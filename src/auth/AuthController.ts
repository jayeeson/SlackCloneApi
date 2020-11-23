import { Request, Response } from 'express';
import config from '../config';
import { CustomError } from '../CustomError';
import { attachTokenToResponse } from '../helpers/jwt';
import { ErrorTypes } from '../types';
import { AuthService } from './AuthService';

export class AuthController {
  service: AuthService;

  constructor(service: AuthService) {
    this.service = service;
  }

  login = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new CustomError(400, 'Missing username / password', ErrorTypes.VALIDATION);
    }

    const loggedInUsername = await this.service.validatePassword(username, password);

    const token = this.service.generateToken(username);
    attachTokenToResponse(token, res);

    res.send(loggedInUsername);
  };

  register = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new CustomError(400, 'Missing username / password', ErrorTypes.VALIDATION);
    }

    const registeredUsername = await this.service.register(username, password);
    const token = this.service.generateToken(username);
    attachTokenToResponse(token, res);
    res.send(registeredUsername);
  };

  logout = async (req: Request, res: Response) => {
    const token = req.cookies[config.jwt.cookie.name];
    if (token) {
      await this.service.logout(token);
      res.clearCookie(config.jwt.cookie.name);
    }

    res.send('Logged out');
  };
}
