import e from 'express';
import config from '../config';
import { IDao } from '../dao/IDao';
import { ChatChannel, ChatMessage, ChatServer, CreateChannelParams, MessageContentType, User } from '../types';

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

  deleteServer = async (serverName: string, username: string) => {
    return await this.dao.run(
      'DELETE FROM server WHERE name = ? AND ownerUserId = (SELECT id FROM user WHERE username = ?)',
      [serverName, username]
    );
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

  isUserInServer = async ({
    username,
    serverId,
    channelId,
  }: {
    username: string;
    serverId?: string;
    channelId?: number;
  }) => {
    if (serverId) {
      const server = await this.dao.getOne(
        `SELECT lsu.serverId FROM link_server_user lsu 
          LEFT JOIN user u ON lsu.userId = u.id 
          WHERE u.username = ? 
            AND lsu.serverId = ?`,
        [username, serverId]
      );
      return Boolean(server);
    } else if (channelId) {
      const server = await this.dao.getOne(
        `SELECT lsu.serverId FROM link_server_user lsu 
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
    const channel = await this.dao.getOne(
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
      `INSERT INTO message (contentType, channelId, content, time, userId) SELECT ?, ?, ?, ?, id FROM user WHERE username = ?`,
      [contentType, channelId, text, timestamp, username]
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

  getLastestMessagesForChannel = async (channelId: number, numberOfMessages: number) => {
    return await this.dao.getAll<ChatMessage>(
      ` SELECT m.id,
          m.channelId,
          m.contentType,
          m.time,
          m.content,
          m.originalMsgId,
          u.id AS userId,
          u.username AS username
        FROM message m
          LEFT JOIN user u
            ON m.userId = u.id 
        WHERE m.channelId = ?
        ORDER BY m.time DESC LIMIT ?;`,
      [channelId, numberOfMessages]
    );
  };

  // // list of active users
  getLoggedInUsersForServer = async (serverId: number) => {
    return await this.dao.getAll<{ userId: number }>('SELECT userId FROM client WHERE serverId = ?', [serverId]);
  };
}
