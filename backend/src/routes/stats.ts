import { Router } from 'express';
import { getBrokerStats } from '../controllers/statsController';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = Router();

// This route is only accessible to users with the 'Admin' role.
router.get('/stats', authenticateToken, authorizeRole(['Admin']), getBrokerStats);

export default router;
