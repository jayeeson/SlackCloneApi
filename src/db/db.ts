import mysql from 'mysql';
import config from '../config';

export default mysql.createPool({
  ...config.mysql.connectionOptions,
  database: 'slack',
});
