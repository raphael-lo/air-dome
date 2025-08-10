import { Router, Request, Response } from 'express';
import { querySensorData, queryHistoricalData } from '../services/influxdbService';
import { InfluxSensorData } from '../types/sensorData';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/sensor-data', authenticateToken, async (req: Request, res: Response) => {
  try {
    const range = req.query.range as string || '-1h';
    const data = await querySensorData(range) as InfluxSensorData[];
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error getting sensor data', error });
  }
});

router.get('/sensor-data/view', async (req: Request, res: Response) => {
    try {
        const range = req.query.range as string || '-1h';
        const data = await querySensorData(range) as InfluxSensorData[];
        res.send(`
        <!DOCTYPE html>
        <html>
            <head>
            <title>Sensor Data</title>
            <style>
                table, th, td {
                border: 1px solid black;
                border-collapse: collapse;
                padding: 5px;
                }
            </style>
            </head>
            <body>
            <h1>Sensor Data</h1>
            <table>
                <tr>
                <th>Timestamp</th>
                <th>Measurement</th>
                <th>Field</th>
                <th>Value</th>
                </tr>
                ${
                    data.map(row => `
                    <tr>
                        <td>${row._time}</td>
                        <td>${row._measurement}</td>
                        <td>${row._field}</td>
                        <td>${row._value}</td>
                    </tr>
                    `).join('')
                }
            </table>
            </body>
        </html>
        `);
    } catch (error) {
        res.status(500).send('Error getting sensor data');
    }
});

router.get('/sensor-data/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { measurement, field, range } = req.query;
    if (!measurement || !field) {
      return res.status(400).json({ message: 'Measurement and field are required.' });
    }
    const data = await queryHistoricalData(measurement as string, field as string, range as string);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error getting historical sensor data', error });
  }
});

export default router;