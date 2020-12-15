import express from 'express';
import { SqlDao } from '../dao/SqlDao';
import { asyncWrapper } from '../utils/wrappers';
import { ChatController } from './ChatController';
import { ChatRepository } from './ChatRepository';
import { ChatService } from './ChatService';
import { authService } from '../auth/authRoutes';

const dao = new SqlDao();
const chatRepository = new ChatRepository(dao);
const chatService = new ChatService(chatRepository);
const chatController = new ChatController(chatService, authService);

const router = express.Router();

router.post('/getStartupData', asyncWrapper(chatController.getStartupData));
router.post('/createServer', asyncWrapper(chatController.createServer));
router.post('/createChannel', asyncWrapper(chatController.createChannel));

export default router;
