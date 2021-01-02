import { Socket } from 'socket.io';
import events from 'events';
import { ActiveSockets } from './ActiveSockets';
import { SocketService } from './SocketService';
import { getCookieFromRequest, verifySocketToken } from '../helpers/jwt';
import { ChatChannel, ChatServer, CreateChannelParams, ErrorTypes, SocketEvent, User } from '../types';
import { CustomError } from '../CustomError';
import { io } from '../index';

events.captureRejections = true;

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

    socket.on('getStartupData', async (args: { [idx: string]: never }, callback: (args: any) => void) => {
      const token = getCookieFromRequest(socket.request);
      if (!token) {
        throw new CustomError(401, 'not signed in', ErrorTypes.AUTH);
      }
      const data = await this.service.getStartupData(token);

      if (!data.user) {
        throw new CustomError(401, 'user does not exist', ErrorTypes.AUTH);
      }
      console.log(data);
      callback(
        data as {
          servers: ChatServer[];
          channels: ChatChannel[];
          user: Pick<User, 'username' | 'id' | 'displayName'>;
        }
      );
    });
    socket.on('createServer', async ({ serverName }: { serverName: string }, callback: (args: any) => void) => {
      const token = getCookieFromRequest(socket.request);
      console.log(callback);
      if (!token) {
        throw new CustomError(401, 'not signed in', ErrorTypes.AUTH);
      }
      const serverAndDefaultChannels = await this.service.createServer(token, serverName);
      console.log(serverAndDefaultChannels);
      callback(serverAndDefaultChannels);
    });
    socket.on(
      'createChannel',
      async (
        {
          channelName,
          serverId,
          description,
          isPrivate,
          addEveryone,
          addTheseUsers,
          autoAddNewMembers,
        }: CreateChannelParams,
        { callback }: { callback: (args: any) => void }
      ) => {
        const token = getCookieFromRequest(socket.request);
        if (!token) {
          throw new CustomError(401, 'not signed in', ErrorTypes.AUTH);
        }
        if (!channelName) {
          throw new CustomError(400, 'Missing channel name', ErrorTypes.BAD_REQUEST);
        }
        if (!serverId) {
          throw new CustomError(400, 'Missing server id', ErrorTypes.BAD_REQUEST);
        }

        const newChannel = await this.service.createChannel(token, {
          channelName,
          serverId,
          description,
          isPrivate,
          addEveryone,
          addTheseUsers,
          autoAddNewMembers,
        });
        callback(newChannel);
      }
    );
    socket.on(
      'getOldestMessages',
      async ({ quantity, offset }: { quantity: number; offset?: number }, callback: (args: any) => void) => {
        if (!quantity) {
          throw new CustomError(400, 'missing key "quantity"', ErrorTypes.BAD_REQUEST);
        }
        const data = await this.service.repository.getOldestMessages(quantity, offset);
        callback(data);
      }
    );
    socket.on(
      'getNewestMessages',
      async ({ quantity, offset }: { quantity: number; offset?: number }, callback: (args: any) => void) => {
        if (!quantity) {
          throw new CustomError(400, 'missing key "quantity"', ErrorTypes.BAD_REQUEST);
        }
        const data = await this.service.repository.getNewestMessages(quantity, offset);
        callback(data);
      }
    );
    socket.on(
      'message',
      async (
        {
          text,
          channelId,
          serverId,
        }: {
          text: string;
          channelId: number;
          serverId: number;
        },
        callback: (status: string) => void
      ) => {
        const token = getCookieFromRequest(socket.request);
        if (!token) {
          throw new CustomError(401, 'not signed in', ErrorTypes.AUTH);
        }
        if (!text) {
          throw new CustomError(400, 'missing key "text"', ErrorTypes.BAD_REQUEST);
        }
        if (!channelId) {
          throw new CustomError(400, 'missing key "channelId"', ErrorTypes.BAD_REQUEST);
        }
        if (!serverId) {
          throw new CustomError(400, 'missing key "serverId"', ErrorTypes.BAD_REQUEST);
        }
        const { timestamp, username } = await this.service.sendMessage({ text, channelId, token });
        // todo: emit message sent event on socket to the server and the channel ... TBD
        io.emit(SocketEvent.NEW_MESSAGE, { content: text, serverId, timestamp, username });
        callback('OK');
        console.log('end');
      }
    );

    socket.on('error', err => {
      console.log(err);
    });
  };
}
