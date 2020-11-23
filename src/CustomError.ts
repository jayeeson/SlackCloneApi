import { ErrorTypes } from './types';

export class CustomError extends Error {
  status: number;
  type: ErrorTypes;

  constructor(status: number, message: string, type: ErrorTypes) {
    super(message);
    this.status = status;
    this.name = 'CustomError';
    this.type = type;
  }
}
