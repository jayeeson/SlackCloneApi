import { JwtDecoded } from '../types';
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
}
