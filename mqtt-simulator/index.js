require('dotenv').config();
const mqtt = require('mqtt');

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const client = mqtt.connect(MQTT_BROKER_URL, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
});

const metrics = [
    { device_param: 'sensor-1', mqtt_param: 'internalPressure', min: 990, max: 1010 },
    { device_param: 'sensor-2', mqtt_param: 'externalPressure', min: 990, max: 1010 },
    { device_param: 'sensor-3', mqtt_param: 'internalTemperature', min: 15, max: 25 },
    { device_param: 'sensor-4', mqtt_param: 'externalTemperature', min: 10, max: 20 },
    { device_param: 'sensor-21', mqtt_param: 'fanSpeed', min: 0, max: 3000 },
];

client.on('connect', () => {
    console.log('MQTT Simulator connected to broker');
    setInterval(() => {
        const metric = metrics[Math.floor(Math.random() * metrics.length)];
        const value = Math.random() * (metric.max - metric.min) + metric.min;
        
        const topic = 'air-dome/data'; // All data goes to one topic
        
        // New payload format
        const messagePayload = {
            timestamp: new Date().toISOString(),
            sensor_id: metric.device_param, // Use 'sensor_id' as the key, per user request
        };
        // Add the actual metric key-value pair
        messagePayload[metric.mqtt_param] = parseFloat(value.toFixed(2));

        const message = JSON.stringify(messagePayload);

        client.publish(topic, message, (err) => {
            if (err) {
                console.error('Error publishing message:', err);
            } else {
                console.log(`Published to ${topic}: ${message}`);
            }
        });
    }, 2000);
});

client.on('error', (err) => {
    console.error('MQTT connection error:', err);
});
