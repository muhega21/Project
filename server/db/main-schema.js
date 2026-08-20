import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// ============================================================
// MAIN DATABASE SCHEMA
// Berisi: registry tenant & credential login (BUKAN data operasional)
// ============================================================

/**
 * Tabel registry semua tenant/perusahaan yang terdaftar
 */
export const tenants = sqliteTable('tenants', {
  id: text('id').primaryKey(),                   // e.g. "tenant_abc123"
  slug: text('slug').unique().notNull(),          // e.g. "pt-maju-jaya" → subdomain
  name: text('name').notNull(),                   // e.g. "PT Maju Jaya"
  dbPath: text('db_path').notNull(),              // e.g. "pt-maju-jaya.db"
  plan: text('plan').notNull().default('free'),   // free | pro | enterprise
  createdAt: text('created_at').notNull(),
  isActive: integer('is_active').notNull().default(1),
});

/**
 * Tabel credential login pekerja — satu baris per pekerja per tenant.
 * Hanya dipakai untuk lookup saat login. Password TIDAK ada di tenant DB.
 */
export const tenantUsers = sqliteTable('tenant_users', {
  id: text('id').primaryKey(),
  tenantId: text('tenant_id').notNull().references(() => tenants.id),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  workerId: text('worker_id').notNull(),          // ID worker di tenant DB
  createdAt: text('created_at').notNull(),
  isActive: integer('is_active').notNull().default(1),
});
