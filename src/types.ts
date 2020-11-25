export enum DeploymentType {
  PROD,
  DEV,
}

export interface SlackClient {
  socketId: string;
  userId: number;
  serverId: number;
  channelId: number;
}

export interface User {
  id: number;
  name: string;
  pass: string;
}

export interface SlackMessage {
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
  ownerUserId: number;
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
  lastAccessed: Date;
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

export interface JwtPayload {
  username: string;
}

export interface JwtDecoded extends JwtPayload {
  iat: string;
  exp: string;
}

export enum ErrorTypes {
  VALIDATION = 'VALIDATION',
  DB = 'DB',
  INIT = 'INIT',
  CONFIG = 'CONFIG',
}
