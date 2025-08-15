import { Request, Response } from 'express';
import db from '../services/databaseService';
import { FanSet } from '../models/fanSet';

export const getFanSets = (req: Request, res: Response) => {
  db.all('SELECT * FROM fan_sets', (err, rows: FanSet[]) => {
    if (err) {
      res.status(500).json({ message: 'Error fetching fan sets', error: err.message });
    } else {
      res.json(rows);
    }
  });
};

export const updateFanSet = (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, mode, inflow, outflow } = req.body;

  if (status === undefined && mode === undefined && inflow === undefined && outflow === undefined) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  let updateQuery = 'UPDATE fan_sets SET ';
  const params: any[] = [];

  if (status !== undefined) {
    updateQuery += 'status = ?, ';
    params.push(status);
  }

  if (mode !== undefined) {
    updateQuery += 'mode = ?, ';
    params.push(mode);
  }

  if (inflow !== undefined) {
    updateQuery += 'inflow = ?, ';
    params.push(inflow);
  }

  if (outflow !== undefined) {
    updateQuery += 'outflow = ?, ';
    params.push(outflow);
  }

  updateQuery = updateQuery.slice(0, -2); // Remove trailing comma and space
  updateQuery += ' WHERE id = ?';
  params.push(id);

  db.run(updateQuery, params, function(err) {
    if (err) {
      res.status(500).json({ message: 'Error updating fan set', error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Fan set not found' });
    } else {
      db.get('SELECT * FROM fan_sets WHERE id = ?', [id], (err, row: FanSet) => {
        if (err) {
          res.status(500).json({ message: 'Error fetching updated fan set', error: err.message });
        } else {
          res.json(row);
        }
      });
    }
  });
};
