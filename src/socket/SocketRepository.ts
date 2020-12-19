import { IDao } from '../dao/IDao';

export class SocketRepository {
  dao: IDao;

  constructor(dao: IDao) {
    this.dao = dao;
  }

  addClient = async (socketId: string, username: string | undefined) => {
    return await this.dao.run('INSERT INTO client (socketId, userId) SELECT ?, id FROM user WHERE username = ?', [
      socketId,
      username,
    ]);
  };

  removeClient = (socketId: string) => {
    this.dao.run('DELETE FROM client WHERE socketId = ?', [socketId]);
  };
}
