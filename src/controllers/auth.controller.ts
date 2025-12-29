import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccessResponse, sendErrorResponse } from '../utils/helpers';
import { HTTP_STATUS } from '../utils/constants';
import { logger } from '../utils/logger';

export class AuthController {
  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, email, password } = req.body;

      // Validation
      if (!name || !email || !password) {
        sendErrorResponse(
          res,
          'Name, email, and password are required',
          HTTP_STATUS.BAD_REQUEST
        );
        return;
      }

      if (password.length < 6) {
        sendErrorResponse(
          res,
          'Password must be at least 6 characters long',
          HTTP_STATUS.BAD_REQUEST
        );
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        sendErrorResponse(
          res,
          'Invalid email format',
          HTTP_STATUS.BAD_REQUEST
        );
        return;
      }

      const result = await authService.signup({ name, email, password });
      sendSuccessResponse(res, 'User created successfully', result, HTTP_STATUS.CREATED);
    } catch (error: any) {
      if (error.message === 'User with this email already exists') {
        sendErrorResponse(res, error.message, HTTP_STATUS.CONFLICT);
      } else {
        next(error);
      }
    }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        sendErrorResponse(
          res,
          'Email and password are required',
          HTTP_STATUS.BAD_REQUEST
        );
        return;
      }

      const result = await authService.login({ email, password });
      sendSuccessResponse(res, 'Login successful', result);
    } catch (error: any) {
      if (error.message === 'Invalid email or password') {
        sendErrorResponse(res, error.message, HTTP_STATUS.UNAUTHORIZED);
      } else {
        next(error);
      }
    }
  }

  async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // User is attached to request by auth middleware
      const user = (req as any).user;
      
      if (!user) {
        sendErrorResponse(
          res,
          'User not found',
          HTTP_STATUS.NOT_FOUND
        );
        return;
      }

      sendSuccessResponse(res, 'User retrieved successfully', { user });
    } catch (error: any) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // In a stateless JWT system, logout is handled client-side
      // But we can still provide an endpoint for consistency
      sendSuccessResponse(res, 'Logged out successfully');
    } catch (error: any) {
      next(error);
    }
  }

  async googleAuth(_req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      // This will be handled by passport middleware
      // The actual redirect happens in the route handler
      next();
    } catch (error: any) {
      next(error);
    }
  }

  async googleCallback(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const error = req.query.error as string | undefined;

      // Handle OAuth errors
      if (error) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent(error)}`);
        return;
      }

      // If no user, authentication failed
      if (!user) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/callback?error=authentication_failed`);
        return;
      }

      // Generate JWT token and redirect to frontend
      const result = await authService.handleGoogleOAuth(user);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      // Redirect to frontend with token
      res.redirect(`${frontendUrl}/auth/callback?token=${encodeURIComponent(result.token)}`);
    } catch (error: any) {
      logger.error('Google OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/callback?error=authentication_failed`);
    }
  }
}

export const authController = new AuthController();

