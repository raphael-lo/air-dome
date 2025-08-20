import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const DB_FILE = process.env.DATABASE_URL;
const INIT_SQL_FILE = path.resolve(__dirname, './src/config/init.sql');

export const initializeDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!DB_FILE) {
      const err = new Error('DATABASE_URL environment variable is not set. Cannot initialize database.');
      console.error(err.message);
      return reject(err);
    }

    const dbDir = path.dirname(DB_FILE);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    const db = new sqlite3.Database(DB_FILE, (err) => {
      if (err) {
        console.error('Error opening database', err.message);
        return reject(err);
      }
    });

    const initSql = fs.readFileSync(INIT_SQL_FILE, 'utf-8');
    db.exec(initSql, function(err) {
        if (err) {
            console.error('Error initializing database:', err.message);
            db.close();
            return reject(err);
        } else {
            console.log('Database tables created or already exist.');
            db.close();
            return resolve();
        }
    });
  });
};