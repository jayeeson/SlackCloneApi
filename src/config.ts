import mysql from 'mysql';
import dotenv from 'dotenv';

dotenv.config();

const host = process.env.HOST || 'localhost';
const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306;
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const dbPoolOptions: mysql.ConnectionConfig = {
  host: host,
  port: dbPort,
  user: process.env.DB_USER,
  password: process.env.DB_PASS || '',
};

export default {
  port,
  mysql: {
    connectionOptions: dbPoolOptions,
  },
};
