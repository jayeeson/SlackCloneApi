import { Request, Response } from 'express';
import { ChatService } from './ChatService';
import { AuthService } from '../auth/AuthService';
import config from '../config';
import { CustomError } from '../CustomError';
import { CreateChannelParams, ErrorTypes } from '../types';

export class ChatController {
  service: ChatService;
  authService: AuthService;

  constructor(service: ChatService, authService: AuthService) {
    this.service = service;
    this.authService = authService;
  }

  getStartupData = async (req: Request, res: Response) => {
    const token = req.cookies[config.jwt.cookie.name];
    const validToken = this.authService.isValidToken(token);
    if (!validToken) {
      // gather required data...
    }
    res.send('not implemented');
  };

  createServer = async (req: Request, res: Response) => {
    console.log('top of create server controller');
    const token = req.cookies[config.jwt.cookie.name];
    const { serverName } = req.body;
    const newServerName = await this.service.createServer(token, serverName);
    res.send(newServerName);
  };

  createChannel = async (req: Request, res: Response) => {
    const token = req.cookies[config.jwt.cookie.name];
    console.log('here');

    const {
      channelName,
      serverId,
      description,
      isPrivate,
      addEveryone,
      addTheseUsers,
      autoAddNewMembers,
    } = req.body as CreateChannelParams;
    if (!channelName) {
      throw new CustomError(400, 'Missing channel name', ErrorTypes.BAD_REQUEST);
    }
    if (!serverId) {
      throw new CustomError(400, 'Missing server id', ErrorTypes.BAD_REQUEST);
    }

    const newChannelName = await this.service.createChannel(token, {
      channelName,
      serverId,
      description,
      isPrivate,
      addEveryone,
      addTheseUsers,
      autoAddNewMembers,
    });
    res.send(newChannelName);
  };
}
