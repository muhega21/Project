import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create SQLite database
const sqlite = new Database(path.join(__dirname, '../../warehouse.db'));

// Initialize Drizzle
export const db = drizzle(sqlite, { schema });

// Basic migrations for table creation (since we are not running drizzle-kit migrate yet)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS warehouse_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    unit TEXT NOT NULL,
    qty INTEGER NOT NULL DEFAULT 0,
    min_qty INTEGER NOT NULL DEFAULT 10,
    location TEXT,
    image TEXT
  );

  CREATE TABLE IF NOT EXISTS warehouse_transactions (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    type TEXT NOT NULL,
    item_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    qty INTEGER NOT NULL,
    worker TEXT NOT NULL,
    notes TEXT,
    reference_id TEXT,
    FOREIGN KEY(item_id) REFERENCES warehouse_items(id)
  );

  CREATE TABLE IF NOT EXISTS logistic_requests (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    item TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    purpose TEXT,
    nik TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending',
    reject_reason TEXT
  );
`);
