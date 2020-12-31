import { Request, Response } from 'express';
import { ChatService } from './ChatService';
import config from '../config';
import { CustomError } from '../CustomError';
import { CreateChannelParams, ErrorTypes, SocketEvent } from '../types';
import { io } from '../index';

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
    const serverAndDefaultChannels = await this.service.createServer(token, serverName);
    res.json(serverAndDefaultChannels);
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

    const newChannel = await this.service.createChannel(token, {
      channelName,
      serverId,
      description,
      isPrivate,
      addEveryone,
      addTheseUsers,
      autoAddNewMembers,
    });
    res.send(newChannel);
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

  sendMessage = async (req: Request, res: Response) => {
    const token = req.cookies[config.jwt.cookie.name];
    const { text, channelId, serverId } = req.body;
    if (!text) {
      throw new CustomError(400, 'missing key "text"', ErrorTypes.BAD_REQUEST);
    }
    if (!channelId) {
      throw new CustomError(400, 'missing key "channelId"', ErrorTypes.BAD_REQUEST);
    }
    if (!serverId) {
      throw new CustomError(400, 'missing key "serverId"', ErrorTypes.BAD_REQUEST);
    }
    const { timestamp, username } = await this.service.sendMessage({ text, channelId, token });
    // todo: emit message sent event on socket
    io.emit(SocketEvent.NEW_MESSAGE, { content: text, serverId, timestamp, username });
    res.send('message sent');
  };
}
