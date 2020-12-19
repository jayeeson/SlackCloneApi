import { Request, Response } from 'express';
import { ChatService } from './ChatService';
import config from '../config';
import { CustomError } from '../CustomError';
import { CreateChannelParams, ErrorTypes } from '../types';

export class ChatController {
  service: ChatService;

  constructor(service: ChatService) {
    this.service = service;
  }

  getStartupData = async (req: Request, res: Response) => {
    const token = req.cookies[config.jwt.cookie.name];
    const data = await this.service.getStartupData(token);
    res.json(data);
  };

  createServer = async (req: Request, res: Response) => {
    const token = req.cookies[config.jwt.cookie.name];
    const { serverName } = req.body;
    const server = await this.service.createServer(token, serverName);
    res.json(server);
  };

  createChannel = async (req: Request, res: Response) => {
    const token = req.cookies[config.jwt.cookie.name];
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

  getOldestMessages = async (req: Request, res: Response) => {
    const { quantity, offset } = req.body;
    if (!quantity) {
      throw new CustomError(400, 'missing key "quantity"', ErrorTypes.BAD_REQUEST);
    }
    const data = await this.service.repository.getOldestMessages(quantity, offset);
    res.send(data);
  };

  getNewestMessages = async (req: Request, res: Response) => {
    const { quantity, offset } = req.body;
    if (!quantity) {
      throw new CustomError(400, 'missing key "quantity"', ErrorTypes.BAD_REQUEST);
    }
    const data = await this.service.repository.getNewestMessages(quantity, offset);
    res.json(data);
  };
}
