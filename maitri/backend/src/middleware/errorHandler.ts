import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class AppError extends Error implements ApiError {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { statusCode = 500, message, stack } = error;

  logger.error({
    statusCode,
    message,
    stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  const response = {
    success: false,
    message: statusCode === 500 ? 'Internal Server Error' : message,
    ...(process.env.NODE_ENV === 'development' && { stack }),
  };

  res.status(statusCode).json(response);
};

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Resource not found - ${req.originalUrl}`, 404);
  next(error);
};