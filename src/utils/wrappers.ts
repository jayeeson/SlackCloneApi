import { NextFunction, Request, Response } from 'express';
import { Socket } from 'socket.io';

export const asyncWrapper = (fn: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

export const wrapExpressMwForIo = (fn: any) => {
  return (socket: Socket, next: NextFunction) => {
    fn(socket.request, {}, next);
  };
};
