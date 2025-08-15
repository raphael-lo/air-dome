import { Request, Response } from 'express';
import db from '../services/databaseService';
import { Section, SectionItem } from '../models/section';

export const createSection = (req: Request, res: Response) => {
  const { name } = req.body;
  db.run('INSERT INTO sections (name) VALUES (?)', [name], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error creating section', error: err.message });
    }
    res.status(201).json({ message: 'Section created', sectionId: this.lastID });
  });
};

export const getSections = (req: Request, res: Response) => {
  db.all('SELECT * FROM sections', (err, rows: Section[]) => {
    if (err) {
      res.status(500).json({ message: 'Error fetching sections', error: err.message });
    } else {
      res.json(rows);
    }
  });
};

export const updateSection = (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  db.run('UPDATE sections SET name = ? WHERE id = ?', [name, id], function(err) {
    if (err) {
      res.status(500).json({ message: 'Error updating section', error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Section not found' });
    } else {
      res.json({ message: 'Section updated successfully' });
    }
  });
};

export const deleteSection = (req: Request, res: Response) => {
  const { id } = req.params;
  db.run('DELETE FROM sections WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ message: 'Error deleting section', error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Section not found' });
    } else {
      res.json({ message: 'Section deleted successfully' });
    }
  });
};

export const addSectionItem = (req: Request, res: Response) => {
  const { id } = req.params;
  const { item_id, item_type, item_order } = req.body;
  db.run('INSERT INTO section_items (section_id, item_id, item_type, item_order) VALUES (?, ?, ?, ?)', [id, item_id, item_type, item_order], function(err) {
    if (err) {
      return res.status(500).json({ message: 'Error adding item to section', error: err.message });
    }
    res.status(201).json({ message: 'Item added to section', sectionItemId: this.lastID });
  });
};

export const updateSectionItems = (req: Request, res: Response) => {
  const { id } = req.params;
  const { items } = req.body;
  db.serialize(() => {
    db.run('DELETE FROM section_items WHERE section_id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error updating section items', error: err.message });
      }
    });
    items.forEach((item: SectionItem) => {
      db.run('INSERT INTO section_items (section_id, item_id, item_type, item_order) VALUES (?, ?, ?, ?)', [id, item.item_id, item.item_type, item.item_order], (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error updating section items', error: err.message });
        }
      });
    });
    res.json({ message: 'Section items updated successfully' });
  });
};

export const deleteSectionItem = (req: Request, res: Response) => {
    const { id, itemId } = req.params;
    db.run('DELETE FROM section_items WHERE section_id = ? AND id = ?', [id, itemId], function(err) {
        if (err) {
            res.status(500).json({ message: 'Error deleting section item', error: err.message });
        } else if (this.changes === 0) {
            res.status(404).json({ message: 'Section item not found' });
        } else {
            res.json({ message: 'Section item deleted successfully' });
        }
    });
};