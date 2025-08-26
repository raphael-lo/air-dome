import mqtt from 'mqtt';

const options = {
  host: 'air-dome-broker.yotatech.com.hk',
  port: 1883,
  protocol: 'mqtt',
  username: 'ytech-mqtt-broker',
  password: 'air-dome2025@'
};

const client = mqtt.connect(options);

const topic = '$SYS/broker/clients/connected';

client.on('connect', () => {
  console.log('Connected to broker. Subscribing to status topic...');
  client.subscribe(topic, (err) => {
    if (err) {
      console.error('Subscription error:', err);
      client.end();
    }
  });
});

client.on('message', (topic, message) => {
  console.log(`
----------------------------------------`);
  console.log(`Connected clients: ${message.toString()}`);
  console.log(`----------------------------------------`);
  client.end(); // Disconnect after receiving the message
});

client.on('error', (err) => {
  console.error('Connection error:', err);
  client.end();
});