import { Response } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { JwtPayload } from '../types';
import timespan from '../utils/timespan';

export const createToken = (data: JwtPayload) => {
  const token = jwt.sign(data, config.jwt.tokenSecret, config.jwt.options);
  return token;
};

export const attachTokenToResponse = (token: string, res: Response) => {
  const tokenIssueLength = new Date(timespan(config.jwt.options.expiresIn, Date.now()));
  res.cookie(config.jwt.cookie.name, token, { ...config.jwt.cookie.options, expires: tokenIssueLength });
};
