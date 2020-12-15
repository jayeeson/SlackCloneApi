import { NextFunction, Request, Response } from 'express';
import config from '../config';
import { CustomError } from '../CustomError';
import { ErrorTypes } from '../types';
import { authService } from '../auth/authRoutes';

export const requireToken = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies[config.jwt.cookie.name];
  const validToken = await authService.isValidToken(token);
  if (!validToken) {
    throw new CustomError(401, 'Not authenticated', ErrorTypes.VALIDATION);
  }
  next();
};
