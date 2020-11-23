import mysql, { OkPacket } from 'mysql';
import { CustomError } from '../CustomError';
import sql from '../db/db';
import { ErrorTypes } from '../types';
import { IDao } from './IDao';

export class SqlDao implements IDao {
  private db: mysql.Pool;

  constructor() {
    this.db = sql;
  }

  getOne = <T>(query: string, params?: any[]): Promise<T | undefined> => {
    return new Promise<T>((resolve, reject) => {
      try {
        this.db.query(query, params, (err: mysql.MysqlError | null, results: T[]) => {
          if (err) {
            reject(err);
          } else if (results.length) {
            resolve(results[0]);
          } else {
            resolve(undefined);
          }
        });
      } catch (err) {
        console.log(err);
        throw new CustomError(500, 'Database issue', ErrorTypes.DB);
      }
    });
  };

  getAll = <T>(query: string, params?: any[]): Promise<T[]> => {
    return new Promise<T[]>((resolve, reject) => {
      try {
        this.db.query(query, params, (err: mysql.MysqlError | null, results: T[]) => {
          if (err) {
            reject(err);
          } else if (results.length) {
            resolve(results);
          } else {
            resolve([]);
          }
        });
      } catch (err) {
        console.log(err);
        throw new CustomError(500, 'Database issue', ErrorTypes.DB);
      }
    });
  };

  run = (query: string, params?: any[]): Promise<OkPacket> => {
    return new Promise<OkPacket>((resolve, reject) => {
      try {
        this.db.query(query, params, (err: mysql.MysqlError | null, results: OkPacket) => {
          if (err) {
            reject(err);
          }
          resolve(results);
        });
      } catch (err) {
        console.log(err);
        throw new CustomError(500, 'Database issue', ErrorTypes.DB);
      }
    });
  };
}
