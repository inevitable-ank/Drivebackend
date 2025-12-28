import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendErrorResponse } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';

export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendErrorResponse(
        res,
        'Authorization token required',
        HTTP_STATUS.UNAUTHORIZED
      );
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = authService.verifyToken(token);
    if (!decoded) {
      sendErrorResponse(
        res,
        'Invalid or expired token',
        HTTP_STATUS.UNAUTHORIZED
      );
      return;
    }

    // Get user from database
    const user = await authService.getUserById(decoded.userId);
    if (!user) {
      sendErrorResponse(
        res,
        'User not found',
        HTTP_STATUS.UNAUTHORIZED
      );
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    sendErrorResponse(
      res,
      'Authentication failed',
      HTTP_STATUS.UNAUTHORIZED
    );
  }
};

