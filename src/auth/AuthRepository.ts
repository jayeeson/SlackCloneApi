import { IDao } from '../dao/IDao';
import { User } from '../types';

export class AuthRepository {
  private dao: IDao;

  constructor(dao: IDao) {
    this.dao = dao;
  }

  getByUser = async (username: string) => {
    return await this.dao.getOne<User>('SELECT * FROM user WHERE name = (?)', [username]);
  };

  createUser = async (username: string, hash: string) => {
    return await this.dao.run('INSERT INTO user (name, pass) VALUES (?,?)', [username, hash]);
  };

  blacklistToken = async (token: string) => {
    return await this.dao.run('INSERT INTO blacklist (token, insertDate) VALUES (?,?)', [token, new Date().getTime()]);
  };
}
