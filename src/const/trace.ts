export const LOBE_CHAT_TRACE_HEADER = 'X-lobe-trace';
export const LOBE_CHAT_TRACE_ID = 'X-chat-completion-trace-id';

export enum TraceType {
  SystemChain = 'System Chain',
  UserChat = 'User Chat'
}

export interface TracePayload {
  /**
   * chat session: agentId or groupId
   */
  sessionId?: string;
  /**
   * chat topicId
   */
  topicId?: string;
  traceType?: TraceType;
  /**
   * user uuid
   */
  userId?: string;
}
