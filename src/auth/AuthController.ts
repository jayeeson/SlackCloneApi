import { Request, Response } from 'express';
import config from '../config';
import { CustomError } from '../CustomError';
import { attachTokenToResponse } from '../helpers/jwt';
import { SocketService } from '../socket/SocketService';
import { ErrorTypes } from '../types';
import { AuthService } from './AuthService';

export class AuthController {
  service: AuthService;
  socketService: SocketService;

  constructor(service: AuthService, socketService: SocketService) {
    this.service = service;
    this.socketService = socketService;
  }

  login = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new CustomError(400, 'Missing username / password', ErrorTypes.VALIDATION);
    }

    const { username: loggedInUsername } = await this.service.login(username, password);

    const token = await this.service.generateToken(loggedInUsername);
    attachTokenToResponse(token, res);

    res.send(loggedInUsername);
  };

  register = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new CustomError(400, 'Missing username / password', ErrorTypes.VALIDATION);
    }

    const { username: newUsername } = await this.service.register(username, password);
    await this.socketService.repository.addUserToServer(username, config.defaultServer.id);
    const token = await this.service.generateToken(newUsername);
    attachTokenToResponse(token, res);
    res.send(newUsername);
  };

  logout = async (req: Request, res: Response) => {
    const token = req.cookies[config.jwt.cookie.name];
    if (token) {
      await this.service.logout(token);
      res.clearCookie(config.jwt.cookie.name);
    }

    res.send('Logged out');
  };

  status = async (req: Request, res: Response) => {
    const token = req.cookies[config.jwt.cookie.name];

    if (token) {
      const signedInToken = await this.service.getTokenIfValid(token);
      if (signedInToken) {
        return res.send(signedInToken.username);
      }
    }

    res.clearCookie(config.jwt.cookie.name);
    return res.send('logged out');
  };
}
