import { JwtDecoded } from '../types';
import { SocketRepository } from './SocketRepository';

export class SocketService {
  repository: SocketRepository;
  private numberMsgsToRetrieve = 10;

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

  createServer = (serverName: string, username: string) => {
    this.repository.createServer(serverName, username);
  };

  deleteServer = (serverName: string, username: string) => {
    this.repository.deleteServer(serverName, username);
  };

  createChannel = (channelName: string, serverId: number, username: string) => {
    this.repository.createChannel(channelName, serverId, username);
  };

  joinChannel = (channelId: number, username: string) => {
    this.repository.joinChannel(channelId, username);
  };

  selectActiveServer = async (serverId: number) => {
    const channels = await this.repository.getChannelsForServer(serverId);
    const signedIn = await this.repository.getLoggedInUsersForServer(serverId);
    const timeStamps = await this.repository.getLastMessageOnEachChannelForServer(serverId);

    return {
      channels,
      signedIn,
      timeStamps,
    };
  };

  selectActiveChannel = async (channelId: number) => {
    const messages = await this.repository.getLastestMessagesForChannel(channelId, this.numberMsgsToRetrieve);

    return messages;
  };
}
