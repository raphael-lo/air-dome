import { Router } from 'express';
import { getDomeMetricsStructure } from '../controllers/domeMetricsController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/dome-metrics-structure', authenticateToken, getDomeMetricsStructure);

export default router;
