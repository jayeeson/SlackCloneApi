import { IDao } from '../dao/IDao';
import { User } from '../types';

export class AuthRepository {
  private dao: IDao;

  constructor(dao: IDao) {
    this.dao = dao;
  }

  getByUser = async (username: string) => {
    return await this.dao.getOne<User>('SELECT * FROM user WHERE username = (?)', [username]);
  };

  createUser = async (username: string, hash: string) => {
    return await this.dao.run('INSERT INTO user (username, pass, displayName) VALUES (?,?,?)', [
      username,
      hash,
      username,
    ]);
  };

  blacklistToken = async (token: string) => {
    return await this.dao.run('INSERT INTO blacklist (token, insertDate) VALUES (?,?)', [token, new Date().getTime()]);
  };

  isTokenBlacklisted = async (token: string) => {
    const dbToken = await this.dao.getOne('SELECT * FROM blacklist WHERE token = (?)', [token]);
    if (dbToken) {
      return true;
    }
    return false;
  };
}
