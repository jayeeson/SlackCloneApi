import { IDao } from '../dao/IDao';
import { Blacklist, User } from '../types';

export class AuthRepository {
  private dao: IDao;

  constructor(dao: IDao) {
    this.dao = dao;
  }

  getUser = async (user: string | number) => {
    const column = typeof user === 'string' ? 'username' : 'id';
    return await this.dao.getOne<User>(`SELECT * FROM user WHERE ${column} = (?)`, [user]);
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
    const blacklistedToken = await this.dao.getOne<Blacklist>('SELECT * FROM blacklist WHERE token = (?)', [token]);
    if (blacklistedToken) {
      return true;
    }
    return false;
  };
}
