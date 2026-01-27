import { NextFunction, Request, Response } from 'express';
import { AppError, ValidationError } from '@core/errors/custom-errors';
import { logger } from '@utils/logger';

/**
 * Global error handler for Express
 * Converts custom errors to proper HTTP responses
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Handle custom application errors
  if (err instanceof AppError) {
    const response: any = {
      error: err.name,
      message: err.message,
      code: err.code
    };

    // Add validation fields if available
    if (err instanceof ValidationError && err.fields) {
      response.fields = err.fields;
    }

    res.status(err.statusCode).json(response);
    return;
  }

  // Handle database errors
  if (err.name === 'PostgresError' || (err as any).code) {
    const pgError = err as any;
    
    // Unique constraint violation
    if (pgError.code === '23505') {
      res.status(409).json({
        error: 'ConflictError',
        message: 'Resource already exists',
        code: 'DUPLICATE_ENTRY'
      });
      return;
    }

    // Foreign key violation
    if (pgError.code === '23503') {
      res.status(400).json({
        error: 'ValidationError',
        message: 'Referenced resource does not exist',
        code: 'INVALID_REFERENCE'
      });
      return;
    }
  }

  // Default 500 error
  res.status(500).json({
    error: 'InternalServerError',
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : err.message,
    code: 'INTERNAL_ERROR'
  });
}