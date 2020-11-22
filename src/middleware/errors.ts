import { Request, Response } from 'express';
import { CustomError, ErrorTypes } from '../CustomError';

export const handleCustomErrors = (err: any, req: Request, res: Response) => {
  if (err.name === 'CustomError') {
    const { message, name, type } = err as CustomError;
    if (type === ErrorTypes.validation) {
      return res.status(400).send(JSON.stringify({ message, name, type }));
    } else if (type === ErrorTypes.db) {
      return res.status(500).send(message);
    }
  } else {
    res.status(500).send('unknown server error');
  }
};
