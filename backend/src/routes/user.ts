import { Router } from 'express';
import { createUser, login, getUsers, updateUser, updateUserStatus } from '../controllers/userController';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import db from '../services/databaseService';

const router = Router();

router.post('/users', authenticateToken, authorizeRole(['Admin']), createUser);
router.post('/login', login);
router.get('/users', authenticateToken, authorizeRole(['Admin', 'Operator']), getUsers);
router.put('/users/:id', authenticateToken, authorizeRole(['Admin']), updateUser);
router.put('/users/:id/status', authenticateToken, authorizeRole(['Admin']), updateUserStatus);

export default router;
