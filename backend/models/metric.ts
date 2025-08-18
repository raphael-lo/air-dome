import { Pool } from 'pg';

export interface Metric {
    id: number;
    mqtt_param: string;
    display_name: string;
    display_name_tc?: string; // Added
    device_id: string;
    icon: string; // Added
    unit?: string; // Added
}

const pool = new Pool();

export const getMetrics = async () => {
    const res = await pool.query('SELECT * FROM metrics');
    return res.rows;
};

export const createMetric = async (metric: { mqtt_param: string; display_name: string; device_id: string; }) => {
    const res = await pool.query(
        'INSERT INTO metrics (mqtt_param, display_name, device_id) VALUES ($1, $2, $3) RETURNING *',
        [metric.mqtt_param, metric.display_name, metric.device_id]
    );
    return res.rows[0];
};

export const updateMetric = async (id: number, metric: { mqtt_param: string; display_name: string; device_id: string; }) => {
    const res = await pool.query(
        'UPDATE metrics SET mqtt_param = $1, display_name = $2, device_id = $3 WHERE id = $4 RETURNING *',
        [metric.mqtt_param, metric.display_name, metric.device_id, id]
    );
    return res.rows[0];
};

export const deleteMetric = async (id: number) => {
    await pool.query('DELETE FROM metrics WHERE id = $1', [id]);
};

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