import { Router } from 'express';

const router = Router();

// Share routes will be implemented later
router.get('/', (_req, res) => {
  res.status(501).json({ message: 'Share routes not implemented yet' });
});

export default router;

