import { BaseError } from '../types';

export class AppError implements BaseError {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    public message: string,
    statusCode: number,
    isOperational = true,
  ) {
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
  name: string | undefined;
  stack?: string | undefined;
}