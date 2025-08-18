import { Request, Response } from 'express';
import * as sectionModel from '../models/section';

export const createSection = async (req: Request, res: Response) => {
    try {
        const section = await sectionModel.createSection(req.body);
        res.status(201).json(section);
    } catch (error) {
        res.status(500).json({ message: 'Error creating section', error });
    }
};

export const getSections = async (req: Request, res: Response) => {
    try {
        const sections = await sectionModel.getSections();
        res.json(sections);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sections', error });
    }
};

export const updateSection = async (req: Request, res: Response) => {
    try {
        const section = await sectionModel.updateSection(Number(req.params.id), req.body);
        res.json(section);
    } catch (error) {
        res.status(500).json({ message: 'Error updating section', error });
    }
};

export const deleteSection = async (req: Request, res: Response) => {
    try {
        await sectionModel.deleteSection(Number(req.params.id));
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error deleting section', error });
    }
};

export const getSectionItems = async (req: Request, res: Response) => {
    try {
        const items = await sectionModel.getSectionItems(Number(req.params.id));
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching section items', error });
    }
};

export const addSectionItem = async (req: Request, res: Response) => {
    try {
        const sectionId = Number(req.params.id);
        const { item_id, item_type, item_order } = req.body;
        const newItem = { section_id: sectionId, item_id, item_type, item_order };
        const item = await sectionModel.addSectionItem(newItem);
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ message: 'Error adding section item', error });
    }
};

export const removeSectionItem = async (req: Request, res: Response) => {
    try {
        await sectionModel.removeSectionItem(Number(req.params.itemId));
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error removing section item', error });
    }
};

export const updateSectionItemOrder = async (req: Request, res: Response) => {
    try {
        await sectionModel.updateSectionItemOrder(req.body);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error updating section item order', error });
    }
};

export const updateSectionOrder = async (req: Request, res: Response) => {
    try {
        await sectionModel.updateSectionOrder(req.body);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error updating section order', error });
    }
};