import { IDao } from '../dao/IDao';
import { ChatClient } from '../types';

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
}
