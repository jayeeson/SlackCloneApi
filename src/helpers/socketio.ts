import http from 'http';
import socketio, { Socket } from 'socket.io';
import { SqlDao } from '../dao/SqlDao';
import { SocketRepository } from '../socket/SocketRepository';
import { SocketService } from '../socket/SocketService';
import { SocketController } from '../socket/SocketController';
import { app } from '../index';

const dao = new SqlDao();
const socketRepository = new SocketRepository(dao);
const socketService = new SocketService(socketRepository);
const socketController = new SocketController(socketService);

const server = http.createServer(app);
export const io = new socketio.Server(server);

export const launchSocketServer = () => {
  io.on('connect', (socket: Socket) => {
    socketController.onConnect(socket);
  });

  return server;
};
