import { Request, Response } from 'express';
import { CustomError, ErrorTypes } from '../CustomError';
import { AuthService } from './AuthService';

export class AuthController {
  service: AuthService;

  constructor(service: AuthService) {
    this.service = service;
  }

  login = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new CustomError(400, 'Missing username / password', ErrorTypes.validation);
    }

    const loggedInUsername = await this.service.login(username, password);
    res.send(loggedInUsername);
  };

  register = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new CustomError(400, 'Missing username / password', ErrorTypes.validation);
    }

    const registeredUsername = await this.service.register(username, password);
    res.send(registeredUsername);
  };
}
