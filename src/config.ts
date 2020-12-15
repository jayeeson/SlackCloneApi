import mysql from 'mysql';
import dotenv from 'dotenv';
import { CustomError } from './CustomError';
import { Algorithm } from 'jsonwebtoken';
import { DeploymentType as Mode, ErrorTypes } from './types';
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
  throw new CustomError(500, 'Server setup issue', ErrorTypes.CONFIG);
}

// Client currently uses proxy. Reenable cors if that changes.
// const clientUrl = process.env.CLIENT_URL;
// if (!clientUrl) {
//   throw new CustomError(500, 'Server setup issue', ErrorTypes.CONFIG);
// }

// const cors = {
//   options: { origin: clientUrl, credentials: true },
// };

const dbPoolOptions: mysql.ConnectionConfig = {
  host: host,
  port: dbPort,
  user: process.env.DB_USER,
  password: process.env.DB_PASS || '',
  dateStrings: true,
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

const chat = {
  default: {
    channel: {
      description: 'This is the description for this channel',
    },
  },
};

export default {
  // cors,
  port,
  mysql: {
    connectionOptions: dbPoolOptions,
  },
  jwt: {
    tokenSecret,
    options: jwtOptions as typeof jwtOptions,
    cookie,
  },
  chat,
};
