import express from 'express';
import { SqlDao } from '../dao/SqlDao';
import { SocketRepository } from '../socket/SocketRepository';
import { SocketService } from '../socket/SocketService';
import { asyncWrapper } from '../utils/wrappers';
import { AuthController } from './AuthController';
import { AuthRepository } from './AuthRepository';
import { AuthService } from './AuthService';

const dao = new SqlDao();
const authRepository = new AuthRepository(dao);
export const authService = new AuthService(authRepository);
const socketRepository = new SocketRepository(dao);
const socketService = new SocketService(socketRepository);
const authController = new AuthController(authService, socketService);

const router = express.Router();

router.post('/login', asyncWrapper(authController.login));
router.post('/register', asyncWrapper(authController.register));
router.get('/logout', asyncWrapper(authController.logout));
router.get('/status', asyncWrapper(authController.status));

export default router;
