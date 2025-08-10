import { Request, Response } from 'express';
import db from '../services/databaseService';

interface AlertThreshold {
  id: string;
  siteId: string;
  metricName: string;
  minWarning: number;
  maxWarning: number;
  minAlert: number;
  maxAlert: number;
}

export const getAlertThresholds = (req: Request, res: Response) => {
  const { siteId } = req.params;
  db.all('SELECT * FROM alert_thresholds WHERE siteId = ?', [siteId], (err, rows: AlertThreshold[]) => {
    if (err) {
      res.status(500).json({ message: 'Error getting alert thresholds', error: err.message });
    } else {
      res.json(rows);
    }
  });
};

export const updateAlertThreshold = (req: Request, res: Response) => {
  const { siteId, metricName } = req.params;
  const { minWarning, maxWarning, minAlert, maxAlert } = req.body;

  db.run(
    `INSERT INTO alert_thresholds (id, siteId, metricName, minWarning, maxWarning, minAlert, maxAlert)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(metricName) DO UPDATE SET
     minWarning = excluded.minWarning,
     maxWarning = excluded.maxWarning,
     minAlert = excluded.minAlert,
     maxAlert = excluded.maxAlert
    `,
    [ `${siteId}-${metricName}`, siteId, metricName, minWarning, maxWarning, minAlert, maxAlert ],
    function (err) {
      if (err) {
        res.status(500).json({ message: 'Error updating alert threshold', error: err.message });
      } else {
        res.status(200).json({ message: 'Alert threshold updated successfully', changes: this.changes });
      }
    }
  );
};
