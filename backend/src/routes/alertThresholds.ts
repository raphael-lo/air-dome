import { Router } from 'express';
import { getAlertThresholds, updateAlertThreshold, deleteAlertThreshold } from '../controllers/alertThresholdController';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = Router();

router.get('/alert-thresholds/:siteId', authenticateToken, getAlertThresholds);
router.put('/alert-thresholds/:siteId/:id', authenticateToken, authorizeRole(['Admin']), updateAlertThreshold);
router.delete('/alert-thresholds/:siteId/:id', authenticateToken, authorizeRole(['Admin']), deleteAlertThreshold);

export default router;
