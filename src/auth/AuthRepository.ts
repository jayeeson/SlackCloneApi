import { OkPacket } from 'mysql';
import { IDao } from '../dao/IDao';
import { User } from '../types';

export class AuthRepository {
  private dao: IDao;

  constructor(dao: IDao) {
    this.dao = dao;
  }

  getByUser = async (username: string): Promise<User | undefined> => {
    return await this.dao.getOne<User>(`SELECT * FROM user WHERE name = (?)`, [username]);
  };

  createUser = async (username: string, hash: string): Promise<OkPacket> => {
    return await this.dao.run('INSERT INTO user (name, pass) VALUES (?,?)', [username, hash]);
  };
}
