import mqtt from 'mqtt';
import { writeMetric } from './influxdbService';
import { broadcast } from './websocketService';
import db from './databaseService';
import { v4 as uuidv4 } from 'uuid';
import { StatusLevel, type AlertThreshold, type Metric } from '../types';

// --- In-memory cache for metric rules ---
type MetricRule = Metric & { topic: string };
let metricRules: MetricRule[] = [];

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

// This function is now more generic
const processMetric = (metricRule: MetricRule, value: any, timestamp: string) => {
    if (typeof value !== 'number') return;

    // Safely handle nullable device_id
    if (!metricRule.device_id) {
        console.error(`Cannot process metric for rule ID ${metricRule.id} because it has no device_id.`);
        return;
    }

    // Write to InfluxDB using the unique device_id from the rule
    writeMetric('sensor_data', metricRule.mqtt_param, value, { device_id: metricRule.device_id });

    // Alerting logic remains similar, but uses the metricRule directly
    // (Further logic for fetching thresholds based on the new rule structure would be needed here)
    // For now, we broadcast the data for real-time UI updates
    broadcast({ [metricRule.mqtt_param]: { value, status: StatusLevel.Ok, device_id: metricRule.device_id }, timestamp });
}

const loadMetricRules = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM metrics', [], (err, fetchedMetrics: MetricRule[]) => {
      if (err) {
        console.error('Failed to fetch metric rules:', err);
        return reject(err);
      }
      metricRules = fetchedMetrics;
      console.log(`Loaded ${metricRules.length} metric rules into memory.`);
      resolve();
    });
  });
};


// --- MQTT Client Setup ---

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL;
if (!MQTT_BROKER_URL) {
  throw new Error('MQTT_BROKER_URL environment variable is not set.');
}

export const mqttClient = mqtt.connect(MQTT_BROKER_URL, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
});

mqttClient.on('connect', async () => {
  try {
    await loadMetricRules();

    // Subscribe to all topics. The logic will now be handled by our rule matcher.
    mqttClient.subscribe('#', (err) => {
      if (err) console.error('Failed to subscribe to #', err);
      else console.log('Subscribed to all topics (#) to process messages based on loaded rules.');
    });

    // Listen for a special topic to reload rules without restarting the backend
    const RELOAD_RULES_TOPIC = 'air-dome/config/reload';
    mqttClient.subscribe(RELOAD_RULES_TOPIC, (err) => {
        if (err) console.error(`Failed to subscribe to ${RELOAD_RULES_TOPIC}`);
    });

    mqttClient.on('message', (topic, message) => {
      let payload;
      const messageString = message.toString();

      try {
        payload = JSON.parse(messageString);
      } catch (error) {
        console.warn(`Received non-JSON message on topic '${topic}': "${messageString}". Ignoring.`);
        return; // Stop processing this message
      }

      try {
        if (topic === RELOAD_RULES_TOPIC) {
            console.log('Reloading metric rules from database...');
            loadMetricRules();
            return;
        }

        const timestamp = payload.timestamp ? new Date(parseInt(payload.timestamp)).toISOString() : new Date().toISOString();

        // Flexible matching logic
        const matchedRules = metricRules.filter(rule => {
            // 1. Check if topic matches
            if (rule.topic && rule.topic !== topic) {
                return false;
            }

            // 2. Check if device identifier matches
            if (rule.device_param && rule.device_id) {
                const deviceIdFromPayload = payload[rule.device_param];
                if (deviceIdFromPayload !== rule.device_id) {
                    return false;
                }
            }
            
            return true;
        });

        if (matchedRules.length > 0) {
            const deviceId = matchedRules[0].device_id;
            // console.log(`Processing message from identified device: ${deviceId}`);

            matchedRules.forEach(metricRule => {
                const metricValue = payload[metricRule.mqtt_param];
                if (metricValue !== undefined) {
                    processMetric(metricRule, metricValue, timestamp);
                }
            });
        }

      } catch (parseError) {
        console.error("Error processing MQTT message:", parseError);
      }
    });

  } catch (error) {
    console.error('Failed to initialize metric rule service:', error);
  }
});

mqttClient.on('error', (error) => {
  console.error('MQTT client error:', error);
});