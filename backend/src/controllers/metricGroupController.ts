import { Request, Response } from 'express';
import db from '../services/databaseService';
import { MetricGroup } from '../models/metricGroup';

export const createMetricGroup = (req: Request, res: Response) => {
  const { name } = req.body;
  db.run('INSERT INTO metric_groups (name) VALUES (?)', [name], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error creating metric group', error: err.message });
    }
    res.status(201).json({ message: 'Metric group created', metricGroupId: this.lastID });
  });
};

export const getMetricGroups = (req: Request, res: Response) => {
  db.all('SELECT * FROM metric_groups', (err, rows: MetricGroup[]) => {
    if (err) {
      res.status(500).json({ message: 'Error fetching metric groups', error: err.message });
    } else {
      res.json(rows);
    }
  });
};

export const updateMetricGroup = (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  db.run('UPDATE metric_groups SET name = ? WHERE id = ?', [name, id], function(err) {
    if (err) {
      res.status(500).json({ message: 'Error updating metric group', error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Metric group not found' });
    } else {
      res.json({ message: 'Metric group updated successfully' });
    }
  });
};

export const deleteMetricGroup = (req: Request, res: Response) => {
  const { id } = req.params;
  db.run('DELETE FROM metric_groups WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ message: 'Error deleting metric group', error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Metric group not found' });
    } else {
      res.json({ message: 'Metric group deleted successfully' });
    }
  });
};