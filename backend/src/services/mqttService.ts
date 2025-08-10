import mqtt from 'mqtt';
import { writeSensorData } from './influxdbService';
import { broadcast } from './websocketService';

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://test.mosquitto.org';
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'air-dome/sensors';

const client = mqtt.connect(MQTT_BROKER_URL);

client.on('connect', () => {
  console.log('Connected to MQTT broker');
  setInterval(() => {
    const data = {
      internalPressure: (Math.random() * 10) + 990,
      externalPressure: (Math.random() * 10) + 990,
      internalTemperature: (Math.random() * 10) + 15,
      externalTemperature: (Math.random() * 10) + 10,
      internalHumidity: (Math.random() * 20) + 40,
      externalHumidity: (Math.random() * 20) + 30,
      internalWindSpeed: Math.random() * 5,
      externalWindSpeed: Math.random() * 20,
      internalPM25: Math.random() * 25,
      externalPM25: Math.random() * 50,
      internalCO2: (Math.random() * 200) + 400,
      externalCO2: (Math.random() * 100) + 300,
      internalO2: 20.95 + (Math.random() * 0.1) - 0.05,
      externalO2: 20.95 + (Math.random() * 0.1) - 0.05,
      internalCO: Math.random() * 5,
      externalCO: Math.random() * 2,
      airExchangeRate: Math.random() * 5,
      internalNoise: (Math.random() * 20) + 30,
      externalNoise: (Math.random() * 30) + 50,
      internalLux: Math.random() * 1000,
      lightingStatus: Math.random() > 0.5 ? 'On' : 'Off',
      basePressure: (Math.random() * 5) + 95,
      fanSpeed: Math.random() * 3000,
      timestamp: new Date().toISOString(),
    };
    client.publish(MQTT_TOPIC, JSON.stringify(data));
    writeSensorData(data);
    broadcast(data);
  }, 5000);
});

client.on('error', (error) => {
  console.error('MQTT client error:', error);
});

export default client;
