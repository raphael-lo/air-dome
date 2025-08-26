CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  role TEXT DEFAULT 'Operator',
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT,
  device_param TEXT,            -- The key for the device ID in the payload (e.g., 'deviceID')
  device_id TEXT,               -- The value of the device ID in the payload (e.g., 'external-sensor')
  mqtt_param TEXT NOT NULL,     -- The key for the metric value in the payload (e.g., 'temperature')
  display_name TEXT NOT NULL,
  display_name_tc TEXT,
  icon TEXT,
  unit TEXT,
  UNIQUE (topic, device_id, mqtt_param)
);

CREATE TABLE IF NOT EXISTS metric_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  name_tc TEXT,
  icon TEXT,
  metric1_id INTEGER,
  metric1_display_name TEXT,
  metric1_display_name_tc TEXT,
  metric2_id INTEGER,
  metric2_display_name TEXT,
  metric2_display_name_tc TEXT,
  FOREIGN KEY (metric1_id) REFERENCES metrics(id),
  FOREIGN KEY (metric2_id) REFERENCES metrics(id)
);

CREATE TABLE IF NOT EXISTS sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  name_tc TEXT,
  item_order INTEGER
);

CREATE TABLE IF NOT EXISTS section_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  item_type TEXT NOT NULL,
  item_order INTEGER NOT NULL,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  site_id TEXT,
  parameter_key TEXT, -- Changed from 'parameter'
  message_key TEXT,   -- Changed from 'message'
  message_params TEXT, -- New field for JSON string of parameters
  severity TEXT,
  timestamp TEXT,
  status TEXT
);

CREATE TABLE IF NOT EXISTS fan_sets (
  id TEXT PRIMARY KEY,
  name TEXT,
  status TEXT,
  mode TEXT,
  inflow INTEGER,
  outflow INTEGER
);

CREATE TABLE IF NOT EXISTS lighting_state (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lights_on BOOLEAN,
  brightness INTEGER
);

CREATE TABLE IF NOT EXISTS alert_thresholds (
  id TEXT PRIMARY KEY,
  site_id TEXT,
  metric_id INTEGER UNIQUE,
  min_warning REAL,
  max_warning REAL,
  min_alert REAL,
  max_alert REAL,
  FOREIGN KEY (metric_id) REFERENCES metrics(id) ON DELETE CASCADE
);

-- Seed Data --
-- INSERT INTO users (username, password, role, status, created_at) 
-- SELECT 'admin', '$2b$10$wydOzraZ12j.hmkQnTeumOKGxj2eR/I3zjN2JSL0sxDqdiFIfP1WS', 'Admin', 'active', strftime('%Y-%m-%dT%H:%M:%fZ', 'now') -- password
-- WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- Metrics Seed Data --
-- These rules are for the mqtt-simulator, which sends data to the 'air-dome/data' topic
-- and uses the 'sensor_id' key in the payload to identify the device.
-- INSERT INTO metrics (topic, device_param, device_id, mqtt_param, display_name, display_name_tc, unit, icon) SELECT 'air-dome/data', 'sensor_id', 'sensor-1', 'internalPressure', 'Internal Pressure', '內部壓力', 'Pa', 'PressureIcon' WHERE NOT EXISTS (SELECT 1 FROM metrics WHERE device_id = 'sensor-1' AND mqtt_param = 'internalPressure');
-- INSERT INTO metrics (topic, device_param, device_id, mqtt_param, display_name, display_name_tc, unit, icon) SELECT 'air-dome/data', 'sensor_id', 'sensor-2', 'externalPressure', 'External Pressure', '外部壓力', 'Pa', 'PressureIcon' WHERE NOT EXISTS (SELECT 1 FROM metrics WHERE device_id = 'sensor-2' AND mqtt_param = 'externalPressure');
-- INSERT INTO metrics (topic, device_param, device_id, mqtt_param, display_name, display_name_tc, unit, icon) SELECT 'air-dome/data', 'sensor_id', 'sensor-3', 'internalTemperature', 'Internal Temperature', '內部溫度', '°C', 'TempIcon' WHERE NOT EXISTS (SELECT 1 FROM metrics WHERE device_id = 'sensor-3' AND mqtt_param = 'internalTemperature');
-- INSERT INTO metrics (topic, device_param, device_id, mqtt_param, display_name, display_name_tc, unit, icon) SELECT 'air-dome/data', 'sensor_id', 'sensor-4', 'externalTemperature', 'External Temperature', '外部溫度', '°C', 'TempIcon' WHERE NOT EXISTS (SELECT 1 FROM metrics WHERE device_id = 'sensor-4' AND mqtt_param = 'externalTemperature');
-- INSERT INTO metrics (topic, device_param, device_id, mqtt_param, display_name, display_name_tc, unit, icon) SELECT 'air-dome/data', 'sensor_id', 'sensor-21', 'fanSpeed', 'Fan Speed', '風扇速度', 'RPM', 'FanIcon' WHERE NOT EXISTS (SELECT 1 FROM metrics WHERE device_id = 'sensor-21' AND mqtt_param = 'fanSpeed');

