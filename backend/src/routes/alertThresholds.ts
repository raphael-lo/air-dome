import { Router } from 'express';
import { getAlertThresholds, updateAlertThreshold, deleteAlertThreshold } from '../controllers/alertThresholdController';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = Router();

router.get('/alert-thresholds/:siteId', authenticateToken, getAlertThresholds);
router.post('/alert-thresholds/:siteId/:metricId', authenticateToken, authorizeRole(['Admin']), updateAlertThreshold);
router.delete('/alert-thresholds/:siteId/:metricId', authenticateToken, authorizeRole(['Admin']), deleteAlertThreshold);

export default router;
