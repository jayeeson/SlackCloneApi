import mysql from 'mysql';
import config from '../config';

const db = mysql.createPool({
  ...config.mysql.connectionOptions,
  database: 'slack',
});

export const _queryAsync = <T>(db: mysql.Pool | mysql.Connection, query: string, params?: any[]) => {
  return new Promise<T[]>((resolve, reject) => {
    db.query(query, params, (err, results) => {
      if (err) {
        return reject(err);
      }
      resolve(results);
    });
  });
};

export default db;
