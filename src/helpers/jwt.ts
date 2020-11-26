import { Response } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { JwtDecoded, JwtPayload } from '../types';
import timespan from '../utils/timespan';

export const createToken = (data: JwtPayload) => {
  const token = jwt.sign(data, config.jwt.tokenSecret, config.jwt.options);
  return token;
};

export const attachTokenToResponse = (token: string, res: Response) => {
  const tokenIssueLength = new Date(timespan(config.jwt.options.expiresIn, Date.now()));
  res.cookie(config.jwt.cookie.name, token, { ...config.jwt.cookie.options, expires: tokenIssueLength });
};

const verifyJwtAsync = async (token: string) => {
  const decoded = await new Promise<JwtDecoded>((resolve, reject) => {
    jwt.verify(token, config.jwt.tokenSecret, (err: jwt.VerifyErrors | null, decoded: any) => {
      if (err) {
        return reject(err);
      }
      return resolve(decoded as JwtDecoded);
    });
  });
  return decoded;
};

export const getCookieFromRequest = (req: any) => {
  // console.log(req);
  return 'cookie';
};

export const verifySocketToken = async (req: any): Promise<JwtDecoded | undefined> => {
  const cookie = getCookieFromRequest(req);
  if (!cookie) {
    return undefined;
  }
  try {
    const decoded = await verifyJwtAsync(cookie);
    return decoded;
  } catch {
    return undefined;
  }
};
