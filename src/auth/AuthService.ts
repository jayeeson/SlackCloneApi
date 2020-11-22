import { hashPassword } from '../helpers/bcrypt';
import bcrypt from 'bcrypt';
import { AuthRepository } from './AuthRepository';
import { CustomError, ErrorTypes } from '../CustomError';

export class AuthService {
  repository: AuthRepository;

  constructor(repository: AuthRepository) {
    this.repository = repository;
  }

  login = async (username: string, password: string): Promise<string> => {
    const user = await this.repository.getByUser(username);
    if (!user) {
      throw new CustomError(401, 'user not found', ErrorTypes.validation);
    }
    const passMatch = await bcrypt.compare(password, user.pass);
    if (!passMatch) {
      throw new CustomError(401, 'Incorrect password', ErrorTypes.validation);
    }
    ///\todo: issue jwt
    return username;
  };

  register = async (username: string, password: string): Promise<string> => {
    const user = await this.repository.getByUser(username);
    if (user) {
      throw new CustomError(403, 'Username already taken', ErrorTypes.validation);
    }

    const hash = await hashPassword(password);
    await this.repository.createUser(username, hash);
    ///\todo: issue jwt token
    return username;
  };
}
