import { NextFunction, Request, Response } from 'express';
import { CustomError } from '../CustomError';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const handleCustomErrors = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.log(err);

  if (err.name === 'CustomError') {
    const { message, name, type, status } = err as CustomError;
    return res.status(status).send(JSON.stringify({ message, name, type }));
  }
  return res.sendStatus(500);
};
