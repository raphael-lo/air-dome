import sqlite3 from 'sqlite3';
import path from 'path';

const DB_FILE = path.resolve(__dirname, '../air_dome.db');

const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
    return;
  }
  console.log(`Connected to the SQLite database at ${DB_FILE}`);
  db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT, role TEXT, status TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP)');
    db.run('CREATE TABLE IF NOT EXISTS sensor_data (id INTEGER PRIMARY KEY AUTOINCREMENT, pressure REAL, temperature REAL, humidity REAL, windSpeed REAL, timestamp TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS fan_sets (id TEXT PRIMARY KEY, name TEXT, status TEXT, mode TEXT, inflow INTEGER, outflow INTEGER)');
    db.run('CREATE TABLE IF NOT EXISTS lighting_state (id INTEGER PRIMARY KEY AUTOINCREMENT, lightsOn BOOLEAN, brightness INTEGER)');
    db.run('CREATE TABLE IF NOT EXISTS alerts (id TEXT PRIMARY KEY, siteId TEXT, parameter TEXT, message TEXT, severity TEXT, timestamp TEXT, status TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS metrics (id INTEGER PRIMARY KEY AUTOINCREMENT, mqtt_param TEXT, display_name TEXT, device_id TEXT, group_id INTEGER, FOREIGN KEY (group_id) REFERENCES metric_groups(id))');
    db.run('CREATE TABLE IF NOT EXISTS metric_groups (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT)');
    db.run('CREATE TABLE IF NOT EXISTS sections (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, item_order INTEGER)');
    db.run('CREATE TABLE IF NOT EXISTS section_items (id INTEGER PRIMARY KEY AUTOINCREMENT, section_id INTEGER, item_id INTEGER, item_type TEXT, item_order INTEGER, FOREIGN KEY (section_id) REFERENCES sections(id))');
    db.run(`INSERT INTO users (username, password, role, status) SELECT 'admin', '$2b$10$1S4szPEWy6eo7L6uhV6xaOBTdGdtKS1zoffNN4NJWEY1V.YUxXZgC', 'Admin', 'active' WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin')`);
    db.run(`INSERT INTO fan_sets (id, name, status, mode, inflow, outflow) SELECT 'fan-set-1', 'Fan Set 1', 'on', 'auto', 50, 50 WHERE NOT EXISTS (SELECT 1 FROM fan_sets WHERE id = 'fan-set-1')`);
    db.run(`INSERT INTO fan_sets (id, name, status, mode, inflow, outflow) SELECT 'fan-set-2', 'Fan Set 2', 'off', 'manual', 0, 0 WHERE NOT EXISTS (SELECT 1 FROM fan_sets WHERE id = 'fan-set-2')`);
    db.run(`INSERT INTO lighting_state (id, lightsOn, brightness) SELECT 1, 1, 80 WHERE NOT EXISTS (SELECT 1 FROM lighting_state WHERE id = 1)`);
    db.run(`INSERT INTO alerts (id, siteId, parameter, message, severity, timestamp, status) SELECT 'alert-1', 'site-1', 'Internal Pressure', 'Pressure is critically low!', 'danger', '2024-05-23T10:00:00Z', 'active' WHERE NOT EXISTS (SELECT 1 FROM alerts WHERE id = 'alert-1')`);
    db.run(`INSERT INTO alerts (id, siteId, parameter, message, severity, timestamp, status) SELECT 'alert-2', 'site-1', 'External Wind Speed', 'High wind speeds detected.', 'warn', '2024-05-23T10:05:00Z', 'active' WHERE NOT EXISTS (SELECT 1 FROM alerts WHERE id = 'alert-2')`);
    db.run(`INSERT INTO sections (name, item_order) SELECT 'Dome Integrity', 0 WHERE NOT EXISTS (SELECT 1 FROM sections WHERE name = 'Dome Integrity')`);
    db.run(`INSERT INTO sections (name, item_order) SELECT 'Environment', 1 WHERE NOT EXISTS (SELECT 1 FROM sections WHERE name = 'Environment')`);
    db.run(`INSERT INTO sections (name, item_order) SELECT 'Air Quality', 2 WHERE NOT EXISTS (SELECT 1 FROM sections WHERE name = 'Air Quality')`);
    db.run(`INSERT INTO sections (name, item_order) SELECT 'Systems Status', 3 WHERE NOT EXISTS (SELECT 1 FROM sections WHERE name = 'Systems Status')`);
    db.run(`INSERT INTO metric_groups (name) SELECT 'Pressure' WHERE NOT EXISTS (SELECT 1 FROM metric_groups WHERE name = 'Pressure')`);
    db.run(`INSERT INTO metric_groups (name) SELECT 'Temperature' WHERE NOT EXISTS (SELECT 1 FROM metric_groups WHERE name = 'Temperature')`);
    db.run(`INSERT INTO metric_groups (name) SELECT 'Humidity' WHERE NOT EXISTS (SELECT 1 FROM metric_groups WHERE name = 'Humidity')`);
    db.run(`INSERT INTO metric_groups (name) SELECT 'PM2.5' WHERE NOT EXISTS (SELECT 1 FROM metric_groups WHERE name = 'PM2.5')`);
    db.run(`INSERT INTO metric_groups (name) SELECT 'CO2' WHERE NOT EXISTS (SELECT 1 FROM metric_groups WHERE name = 'CO2')`);
    db.run(`INSERT INTO metric_groups (name) SELECT 'O2' WHERE NOT EXISTS (SELECT 1 FROM metric_groups WHERE name = 'O2')`);
    db.run(`INSERT INTO metric_groups (name) SELECT 'CO' WHERE NOT EXISTS (SELECT 1 FROM metric_groups WHERE name = 'CO')`);
    db.run(`INSERT INTO metric_groups (name) SELECT 'Noise' WHERE NOT EXISTS (SELECT 1 FROM metric_groups WHERE name = 'Noise')`);
  });
  db.close();
});