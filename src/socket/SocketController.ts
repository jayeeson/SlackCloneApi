import { Socket } from 'socket.io';
import { ActiveSockets } from './ActiveSockets';
import { SocketService } from './SocketService';
import { verifySocketToken } from '../helpers/jwt';

export class SocketController {
  service: SocketService;
  private activeSockets: ActiveSockets;

  constructor(service: SocketService) {
    this.service = service;
    this.activeSockets = new ActiveSockets();
    this.service.clearClientTable();
  }

  onConnect = async (socket: Socket) => {
    console.log('a user connected');

    this.activeSockets.add(socket);
    const token = await verifySocketToken(socket.request);
    this.service.addClient(socket.id, token);
    this.createEventHandlers(socket);
  };

  private createEventHandlers = (socket: Socket) => {
    // LEAVE_CHANNEL
    // DELETE_CHANNEL
    // INVITE_TO_CHANNEL
    // SEND_MESSAGE
    // EDIT_MESSAGE
    // DELETE_MESSAGE
    // EDIT_SERVER
    // RECEIVED_MESSAG

    // CREATE_SERVER : need: 1. valid login token 2. server name

    socket.on('disconnecting', async () => {
      this.activeSockets.remove(socket.id);
      const client = await this.service.getClient(socket.id);
      this.service.removeClient(socket.id);
      if (client) {
        socket.rooms.forEach(room => socket.to(room).emit('user disconnected', client.userId));
      }
    });

    socket.on('login', ({ username }: { username: string }) => {
      this.service.repository.clientLogin(socket.id, username);
    });

    socket.on('logout', () => {
      this.service.repository.clientLogout(socket.id);
    });

    socket.on('setActiveServer', ({ newServer, oldServer }: { newServer: number; oldServer: number }) => {
      socket.join(`server#${newServer}`);
      if (oldServer) {
        socket.leave(`server#${oldServer}`);
      }
    });
  };
}
