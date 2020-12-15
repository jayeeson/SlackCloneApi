import config from '../config';
import { IDao } from '../dao/IDao';
import { CreateChannelParams } from '../types';

export class ChatRepository {
  private dao: IDao;

  constructor(dao: IDao) {
    this.dao = dao;
  }

  createServer = async (username: string, inputServerName?: string) => {
    const usernameWithFirstLetterCapitalized = username.slice(0, 1).toLocaleUpperCase() + username.slice(1);
    const useServerName = inputServerName ?? `${usernameWithFirstLetterCapitalized}'s Server`;
    console.log('server name inputted', inputServerName, 'useServerName', useServerName);
    const newServer = await this.dao.run(
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
      [newServer.insertId, username]
    );
    return useServerName;
  };

  createChannel = async (username: string, params: CreateChannelParams) => {
    const { channelName, serverId, description, isPrivate, addEveryone, addTheseUsers, autoAddNewMembers } = params;
    const newChannel = await this.dao.run(
      'INSERT INTO channel (name, serverId, description, isPrivate, autoAddNewMembers) VALUES(?, ?, ?, ?, ?)',
      [channelName, serverId, description ?? config.chat.default.channel.description, isPrivate, autoAddNewMembers]
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
    return params.channelName;
  };

  isUserInServer = async (username: string, serverId: string) => {
    const server = await this.dao.getOne(
      `SELECT (serverId) FROM link_server_user WHERE userId = (
      SELECT id FROM user WHERE username = ?
    ) AND serverId = ?`,
      [username, serverId]
    );
    console.log(server);
    return Boolean(server);
  };
}
