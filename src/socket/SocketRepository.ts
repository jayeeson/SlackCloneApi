import { IDao } from '../dao/IDao';
import {
  ChatChannel,
  ChatClient,
  ChatMessage,
  ChatServer,
  CreateChannelParams,
  DmChannelFrontEnd,
  ErrorTypes,
  MessageContentType,
  User,
} from '../types';
import config from '../config';
import { CustomError } from '../CustomError';
import { parameterizeArrayForQuery } from '../db/db';
import { cachedDataVersionTag } from 'v8';

export class SocketRepository {
  dao: IDao;

  constructor(dao: IDao) {
    this.dao = dao;
  }

  addClient = async (socketId: string, userId: number | undefined) => {
    return await this.dao.run('INSERT INTO client (socketId, userId) SELECT ?, id FROM user WHERE id = ?', [
      socketId,
      userId ?? 0,
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
      `REPLACE INTO client (userId, socketId) VALUES (
        (SELECT id FROM user WHERE username = ?),
        ?
      )`,
      [username, socketId]
    );
    return updated;
  };

  clientLogout = async (socketId: string) => {
    return await this.dao.run('UPDATE client SET userId = ? WHERE socketId = ?', [null, socketId]);
  };

  clearClientTable = async () => {
    return await this.dao.run('TRUNCATE TABLE client');
  };

  getUserServers = async (userId: number) => {
    const servers = await this.dao.getAll<ChatServer>(
      `SELECT s.id, s.name, s.ownerUserId FROM server s
        LEFT JOIN link_server_user lsu ON s.id = lsu.serverId
        LEFT JOIN user u ON lsu.userId = u.id
        WHERE u.id = ?`,
      [userId]
    );

    const serverIds = servers.map(server => server.id);
    if (!serverIds.length) {
      return servers;
    }

    const usersInServers = await this.dao.getAll<{ serverId: number; userIds: string }>(
      `SELECT serverId, GROUP_CONCAT(userId) userIds FROM link_server_user
      WHERE serverId IN (?)
      GROUP BY serverId`,
      [serverIds]
    );
    const usersInServersObjArray = usersInServers.map(usersInServer => ({
      serverId: usersInServer.serverId,
      userIds: usersInServer.userIds.split(',').map(userId => parseInt(userId, 10)),
    }));

    const serversWithUserIds = servers.map(server => ({
      ...server,
      userIds:
        usersInServersObjArray.find(usersInServersObj => server.id === usersInServersObj.serverId)?.userIds || [],
    }));

    return serversWithUserIds;
  };

  getUserChannels = async (userId: number) => {
    const channels = await this.dao.getAll<ChatChannel>(
      `SELECT c.id, c.name, c.serverId, c.isPrivate, c.topic, c.autoAddNewMembers, c.description FROM channel c
        LEFT JOIN link_channel_user lcu ON c.id = lcu.channelId
        LEFT JOIN user u ON lcu.userId = u.id
        WHERE u.id = ?`,
      [userId]
    );

    const channelIds = channels.map(channel => channel.id);
    if (!channelIds.length) {
      return channels;
    }

    const usersInChannels = await this.dao.getAll<{ channelId: number; userIds: string }>(
      `SELECT channelId, GROUP_CONCAT(userId) userIds FROM link_channel_user
      WHERE channelId IN (?)
      GROUP BY channelId`,
      [channelIds]
    );
    const usersInChannelsObjArray = usersInChannels.map(usersInChannel => ({
      channelId: usersInChannel.channelId,
      userIds: usersInChannel.userIds.split(',').map(userId => parseInt(userId, 10)),
    }));

    const channelsWithUserIds = channels.map(channel => ({
      ...channel,
      userIds:
        usersInChannelsObjArray.find(usersInChannelsObj => channel.id === usersInChannelsObj.channelId)?.userIds || [],
    }));

    return channelsWithUserIds;
  };

  ///\todo: delete this, probably
  // getUserDmChannels = async (userId: number) => {
  //   const dmChannels = await this.dao.getAll<{ id: number }>(
  //     `SELECT dmc.id FROM dmChannel dmc
  //       LEFT JOIN link_dmChannel_user ldu ON dmc.id = ldu.dmChannelId
  //       WHERE ldu.userId = ?`,
  //     [userId]
  //   );
  //   const dmChannelIds = dmChannels.map(dmChannel => dmChannel.id);
  //   return dmChannelIds;
  // };

  getUser = async (userId: number) => {
    return await this.dao.getOne<Omit<User, 'pass'>>('SELECT id, username, displayName FROM user WHERE id = (?)', [
      userId,
    ]);
  };

  getUsersInServers = async (servers: number[]): Promise<Omit<User, 'pass'>[]> => {
    if (!servers.length) {
      return [];
    }
    return await this.dao.getAll<Omit<User, 'pass'>>(
      `SELECT DISTINCT u.id, u.username, u.displayName FROM user u 
      LEFT JOIN link_server_user lsu ON lsu.userId = u.id
      WHERE lsu.serverId IN (?)`,
      [servers]
    );
  };

  getUserDmChannels = async (userId: number): Promise<DmChannelFrontEnd[]> => {
    const data = await this.dao.getAll<{ dmChannelId: number; userId: number; username: string }>(
      `SELECT ldu.dmChannelId, ldu2.userId, user.username FROM link_dmChannel_user ldu
      INNER JOIN link_dmChannel_user ldu2 ON ldu.dmChannelId=ldu2.dmChannelId
      INNER JOIN user ON ldu2.userId = user.id
      WHERE ldu.userId = ?`,
      [userId]
    );

    const dmChannelIds = data.reduce((prev, cur) => {
      return [...prev, cur.dmChannelId];
    }, [] as number[]);

    const uniqueDmChannelIds = Array.from(new Set(dmChannelIds));

    const dmChannels = uniqueDmChannelIds.map(id => {
      const users = data
        .filter(row => row.dmChannelId === id)
        .reduce((acc, cur) => {
          return [...acc, { userId: cur.userId, username: cur.username }];
        }, [] as { userId: number; username: string }[]);

      return {
        id,
        users,
      };
    });

    return dmChannels;
  };

  createServer = async (userId: number, inputServerName: string) => {
    const newServerResponse = await this.dao.run('INSERT INTO server (name, ownerUserId) VALUES(?,?)', [
      inputServerName,
      userId,
      userId,
    ]);
    await this.dao.run('INSERT INTO link_server_user (serverId, userId) VALUES(?,?)', [
      newServerResponse.insertId,
      userId,
    ]);
    const createdServer = await this.dao.getOne<ChatServer>('SELECT * FROM server WHERE id = ?', [
      newServerResponse.insertId,
    ]);

    // create two default channels
    if (createdServer) {
      const generalChannel = await this.createChannel(userId, {
        channelName: 'General',
        serverId: createdServer.id,
        description: 'This is the General channel where anything goes.',
        autoAddNewMembers: true,
      });
      const randomChannel = await this.createChannel(userId, {
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

  deleteServer = async (serverName: string, userId: number) => {
    return await this.dao.run('DELETE FROM server WHERE name = ? AND ownerUserId = ?', [serverName, userId]);
  };

  getChannelById = async (id: number) => {
    return await this.dao.getOne<ChatChannel>('SELECT * FROM channel WHERE id = ?', [id]);
  };

  createChannel = async (userId: number, params: CreateChannelParams) => {
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

    if (!newChannel) {
      throw new CustomError(500, 'could not create new server channel', ErrorTypes.DB);
    }

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
          AND u.id IN ?`,
        [newChannel.insertId, params.serverId, [...addTheseUsers, userId]]
      );
    } else {
      // just add channel creator
      await this.dao.run(
        `INSERT INTO link_channel_user (channelId, userId)
          SELECT ?, ?`,
        [newChannel.insertId, userId]
      );
    }
    return this.getChannelById(newChannel.insertId);
  };

  isUserInServer = async ({
    userId,
    serverId,
    channelId,
  }: {
    userId: number;
    serverId?: number;
    channelId?: number;
  }) => {
    if (serverId) {
      const server = await this.dao.getOne<{ serverId: number; username: string; displayName: string }>(
        `SELECT lsu.serverId, u.username, u.displayName FROM link_server_user lsu 
          LEFT JOIN user u ON lsu.userId = u.id 
          WHERE u.id = ? 
            AND lsu.serverId = ?`,
        [userId, serverId]
      );
      return Boolean(server);
    } else if (channelId) {
      const server = await this.dao.getOne<{ serverId: number }>(
        `SELECT lsu.serverId, u.username, u.displayName FROM link_server_user lsu 
        LEFT JOIN user u ON lsu.userId = u.id
        LEFT JOIN channel c ON c.serverId = lsu.serverId
        WHERE u.id = ? 
          AND c.id = ?`,
        [userId, channelId]
      );
      return Boolean(server);
    }
  };

  isUserInChannel = async ({ userId, channelId }: { userId: number; channelId?: number }) => {
    const channel = await this.dao.getOne<{ channelId: number }>(
      `SELECT lcu.channelId FROM link_channel_user lcu 
        LEFT JOIN user u ON lcu.userId = u.id
        WHERE u.id = ? 
          AND lcu.channelId = ?`,
      [userId, channelId]
    );
    return Boolean(channel);
  };

  sendMessage = async ({
    userId,
    text,
    channelId,
    timestamp,
  }: {
    userId: number;
    channelId: number;
    text: string;
    timestamp: number;
  }) => {
    const contentType = MessageContentType.MESSAGE;
    const message = await this.dao.run(
      `INSERT INTO message (contentType, channelId, content, timestamp, userId) SELECT ?, ?, ?, ?, id FROM user WHERE id = ?`,
      [contentType, channelId, text, timestamp, userId]
    );
    return message;
  };

  getDmChannelFromUsers = async (users: number[]) => {
    // 1. check table against array: [...recipients, sender]. need ALL these ids and NO MORE -> result T / F
    const parameterizedUsers = parameterizeArrayForQuery(users);
    if (!parameterizedUsers) {
      return;
    }
    const { distinctValueArray: distinctUsers, parameterString } = parameterizedUsers;

    const existingChannelId = await this.dao.getOne<{ dmChannelId: number; memberCount: number }>(
      `SELECT dmChannelId, COUNT(userId) AS memberCount 
        FROM link_dmChannel_user ldu 
        INNER JOIN dmChannel dmc ON ldu.dmChannelId = dmc.id
        WHERE ldu.userId IN (${parameterString})
        GROUP BY ldu.dmChannelId
        HAVING memberCount=?
        ORDER BY dmChannelId ASC`,
      [...distinctUsers, distinctUsers.length]
    );
    return existingChannelId?.dmChannelId;
  };

  createDmChannel = async (users: number[]) => {
    const members = Array.from(new Set(users)); // distinct entries
    if (members.length < 1) {
      throw new CustomError(400, 'cannot create channel with 0 members', ErrorTypes.BAD_REQUEST);
    }
    const existingChannelId = await this.getDmChannelFromUsers(users);
    if (existingChannelId) {
      console.log('aborting request to create a dm channel that already exists');
      return existingChannelId;
    }
    const newChannelId = (await this.dao.run('INSERT INTO dmChannel (members) VALUE (?)', [members.length])).insertId;
    // link
    const insertParamQueryBuilder = members.reduce(
      (acc, cur, index) => `${acc}(?,?)${index === members.length - 1 ? ';' : ',\n'}`,
      ''
    );
    const insertParams = members.reduce((acc, cur) => [...acc, newChannelId, cur], [] as number[]);
    await this.dao.run(
      `INSERT INTO link_dmChannel_user (dmChannelId, userId) VALUES ${insertParamQueryBuilder}`,
      insertParams
    );
    return newChannelId;
  };

  sendDirectMessage = async ({
    text,
    sender,
    channelId,
    timestamp,
  }: {
    text: string;
    sender: number;
    channelId: number;
    timestamp: number;
  }) => {
    const contentType = MessageContentType.MESSAGE;
    const message = await this.dao.run(
      `INSERT INTO directMessage (contentType, channelId, content, timestamp, userId) SELECT ?, ?, ?, ?, id FROM user WHERE id = ?`,
      [contentType, channelId, text, timestamp, sender]
    );
    if (!message.insertId) {
      throw new CustomError(500, 'could not add new direct message to db', ErrorTypes.DB);
    }
    return message;
  };

  ///\todo: implement more sophisticated message getters
  // getMessagesByDate = async ({}: { quantity: number; time: number; showBeforeTime?: boolean; showAfterTime?: boolean }) => {

  private getOldestOrNewestMessages = async (quantity: number, offset?: number, getNewestInstead?: boolean) => {
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
    return messages;
  };

  getOldestMessages = async (quantity: number, offset?: number) => {
    return this.getOldestOrNewestMessages(quantity, offset);
  };

  getNewestMessages = async (quantity: number, offset?: number) => {
    return this.getOldestOrNewestMessages(quantity, offset, true);
  };

  getLastestMessagesForChannel = async (channelId: string, numberOfMessages: number, offset?: number) => {
    if (channelId.slice(0, 2) === 'c#') {
      const cid = channelId.slice(2);
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
        [cid, offset ?? 0, numberOfMessages]
      );
    }
  };

  getLastMessageForDmChannels = async (dmChannelId: number | number[]) => {
    const ids = Array.isArray(dmChannelId) ? dmChannelId : [dmChannelId];
    if (!ids.length) {
      return [] as ChatMessage[];
    }
    return await this.dao.getAll<ChatMessage & { username: string; displayName: string }>(
      `SELECT dm.id,
      dm.timestamp,
      dm.content,
      dm.dmChannelId,
      dm.contentType,
      u.id AS userId,
      u.displayName
    FROM directMessage dm
    LEFT JOIN user u
      ON dm.userId = u.id 
    WHERE dm.dmChannelId IN (?)
      ORDER BY dm.timestamp DESC`,
      [ids]
    );
  };

  // list of active users
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

  getSocketIdsFromUserIds = async (users: number[]) => {
    const parameterizedUsers = parameterizeArrayForQuery(users);
    if (!parameterizedUsers) {
      return;
    }
    const { distinctValueArray: distinctUsers, parameterString } = parameterizedUsers;
    return await this.dao.getAll<{ socketId: string }>(
      `SELECT socketId FROM client WHERE userId IN (${parameterString})`,
      distinctUsers
    );
  };
}
