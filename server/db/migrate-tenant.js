import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as tenantSchema from './tenant-schema.js';
import { DEFAULT_ROLES } from './tenant-schema.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Buat database SQLite baru untuk tenant.
 * Menjalankan DDL dan seeding default roles.
 *
 * @param {string} slug - slug tenant (e.g. "pt-maju-jaya")
 * @returns {string} nama file .db yang dibuat (e.g. "pt-maju-jaya.db")
 */
export function createTenantDatabase(slug) {
  const tenantsDir = process.env.TENANTS_DIR
    ? path.resolve(process.env.TENANTS_DIR)
    : path.resolve(__dirname, '../../tenants');

  // Buat direktori jika belum ada
  if (!fs.existsSync(tenantsDir)) {
    fs.mkdirSync(tenantsDir, { recursive: true });
  }

  const dbFilename = `${slug}.db`;
  const fullPath = path.join(tenantsDir, dbFilename);

  const sqlite = new Database(fullPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  // DDL: buat semua tabel
  sqlite.exec(`
    -- Migration tracking
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );

    -- RBAC
    CREATE TABLE IF NOT EXISTS roles (
      name TEXT PRIMARY KEY,
      description TEXT,
      permissions TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      nik TEXT UNIQUE,
      phone TEXT,
      role TEXT NOT NULL REFERENCES roles(name),
      position TEXT,
      department TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      avatar_url TEXT,
      created_at TEXT NOT NULL
    );

    -- Warehouse
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
      item_id TEXT NOT NULL REFERENCES warehouse_items(id),
      item_name TEXT NOT NULL,
      qty INTEGER NOT NULL,
      worker TEXT NOT NULL,
      notes TEXT,
      reference_id TEXT
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

    -- Maintenance
    CREATE TABLE IF NOT EXISTS areas (
      id TEXT PRIMARY KEY,
      plant_code TEXT,
      name TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      area_id TEXT REFERENCES areas(id),
      category TEXT,
      brand TEXT,
      serial_number TEXT,
      status TEXT DEFAULT 'Active',
      install_date TEXT
    );

    CREATE TABLE IF NOT EXISTS maintenance_plans (
      id TEXT PRIMARY KEY,
      area_id TEXT,
      area_name TEXT,
      asset_id TEXT,
      asset_name TEXT,
      task_description TEXT NOT NULL,
      frequency TEXT NOT NULL,
      start_date TEXT NOT NULL,
      pic TEXT,
      status TEXT NOT NULL DEFAULT 'Active',
      priority TEXT DEFAULT 'Normal',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_statuses (
      plan_id TEXT PRIMARY KEY REFERENCES maintenance_plans(id),
      status TEXT NOT NULL DEFAULT 'Open',
      updated_at TEXT NOT NULL,
      updated_by TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS work_orders (
      id TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'Medium',
      status TEXT NOT NULL DEFAULT 'Pending Approval',
      submitted_at TEXT NOT NULL,
      submitted_by TEXT,
      approved_by TEXT,
      approved_at TEXT,
      asset_id TEXT
    );
  `);

  // Seed default roles
  const insertRole = sqlite.prepare(
    `INSERT OR IGNORE INTO roles (name, description, permissions) VALUES (?, ?, ?)`
  );
  for (const role of DEFAULT_ROLES) {
    insertRole.run(role.name, role.description, role.permissions);
  }

  // Catat versi migrasi awal
  sqlite.prepare(
    `INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)`
  ).run('001_initial', new Date().toISOString());

  sqlite.close();

  console.log(`[MigrateTenant] Created DB: ${dbFilename}`);
  return dbFilename;
}

/**
 * Jalankan satu set migrasi ke tenant DB yang sudah ada.
 * Hanya menjalankan migrasi yang belum pernah dijalankan (idempotent).
 *
 * @param {string} dbFilename - nama file .db
 * @param {Array<{version: string, sql: string}>} migrations
 */
export function runMigrationsOnTenant(dbFilename, migrations) {
  const tenantsDir = process.env.TENANTS_DIR
    ? path.resolve(process.env.TENANTS_DIR)
    : path.resolve(__dirname, '../../tenants');

  const fullPath = path.join(tenantsDir, dbFilename);
  const sqlite = new Database(fullPath);

  for (const migration of migrations) {
    const already = sqlite.prepare(
      `SELECT 1 FROM schema_migrations WHERE version = ?`
    ).get(migration.version);

    if (!already) {
      sqlite.exec(migration.sql);
      sqlite.prepare(
        `INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)`
      ).run(migration.version, new Date().toISOString());
      console.log(`  Applied migration ${migration.version} → ${dbFilename}`);
    }
  }

  sqlite.close();
}
