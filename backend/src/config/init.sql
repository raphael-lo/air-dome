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
  mqtt_param TEXT NOT NULL,
  device_param TEXT NOT NULL,
  display_name TEXT NOT NULL,
  display_name_tc TEXT,
  device_id TEXT NOT NULL,
  icon TEXT,
  unit TEXT,
  UNIQUE (mqtt_param, device_param)
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
  parameter TEXT,
  message TEXT,
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
INSERT INTO users (username, password, role, status, created_at) 
SELECT 'admin', '$2b$10$fSDH8l5HYggB9r8w9IgKeAZ1sx1WMMQQs60MCYdwlG9BayRmB9Te', 'Admin', 'active', strftime('%Y-%m-%dT%H:%M:%fZ', 'now') -- password
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- Metrics Seed Data --
INSERT INTO metrics (mqtt_param, device_param, display_name, display_name_tc, device_id, unit, icon) SELECT 'internalPressure', 'sensor-1', 'Internal Pressure', '內部壓力', 'sensor-1', 'Pa', 'PressureIcon' WHERE NOT EXISTS (SELECT 1 FROM metrics WHERE mqtt_param = 'internalPressure' AND device_param = 'sensor-1');
INSERT INTO metrics (mqtt_param, device_param, display_name, display_name_tc, device_id, unit, icon) SELECT 'externalPressure', 'sensor-2', 'External Pressure', '外部壓力', 'sensor-2', 'Pa', 'PressureIcon' WHERE NOT EXISTS (SELECT 1 FROM metrics WHERE mqtt_param = 'externalPressure' AND device_param = 'sensor-2');
INSERT INTO metrics (mqtt_param, device_param, display_name, display_name_tc, device_id, unit, icon) SELECT 'internalTemperature', 'sensor-3', 'Internal Temperature', '內部溫度', 'sensor-3', '°C', 'TempIcon' WHERE NOT EXISTS (SELECT 1 FROM metrics WHERE mqtt_param = 'internalTemperature' AND device_param = 'sensor-3');
INSERT INTO metrics (mqtt_param, device_param, display_name, display_name_tc, device_id, unit, icon) SELECT 'externalTemperature', 'sensor-4', 'External Temperature', '外部溫度', 'sensor-4', '°C', 'TempIcon' WHERE NOT EXISTS (SELECT 1 FROM metrics WHERE mqtt_param = 'externalTemperature' AND device_param = 'sensor-4');
INSERT INTO metrics (mqtt_param, device_param, display_name, display_name_tc, device_id, unit, icon) SELECT 'fanSpeed', 'sensor-21', 'Fan Speed', '風扇速度', 'sensor-21', 'RPM', 'FanIcon' WHERE NOT EXISTS (SELECT 1 FROM metrics WHERE mqtt_param = 'fanSpeed' AND device_param = 'sensor-21');

-- Metric Groups Seed Data --
INSERT INTO metric_groups (name, name_tc, icon, metric1_id, metric2_id) SELECT 'Group Pressure', '壓力', 'PressureIcon', 1, 2 WHERE NOT EXISTS (SELECT 1 FROM metric_groups WHERE name = 'Pressure');
INSERT INTO metric_groups (name, name_tc, icon, metric1_id, metric2_id) SELECT 'Group Temperature', '溫度', 'TempIcon', 3, 4 WHERE NOT EXISTS (SELECT 1 FROM metric_groups WHERE name = 'Temperature');

-- Sections Seed Data --
INSERT INTO sections (name, item_order) SELECT 'Dome Integrity', 0 WHERE NOT EXISTS (SELECT 1 FROM sections WHERE name = 'Dome Integrity');
INSERT INTO sections (name, item_order) SELECT 'Environment', 1 WHERE NOT EXISTS (SELECT 1 FROM sections WHERE name = 'Environment');

-- Section Items Seed Data --
INSERT INTO section_items (section_id, item_id, item_type, item_order) SELECT 1, 1, 'group', 0 WHERE NOT EXISTS (SELECT 1 FROM section_items WHERE section_id = 1 AND item_id = 1 AND item_type = 'group');
INSERT INTO section_items (section_id, item_id, item_type, item_order) SELECT 1, 5, 'metric', 1 WHERE NOT EXISTS (SELECT 1 FROM section_items WHERE section_id = 1 AND item_id = 5 AND item_type = 'metric');
INSERT INTO section_items (section_id, item_id, item_type, item_order) SELECT 2, 2, 'group', 0 WHERE NOT EXISTS (SELECT 1 FROM section_items WHERE section_id = 2 AND item_id = 2 AND item_type = 'group');

-- Fan Sets Seed Data --
INSERT INTO fan_sets (id, name, status, mode, inflow, outflow) SELECT 'fan_set_1', 'Fan Set 1', 'on', 'auto', 75, 60 WHERE NOT EXISTS (SELECT 1 FROM fan_sets WHERE id = 'fan_set_1');
INSERT INTO fan_sets (id, name, status, mode, inflow, outflow) SELECT 'fan_set_2', 'Fan Set 2', 'on', 'manual', 50, 50 WHERE NOT EXISTS (SELECT 1 FROM fan_sets WHERE id = 'fan_set_2');

-- Lighting State Seed Data --
INSERT INTO lighting_state (id, lights_on, brightness) SELECT 1, 1, 80 WHERE NOT EXISTS (SELECT 1 FROM lighting_state WHERE id = 1);
