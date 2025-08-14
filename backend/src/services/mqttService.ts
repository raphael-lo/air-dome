import mqtt from 'mqtt';
import { writeSensorData } from './influxdbService';
import { broadcast } from './websocketService';

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL;
if (!MQTT_BROKER_URL) {
  throw new Error('MQTT_BROKER_URL environment variable is not set.');
}
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'air-dome/sensors';

const client = mqtt.connect(MQTT_BROKER_URL);

client.on('connect', () => {
  console.log('Connected to MQTT broker');
  client.subscribe(MQTT_TOPIC, (err) => {
    if (!err) {
      console.log(`Subscribed to topic: ${MQTT_TOPIC}`);
    } else {
      console.error(`Failed to subscribe to topic ${MQTT_TOPIC}:`, err);
    }
  });
});

client.on('message', (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    console.log('MQTT message parsed:', data); // Log parsed data

    try {
      writeSensorData(data);
      console.log('Data written to InfluxDB.'); // Log successful write
    } catch (writeError) {
      console.error('Error writing data to InfluxDB:', writeError); // Log write errors
    }

    try {
      broadcast(data);
      console.log('Data broadcasted via WebSocket.'); // Log successful broadcast
    } catch (broadcastError) {
      console.error('Error broadcasting data via WebSocket:', broadcastError); // Log broadcast errors
    }

  } catch (parseError) {
    console.error('Error parsing MQTT message:', parseError);
  }
});

client.on('error', (error) => {
  console.error('MQTT client error:', error);
});

export default client;