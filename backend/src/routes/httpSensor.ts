import { Router } from 'express';
import { postSensorData } from '../controllers/httpSensorController';

const router = Router();

router.post('/v1/sensor-data', postSensorData);

export default router;
