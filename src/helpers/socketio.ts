import http from 'http';
import socketio, { Socket } from 'socket.io';
import config from '../config';
import { Express } from 'express';
import { SqlDao } from '../dao/SqlDao';
import { SocketRepository } from '../socket/SocketRepository';
import { SocketService } from '../socket/SocketService';
import { SocketController } from '../socket/SocketController';
export enum SocketEvent {}

const dao = new SqlDao();
const socketRepository = new SocketRepository(dao);
const socketService = new SocketService(socketRepository);
const socketController = new SocketController(socketService);

export const launchSocketServer = (app: Express) => {
  const server = http.createServer(app);
  const io = new socketio.Server(server, { cors: config.cors.options });

  io.on('connect', (socket: Socket) => {
    socketController.onConnect(socket);
  });

  return server;
};
