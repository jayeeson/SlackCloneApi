import { ChatRepository } from './ChatRepository';
import { verifyJwtAsync } from '../helpers/jwt';
import { CreateChannelParams, ErrorTypes } from '../types';
import { CustomError } from '../CustomError';

export class ChatService {
  repository: ChatRepository;

  constructor(repository: ChatRepository) {
    this.repository = repository;
  }

  getStartupData = async (token: string) => {
    const { username } = await verifyJwtAsync(token);
    const servers = await this.repository.getUserServers(username);
    const channels = await this.repository.getUserChannels(username);
    const user = await this.repository.getUser(username);
    return { servers, channels, user };
  };

  createServer = async (token: string, serverName: string | undefined) => {
    const { username } = await verifyJwtAsync(token);
    const server = await this.repository.createServer(username, serverName);
    return server;
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
    const serverName = await this.repository.sendMessage({ username, channelId, text });
    return serverName;
  };
}
