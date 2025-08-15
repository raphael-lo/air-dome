import { Request, Response } from 'express';
import db from '../services/databaseService';
import { Metric } from '../models/metric';

export const createMetric = (req: Request, res: Response) => {
  const { mqtt_param, display_name, device_id, group_id } = req.body;
  db.run('INSERT INTO metrics (mqtt_param, display_name, device_id, group_id) VALUES (?, ?, ?, ?)', [mqtt_param, display_name, device_id, group_id], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error creating metric', error: err.message });
    }
    res.status(201).json({ message: 'Metric created', metricId: this.lastID });
  });
};

export const getMetrics = (req: Request, res: Response) => {
  db.all('SELECT * FROM metrics', (err, rows: Metric[]) => {
    if (err) {
      res.status(500).json({ message: 'Error fetching metrics', error: err.message });
    } else {
      res.json(rows);
    }
  });
};

export const updateMetric = (req: Request, res: Response) => {
  const { id } = req.params;
  const { mqtt_param, display_name, device_id, group_id } = req.body;
  db.run('UPDATE metrics SET mqtt_param = ?, display_name = ?, device_id = ?, group_id = ? WHERE id = ?', [mqtt_param, display_name, device_id, group_id, id], function(err) {
    if (err) {
      res.status(500).json({ message: 'Error updating metric', error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Metric not found' });
    } else {
      res.json({ message: 'Metric updated successfully' });
    }
  });
};

export const deleteMetric = (req: Request, res: Response) => {
  const { id } = req.params;
  db.run('DELETE FROM metrics WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ message: 'Error deleting metric', error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Metric not found' });
    } else {
      res.json({ message: 'Metric deleted successfully' });
    }
  });
};