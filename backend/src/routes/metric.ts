import { Router } from 'express';
import { createMetric, getMetrics, updateMetric, deleteMetric } from '../controllers/metricController';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = Router();

router.post('/metrics', authenticateToken, authorizeRole(['Admin']), createMetric);
router.get('/metrics', authenticateToken, getMetrics);
router.put('/metrics/:id', authenticateToken, authorizeRole(['Admin']), updateMetric);
router.delete('/metrics/:id', authenticateToken, authorizeRole(['Admin']), deleteMetric);

export default router;