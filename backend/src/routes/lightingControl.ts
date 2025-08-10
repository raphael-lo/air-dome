import { Router } from 'express';
import { getLightingState, updateLightingState } from '../controllers/lightingController';

const router = Router();

router.get('/lighting-state', getLightingState);
router.put('/lighting-state', updateLightingState);

export default router;
