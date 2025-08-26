import db from '../services/databaseService';
import { Metric } from '../types';

export const getMetrics = (): Promise<Metric[]> => {
  const sql = `SELECT id, topic, device_param, device_id, mqtt_param, display_name, display_name_tc, icon, unit FROM metrics`;
  return new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows) => {
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
        // Return the created metric with its new ID
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