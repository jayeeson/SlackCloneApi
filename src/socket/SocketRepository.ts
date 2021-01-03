import { IDao } from '../dao/IDao';
import {
  ChatChannel,
  ChatClient,
  ChatMessage,
  ChatServer,
  CreateChannelParams,
  ErrorTypes,
  MessageContentType,
  User,
} from '../types';
import config from '../config';
import { CustomError } from '../CustomError';

export class SocketRepository {
  dao: IDao;

  constructor(dao: IDao) {
    this.dao = dao;
  }

  addClient = async (socketId: string, username: string | undefined) => {
    return await this.dao.run('INSERT INTO client (socketId, userId) SELECT ?, id FROM user WHERE username = ?', [
      socketId,
      username ?? '',
    ]);
  };

  removeClient = async (socketId: string) => {
    return await this.dao.run('DELETE FROM client WHERE socketId = ?', [socketId]);
  };

  getClient = async (socketId: string) => {
    return await this.dao.getOne<ChatClient>('SELECT * FROM client WHERE socketId = ?', [socketId]);
  };

  clientLogin = async (socketId: string, username: string) => {
    const updated = await this.dao.run(
      'UPDATE client SET userId = (SELECT id FROM user WHERE username = ?) WHERE socketId = ?',
      [username, socketId]
    );
    if (updated.affectedRows === 0) {
      return await this.dao.run('INSERT INTO client (socketId, userId) SELECT ?, u.id FROM user u WHERE username = ?', [
        socketId,
        username,
      ]);
    }
    return updated;
  };

  clientLogout = async (socketId: string) => {
    return await this.dao.run('UPDATE client SET userId = ? WHERE socketId = ?', [null, socketId]);
  };

  clearClientTable = async () => {
    return await this.dao.run('TRUNCATE TABLE client');
  };

  getUserServers = async (username: string) => {
    return await this.dao.getAll<ChatServer>(
      `SELECT s.id, s.name, s.ownerUserId FROM server s
        LEFT JOIN link_server_user lsu ON s.id = lsu.serverId
        LEFT JOIN user u ON lsu.userId = u.id
        WHERE u.username = ?`,
      [username]
    );
  };

  getUserChannels = async (username: string) => {
    return await this.dao.getAll<ChatChannel>(
      `SELECT c.id, c.name, c.serverId, c.isPrivate, c.topic, c.autoAddNewMembers, c.description FROM channel c
        LEFT JOIN link_channel_user lcu ON c.id = lcu.channelId
        LEFT JOIN user u ON lcu.userId = u.id
        WHERE u.username = ?`,
      [username]
    );
  };

  getUser = async (username: string) => {
    return await this.dao.getOne<Omit<User, 'pass'>>(
      'SELECT id, username, displayName FROM user WHERE username = (?)',
      [username]
    );
  };

  createServer = async (username: string, inputServerName?: string) => {
    const usernameWithFirstLetterCapitalized = username.slice(0, 1).toLocaleUpperCase() + username.slice(1);
    const useServerName = inputServerName ?? `${usernameWithFirstLetterCapitalized}'s Server`;
    const newServerResponse = await this.dao.run(
      `INSERT INTO server (name, ownerUserId) VALUES(
        ?,
        (SELECT id FROM user WHERE user.username = ? )
      )`,
      [useServerName, username]
    );
    await this.dao.run(
      `INSERT INTO link_server_user (serverId, userId) VALUES(
        ?,
        (SELECT id FROM user WHERE user.username = ? )
      )`,
      [newServerResponse.insertId, username]
    );
    const createdServer = await this.dao.getOne<ChatServer>('SELECT * FROM server WHERE id = ?', [
      newServerResponse.insertId,
    ]);

    // create two default channels
    if (createdServer) {
      const generalChannel = await this.createChannel(username, {
        channelName: 'General',
        serverId: createdServer.id,
        description: 'This is the General channel where anything goes.',
        autoAddNewMembers: true,
      });
      const randomChannel = await this.createChannel(username, {
        channelName: 'Random',
        serverId: createdServer.id,
        description: 'This is the Random channel, home of off-topic discussions.',
        autoAddNewMembers: true,
      });
      if (!generalChannel || !randomChannel) {
        throw new CustomError(500, 'could not create default channels in new server', ErrorTypes.DB);
      }
      return { server: createdServer, channels: [generalChannel, randomChannel] };
    }
  };

  deleteServer = async (serverName: string, username: string) => {
    return await this.dao.run(
      'DELETE FROM server WHERE name = ? AND ownerUserId = (SELECT id FROM user WHERE username = ?)',
      [serverName, username]
    );
  };

  getChannelById = async (id: number) => {
    return await this.dao.getOne<ChatChannel>('SELECT * FROM channel WHERE id = ?', [id]);
  };

