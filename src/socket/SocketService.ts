import _ from 'lodash';
import { CustomError } from '../CustomError';
import { verifyJwtAsync } from '../helpers/jwt';
import { ChatChannel, ChatServer, CreateChannelParams, ErrorTypes, JwtDecoded } from '../types';
import { SocketRepository } from './SocketRepository';

export class SocketService {
  repository: SocketRepository;

  constructor(repository: SocketRepository) {
    this.repository = repository;
  }

  addClient = (socketId: string, token: JwtDecoded | undefined) => {
    const userId = token?.userId;
    this.repository.addClient(socketId, userId);
  };

  removeClient = (socketId: string) => {
    this.repository.removeClient(socketId);
  };

  getClient = async (id: string) => {
    return await this.repository.getClient(id);
  };

  clearClientTable = async () => {
    return await this.repository.clearClientTable();
  };

  getStartupData = async (token: string) => {
    const { userId } = await verifyJwtAsync(token);
    const servers = await this.repository.getUserServers(userId);
    const channels = await this.repository.getUserChannels(userId);
    const serverIds = servers.map(server => server.id);
    const users = await this.repository.getUsersInServers(serverIds);
    return { servers, channels, userId, users };
  };

  createServer = async (token: string, serverName: string) => {
    const { userId } = await verifyJwtAsync(token);
    const serverAndDefaultChannels = await this.repository.createServer(userId, serverName);
    return serverAndDefaultChannels;
  };

  createChannel = async (token: string, params: CreateChannelParams) => {
    const { userId } = await verifyJwtAsync(token);
    const userIsInServer = await this.repository.isUserInServer({ userId, serverId: params.serverId });
    if (!userIsInServer) {
      throw new CustomError(401, 'user is not part of that server', ErrorTypes.VALIDATION);
    }
    const channel = await this.repository.createChannel(userId, params);
    return Object.assign({}, channel);
  };

  sendMessage = async ({ text, channelId, token }: { text: string; channelId: number; token: string }) => {
    const { userId } = await verifyJwtAsync(token);
    const userIsInServer = await this.repository.isUserInServer({ userId, channelId });
    if (!userIsInServer) {
      throw new CustomError(401, 'user is not part of that server', ErrorTypes.VALIDATION);
    }
    const userIsInChannel = await this.repository.isUserInChannel({ userId, channelId });
    if (!userIsInChannel) {
      throw new CustomError(401, 'user is not part of that channel', ErrorTypes.VALIDATION);
    }
    const timestamp = new Date().getTime();
    const messageOkPacket = await this.repository.sendMessage({ userId, channelId, text, timestamp });
    return { timestamp, userId, id: messageOkPacket.insertId };
  };
}
