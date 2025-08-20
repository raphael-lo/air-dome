import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

// const DB_FILE = process.env.DATABASE_URL; 
const DB_FILE = path.resolve(__dirname, '../../air_dome.db');
const INIT_SQL_FILE = path.resolve(__dirname, '../config/init.sql');

const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  }
});

export const initializeDatabase = () => {
  const initSql = fs.readFileSync(INIT_SQL_FILE, 'utf-8');
  db.exec(initSql, (err) => {
    if (err) {
      console.error('Error initializing database', err.message);
    }
  });
};

export default db;
