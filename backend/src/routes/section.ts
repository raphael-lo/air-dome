import { Router } from 'express';
import { createSection, getSections, updateSection, deleteSection, addSectionItem, updateSectionItems, deleteSectionItem } from '../controllers/sectionController';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = Router();

router.post('/sections', authenticateToken, authorizeRole(['Admin']), createSection);
router.get('/sections', authenticateToken, authorizeRole(['Admin']), getSections);
router.put('/sections/:id', authenticateToken, authorizeRole(['Admin']), updateSection);
router.delete('/sections/:id', authenticateToken, authorizeRole(['Admin']), deleteSection);
router.post('/sections/:id/items', authenticateToken, authorizeRole(['Admin']), addSectionItem);
router.put('/sections/:id/items', authenticateToken, authorizeRole(['Admin']), updateSectionItems);
router.delete('/sections/:id/items/:itemId', authenticateToken, authorizeRole(['Admin']), deleteSectionItem);

export default router;