import mysql from 'mysql';
import dotenv from 'dotenv';
import { CustomError, ErrorTypes } from './CustomError';
import { Algorithm } from 'jsonwebtoken';
import { DeploymentType as Mode } from './types';
import { CookieOptions } from 'express';

dotenv.config();

const mode: Mode = process.env.NODE_ENV === 'production' ? Mode.PROD : Mode.DEV;
const https = false;

const protocol = `http${https ? 's' : ''}`;
const host = process.env.HOST || 'localhost';
const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306;
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const url = mode === Mode.PROD ? `${protocol}://${host}` : `${protocol}://${host}:${port}`;

const tokenSecret = process.env.TOKEN_SECRET;
if (!tokenSecret) {
  throw new CustomError(500, 'Server start issue', ErrorTypes.init);
}

const dbPoolOptions: mysql.ConnectionConfig = {
  host: host,
  port: dbPort,
  user: process.env.DB_USER,
  password: process.env.DB_PASS || '',
};

const jwtOptions = {
  algorithm: 'HS256' as Algorithm,
  audience: url,
  expiresIn: '7 days',
};

const cookieOptions: CookieOptions = {
  httpOnly: true,
};

const cookie = {
  name: 'jwtToken',
  options: cookieOptions,
};

export default {
  port,
  mysql: {
    connectionOptions: dbPoolOptions,
  },
  jwt: {
    tokenSecret,
    options: jwtOptions as typeof jwtOptions,
    cookie,
  },
};