-- Metric Groups Seed Data --
-- INSERT INTO metric_groups (name, name_tc, icon, metric1_id, metric2_id) SELECT 'Group Pressure', '壓力', 'PressureIcon', 1, 2 WHERE NOT EXISTS (SELECT 1 FROM metric_groups WHERE name = 'Group Pressure');
-- INSERT INTO metric_groups (name, name_tc, icon, metric1_id, metric2_id) SELECT 'Group Temperature', '溫度', 'TempIcon', 3, 4 WHERE NOT EXISTS (SELECT 1 FROM metric_groups WHERE name = 'Group Temperature');

-- Sections Seed Data --
-- INSERT INTO sections (name, item_order) SELECT 'Dome Integrity', 0 WHERE NOT EXISTS (SELECT 1 FROM sections WHERE name = 'Dome Integrity');
-- INSERT INTO sections (name, item_order) SELECT 'Environment', 1 WHERE NOT EXISTS (SELECT 1 FROM sections WHERE name = 'Environment');
-- INSERT INTO sections (name, item_order) SELECT 'Air Quality', 2 WHERE NOT EXISTS (SELECT 1 FROM sections WHERE name = 'Air Quality');
-- INSERT INTO sections (name, item_order) SELECT 'Systems Status', 3 WHERE NOT EXISTS (SELECT 1 FROM sections WHERE name = 'Systems Status');

-- Section Items Seed Data --
-- INSERT INTO section_items (section_id, item_id, item_type, item_order) SELECT 1, 1, 'group', 0 WHERE NOT EXISTS (SELECT 1 FROM section_items WHERE section_id = 1 AND item_id = 1 AND item_type = 'group');
-- INSERT INTO section_items (section_id, item_id, item_type, item_order) SELECT 1, 5, 'metric', 1 WHERE NOT EXISTS (SELECT 1 FROM section_items WHERE section_id = 1 AND item_id = 5 AND item_type = 'metric');
-- INSERT INTO section_items (section_id, item_id, item_type, item_order) SELECT 2, 2, 'group', 0 WHERE NOT EXISTS (SELECT 1 FROM section_items WHERE section_id = 2 AND item_id = 2 AND item_type = 'group');

-- Fan Sets Seed Data --
INSERT INTO fan_sets (id, name, status, mode, inflow, outflow) SELECT 'fan_set_1', 'Fan Set 1', 'on', 'auto', 75, 60 WHERE NOT EXISTS (SELECT 1 FROM fan_sets WHERE id = 'fan_set_1');
INSERT INTO fan_sets (id, name, status, mode, inflow, outflow) SELECT 'fan_set_2', 'Fan Set 2', 'on', 'manual', 50, 50 WHERE NOT EXISTS (SELECT 1 FROM fan_sets WHERE id = 'fan_set_2');

-- Lighting State Seed Data --
INSERT INTO lighting_state (id, lights_on, brightness) SELECT 1, 1, 80 WHERE NOT EXISTS (SELECT 1 FROM lighting_state WHERE id = 1);

-- Alert Thresholds Seed Data --
-- INSERT INTO alert_thresholds (id, site_id, metric_id, min_warning, max_warning, min_alert, max_alert) 
-- SELECT 'threshold-internal-pressure', 'site_a', (SELECT id FROM metrics WHERE mqtt_param = 'internalPressure'), 100, 150, 50, 200 
-- WHERE NOT EXISTS (SELECT 1 FROM alert_thresholds WHERE id = 'threshold-internal-pressure');

-- INSERT INTO alert_thresholds (id, site_id, metric_id, min_warning, max_warning, min_alert, max_alert) 
-- SELECT 'threshold-external-temperature', 'site_a', (SELECT id FROM metrics WHERE mqtt_param = 'externalTemperature'), -5, 35, -10, 40 
-- WHERE NOT EXISTS (SELECT 1 FROM alert_thresholds WHERE id = 'threshold-external-temperature');

-- INSERT INTO alert_thresholds (id, site_id, metric_id, min_warning, max_warning, min_alert, max_alert) 
-- SELECT 'threshold-internal-co2', 'site_a', (SELECT id FROM metrics WHERE mqtt_param = 'internalCO2'), 800, 1200, 1000, 1500 
-- WHERE NOT EXISTS (SELECT 1 FROM alert_thresholds WHERE id = 'threshold-internal-co2');
