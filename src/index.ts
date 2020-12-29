import express from 'express';
import cookieParser from 'cookie-parser';
import http from 'http';
import { Server, Socket } from 'socket.io';
import bodyParser from 'body-parser';
import authRoutes from './auth/authRoutes';
import chatRoutes from './chat/chatRoutes';
import { handleCustomErrors } from './middleware/errors';
import { seedDb } from './db/seedDb';
import config from './config';
import * as mw from './middleware/validators';
import { asyncWrapper } from './utils/wrappers';
import { SqlDao } from './dao/SqlDao';
import { SocketController } from './socket/SocketController';
import { SocketRepository } from './socket/SocketRepository';
import { SocketService } from './socket/SocketService';

seedDb();

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());
app.use(handleCustomErrors);
app.use(authRoutes);
app.use(asyncWrapper(mw.requireToken), chatRoutes);

const server = http.createServer(app);
export const io = new Server(server);

const dao = new SqlDao();
const socketRepository = new SocketRepository(dao);
const socketService = new SocketService(socketRepository);
const socketController = new SocketController(socketService);

io.on('connect', (socket: Socket) => {
  socketController.onConnect(socket);
});

server.listen(config.port, () => {
  console.log('App started on port', config.port);
});
