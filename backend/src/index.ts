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
import './services/databaseService';
import './services/mqttService';
import { initializeWebSocket } from './services/websocketService';

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3001;

const corsOptions = {
  origin: 'http://localhost:5173',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api', httpSensorRouter);
app.use('/api', sensorDataRouter);
app.use('/api', userRouter);
app.use('/api', alertRouter);
app.use('/api', fanControlRouter);
app.use('/api', lightingControlRouter);
app.use('/api', alertThresholdsRouter);

app.get('/', (req: Request, res: Response) => {
  res.send('Air Dome Backend is running!');
});

initializeWebSocket(server);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
