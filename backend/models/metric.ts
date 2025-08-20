import db from '../services/databaseService';
import { Metric } from '../types';

export const getMetrics = (): Promise<Metric[]> => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM metrics', [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows as Metric[]);
      }
    });
  });
};

export const createMetric = (metric: Metric): Promise<Metric> => {
  const { topic, device_param, device_id, mqtt_param, display_name, display_name_tc, icon, unit } = metric;
  const sql = `INSERT INTO metrics (topic, device_param, device_id, mqtt_param, display_name, display_name_tc, icon, unit)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  return new Promise((resolve, reject) => {
    db.run(sql, [topic, device_param, device_id, mqtt_param, display_name, display_name_tc, icon, unit], function(err) {
      if (err) {
        reject(err);
      } else {
        db.get('SELECT * FROM metrics WHERE id = ?', [this.lastID], (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row as Metric);
          }
        });
      }
    });
  });
};

export const updateMetric = (id: number, metric: Metric): Promise<Metric> => {
  const { topic, device_param, device_id, mqtt_param, display_name, display_name_tc, icon, unit } = metric;
  const sql = `UPDATE metrics SET
                 topic = ?,
                 device_param = ?,
                 device_id = ?,
                 mqtt_param = ?,
                 display_name = ?,
                 display_name_tc = ?,
                 icon = ?,
                 unit = ?
               WHERE id = ?`;
  return new Promise((resolve, reject) => {
    db.run(sql, [topic, device_param, device_id, mqtt_param, display_name, display_name_tc, icon, unit, id], function(err) {
      if (err) {
        reject(err);
      } else {
        db.get('SELECT * FROM metrics WHERE id = ?', [id], (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row as Metric);
          }
        });
      }
    });
  });
};

export const deleteMetric = (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM metrics WHERE id = ?', [id], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

/*
// The following functions are for a different feature and use a different database client.
// Commenting them out to avoid errors until they can be properly refactored.

import { Pool } from 'pg';

export const getSections = async () => {
    const res = await pool.query('SELECT * FROM sections ORDER BY section_order');
    return res.rows;
};

export const createSection = async (section: { name: string }) => {
    const res = await pool.query('INSERT INTO sections (name) VALUES ($1) RETURNING *', [section.name]);
    return res.rows[0];
};

export const updateSection = async (id: number, section: { name: string }) => {
    const res = await pool.query('UPDATE sections SET name = $1 WHERE id = $2 RETURNING *', [section.name, id]);
    return res.rows[0];
};

export const deleteSection = async (id: number) => {
    await pool.query('DELETE FROM sections WHERE id = $1', [id]);
};

export const updateSectionItems = async (sectionId: number, items: any[]) => {
    // This is a simplified example. You'd need a more robust way to handle item updates.
    // You might have a separate table for section items.
    console.log(`Updating items for section ${sectionId}`, items);
    // For demonstration, this function doesn't actually do anything.
    return;
};
*/