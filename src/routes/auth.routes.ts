import { Router } from 'express';
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

// Google OAuth routes (will be implemented later)
router.get('/google', (req, res) => {
  res.status(501).json({ message: 'Google OAuth not implemented yet' });
});

router.get('/google/callback', (req, res) => {
  res.status(501).json({ message: 'Google OAuth callback not implemented yet' });
});

export default router;

