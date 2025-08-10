import { Request, Response } from 'express';
import db from '../services/databaseService';
import { LightingState } from '../models/lightingState';

export const getLightingState = (req: Request, res: Response) => {
  db.get('SELECT * FROM lighting_state LIMIT 1', (err, row: LightingState) => {
    if (err) {
      res.status(500).json({ message: 'Error fetching lighting state', error: err.message });
    } else if (!row) {
      // Initialize if not found
      const defaultState = { lightsOn: false, brightness: 0 };
      db.run('INSERT INTO lighting_state (lightsOn, brightness) VALUES (?, ?)', [defaultState.lightsOn, defaultState.brightness], (err) => {
        if (err) {
          res.status(500).json({ message: 'Error initializing lighting state', error: err.message });
        } else {
          res.json(defaultState);
        }
      });
    } else {
      res.json(row);
    }
  });
};

export const updateLightingState = (req: Request, res: Response) => {
  const { lightsOn, brightness } = req.body;

  db.run('UPDATE lighting_state SET lightsOn = ?, brightness = ?', [lightsOn, brightness], function(err) {
    if (err) {
      res.status(500).json({ message: 'Error updating lighting state', error: err.message });
    } else if (this.changes === 0) {
      // If no row was updated, it means it didn't exist, so insert it
      db.run('INSERT INTO lighting_state (lightsOn, brightness) VALUES (?, ?)', [lightsOn, brightness], (err) => {
        if (err) {
          res.status(500).json({ message: 'Error inserting lighting state', error: err.message });
        } else {
          res.json({ lightsOn, brightness });
        }
      });
    } else {
      res.json({ lightsOn, brightness });
    }
  });
};
