import { Router } from 'express';
import { getAlertThresholds, createAlertThreshold, updateAlertThreshold, deleteAlertThreshold, reloadConfig } from '../controllers/alertThresholdController';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = Router();

router.get('/alert-thresholds/:siteId', authenticateToken, getAlertThresholds);
router.post('/alert-thresholds/:siteId', authenticateToken, authorizeRole(['Admin']), createAlertThreshold);
router.put('/alert-thresholds/:siteId/:id', authenticateToken, authorizeRole(['Admin']), updateAlertThreshold);
router.delete('/alert-thresholds/:siteId/:id', authenticateToken, authorizeRole(['Admin']), deleteAlertThreshold);
router.post('/config/reload', authenticateToken, reloadConfig); // New endpoint for config reload

export default router;
