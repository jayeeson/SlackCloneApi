import express from 'express';
import { SqlDao } from '../dao/SqlDao';
import { asyncWrapper } from '../utils/wrappers';
import { AuthController } from './AuthController';
import { AuthRepository } from './AuthRepository';
import { AuthService } from './AuthService';

const dao = new SqlDao();
const authRepository = new AuthRepository(dao);
const authService = new AuthService(authRepository);
const authController = new AuthController(authService);

const router = express.Router();

router.post('/login', asyncWrapper(authController.login));
router.post('/register', asyncWrapper(authController.register));
router.get('/logout', asyncWrapper(authController.logout));
router.get('/status', asyncWrapper(authController.status));

export default router;
