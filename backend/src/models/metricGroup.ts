import db from '../services/databaseService';

export interface MetricGroup {
  id?: number;
  name: string;
  name_tc?: string;
  icon: string;
  metric1_id: number;
  metric1_display_name: string;
  metric1_display_name_tc?: string;
  metric2_id: number;
  metric2_display_name: string;
  metric2_display_name_tc?: string;
}

export const getMetricGroups = () => {
  return new Promise<MetricGroup[]>((resolve, reject) => {
    db.all('SELECT *, name_tc, metric1_display_name_tc, metric2_display_name_tc FROM metric_groups', (err, rows: any[]) => {
      if (err) {
        reject(err);
      } else {
        const metricGroups: MetricGroup[] = rows.map(row => ({
          id: row.id,
          name: row.name,
          name_tc: row.name_tc,
          icon: row.icon,
          metric1_id: row.metric1_id,
          metric1_display_name: row.metric1_display_name,
          metric1_display_name_tc: row.metric1_display_name_tc,
          metric2_id: row.metric2_id,
          metric2_display_name: row.metric2_display_name,
          metric2_display_name_tc: row.metric2_display_name_tc,
        }));
        resolve(metricGroups);
      }
    });
  });
};

export const createMetricGroup = (group: Omit<MetricGroup, 'id'>) => {
  return new Promise<MetricGroup>((resolve, reject) => {
    db.run('INSERT INTO metric_groups (name, name_tc, icon, metric1_id, metric1_display_name, metric1_display_name_tc, metric2_id, metric2_display_name, metric2_display_name_tc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
    [group.name, group.name_tc, group.icon, group.metric1_id, group.metric1_display_name, group.metric1_display_name_tc, group.metric2_id, group.metric2_display_name, group.metric2_display_name_tc], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, ...group });
      }
    });
  });
};

export const updateMetricGroup = (id: number, group: Omit<MetricGroup, 'id'>) => {
  return new Promise<MetricGroup>((resolve, reject) => {
    db.run('UPDATE metric_groups SET name = ?, name_tc = ?, icon = ?, metric1_id = ?, metric1_display_name = ?, metric1_display_name_tc = ?, metric2_id = ?, metric2_display_name = ?, metric2_display_name_tc = ? WHERE id = ?', 
    [group.name, group.name_tc, group.icon, group.metric1_id, group.metric1_display_name, group.metric1_display_name_tc, group.metric2_id, group.metric2_display_name, group.metric2_display_name_tc, id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id, ...group });
      }
    });
  });
};

export const deleteMetricGroup = (id: number) => {
  return new Promise<void>((resolve, reject) => {
    db.run('DELETE FROM metric_groups WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};