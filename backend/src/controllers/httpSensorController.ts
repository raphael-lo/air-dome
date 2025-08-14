import { Request, Response } from 'express';
import mqttClient from '../services/mqttService';

export const postSensorData = (req: Request, res: Response) => {
  const data = req.body;
  const topic = process.env.MQTT_TOPIC || 'air-dome/sensors';

  // Basic validation
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ message: 'Invalid data format' });
  }

  try {
    const message = JSON.stringify(data);
    mqttClient.publish(topic, message, (err) => {
      if (err) {
        console.error('Failed to publish to MQTT', err);
        return res.status(500).json({ message: 'Failed to publish to MQTT' });
      }
      res.status(202).json({ message: 'Data accepted and forwarded to MQTT' });
    });
  } catch (error) {
    console.error('Error processing request', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
