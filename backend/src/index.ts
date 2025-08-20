import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import sensorDataRouter from './routes/sensorData';
import userRouter from './routes/user';
import alertRouter from './routes/alert';
import fanControlRouter from './routes/fanControl';
import lightingControlRouter from './routes/lightingControl';
import alertThresholdsRouter from './routes/alertThresholds';
import httpSensorRouter from './routes/httpSensor';
import metricRouter from './routes/metric';
import metricGroupRouter from './routes/metricGroup';
import sectionRouter from './routes/section';
import domeMetricsRouter from './routes/domeMetrics';
import './services/databaseService';
import { initializeDatabase } from '../init_db';
import { initializeWebSocket } from './services/websocketService';
import { authenticateToken } from './middleware/auth';

const main = async () => {
  // Ensure the database is initialized before starting anything else
  try {
    await initializeDatabase();
    console.log('Database initialization complete.');
  } catch (error) {
    console.error('Failed to initialize database. Exiting.', error);
    process.exit(1);
  }

  // Now that the DB is ready, we can safely start other services
  await import('./services/mqttService');

  const app = express();
  const server = http.createServer(app);
  const port = process.env.PORT || 3001;

  const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    optionsSuccessStatus: 200
  };

  app.use(cors(corsOptions));
  app.use(express.json());

  app.use('/api', httpSensorRouter);
  app.use('/api', sensorDataRouter);
  app.use('/api', userRouter);
  app.use('/api', authenticateToken, alertRouter);
  app.use('/api', authenticateToken, fanControlRouter);
  app.use('/api', authenticateToken, lightingControlRouter);
  app.use('/api', authenticateToken, alertThresholdsRouter);
  app.use('/api', metricRouter);
  app.use('/api', metricGroupRouter);
  app.use('/api', sectionRouter);
  app.use('/api', domeMetricsRouter);

  app.get('/', (req: Request, res: Response) => {
    res.send('Air Dome Backend is running!');
  });

  initializeWebSocket(server);

  server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};

main();
