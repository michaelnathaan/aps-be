import { NextFunction, Request, Response } from 'express';
import { AppError, ValidationError } from '../../core/errors/custom-errors';
import logger from '../../utils/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  if (err instanceof AppError) {
    const response: any = {
      error: err.name,
      message: err.message,
      code: err.code
    };

    if (err instanceof ValidationError && err.fields) {
      response.fields = err.fields;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  if (err.name === 'PostgresError' || (err as any).code) {
    const pgError = err as any;
    
    if (pgError.code === '23505') {
      res.status(409).json({
        error: 'ConflictError',
        message: 'Resource already exists',
        code: 'DUPLICATE_ENTRY'
      });
      return;
    }

    if (pgError.code === '23503') {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Referenced resource does not exist',
        code: 'INVALID_REFERENCE'
      });
      return;
    }
  }

  res.status(500).json({
    error: 'InternalServerError',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    code: 'INTERNAL_ERROR'
  });
}