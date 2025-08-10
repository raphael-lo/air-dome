"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const DB_FILE = path_1.default.resolve(__dirname, '../air_dome.db');
const db = new sqlite3_1.default.Database(DB_FILE, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        return;
    }
    console.log(`Connected to the SQLite database at ${DB_FILE}`);
    db.serialize(() => {
        db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT)');
        db.run('CREATE TABLE IF NOT EXISTS sensor_data (id INTEGER PRIMARY KEY AUTOINCREMENT, pressure REAL, temperature REAL, humidity REAL, windSpeed REAL, timestamp TEXT)');
        db.run(`INSERT INTO users (username, password) SELECT 'admin', '$2a$10$//sS8k4g/9Y/8vH.gS.Y5u3.qU4bO9zJ.gS.Y5u3.qU4bO9zJ.gS.Y5' WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin')`);
    });
    db.close();
});
