#!/usr/bin/env node
/**
 * scripts/migrate-all-tenants.js
 *
 * Jalankan migrasi schema ke SEMUA database tenant sekaligus.
 * Script ini idempotent — hanya menjalankan migrasi yang belum pernah dijalankan.
 *
 * Cara pakai:
 *   node scripts/migrate-all-tenants.js
 *
 * Untuk dry-run (hanya tampil, tidak eksekusi):
 *   DRY_RUN=1 node scripts/migrate-all-tenants.js
 */

import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { mainDb } from '../server/db/main.js';
import { tenants } from '../server/db/main-schema.js';
import { eq } from 'drizzle-orm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY_RUN = process.env.DRY_RUN === '1';
const TENANTS_DIR = process.env.TENANTS_DIR
  ? path.resolve(process.env.TENANTS_DIR)
  : path.resolve(__dirname, '../tenants');

// ============================================================
// ⭐ DAFTAR MIGRASI — tambahkan migrasi baru di sini
// ============================================================
const MIGRATIONS = [
  // Format: { version: 'NNN_nama', sql: `...` }
  // Contoh migrasi yang sudah ada (skip otomatis karena ada di schema_migrations):
  {
    version: '001_initial',
    sql: `-- Skip: sudah dibuat saat createTenantDatabase()`,
  },

  // Contoh migrasi baru (uncomment dan isi saat ada update schema):
  // {
  //   version: '002_add_audit_logs',
  //   sql: `
  //     CREATE TABLE IF NOT EXISTS audit_logs (
  //       id TEXT PRIMARY KEY,
  //       worker_id TEXT,
  //       action TEXT NOT NULL,
  //       table_name TEXT,
  //       record_id TEXT,
  //       created_at TEXT NOT NULL
  //     );
  //   `,
  // },
  // {
  //   version: '003_add_worker_avatar',
  //   sql: `ALTER TABLE workers ADD COLUMN avatar_url TEXT;`,
  // },
];

// ============================================================
// Main runner
// ============================================================
async function main() {
  console.log(`\n🔧 MaintainX — Tenant Migration Script`);
  console.log(`   Tenants dir : ${TENANTS_DIR}`);
  console.log(`   Dry run     : ${DRY_RUN ? 'YES (no changes will be made)' : 'NO'}`);
  console.log(`   Migrations  : ${MIGRATIONS.length}\n`);

  if (!fs.existsSync(TENANTS_DIR)) {
    console.log('⚠️  Tenants directory tidak ditemukan. Tidak ada tenant untuk dimigrasi.');
    process.exit(0);
  }

  // Ambil semua tenant aktif dari main.db
  const allTenants = mainDb.select().from(tenants).where(eq(tenants.isActive, 1)).all();
  console.log(`📦 Ditemukan ${allTenants.length} tenant aktif\n`);

  let successCount = 0;
  let failedCount = 0;
  const failures = [];

  for (const tenant of allTenants) {
    const fullPath = path.join(TENANTS_DIR, tenant.dbPath);
    const label = `${tenant.slug} (${tenant.dbPath})`;

    if (!fs.existsSync(fullPath)) {
      console.warn(`  ⚠️  File tidak ditemukan: ${label}`);
      failures.push({ tenant: tenant.slug, error: 'DB file not found' });
      failedCount++;
      continue;
    }

    try {
      process.stdout.write(`  Processing: ${label} ... `);

      if (!DRY_RUN) {
        const sqlite = new Database(fullPath);

        // Pastikan tabel schema_migrations ada
        sqlite.exec(`
          CREATE TABLE IF NOT EXISTS schema_migrations (
            version TEXT PRIMARY KEY,
            applied_at TEXT NOT NULL
          );
        `);

        let applied = 0;
        for (const migration of MIGRATIONS) {
          const already = sqlite
            .prepare(`SELECT 1 FROM schema_migrations WHERE version = ?`)
            .get(migration.version);

          if (!already) {
            sqlite.exec(migration.sql);
            sqlite.prepare(
              `INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)`
            ).run(migration.version, new Date().toISOString());
            applied++;
          }
        }

        sqlite.close();
        console.log(`✅ (${applied} migration(s) applied)`);
      } else {
        // Dry run: hanya hitung yang akan dijalankan
        const sqlite = new Database(fullPath);
        let wouldApply = 0;
        for (const migration of MIGRATIONS) {
          const already = sqlite
            .prepare(`SELECT 1 FROM schema_migrations WHERE version = ? LIMIT 1`)
            .get(migration.version);
          if (!already) wouldApply++;
        }
        sqlite.close();
        console.log(`👁  (would apply ${wouldApply} migration(s))`);
      }

      successCount++;
    } catch (err) {
      console.log(`❌ ERROR: ${err.message}`);
      failures.push({ tenant: tenant.slug, error: err.message });
      failedCount++;
    }
  }

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`✅ Success : ${successCount}`);
  console.log(`❌ Failed  : ${failedCount}`);

  if (failures.length > 0) {
    console.log('\nGagal:');
    failures.forEach(f => console.log(`  - ${f.tenant}: ${f.error}`));
    process.exit(1);
  }

  console.log('\nDone! 🚀\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
