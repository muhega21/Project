import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as tenantSchema from './tenant-schema.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Pool koneksi in-memory: Map<dbPath → { db, sqlite, lastAccess }>
 * Koneksi idle > IDLE_TIMEOUT_MS akan ditutup otomatis.
 */
const pool = new Map();
const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 menit

// Cleanup interval: tutup koneksi yang sudah idle
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of pool.entries()) {
    if (now - entry.lastAccess > IDLE_TIMEOUT_MS) {
      try {
        entry.sqlite.close();
      } catch (_) { /* ignore */ }
      pool.delete(key);
      console.log(`[TenantPool] Closed idle connection: ${key}`);
    }
  }
}, 60_000); // cek tiap 1 menit

// Pastikan cleanup tidak menghalangi proses Node.js untuk exit
if (cleanupInterval.unref) cleanupInterval.unref();

/**
 * Ambil koneksi Drizzle ke tenant DB dari pool.
 * Jika belum ada di pool, buka koneksi baru.
 *
 * @param {string} dbFilename - nama file .db relatif terhadap TENANTS_DIR (e.g. "pt-maju-jaya.db")
 * @returns {import('drizzle-orm/better-sqlite3').BetterSQLite3Database}
 */
export function getTenantDb(dbFilename) {
  if (pool.has(dbFilename)) {
    const entry = pool.get(dbFilename);
    entry.lastAccess = Date.now();
    return entry.db;
  }

  const tenantsDir = process.env.TENANTS_DIR
    ? path.resolve(process.env.TENANTS_DIR)
    : path.resolve(__dirname, '../../tenants');

  const fullPath = path.join(tenantsDir, dbFilename);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`[TenantPool] Database file not found: ${fullPath}`);
  }

  const sqlite = new Database(fullPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');

  const db = drizzle(sqlite, { schema: tenantSchema });

  pool.set(dbFilename, { db, sqlite, lastAccess: Date.now() });
  console.log(`[TenantPool] Opened connection: ${dbFilename} (pool size: ${pool.size})`);

  return db;
}

/**
 * Tutup koneksi tenant tertentu dan hapus dari pool.
 * @param {string} dbFilename
 */
export function closeTenantDb(dbFilename) {
  if (pool.has(dbFilename)) {
    try {
      pool.get(dbFilename).sqlite.close();
    } catch (_) { /* ignore */ }
    pool.delete(dbFilename);
    console.log(`[TenantPool] Manually closed: ${dbFilename}`);
  }
}

/**
 * Info debug pool saat ini.
 */
export function getPoolStats() {
  return {
    activeConnections: pool.size,
    tenants: [...pool.keys()],
  };
}

/**
 * Tutup semua koneksi (untuk graceful shutdown).
 */
export function closeAllConnections() {
  for (const [key, entry] of pool.entries()) {
    try { entry.sqlite.close(); } catch (_) { /* ignore */ }
    pool.delete(key);
  }
  console.log('[TenantPool] All connections closed.');
}
