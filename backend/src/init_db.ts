import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs'; // Added

const DB_FILE = path.resolve(__dirname, '../air_dome.db');

const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
    return;
  }
  console.log(`Connected to the SQLite database at ${DB_FILE}`);
  db.serialize(() => {
    const INIT_SQL_FILE = path.resolve(__dirname, './config/init.sql');
    const initSql = fs.readFileSync(INIT_SQL_FILE, 'utf-8');
    db.exec(initSql, function(err) {
        if (err) {
            console.error('Error initializing database:', err.message);
        } else {
            console.log('Tables created successfully');
        }
    });
    // db.run(`INSERT INTO fan_sets (id, name, status, mode, inflow, outflow) SELECT 'fan-set-1', 'Fan Set 1', 'on', 'auto', 50, 50 WHERE NOT EXISTS (SELECT 1 FROM fan_sets WHERE id = 'fan-set-1')`);
    // db.run(`INSERT INTO fan_sets (id, name, status, mode, inflow, outflow) SELECT 'fan-set-2', 'Fan Set 2', 'off', 'manual', 0, 0 WHERE NOT EXISTS (SELECT 1 FROM fan_sets WHERE id = 'fan-set-2')`);
    // db.run(`INSERT INTO lighting_states (id, lights_on, brightness) SELECT 1, 1, 80 WHERE NOT EXISTS (SELECT 1 FROM lighting_state WHERE id = 1)`);
    // db.run(`INSERT INTO alerts (id, siteId, parameter, message, severity, timestamp, status) SELECT 'alert-1', 'site-1', 'Internal Pressure', 'Pressure is critically low!', 'danger', '2024-05-23T10:00:00Z', 'active' WHERE NOT EXISTS (SELECT 1 FROM alerts WHERE id = 'alert-1')`);
    // db.run(`INSERT INTO alerts (id, siteId, parameter, message, severity, timestamp, status) SELECT 'alert-2', 'site-1', 'External Wind Speed', 'High wind speeds detected.', 'warn', '2024-05-23T10:05:00Z', 'active' WHERE NOT EXISTS (SELECT 1 FROM alerts WHERE id = 'alert-2')`);
    // db.run(`INSERT INTO sections (name, name_tc, item_order) SELECT 'Dome Integrity', 'section_dome_integrity_name_tc', 0 WHERE NOT EXISTS (SELECT 1 FROM sections WHERE name = 'Dome Integrity')`);
    // db.run(`INSERT INTO sections (name, name_tc, item_order) SELECT 'Environment', 'section_environment_name_tc', 1 WHERE NOT EXISTS (SELECT 1 FROM sections WHERE name = 'Environment')`);
    // db.run(`INSERT INTO sections (name, name_tc, item_order) SELECT 'Air Quality', 'section_air_quality_name_tc', 2 WHERE NOT EXISTS (SELECT 1 FROM sections WHERE name = 'Air Quality')`);
    // db.run(`INSERT INTO sections (name, name_tc, item_order) SELECT 'Systems Status', 'section_systems_status_name_tc', 3 WHERE NOT EXISTS (SELECT 1 FROM sections WHERE name = 'Systems Status')`);
    // db.run(`INSERT INTO metrics (mqtt_param, display_name, display_name_tc, device_id, unit, icon) SELECT 'pressure', 'Presure', 'Presure_tc', 'device-1', 'Pa', 'PressureIcon' WHERE NOT EXISTS (SELECT 1 FROM metrics WHERE mqtt_param = 'pressure')`);
    // db.run(`INSERT INTO metrics (mqtt_param, display_name, display_name_tc, device_id, unit, icon) SELECT 'temperature', 'Temperature', 'Temperature_tc', 'device-2', '°C', 'TempIcon' WHERE NOT EXISTS (SELECT 1 FROM metrics WHERE mqtt_param = 'temperature')`);
    // db.run(`INSERT INTO metric_groups (name, name_tc, icon, metric1_id, metric1_display_name, metric1_display_name_tc, metric2_id, metric2_display_name, metric2_display_name_tc) SELECT 'group persure', 'group_pressure_name_tc', 'PressureIcon', 1, 'metric_internal_pressure_display_name', 'metric_internal_pressure_display_name_tc', 2, 'metric_external_pressure_display_name', 'metric_external_pressure_display_name_tc' WHERE NOT EXISTS (SELECT 1 FROM metric_groups WHERE name = 'group_pressure_name')`);
    // db.run(`INSERT INTO metric_groups (name, name_tc, icon, metric1_id, metric1_display_name, metric1_display_name_tc, metric2_id, metric2_display_name, metric2_display_name_tc) SELECT 'group temp', 'group_temperature_name_tc', 'TempIcon', 3, 'metric_internal_temperature_display_name', 'metric_internal_temperature_display_name_tc', 4, 'metric_external_temperature_display_name', 'metric_external_temperature_display_name_tc' WHERE NOT EXISTS (SELECT 1 FROM metric_groups WHERE name = 'group_temperature_name')`);
  });
  db.close();
});