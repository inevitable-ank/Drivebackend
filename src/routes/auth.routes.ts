import { Router } from 'express';
import passport from 'passport';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Signup route
router.post('/signup', (req, res, next) => authController.signup(req, res, next));

// Login route
router.post('/login', (req, res, next) => authController.login(req, res, next));

// Get current user (protected route)
router.get('/me', authenticate, (req, res, next) => authController.getCurrentUser(req, res, next));

// Logout route (protected route)
router.post('/logout', authenticate, (req, res, next) => authController.logout(req, res, next));

// Google OAuth routes
// Initiate Google OAuth flow
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false, // We're using JWT, not sessions
  })
);

// Handle Google OAuth callback
router.get(
  '/google/callback',
  (req, res, next) => {
    passport.authenticate('google', { session: false }, (err: any, user: any, _info: any) => {
      // Handle errors
      if (err) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/auth/callback?error=authentication_failed`);
      }

      // If no user, authentication failed
      if (!user) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const error = req.query.error || 'authentication_failed';
        return res.redirect(`${frontendUrl}/auth/callback?error=${encodeURIComponent(error as string)}`);
      }

      // Attach user to request and continue
      (req as any).user = user;
      next();
    })(req, res, next);
  },
  (req, res, next) => authController.googleCallback(req, res, next)
);

export default router;

