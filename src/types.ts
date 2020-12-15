export enum DeploymentType {
  PROD,
  DEV,
}

export interface ChatClient {
  socketId: string;
  userId: number;
  serverId: number;
  channelId: number;
}

export interface User {
  id: number;
  username: string;
  displayName: string;
  pass: string;
}

export interface ChatMessage {
  id: number;
  contentType: MessageContentType;
  userId: number;
  time: string;
  content?: string;
  originalMsgId?: number;
}

export interface ChatServer {
  id: number;
  name: string;
  ownerUserId: number;
}

export interface ChatChannel {
  id: number;
  name: string;
  serverId: number;
  isPrivate: boolean;
  topic: string;
  description: string;
  autoAddNewMembers: boolean;
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
  BAD_REQUEST = 'BAD_REQUEST',
}

export interface CreateChannelParams {
  channelName: string;
  serverId: string;
  description?: string;
  isPrivate?: boolean;
  addEveryone?: boolean;
  addTheseUsers?: string[];
  autoAddNewMembers?: boolean;
}
