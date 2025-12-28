import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { sendErrorResponse } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Default error
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Internal server error';

  sendErrorResponse(res, message, statusCode);
};

