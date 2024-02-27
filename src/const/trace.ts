export const LOBE_CHAT_TRACE_HEADER = 'X-lobe-trace';
export const LOBE_CHAT_TRACE_ID = 'X-chat-completion-trace-id';

export enum TraceNameMap {
  ConnectivityChecker = 'Connectivity Checker',
  EmojiPicker = 'Emoji Picker',
  LanguageDetect = 'Language Detect',
  SummaryAgentDescription = 'Summary Agent Description',
  SummaryAgentTags = 'Summary Agent Tags',
  SummaryAgentTitle = 'Summary Agent Title',
  SummaryTopicTitle = 'Summary Topic Title',
  Translator = 'Translator',
  UserChat = 'User Chat',
}

export enum TraceTopicType {
  AgentSettings = 'Agent Settings',
}

export enum TraceTagType {
  SystemChain = 'System Chain',
  UserChat = 'User Chat',
}

export interface TracePayload {
  /**
   * chat session: agentId or groupId
   */
  sessionId?: string;
  tags?: string[];
  /**
   * chat topicId
   */
  topicId?: string;
  traceName?: TraceNameMap;
  /**
   * user uuid
   */
  userId?: string;
}
