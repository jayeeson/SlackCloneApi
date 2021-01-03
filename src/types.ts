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
  userId: number;
  contentType: MessageContentType;
  contentId: number;
  timestamp: string;
  channelId: number;
  deleted: boolean;
}

export interface ChatMessagePacket {
  id: number;
  content: string;
  channelId: number;
  serverId: number;
  userId: number;
  timestamp: number;
  displayName: string;
  // deleted: boolean;
  // contentType: MessageContentType;
}

export interface ChatMessageContent {
  id: number;
  text: string;
  messageId: number;
}

export interface ChatThreadParent {
  id: number;
  messageId: number;
  lastReplyDate: number;
}

export interface ChatThreadReply extends ChatMessageContent {
  threadId: number;
}

export interface ChatQuoteMessage extends ChatMessageContent {
  quotedMessageId: number;
  quotedMessageType: MessageContentType;
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
  autoAddNewMembers: boolean;
  description?: string;
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

export enum MessageContentTypeKey {
  MESSAGE = 1,
  QUOTE = 2,
  THREAD = 4,
}

export enum MessageContentType {
  MESSAGE = MessageContentTypeKey.MESSAGE,
  QUOTE = MessageContentTypeKey.QUOTE,
  THREAD_PARENT = MessageContentTypeKey.THREAD,
  THREAD_REPLY = MessageContentTypeKey.THREAD + MessageContentTypeKey.MESSAGE,
}

export interface JwtDecoded extends Omit<User, 'pass'> {
  iat: string;
  exp: string;
}

export enum ErrorTypes {
  VALIDATION = 'VALIDATION',
  AUTH = 'AUTHENTICATION',
  DB = 'DB',
  INIT = 'INIT',
  CONFIG = 'CONFIG',
  BAD_REQUEST = 'BAD_REQUEST',
}

export interface CreateChannelParams {
  channelName: string;
  serverId: number;
  description?: string;
  isPrivate?: boolean;
  addEveryone?: boolean;
  addTheseUsers?: string[];
  autoAddNewMembers?: boolean;
}

export enum SocketEvent {
  NEW_MESSAGE = 'NEW_MESSAGE',
}

export interface Blacklist {
  id: number;
  token: string;
  insertDate: number;
}
