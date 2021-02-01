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

export const parameterizeArrayForQuery = <T>(arr: T[]) => {
  const distinctValueArray = Array.from(new Set(arr)); // basic distinct entries => does not work on array of objects.
  if (distinctValueArray.length < 1) {
    return;
  }
  const parameterString = distinctValueArray.reduce(
    (acc, cur, index) => (index === distinctValueArray.length - 1 ? `${acc}?` : `${acc}?,`),
    ''
  );
  return { distinctValueArray, parameterString };
};

export default db;
