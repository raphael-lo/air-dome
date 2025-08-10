import { Router } from 'express';
import { getAlerts, acknowledgeAlert } from '../controllers/alertController';

const router = Router();

router.get('/alerts', getAlerts);
router.post('/alerts/:alertId/acknowledge', acknowledgeAlert);

export default router;
