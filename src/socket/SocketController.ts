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
  }

  onConnect = async (socket: Socket) => {
    console.log('a user connected');
    console.log(socket.request);

    this.activeSockets.add(socket);
    const token = await verifySocketToken(socket.request);
    this.service.addClient(socket.id, token);
    this.createSocketHandlers(socket);
  };

  private createSocketHandlers = (socket: Socket) => {
    // LEAVE_CHANNEL
    // DELETE_CHANNEL
    // INVITE_TO_CHANNEL
    // SEND_MESSAGE
    // EDIT_MESSAGE
    // DELETE_MESSAGE
    // EDIT_SERVER
    // RECEIVED_MESSAG

    // CREATE_SERVER : need: 1. valid login token 2. server name

    socket.on('disconnecting', () => {
      this.activeSockets.remove(socket.id);
      this.service.removeClient(socket.id);
      socket.rooms.forEach(room => socket.to(room).emit('user_disconnected', socket.id));
    });

    socket.on('create_server', async ({ serverName }: { serverName: string }) => {
      if (!serverName) {
        return;
      }

      const token = await verifySocketToken(socket.request);
      const username = token?.username;
      if (!username) {
        return;
      }
      this.service.createServer(serverName, username);
      socket.emit('server_created', { serverName });
    });

    // DELETE_SERVER
    socket.on('delete_server', async ({ serverName }: { serverName: string }) => {
      if (!serverName) {
        return;
      }

      const token = await verifySocketToken(socket.request);
      const username = token?.username;
      if (!username) {
        return;
      }
      this.service.deleteServer(serverName, username);
      socket.emit('server_deleted', { serverName });
    });

    // CREATE_CHANNEL
    socket.on('create_channel', async ({ serverId, channelName }: { serverId: number; channelName: string }) => {
      if (!serverId || !channelName) {
        return;
      }

      const token = await verifySocketToken(socket.request);
      const username = token?.username;
      if (!username) {
        return;
      }
      this.service.createChannel(channelName, serverId, username);
      socket.emit('channel_created', { channelName });
    });

    // JOIN_CHANNEL
    socket.on('join_channel', async ({ channelId }: { channelId: number }) => {
      if (!channelId) {
        return;
      }

      const token = await verifySocketToken(socket.request);
      const username = token?.username;
      if (!username) {
        return;
      }

      this.service.joinChannel(channelId, username);

      ///\todo: convert this to server generated message creation: User X joined.
      socket.emit('channel_joined', { username, channelId });
    });

    // SELECT_ACTIVE_SERVER
    socket.on(
      'select_active_server',
      async ({ serverId }: { serverId: number }, sendResponse: (response: any) => void) => {
        if (!serverId) {
          return;
        }

        const token = await verifySocketToken(socket.request);
        const username = token?.username;
        if (!username) {
          return;
        }

        const response = this.service.selectActiveServer(serverId);
        sendResponse(response);
      }
    );

    // SELECT_ACTIVE_CHANNEL
    socket.on(
      'select_active_channel',
      async ({ channelId }: { channelId: number }, sendResponse: (response: any) => void) => {
        if (!channelId) {
          return;
        }

        const token = await verifySocketToken(socket.request);
        const username = token?.username;
        if (!username) {
          return;
        }

        const response = this.service.selectActiveChannel(channelId);
        sendResponse(response);
      }
    );
  };
}
