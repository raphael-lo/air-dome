import { Request, Response } from 'express';
import db from '../services/databaseService';
import { LightingState } from '../models/lightingState';

export const getLightingState = (req: Request, res: Response) => {
  db.get('SELECT * FROM lighting_state LIMIT 1', (err, row: LightingState) => {
    if (err) {
      res.status(500).json({ message: 'Error fetching lighting state', error: err.message });
    } else if (!row) {
      // Initialize if not found
      const defaultState = { lights_on: false, brightness: 0 };
      db.run('INSERT INTO lighting_state (lights_on, brightness) VALUES (?, ?)', [defaultState.lights_on, defaultState.brightness], (err) => {
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
  const { lights_on, brightness } = req.body;

  if (lights_on === undefined && brightness === undefined) {
    return res.status(400).json({ message: 'No fields to update' });
  }

  let updateQuery = 'UPDATE lighting_state SET ';
  const params: any[] = [];

  if (lights_on !== undefined) {
    updateQuery += 'lights_on = ?, ';
    params.push(lights_on);
  }

  if (brightness !== undefined) {
    updateQuery += 'brightness = ?, ';
    params.push(brightness);
  }

  updateQuery = updateQuery.slice(0, -2); // Remove trailing comma and space

  db.run(updateQuery, params, function(err) {
    if (err) {
      res.status(500).json({ message: 'Error updating lighting state', error: err.message });
    } else {
      db.get('SELECT * FROM lighting_state LIMIT 1', (err, row: LightingState) => {
        if (err) {
          res.status(500).json({ message: 'Error fetching updated lighting state', error: err.message });
        } else {
          res.json(row);
        }
      });
    }
  });
};
