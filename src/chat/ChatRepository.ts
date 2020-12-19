import config from '../config';
import { IDao } from '../dao/IDao';
import { ChatChannel, ChatMessage, ChatServer, CreateChannelParams, User } from '../types';

export class ChatRepository {
  private dao: IDao;

  constructor(dao: IDao) {
    this.dao = dao;
  }

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
    return createdServer;
  };

  getChannelById = async (id: number) => {
    return await this.dao.getOne('SELECT * FROM channel WHERE id = ?', [id]);
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
    return this.getChannelById(newChannel.insertId);
  };

  isUserInServer = async (username: string, serverId: string) => {
    const server = await this.dao.getOne(
      `SELECT (serverId) FROM link_server_user WHERE userId = (
      SELECT id FROM user WHERE username = ?
    ) AND serverId = ?`,
      [username, serverId]
    );
    return Boolean(server);
  };

  createMessage = async (username: string, channelId: number, content: string) => {
    const now = new Date().getTime();
    const message = await this.dao.run(
      `INSERT INTO message (contentType, channelId, content, time, userId) SELECT ?, ?, ?, id, FROM user WHERE name = ?`,
      [1, channelId, content, now, username]
    );
    return message;
  };

  ///\todo: implement more sophisticated message getters
  // getMessagesByDate = async ({}: { quantity: number; time: number; showBeforeTime?: boolean; showAfterTime?: boolean }) => {

  private getOldestOrNewestMessages = async (quantity: number, offset?: number, getNewestInstead?: boolean) => {
    const message = await this.dao.getAll<ChatMessage>(
      `SELECT * FROM message ORDER BY time ${getNewestInstead ? 'DESC' : 'ASC'} LIMIT ?, ?`,
      [offset ?? 0, quantity]
    );
    return message;
  };

  getOldestMessages = async (quantity: number, offset?: number) => {
    return this.getOldestOrNewestMessages(quantity, offset, false);
  };

  getNewestMessages = async (quantity: number, offset?: number) => {
    return this.getOldestOrNewestMessages(quantity, offset, true);
  };
}
