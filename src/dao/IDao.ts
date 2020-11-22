import { OkPacket } from 'mysql';

export interface IDao {
  getOne: <T>(query: string, params?: any[]) => Promise<T | undefined>;
  getAll: <T>(query: string, params?: any[]) => Promise<T[]>;
  run: (query: string, params?: any[]) => Promise<OkPacket>;
}
