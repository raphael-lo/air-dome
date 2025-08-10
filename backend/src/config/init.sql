CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT,
  role TEXT DEFAULT 'Operator',
  status TEXT DEFAULT 'active',
  createdAt TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);



CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  siteId TEXT,
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
  lightsOn BOOLEAN,
  brightness INTEGER
);

CREATE TABLE IF NOT EXISTS lighting_state (
  lightsOn BOOLEAN,
  brightness INTEGER
);

CREATE TABLE IF NOT EXISTS alert_thresholds (
  id TEXT PRIMARY KEY,
  siteId TEXT,
  metricName TEXT UNIQUE,
  minWarning REAL,
  maxWarning REAL,
  minAlert REAL,
  maxAlert REAL
);

INSERT INTO users (username, password, role, status, createdAt) 
SELECT 'admin', '$2b$10$fSDH8l5HYggB9r8w9IgKeAZ1sx1WMMQQs60MCYdwlG9BayRmB9Te', 'Admin', 'active', strftime('%Y-%m-%dT%H:%M:%fZ', 'now') -- password
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

INSERT INTO fan_sets (id, name, status, mode, inflow, outflow)
SELECT 'fan_set_1', 'Fan Set 1', 'on', 'auto', 75, 60
WHERE NOT EXISTS (SELECT 1 FROM fan_sets WHERE id = 'fan_set_1');

INSERT INTO fan_sets (id, name, status, mode, inflow, outflow)
SELECT 'fan_set_2', 'Fan Set 2', 'on', 'manual', 50, 50
WHERE NOT EXISTS (SELECT 1 FROM fan_sets WHERE id = 'fan_set_2');

INSERT INTO fan_sets (id, name, status, mode, inflow, outflow)
SELECT 'fan_set_3', 'Fan Set 3', 'off', 'manual', 0, 0
WHERE NOT EXISTS (SELECT 1 FROM fan_sets WHERE id = 'fan_set_3');

INSERT INTO lighting_state (lightsOn, brightness)
SELECT TRUE, 80
WHERE NOT EXISTS (SELECT 1 FROM lighting_state);
