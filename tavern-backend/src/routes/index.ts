import { Router } from 'express';
import userRoutes from './user.routes';

const router = Router();

router.get('/ping', (req, res) => {
  res.json({ message: '🏰 Tavern backend is alive!' });
});

// Mount user routes
router.use('/users', userRoutes);

export default router;
