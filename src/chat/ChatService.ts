import { ChatRepository } from './ChatRepository';
import { verifyJwtAsync } from '../helpers/jwt';
import { CreateChannelParams, ErrorTypes } from '../types';
import { CustomError } from '../CustomError';

export class ChatService {
  repository: ChatRepository;

  constructor(repository: ChatRepository) {
    this.repository = repository;
  }

  createServer = async (token: string, serverName: string | undefined) => {
    const { username } = await verifyJwtAsync(token);
    const server = await this.repository.createServer(username, serverName);
    return server;
  };

  createChannel = async (token: string, params: CreateChannelParams) => {
    const { username } = await verifyJwtAsync(token);
    const userIsInServer = await this.repository.isUserInServer(username, params.serverId);
    if (!userIsInServer) {
      throw new CustomError(401, 'user is not part of that server', ErrorTypes.VALIDATION);
    }
    const serverName = await this.repository.createChannel(username, params);
    return serverName;
  };
}
