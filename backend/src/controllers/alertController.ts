import { Request, Response } from 'express';
import db from '../services/databaseService';
import { Alert } from '../models/alert';

export const getAlerts = (req: Request, res: Response) => {
  const { site_id } = req.query;
  let query = 'SELECT * FROM alerts';
  const params: string[] = [];

  if (site_id) {
    query += ' WHERE site_id = ?';
    params.push(site_id as string);
  }

  db.all(query, params, (err, rows: Alert[]) => {
    if (err) {
      res.status(500).json({ message: 'Error fetching alerts', error: err.message });
    } else {
      res.json(rows);
    }
  });
};

export const acknowledgeAlert = (req: Request, res: Response) => {
  const { alertId } = req.params;

  db.run('UPDATE alerts SET status = ? WHERE id = ?', ['acknowledged', alertId], function(err) {
    if (err) {
      res.status(500).json({ message: 'Error acknowledging alert', error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Alert not found' });
    } else {
      res.json({ message: 'Alert acknowledged successfully' });
    }
  });
};
