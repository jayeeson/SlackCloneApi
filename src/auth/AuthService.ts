import _ from 'lodash';
import { hashPassword } from '../helpers/bcrypt';
import bcrypt from 'bcrypt';
import { AuthRepository } from './AuthRepository';
import { CustomError } from '../CustomError';
import { createToken, verifyJwtAsync } from '../helpers/jwt';
import { ErrorTypes, User } from '../types';

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
    return user as Omit<User, 'pass'>;
  };

  register = async (username: string, password: string) => {
    const user = await this.repository.getByUser(username);
    if (user) {
      throw new CustomError(403, 'Username already taken', ErrorTypes.VALIDATION);
    }

    const hash = await hashPassword(password);
    const { insertId } = await this.repository.createUser(username, hash);
    return { username, userId: insertId };
  };

  logout = async (token: string) => {
    await this.repository.blacklistToken(token);
  };

  generateToken = async (username: string) => {
    const user = await this.repository.getByUser(username);
    if (!user) {
      throw new CustomError(401, 'authentication error, user not found', ErrorTypes.AUTH);
    }
    const tokenPayload = _.omit(user, 'pass');
    const token = createToken(tokenPayload);
    return token;
  };

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
