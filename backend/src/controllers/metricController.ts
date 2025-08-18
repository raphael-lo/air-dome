import { Request, Response } from 'express';
import * as metricModel from '../models/metric';

export const createMetric = async (req: Request, res: Response) => {
    try {
        const metric = await metricModel.createMetric(req.body);
        res.status(201).json(metric);
    } catch (error) {
        res.status(500).json({ message: 'Error creating metric', error });
    }
};

export const getMetrics = async (req: Request, res: Response) => {
    try {
        const metrics = await metricModel.getMetrics();
        res.json(metrics);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching metrics', error });
    }
};

export const updateMetric = async (req: Request, res: Response) => {
    try {
        const metric = await metricModel.updateMetric(Number(req.params.id), req.body);
        res.json(metric);
    } catch (error) {
        res.status(500).json({ message: 'Error updating metric', error });
    }
};

export const deleteMetric = async (req: Request, res: Response) => {
    try {
        await metricModel.deleteMetric(Number(req.params.id));
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting metric', error });
    }
};