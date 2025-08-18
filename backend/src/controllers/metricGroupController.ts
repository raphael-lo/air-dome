import { Request, Response } from 'express';
import * as metricGroupModel from '../models/metricGroup';

export const createMetricGroup = async (req: Request, res: Response) => {
    try {
        const group = await metricGroupModel.createMetricGroup(req.body);
        res.status(201).json(group);
    } catch (error) {
        res.status(500).json({ message: 'Error creating metric group', error });
    }
};

export const getMetricGroups = async (req: Request, res: Response) => {
    try {
        const groups = await metricGroupModel.getMetricGroups();
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching metric groups', error });
    }
};

export const updateMetricGroup = async (req: Request, res: Response) => {
    try {
        const group = await metricGroupModel.updateMetricGroup(Number(req.params.id), req.body);
        res.json(group);
    } catch (error) {
        res.status(500).json({ message: 'Error updating metric group', error });
    }
};

export const deleteMetricGroup = async (req: Request, res: Response) => {
    try {
        await metricGroupModel.deleteMetricGroup(Number(req.params.id));
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting metric group', error });
    }
};