import { Socket } from 'socket.io';
import events from 'events';
import { ActiveSockets } from './ActiveSockets';
import { SocketService } from './SocketService';
import { getCookieFromRequest, verifySocketToken } from '../helpers/jwt';
import {
  ChatChannel,
  ChatMessagePacket,
  CreateChannelParams,
  ErrorTypes,
  MessageContentType,
  MessageContentTypeKey,
} from '../types';
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
      if (oldServer && oldServer !== newServer) {
        socket.leave(`server#${oldServer}`);
      }
    });

    socket.on('setActiveChannel', ({ newChannel, oldChannel }: { newChannel: string; oldChannel: string }) => {
      if (newChannel.slice(0, 2) === 'c#' || newChannel.slice(0, 2) === 'd#') {
        socket.join(`channel#${newChannel}`);
      }
      if (
        oldChannel &&
        oldChannel !== newChannel &&
        (oldChannel.slice(0, 2) !== 'c#' || oldChannel.slice(0, 2) === 'd#')
      ) {
        socket.leave(`channel#${oldChannel}`);
      }
    });

    socket.on('getStartupData', async (args: { [idx: string]: never }, callback: (args: any) => void) => {
      const token = getCookieFromRequest(socket.request);
      if (!token) {
        throw new CustomError(401, 'not signed in', ErrorTypes.AUTH);
      }
      const data = await this.service.getStartupData(token);
      callback(data);
    });
    socket.on('createServer', async ({ serverName }: { serverName: string }, callback: (args: any) => void) => {
      const token = getCookieFromRequest(socket.request);
      if (!token) {
        throw new CustomError(401, 'not signed in', ErrorTypes.AUTH);
      }
      const serverAndDefaultChannels = await this.service.createServer(token, serverName);
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
        callback: (arg: ChatChannel) => void
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
      'getLatestMessagesForChannel',
      async (
        { channelId, quantity, offset }: { channelId: string; quantity: number; offset?: number },
        callback: (args: any) => void
      ) => {
        if (!channelId) {
          throw new CustomError(400, 'missing key "channelId"', ErrorTypes.BAD_REQUEST);
        }
        if (!quantity) {
          throw new CustomError(400, 'missing key "quantity"', ErrorTypes.BAD_REQUEST);
        }
        const data = await this.service.repository.getLastestMessagesForChannel(channelId, quantity, offset);
        callback(data);
      }
    );
    socket.on(
      'getLastMessageForDmChannels',
      async ({ dmChannelId }: { dmChannelId: number | number[] }, callback: (args: any) => void) => {
        if (!dmChannelId) {
          throw new CustomError(400, 'missing key "dmChannelId"', ErrorTypes.BAD_REQUEST);
        }
        const data = await this.service.repository.getLastMessageForDmChannels(dmChannelId);
        callback(data);
      }
    );
    socket.on(
      'message',
      async ({ text, channelId, serverId }: { text: string; channelId: number; serverId: number }) => {
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
        const { timestamp, userId, id } = await this.service.sendMessage({ text, channelId, token });
        const message: ChatMessagePacket = {
          id,
          content: text,
          channelId,
          serverId,
          timestamp,
          userId,
          contentType: MessageContentType.MESSAGE,
        };
        io.to(`server#${serverId}`).to(`channel#${channelId}`).emit('message', message);
      }
    );

    socket.on('directMessage', async ({ text, recipients }: { text: string; sender: number; recipients: number[] }) => {
      const token = getCookieFromRequest(socket.request);
      if (!token) {
        throw new CustomError(401, 'not signed in', ErrorTypes.AUTH);
      }
      if (!text) {
        throw new CustomError(400, 'missing key "text"', ErrorTypes.BAD_REQUEST);
      }
      if (!recipients) {
        throw new CustomError(400, 'missing key "recipients"', ErrorTypes.BAD_REQUEST);
      }
      ///\todo: check all users exist first, and are "visible" to current user.
      const { timestamp, userId: sender, id: messageId, channelId } = await this.service.sendDirectMessage({
        token,
        text,
        recipients,
      });

      const directMessage: Omit<ChatMessagePacket, 'serverId'> = {
        id: messageId,
        content: text,
        channelId,
        timestamp,
        userId: sender,
        contentType: MessageContentType.MESSAGE,
      };
      const socketIds = await this.service.getSocketIdsFromUserIds([...recipients, sender]);
      if (!socketIds) {
        return;
      }
      socketIds.forEach(socketId => io.to(socketId.socketId).emit('directMessage', directMessage));
    });

    socket.on(
      'inviteUsersToServer',
      async ({ users, serverId }: { users: { username?: string; userId: number }[]; serverId: number }) => {
        const token = getCookieFromRequest(socket.request);
        if (!token) {
          throw new CustomError(401, 'not signed in', ErrorTypes.AUTH);
        }
        if (!users || !Array.isArray(users)) {
          throw new CustomError(400, 'missing key "users", or it is not an array', ErrorTypes.BAD_REQUEST);
        }
        if (!serverId) {
          throw new CustomError(400, 'missing key "serverId"', ErrorTypes.BAD_REQUEST);
        }
        ///\todo: check all users exist first, and are "visible" to current user.
        const userIds = users.map(u => u.userId);
        const { usersToAdd, userId } = await this.service.inviteUsersToServer({
          token,
          userIds,
          serverId,
        });

        // send these users a direct message invitation...

        const username = userIds.forEach(async id => {
          const text = `${userId}`;
          const { timestamp, userId: sender, id: messageId, channelId } = await this.service.sendDirectMessage({
            token,
            text,
            recipients: [id],
          });

          const directMessage: Omit<ChatMessagePacket, 'serverId'> = {
            id: messageId,
            content: text,
            channelId,
            timestamp,
            userId: sender,
            contentType: MessageContentType.INVITE,
          };

          const socketIds = await this.service.getSocketIdsFromUserIds(usersToAdd);
          if (!socketIds) {
            return;
          }
          socketIds.forEach(socketId => io.to(socketId.socketId).emit('directMessage', directMessage));
        });
      }
    );

    socket.on('error', err => {
      console.log('error', err);
    });
  };
}
