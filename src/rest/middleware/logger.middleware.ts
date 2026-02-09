import { Request, Response, NextFunction } from 'express';
import logger from '../../utils/logger';

/**
 * Request logger middleware
 * Logs incoming requests and responses
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  logger.info({
    type: 'request',
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip
  });

  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info({
      type: 'response',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
}