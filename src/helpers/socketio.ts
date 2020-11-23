import http from 'http';
import socketio from 'socket.io';
import config from '../config';
import { Express } from 'express';

export const initSocketServer = (app: Express) => {
  const server = http.createServer(app);
  const io = new socketio.Server(server, { cors: config.cors.options });

  io.on('connection', socket => {
    console.log('a user connected');
  });

  return server;
};
