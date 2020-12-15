import { IDao } from '../dao/IDao';
import { ChatMessage, ChatChannel } from '../types';

export class SocketRepository {
  dao: IDao;

  constructor(dao: IDao) {
    this.dao = dao;
  }

  addClient = (socketId: string, username: string | undefined) => {
    const params = [socketId, username].filter(nonNull => !!nonNull);
    const query = username
      ? 'INSERT INTO client (socketId, username) VALUES (?,?)'
      : 'INSERT INTO client (socketId) VALUES (?)';
    this.dao.run(query, params);
  };

  removeClient = (socketId: string) => {
    this.dao.run('DELETE FROM client WHERE socketId = ?', [socketId]);
  };

  createServer = (serverName: string, username: string) => {
    this.dao.run(
      `INSERT INTO server (name, ownerUserId) VALUES (
      ?,
      (SELECT id FROM user WHERE username = ?)`,
      [serverName, username]
    );
  };

  deleteServer = (serverName: string, username: string) => {
    this.dao.run('DELETE FROM server WHERE name = ? AND owner = ?)', [serverName, username]);
  };

  createChannel = async (channelName: string, serverId: number, username: string) => {
    const channel = await this.dao.run(`INSERT INTO channel (serverId, name) VALUES(?,?)`, [serverId, channelName]);

    this.dao.run(
      `INSERT INTO link_channel_user (channelId, userId) VALUES(
        ?,
        (SELECT id FROM user WHERE username = ?)
      )`,
      [channel.insertId, username]
    );
  };

  joinChannel = (channelId: number, username: string) => {
    this.dao.run(
      `INSERT INTO link_channel_user (channelId, userId) VALUES (
        ?,
        (SELECT id FROM user WHERE username = ?)
      );`,
      [channelId, username]
    );
  };

  getChannelsForServer = async (serverId: number) => {
    ///\todo: maybe limit columns returned depending on if its accessible: private channel
    return await this.dao.getAll<ChatChannel>('SELECT * FROM channel WHERE serverId = ?', [serverId]);
  };

  // // list of active users
  getLoggedInUsersForServer = async (serverId: number) => {
    return await this.dao.getAll<{ userId: number }>('SELECT userId FROM client WHERE serverId = ?', [serverId]);
  };

  // // time stamp of last message on each channel
  getLastMessageOnEachChannelForServer = async (serverId: number) => {
    return await this.dao.getAll<{ time: Date; channelId: number }>(
      ` SELECT MAX(m.time) AS time,
          c.id AS channelId
        FROM message m
          INNER JOIN channel c
            ON c.id = m.channelId 
          INNER JOIN server s
            ON c.serverId = s.id AND
              s.id = ? 
        GROUP BY c.id;`,
      [serverId]
    );
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
}
