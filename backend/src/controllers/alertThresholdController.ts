import { Request, Response } from 'express';
import db from '../services/databaseService';
import { v4 as uuidv4 } from 'uuid';
import type { AlertThreshold } from '../types';
import { mqttClient } from '../services/mqttService';

export const getAlertThresholds = (req: Request, res: Response) => {
  const { siteId } = req.params;
  db.all(
    `SELECT at.*, m.mqtt_param, m.display_name
     FROM alert_thresholds at
     JOIN metrics m ON at.metric_id = m.id
     WHERE at.site_id = ?`,
    [siteId],
    (err, rows: AlertThreshold[]) => {
      if (err) {
        return res.status(500).json({ message: 'Error getting alert thresholds', error: err.message });
      }
      res.json(rows);
    }
  );
};

export const createAlertThreshold = (req: Request, res: Response) => {
  const { siteId } = req.params;
  const { metric_id, min_warning, max_warning, min_alert, max_alert } = req.body;

  db.run(
    `INSERT INTO alert_thresholds (id, site_id, metric_id, min_warning, max_warning, min_alert, max_alert)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(metric_id) DO UPDATE SET
     min_warning = excluded.min_warning,
     max_warning = excluded.max_warning,
     min_alert = excluded.min_alert,
     max_alert = excluded.max_alert
    `,
    [ uuidv4(), siteId, metric_id, min_warning, max_warning, min_alert, max_alert ],
    function (err) {
      if (err) {
        return res.status(500).json({ message: 'Error creating or updating alert threshold', error: err.message });
      }
      // After a successful insert or update, we may want to return the new/updated object.
      // For now, just returning a success message.
      res.status(201).json({ message: 'Alert threshold created or updated successfully' });
      mqttClient.publish('air-dome/config/update', JSON.stringify({ type: 'thresholds' }));
    }
  );
};

export const updateAlertThreshold = (req: Request, res: Response) => {
  const { siteId, id: thresholdId } = req.params;
  const { metric_id, min_warning, max_warning, min_alert, max_alert } = req.body;

  db.run(
    `UPDATE alert_thresholds SET
     metric_id = ?,
     min_warning = ?,
     max_warning = ?,
     min_alert = ?,
     max_alert = ?
     WHERE id = ? AND site_id = ?
    `,
    [metric_id, min_warning, max_warning, min_alert, max_alert, thresholdId, siteId],
    function (err) {
      if (err) {
        return res.status(500).json({ message: 'Error updating alert threshold', error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Alert threshold not found or no changes made' });
      }
      res.status(200).json({ message: 'Alert threshold updated successfully', changes: this.changes });
      mqttClient.publish('air-dome/config/update', JSON.stringify({ type: 'thresholds' }));
    }
  );
};

export const deleteAlertThreshold = (req: Request, res: Response) => {
  const { siteId, id: thresholdId } = req.params;

  db.run('DELETE FROM alert_thresholds WHERE site_id = ? AND id = ?', [siteId, thresholdId], function (err) {
    if (err) {
      return res.status(500).json({ message: 'Error deleting alert threshold', error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Alert threshold not found' });
    }
    res.status(200).json({ message: 'Alert threshold deleted successfully' });
    mqttClient.publish('air-dome/config/update', JSON.stringify({ type: 'thresholds' }));
  });
};

export const reloadConfig = (req: Request, res: Response) => {
  try {
    mqttClient.publish('air-dome/config/reload', JSON.stringify({})); // Publish empty JSON object to trigger reload
    res.status(200).json({ message: 'Config reload triggered' });
  } catch (error) {
    console.error('Error triggering config reload:', error);
    res.status(500).json({ message: 'Failed to trigger config reload' });
  }
};