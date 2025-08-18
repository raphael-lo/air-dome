import { Router } from 'express';
import { createSection, getSections, updateSection, deleteSection, getSectionItems, addSectionItem, removeSectionItem, updateSectionItemOrder, updateSectionOrder } from '../controllers/sectionController';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = Router();

router.post('/sections', authenticateToken, authorizeRole(['Admin']), createSection);
router.get('/sections', authenticateToken, authorizeRole(['Admin']), getSections);
router.put('/sections/:id', authenticateToken, authorizeRole(['Admin']), updateSection);
router.delete('/sections/:id', authenticateToken, authorizeRole(['Admin']), deleteSection);

router.get('/sections/:id/items', authenticateToken, authorizeRole(['Admin']), getSectionItems);
router.post('/sections/:id/items', authenticateToken, authorizeRole(['Admin']), addSectionItem);
router.delete('/sections/:id/items/:itemId', authenticateToken, authorizeRole(['Admin']), removeSectionItem);
router.put('/sections/:id/items/order', authenticateToken, authorizeRole(['Admin']), updateSectionItemOrder);
router.put('/sections/order', authenticateToken, authorizeRole(['Admin']), updateSectionOrder);

export default router;