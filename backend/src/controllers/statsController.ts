import { Request, Response } from 'express';
import { getStats } from '../services/mqttService';

export const getBrokerStats = (req: Request, res: Response) => {
  try {
    const stats = getStats();
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching broker stats', error });
  }
};
