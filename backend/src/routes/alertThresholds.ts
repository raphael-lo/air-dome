import { Router } from 'express';
import { getAlertThresholds, updateAlertThreshold } from '../controllers/alertThresholdController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/alert-thresholds/:siteId', authenticateToken, getAlertThresholds);
router.post('/alert-thresholds/:siteId/:metricName', authenticateToken, updateAlertThreshold);

export default router;
