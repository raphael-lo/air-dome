import mqtt from 'mqtt';
import { writeMetric } from './influxdbService';
import { broadcast } from './websocketService';
import db from './databaseService';
import { v4 as uuidv4 } from 'uuid';
import { StatusLevel, type AlertThreshold, type Metric } from '../types';

// --- In-memory state for alerting ---
let metrics: Metric[] = [];
let alertThresholds: AlertThreshold[] = [];
let metricStates: Record<string, StatusLevel> = {}; // Key: composite key `device_param/mqtt_param`

const severityOrder = {
  [StatusLevel.Ok]: 0,
  [StatusLevel.Warn]: 1,
  [StatusLevel.Danger]: 2,
};

// --- Helper Functions ---

const getStatusForMetric = (value: number, threshold: AlertThreshold | undefined): StatusLevel => {
  if (!threshold) return StatusLevel.Ok;
  const { min_warning, max_warning, min_alert, max_alert } = threshold;
  if (min_alert !== null && value <= min_alert) return StatusLevel.Danger;
  if (max_alert !== null && value >= max_alert) return StatusLevel.Danger;
  if (min_warning !== null && value <= min_warning) return StatusLevel.Warn;
  if (max_warning !== null && value >= max_warning) return StatusLevel.Warn;
  return StatusLevel.Ok;
};

const createAlert = (metric: Metric, severity: StatusLevel, value: number, unit?: string) => {
    const newAlert = {
        id: uuidv4(),
        site_id: '1', // Assuming a single site for now
        parameter_key: metric.display_name, // Use display_name as the key for parameter
        message_key: 'alert_threshold_exceeded', // Generic message key
        message_params: {
            metricName: metric.display_name,
            deviceId: metric.device_id,
            severity: severity,
            value: value,
            unit: unit || '',
        },
        severity,
        timestamp: new Date().toISOString(),
        status: 'active',
    };
    db.run(
        'INSERT INTO alerts (id, site_id, parameter_key, message_key, message_params, severity, timestamp, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [newAlert.id, newAlert.site_id, newAlert.parameter_key, newAlert.message_key, JSON.stringify(newAlert.message_params), newAlert.severity, newAlert.timestamp, newAlert.status],
        (err) => {
            if (err) {
                console.error('Error creating alert in database:', err);
            } else {
                broadcast({ type: 'new_alert', payload: newAlert });
            }
        }
    );
};

const processMetric = (device_param: string, mqtt_param: string, value: any, timestamp: string) => {
    if (typeof value !== 'number') return;

    writeMetric('sensor_data', mqtt_param, value, { device_id: device_param });

    const metric = metrics.find(m => m.device_param === device_param && m.mqtt_param === mqtt_param);
    if (!metric) {
        return;
    }

    const threshold = alertThresholds.find(t => t.metric_id === metric.id);
    const newStatus = getStatusForMetric(value, threshold);

    broadcast({ [mqtt_param]: { value, status: newStatus, device_id: metric.device_id }, timestamp });

    if (threshold) {
        const stateKey = `${device_param}/${mqtt_param}`;
        const currentStatus = metricStates[stateKey] || StatusLevel.Ok;

        if (severityOrder[newStatus] > severityOrder[currentStatus]) {
            createAlert(metric, newStatus, value, metric.unit);
        } else if (severityOrder[newStatus] < severityOrder[currentStatus]) {
            // Optionally, you could acknowledge/resolve existing alerts here if needed
        } else {
        }
        metricStates[stateKey] = newStatus;
    }
}

const initializeAlerting = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM metrics', [], (err, fetchedMetrics: Metric[]) => {
      if (err) {
        console.error('Failed to fetch metrics for alerting:', err);
        return reject(err);
      }
      metrics = fetchedMetrics;
      metricStates = {}; // Reset states
      metrics.forEach(m => {
          const stateKey = `${m.device_param}/${m.mqtt_param}`;
          metricStates[stateKey] = StatusLevel.Ok;
      });

      db.all('SELECT * FROM alert_thresholds', [], (err, fetchedThresholds: AlertThreshold[]) => {
        if (err) {
          console.error('Failed to fetch alert thresholds:', err);
          return reject(err);
        }
        alertThresholds = fetchedThresholds;
        resolve();
      });
    });
  });
};


// --- MQTT Client Setup ---

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL;
if (!MQTT_BROKER_URL) {
  throw new Error('MQTT_BROKER_URL environment variable is not set.');
}
const MQTT_DATA_TOPIC_PREFIX = process.env.MQTT_DATA_TOPIC_PREFIX || 'air-dome/data';
const MQTT_CONFIG_UPDATE_TOPIC = process.env.MQTT_CONFIG_UPDATE_TOPIC || 'air-dome/config/update';

export const mqttClient = mqtt.connect(MQTT_BROKER_URL);

mqttClient.on('connect', async () => {
  try {
    await initializeAlerting();

    const dataTopic = `${MQTT_DATA_TOPIC_PREFIX}/#`;
    mqttClient.subscribe(dataTopic, (err) => {
      if (err) console.error('Failed to subscribe to data topic:', err);
    });

    mqttClient.subscribe(MQTT_CONFIG_UPDATE_TOPIC, (err) => {
      if (err) console.error('Failed to subscribe to config update topic:', err);
    });

    mqttClient.on('message', (topic, message) => {
      try {
        if (topic === MQTT_CONFIG_UPDATE_TOPIC) {
            initializeAlerting();
            return;
        }

        if (topic.startsWith(MQTT_DATA_TOPIC_PREFIX)) {
            const topicParts = topic.substring(MQTT_DATA_TOPIC_PREFIX.length + 1).split('/');
            if (topicParts.length < 2) return; // Ignore invalid topics

            const device_param = topicParts[0];
            const mqtt_param = topicParts[1];
            const data = JSON.parse(message.toString());
            const value = data.value;
            const timestamp = data.timestamp || new Date().toISOString();
            
            processMetric(device_param, mqtt_param, value, timestamp);
        }

      } catch (parseError) {
        console.error("Error processing MQTT message:", parseError);
      }
    });

  } catch (error) {
    console.error('Failed to initialize alerting service:', error);
  }
});

mqttClient.on('error', (error) => {
  console.error('MQTT client error:', error);
});