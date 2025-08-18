import { Pool } from 'pg';

const pool = new Pool();

export const getMetricGroups = async () => {
    const res = await pool.query('SELECT * FROM metric_groups');
    return res.rows;
};

export const createMetricGroup = async (group: { name: string }) => {
    const res = await pool.query('INSERT INTO metric_groups (name) VALUES ($1) RETURNING *', [group.name]);
    return res.rows[0];
};

export const updateMetricGroup = async (id: number, group: { name: string }) => {
    const res = await pool.query('UPDATE metric_groups SET name = $1 WHERE id = $2 RETURNING *', [group.name, id]);
    return res.rows[0];
};

export const deleteMetricGroup = async (id: number) => {
    await pool.query('DELETE FROM metric_groups WHERE id = $1', [id]);
};

export const getMetricsForGroup = async (groupId: number) => {
    const res = await pool.query(
        'SELECT m.* FROM metrics m JOIN metric_group_items mgi ON m.id = mgi.metric_id WHERE mgi.metric_group_id = $1 ORDER BY mgi.item_order',
        [groupId]
    );
    return res.rows;
};

export const addMetricToGroup = async (groupId: number, metricId: number, order: number) => {
    const res = await pool.query(
        'INSERT INTO metric_group_items (metric_group_id, metric_id, item_order) VALUES ($1, $2, $3) RETURNING *',
        [groupId, metricId, order]
    );
    return res.rows[0];
};

export const removeMetricFromGroup = async (groupId: number, metricId: number) => {
    await pool.query('DELETE FROM metric_group_items WHERE metric_group_id = $1 AND metric_id = $2', [groupId, metricId]);
};
