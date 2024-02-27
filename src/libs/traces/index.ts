import { Langfuse } from 'langfuse';
import { CreateLangfuseTraceBody } from 'langfuse-core';

import { getServerConfig } from '@/config/server';
import { CURRENT_VERSION } from '@/const/version';

class TraceClient {
  private _client?: Langfuse;

  constructor() {
    const { LANGFUSE_PUBLIC_KEY, LANGFUSE_SECRET_KEY, LANGFUSE_HOST } = getServerConfig();
    if (!LANGFUSE_PUBLIC_KEY || !LANGFUSE_SECRET_KEY) {
      return;
    }

    this._client = new Langfuse({
      baseUrl: LANGFUSE_HOST,
      publicKey: LANGFUSE_PUBLIC_KEY,
      release: CURRENT_VERSION,
      secretKey: LANGFUSE_SECRET_KEY,
    });
  }

  createTrace(param: CreateLangfuseTraceBody) {
    return this._client?.trace({
      ...param,
    });
  }

  async shutdownAsync() {
    await this._client?.shutdownAsync();
  }
}

export const traceClient = new TraceClient();
