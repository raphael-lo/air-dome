import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const DB_FILE = process.env.DATABASE_URL;

if (!DB_FILE) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

// Ensure the directory for the DB file exists
const dbDir = path.dirname(DB_FILE);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  }
});

// The initialization logic has been moved to init_db.ts to resolve a startup race condition.
// This file is now only responsible for creating and exporting the db connection object.

export default db;
