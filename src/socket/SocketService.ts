import { CustomError } from '../CustomError';
import { verifyJwtAsync } from '../helpers/jwt';
import { CreateChannelParams, ErrorTypes, JwtDecoded } from '../types';
import { SocketRepository } from './SocketRepository';

export class SocketService {
  repository: SocketRepository;

  constructor(repository: SocketRepository) {
    this.repository = repository;
  }

  addClient = (id: string, token: JwtDecoded | undefined) => {
    const username = token?.username;
    this.repository.addClient(id, username);
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
    const { username } = await verifyJwtAsync(token);
    const servers = await this.repository.getUserServers(username);
    const channels = await this.repository.getUserChannels(username);
    const user = await this.repository.getUser(username);
    return { servers, channels, user };
  };

  createServer = async (token: string, serverName: string | undefined) => {
    const { username } = await verifyJwtAsync(token);
    const serverAndDefaultChannels = await this.repository.createServer(username, serverName);
    return serverAndDefaultChannels;
  };

  createChannel = async (token: string, params: CreateChannelParams) => {
    const { username } = await verifyJwtAsync(token);
    const userIsInServer = await this.repository.isUserInServer({ username, serverId: params.serverId });
    if (!userIsInServer) {
      throw new CustomError(401, 'user is not part of that server', ErrorTypes.VALIDATION);
    }
    const serverName = await this.repository.createChannel(username, params);
    return serverName;
  };

  sendMessage = async ({ text, channelId, token }: { text: string; channelId: number; token: string }) => {
    const { username } = await verifyJwtAsync(token);
    const userIsInServer = await this.repository.isUserInServer({ username, channelId });
    if (!userIsInServer) {
      throw new CustomError(401, 'user is not part of that server', ErrorTypes.VALIDATION);
    }
    const userIsInChannel = await this.repository.isUserInChannel({ username, channelId });
    if (!userIsInChannel) {
      throw new CustomError(401, 'user is not part of that channel', ErrorTypes.VALIDATION);
    }
    const timestamp = new Date().getTime();
    await this.repository.sendMessage({ username, channelId, text, timestamp });
    return { timestamp, username };
  };
}
