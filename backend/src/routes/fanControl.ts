import { Router } from 'express';
import { getFanSets, updateFanSet } from '../controllers/fanController';

const router = Router();

router.get('/fan-sets', getFanSets);
router.put('/fan-sets/:id', updateFanSet);

export default router;
