export interface User {
  id: number;
  name: string;
  pass: string;
}

export interface Message {
  id: number;
  contentType: MessageContentType;
  userId: number;
  time: string;
  content?: string;
  originalMsgId?: number;
}

export interface SlackServer {
  id: number;
  name: string;
  owner: number; // owner's user id
}

export interface SlackChannel {
  id: number;
  name: string;
  serverId: number;
  private: boolean;
  topic: string;
  welcomeMsg: string;
  description: string;
}

export interface LinkChannelUser {
  channelId: number;
  userId: number;
}

export interface LinkServerChannel {
  serverId: number;
  channelId: number;
}

export enum MessageContentType {
  STRING = 'STRING',
  QUOTE = 'QUOTE',
  THREAD = 'THREAD',
}
