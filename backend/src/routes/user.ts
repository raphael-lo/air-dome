import { Router } from 'express';
import { createUser, login } from '../controllers/userController';
import db from '../services/databaseService';

const router = Router();

router.post('/users', createUser);
router.post('/login', login);

router.get('/users', (req, res) => {
  db.all('SELECT id, username, role, status, createdAt FROM users', (err, rows) => {
    if (err) {
      res.status(500).json({ message: 'Error fetching users', error: err.message });
    } else {
      res.json(rows);
    }
  });
});

router.put('/users/:userId/status', (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  if (!status || (status !== 'active' && status !== 'disabled')) {
    return res.status(400).json({ message: 'Invalid status provided' });
  }

  db.run('UPDATE users SET status = ? WHERE id = ?', [status, userId], function(err) {
    if (err) {
      res.status(500).json({ message: 'Error updating user status', error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'User not found' });
    } else {
      res.json({ message: 'User status updated successfully' });
    }
  });
});

export default router;
