import { Router } from 'express';

const router = Router();

// File routes will be implemented later
router.get('/', (req, res) => {
  res.status(501).json({ message: 'File routes not implemented yet' });
});

export default router;

