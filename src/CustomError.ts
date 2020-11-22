export enum ErrorTypes {
  'validation',
  'db',
}

export class CustomError extends Error {
  public status: number;
  public type: ErrorTypes;

  constructor(status: number, message: string, type: ErrorTypes) {
    super(message);
    this.status = status;
    this.name = 'CustomError';
    this.type = type;
  }
}
