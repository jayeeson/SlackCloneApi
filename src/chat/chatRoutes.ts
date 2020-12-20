import express from 'express';
import { SqlDao } from '../dao/SqlDao';
import { asyncWrapper } from '../utils/wrappers';
import { ChatController } from './ChatController';
import { ChatRepository } from './ChatRepository';
import { ChatService } from './ChatService';

const dao = new SqlDao();
const chatRepository = new ChatRepository(dao);
const chatService = new ChatService(chatRepository);
const chatController = new ChatController(chatService);

const router = express.Router();

router.get('/getStartupData', asyncWrapper(chatController.getStartupData));
router.post('/createServer', asyncWrapper(chatController.createServer));
router.post('/createChannel', asyncWrapper(chatController.createChannel));
router.post('/getOldestMessages', asyncWrapper(chatController.getOldestMessages));
router.post('/getNewestMessages', asyncWrapper(chatController.getNewestMessages));
router.post('/sendMessage', asyncWrapper(chatController.sendMessage));

export default router;
