import { getPreferredRegion } from '@/app/api/config';
import { createErrorResponse } from '@/app/api/errorResponse';
import { LOBE_CHAT_AUTH_HEADER, OAUTH_AUTHORIZED } from '@/const/auth';
import { LOBE_CHAT_TRACE_ID, TraceTagType } from '@/const/trace';
import {
  AgentInitErrorPayload,
  AgentRuntimeError,
  ChatCompletionErrorPayload,
  ILobeAgentRuntimeErrorType,
} from '@/libs/agent-runtime';
import { traceClient } from '@/libs/traces';
import { ChatErrorType } from '@/types/fetch';
import { ChatStreamPayload } from '@/types/openai/chat';
import { getTracePayload } from '@/utils/trace';

import { checkAuthMethod, getJWTPayload } from '../auth';
import AgentRuntime from './agentRuntime';

export const runtime = 'edge';

export const preferredRegion = getPreferredRegion();

export const POST = async (req: Request, { params }: { params: { provider: string } }) => {
  let agentRuntime: AgentRuntime;
  const { provider } = params;

  // ============  1. init chat model   ============ //

  try {
    // get Authorization from header
    const authorization = req.headers.get(LOBE_CHAT_AUTH_HEADER);
    const oauthAuthorized = !!req.headers.get(OAUTH_AUTHORIZED);

    if (!authorization) throw AgentRuntimeError.createError(ChatErrorType.Unauthorized);

    // check the Auth With payload
    const payload = await getJWTPayload(authorization);
    checkAuthMethod(payload.accessCode, payload.apiKey, oauthAuthorized);

    const body = await req.clone().json();
    agentRuntime = await AgentRuntime.initializeWithUserPayload(provider, payload, {
      apiVersion: payload.azureApiVersion,
      model: body.model,
      useAzure: payload.useAzure,
    });
  } catch (e) {
    // if catch the error, just return it
    const err = e as AgentInitErrorPayload;
    return createErrorResponse(
      (err.errorType || ChatErrorType.InternalServerError) as ILobeAgentRuntimeErrorType,
      { error: err.error || e, provider },
    );
  }

  // ============  2. create chat completion   ============ //

  try {
    const payload = (await req.json()) as ChatStreamPayload;

    // create a trace to monitor the completion
    const tracePayload = getTracePayload(req);

    const trace = traceClient.createTrace({
      id: tracePayload?.traceId,
      input: payload.messages,
      metadata: { provider },
      name: tracePayload?.traceName,
      sessionId: `${tracePayload?.sessionId || 'unknown'}@${tracePayload?.topicId || 'start'}`,
      tags: tracePayload?.tags,
      userId: tracePayload?.userId,
    });

    let startTime: Date;
    return await agentRuntime.chat(payload, {
      callback: {
        experimental_onToolCall: async () => {
          trace?.update({ tags: [...(tracePayload?.tags || []), TraceTagType.ToolsCall] });
        },
        onCompletion: async (completion) => {
          const { messages, model, tools, ...parameters } = payload;
          trace?.generation({
            endTime: new Date(),
            input: messages,
            metadata: { provider, tools },
            model,
            modelParameters: parameters as any,
            name: `Chat Completion (${provider})`,
            output: completion,
            startTime,
          });

          trace?.update({ output: completion });
        },
        onFinal: async () => {
          await traceClient.shutdownAsync();
        },
        onStart: () => {
          startTime = new Date();
        },
      },
      headers: {
        [LOBE_CHAT_TRACE_ID]: trace?.id,
      },
    });
  } catch (e) {
    const { errorType, provider, error: errorContent, ...res } = e as ChatCompletionErrorPayload;

    // track the error at server side
    console.error(`Route: [${provider}] ${errorType}:`, errorContent);

    return createErrorResponse(errorType, { error: errorContent, provider, ...res });
  }
};
