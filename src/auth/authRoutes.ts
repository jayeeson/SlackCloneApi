import express from 'express';
import { SqlDao } from '../dao/SqlDao';
import { asyncWrapper } from '../utils/asyncWrapper';
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

export default router;
