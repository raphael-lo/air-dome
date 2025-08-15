import { Router } from 'express';
import { createMetricGroup, getMetricGroups, updateMetricGroup, deleteMetricGroup } from '../controllers/metricGroupController';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = Router();

router.post('/metric-groups', authenticateToken, authorizeRole(['Admin']), createMetricGroup);
router.get('/metric-groups', authenticateToken, authorizeRole(['Admin']), getMetricGroups);
router.put('/metric-groups/:id', authenticateToken, authorizeRole(['Admin']), updateMetricGroup);
router.delete('/metric-groups/:id', authenticateToken, authorizeRole(['Admin']), deleteMetricGroup);

export default router;