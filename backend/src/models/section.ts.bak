import db from '../services/databaseService';

export interface Section {
  id?: number;
  name: string;
  name_tc?: string;
  item_order: number;
}

export interface SectionItem {
  id?: number;
  section_id: number;
  item_id: number;
  item_type: 'metric' | 'group';
  item_order: number;
}

export const getSections = () => {
  return new Promise<Section[]>((resolve, reject) => {
    db.all('SELECT *, name_tc FROM sections ORDER BY item_order', (err, rows: Section[]) => {
      if (err) {
        reject(err);
      } else {
        const sections: Section[] = rows.map(row => ({
          id: row.id,
          name: row.name,
          name_tc: row.name_tc,
          item_order: row.item_order,
        }));
        resolve(sections);
      }
    });
  });
};

export const createSection = (section: { name: string, name_tc?: string, item_order: number }) => {
  return new Promise<Section>((resolve, reject) => {
    db.run('INSERT INTO sections (name, name_tc, item_order) VALUES (?, ?, ?)', [section.name, section.name_tc, section.item_order], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, ...section });
      }
    });
  });
};

export const updateSection = (id: number, section: { name: string, name_tc?: string, item_order: number }) => {
  return new Promise<Section>((resolve, reject) => {
    db.run('UPDATE sections SET name = ?, name_tc = ?, item_order = ? WHERE id = ?', [section.name, section.name_tc, section.item_order, id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id, ...section });
      }
    });
  });
};

export const deleteSection = (id: number) => {
  return new Promise<void>((resolve, reject) => {
    db.run('DELETE FROM sections WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export const getSectionItems = (sectionId: number) => {
  return new Promise<SectionItem[]>((resolve, reject) => {
    db.all('SELECT * FROM section_items WHERE section_id = ? ORDER BY item_order', [sectionId], (err, rows: SectionItem[]) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

export const addSectionItem = (item: Omit<SectionItem, 'id'>) => {
  return new Promise<SectionItem>((resolve, reject) => {
    db.run('INSERT OR IGNORE INTO section_items (section_id, item_id, item_type, item_order) VALUES (?, ?, ?, ?)', 
    [item.section_id, item.item_id, item.item_type, item.item_order], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, ...item });
      }
    });
  });
};

export const removeSectionItem = (id: number) => {
  return new Promise<void>((resolve, reject) => {
    db.run('DELETE FROM section_items WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export const updateSectionItemOrder = (items: SectionItem[]) => {
  return new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      const stmt = db.prepare('UPDATE section_items SET item_order = ? WHERE id = ?');
      for (const item of items) {
        stmt.run(item.item_order, item.id);
      }
      stmt.finalize((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
};

export const updateSectionOrder = (sections: { id: number, item_order: number }[]) => {
  return new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      const stmt = db.prepare('UPDATE sections SET item_order = ? WHERE id = ?');
      db.run('BEGIN TRANSACTION');
      for (const section of sections) {
        stmt.run(section.item_order, section.id);
      }
      stmt.finalize();
      db.run('COMMIT', (err) => {
        if (err) {
          db.run('ROLLBACK');
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
};