  createChannel = async (username: string, params: CreateChannelParams) => {
    const { channelName, serverId, description, isPrivate, addEveryone, addTheseUsers, autoAddNewMembers } = params;
    const newChannel = await this.dao.run(
      'INSERT INTO channel (name, serverId, description, isPrivate, autoAddNewMembers) VALUES(?, ?, ?, ?, ?)',
      [
        channelName,
        serverId,
        description ?? config.chat.default.channel.description,
        isPrivate ?? false,
        autoAddNewMembers ?? false,
      ]
    );
    if (addEveryone) {
      await this.dao.run(
        `INSERT INTO link_channel_user (channelId, userId) SELECT ?, u.id FROM user u 
          INNER JOIN link_server_user lsu ON u.id = lsu.userId

          WHERE lsu.serverId = ?`,
        [newChannel.insertId, params.serverId]
      );
    } else if (addTheseUsers?.length) {
      await this.dao.run(
        `INSERT INTO link_channel_user (channelId, userId) SELECT ?, u.id FROM user u 
          INNER JOIN link_server_user lsu ON u.id = lsu.userId
          WHERE lsu.serverId = ?
          AND u.username IN ?`,
        [newChannel.insertId, params.serverId, [...addTheseUsers, username]]
      );
    } else {
      // just add channel creator
      await this.dao.run(
        `INSERT INTO link_channel_user (channelId, userId)
          SELECT ?, u.id FROM user u WHERE u.username = ?`,
        [newChannel.insertId, username]
      );
    }
    if (!newChannel) {
      throw new CustomError(500, 'could not create new server channel', ErrorTypes.DB);
    }
    return this.getChannelById(newChannel.insertId);
  };

  isUserInServer = async ({
    username,
    serverId,
    channelId,
  }: {
    username: string;
    serverId?: number;
    channelId?: number;
  }) => {
    if (serverId) {
      const server = await this.dao.getOne<{ serverId: number; username: string; displayName: string }>(
        `SELECT lsu.serverId, u.username, u.displayName FROM link_server_user lsu 
          LEFT JOIN user u ON lsu.userId = u.id 
          WHERE u.username = ? 
            AND lsu.serverId = ?`,
        [username, serverId]
      );
      return Boolean(server);
    } else if (channelId) {
      const server = await this.dao.getOne<{ serverId: number }>(
        `SELECT lsu.serverId, u.username, u.displayName FROM link_server_user lsu 
        LEFT JOIN user u ON lsu.userId = u.id
        LEFT JOIN channel c ON c.serverId = lsu.serverId
        WHERE u.username = ? 
          AND c.id = ?`,
        [username, channelId]
      );
      return Boolean(server);
    }
  };

  isUserInChannel = async ({ username, channelId }: { username: string; channelId?: number }) => {
    const channel = await this.dao.getOne<{ channelId: number }>(
      `SELECT lcu.channelId FROM link_channel_user lcu 
        LEFT JOIN user u ON lcu.userId = u.id
        WHERE u.username = ? 
          AND lcu.channelId = ?`,
      [username, channelId]
    );
    return Boolean(channel);
  };

  sendMessage = async ({
    username,
    text,
    channelId,
    timestamp,
  }: {
    username: string;
    channelId: number;
    text: string;
    timestamp: number;
  }) => {
    const contentType = MessageContentType.MESSAGE;
    const message = await this.dao.run(
      `INSERT INTO message (contentType, channelId, content, timestamp, userId) SELECT ?, ?, ?, ?, id FROM user WHERE username = ?`,
      [contentType, channelId, text, timestamp, username]
    );
    return message;
  };

  ///\todo: implement more sophisticated message getters
  // getMessagesByDate = async ({}: { quantity: number; time: number; showBeforeTime?: boolean; showAfterTime?: boolean }) => {

  private getOldestOrNewestMessages = async (quantity: number, offset?: number, getNewestInstead?: boolean) => {
    console.log('about to get messages+');
    const messages = await this.dao.getAll<ChatMessage & { displayName: string }>(
      `SELECT m.id,
      m.timestamp,
      m.content,
      m.channelId,
      m.contentType,
      u.id AS userId,
      u.displayName
      FROM message m LEFT JOIN user u ON m.userId = u.id
      ORDER BY timestamp ${getNewestInstead ? 'DESC' : 'ASC'} LIMIT ?, ?`,
      [offset ?? 0, quantity]
    );
    console.log(messages);
    return messages;
  };

  getOldestMessages = async (quantity: number, offset?: number) => {
    return this.getOldestOrNewestMessages(quantity, offset);
  };

  getNewestMessages = async (quantity: number, offset?: number) => {
    return this.getOldestOrNewestMessages(quantity, offset, true);
  };

  getLastestMessagesForChannel = async (channelId: number, numberOfMessages: number, offset?: number) => {
    return await this.dao.getAll<ChatMessage & { username: string; displayName: string }>(
      `SELECT m.id,
          m.timestamp,
          m.content,
          m.channelId,
          m.contentType,
          u.id AS userId,
          u.displayName
        FROM message m
        LEFT JOIN user u
          ON m.userId = u.id 
        WHERE m.channelId = ?
          ORDER BY m.timestamp DESC LIMIT ?, ?;`,
      [channelId, offset ?? 0, numberOfMessages]
    );
  };

  // // list of active users
  getLoggedInUsersForServer = async (serverId: number) => {
    return await this.dao.getAll<{ userId: number }>('SELECT userId FROM client WHERE serverId = ?', [serverId]);
  };

  addUserToServer = async (user: string | number, server: number) => {
    const userId =
      typeof user === 'number'
        ? user
        : (await this.dao.getOne<{ id: number }>('SELECT id FROM user WHERE user.username = ?', [user]))?.id;
    if (userId) {
      const addToServer = await this.dao.run(`INSERT INTO link_server_user (userId, serverId) VALUES(?,?)`, [
        userId,
        server,
      ]);
      await this.dao.run(
        `INSERT INTO link_channel_user (channelId, userId) SELECT c.id, ? FROM channel c INNER JOIN server s ON s.id = c.serverId WHERE c.autoAddNewMembers = 1 AND s.id = ?`,
        [userId, server]
      );
      return addToServer;
    }
  };
}
