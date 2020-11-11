import mysql from 'mysql';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.HOST || 'localhost';
const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306;

const dbPoolOptions: mysql.ConnectionConfig = {
  host: host,
  port: dbPort,
  user: process.env.DB_USER,
  password: process.env.DB_PASS || '',
};

export default {
  mysql: {
    connectionOptions: dbPoolOptions,
  },
};
