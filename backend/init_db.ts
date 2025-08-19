import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

// Use environment variable for DB file path
const DB_FILE = process.env.DATABASE_URL;

if (!DB_FILE) {
  console.error('DATABASE_URL environment variable is not set. Cannot initialize database.');
  process.exit(1);
}

const INIT_SQL_FILE = path.resolve(__dirname, './src/config/init.sql');

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

const createTables = async () => {
    const initSql = fs.readFileSync(INIT_SQL_FILE, 'utf-8');
    db.exec(initSql, function(err) {
        if (err) {
            console.error('Error initializing database:', err.message);
        } else {
            console.log('Tables created successfully');
            // Add a check to see if tables exist after creation
            db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, tables) => {
                if (err) {
                    console.error('Error checking tables:', err.message);
                } else {
                    console.log('Tables found after init:', tables);
                }
            });
        }
        db.close();
    });
};

createTables();