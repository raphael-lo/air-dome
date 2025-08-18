import db from '../services/databaseService';

export interface Metric {
  id: number;
  mqtt_param: string;
  display_name: string;
  display_name_tc?: string;
  device_id: string;
  icon: string;
  unit?: string;
  itemId?: number;
  section_item_id?: number;
}

export const getMetrics = () => {
  return new Promise<Metric[]>((resolve, reject) => {
    db.all('SELECT * FROM metrics', (err, rows: any[]) => {
      if (err) {
        reject(err);
      } else {
        const metrics: Metric[] = rows.map(row => ({
          id: row.id,
          mqtt_param: row.mqtt_param,
          display_name: row.display_name,
          display_name_tc: row.display_name_tc,
          device_id: row.device_id,
          icon: row.icon,
          unit: row.unit,
        }));
        resolve(metrics);
      }
    });
  });
};

export const createMetric = (metric: Omit<Metric, 'id'>) => {
  return new Promise<Metric>((resolve, reject) => {
    db.run('INSERT INTO metrics (mqtt_param, display_name, display_name_tc, device_id, icon, unit) VALUES (?, ?, ?, ?, ?, ?)', 
    [metric.mqtt_param, metric.display_name, metric.display_name_tc, metric.device_id, metric.icon, metric.unit], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, ...metric });
      }
    });
  });
};

export const updateMetric = (id: number, metric: Omit<Metric, 'id'>) => {
  return new Promise<Metric>((resolve, reject) => {
    db.run('UPDATE metrics SET mqtt_param = ?, display_name = ?, display_name_tc = ?, device_id = ?, icon = ?, unit = ? WHERE id = ?', 
    [metric.mqtt_param, metric.display_name, metric.display_name_tc, metric.device_id, metric.icon, metric.unit, id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id, ...metric });
      }
    });
  });
};

export const deleteMetric = (id: number) => {
  return new Promise<void>((resolve, reject) => {
    db.run('DELETE FROM metrics WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};