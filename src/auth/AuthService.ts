import { hashPassword } from '../helpers/bcrypt';
import bcrypt from 'bcrypt';
import { AuthRepository } from './AuthRepository';
import { CustomError } from '../CustomError';
import { createToken, verifyJwtAsync } from '../helpers/jwt';
import { ErrorTypes, JwtPayload } from '../types';

export class AuthService {
  repository: AuthRepository;

  constructor(repository: AuthRepository) {
    this.repository = repository;
  }

  login = async (username: string, password: string) => {
    const user = await this.repository.getByUser(username);
    if (!user) {
      throw new CustomError(401, 'user not found', ErrorTypes.VALIDATION);
    }
    const passMatch = await bcrypt.compare(password, user.pass);
    if (!passMatch) {
      throw new CustomError(401, 'Incorrect password', ErrorTypes.VALIDATION);
    }
    return username;
  };

  register = async (username: string, password: string) => {
    const user = await this.repository.getByUser(username);
    if (user) {
      throw new CustomError(403, 'Username already taken', ErrorTypes.VALIDATION);
    }

    const hash = await hashPassword(password);
    await this.repository.createUser(username, hash);
    return username;
  };

  logout = async (token: string) => {
    await this.repository.blacklistToken(token);
  };

  generateToken(username: string) {
    const data: JwtPayload = { username };
    const token = createToken(data);
    return token;
  }

  isValidToken = async (token: string) => {
    if (!token) {
      return null;
    }
    const valid = await verifyJwtAsync(token);
    if (!valid) {
      return null;
    }
    const blacklisted = await this.repository.isTokenBlacklisted(token);
    if (blacklisted) {
      return null;
    }
    const userRow = await this.repository.getByUser(valid.username);
    return userRow;
  };
}
