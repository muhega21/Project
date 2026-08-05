import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role').notNull(), // e.g., admin, manager, user
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const workers = sqliteTable('workers', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  name: text('name').notNull(),
  skill: text('skill'),
  role: text('role'),
  area: text('area'),
});

export const assets = sqliteTable('assets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  location: text('location'),
  status: text('status').notNull(), // e.g., good, broken, in_repair
  specs: text('specs'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const maintenanceJobs = sqliteTable('maintenance_jobs', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  maintenanceType: text('maintenance_type').notNull(), // e.g., preventive, corrective
  assetId: text('asset_id').references(() => assets.id),
  workerId: text('worker_id').references(() => workers.id),
  priority: text('priority').notNull(), // e.g., low, medium, high
  dueDate: integer('due_date', { mode: 'timestamp' }),
  status: text('status').notNull(), // e.g., pending, in_progress, completed
  photoUrl: text('photo_url'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const schedules = sqliteTable('schedules', {
  id: text('id').primaryKey(),
  jobId: text('job_id').references(() => maintenanceJobs.id),
  workerId: text('worker_id').references(() => workers.id),
  assetId: text('asset_id').references(() => assets.id),
  scheduledDate: integer('scheduled_date', { mode: 'timestamp' }).notNull(),
  status: text('status').notNull(), // e.g., scheduled, completed, delayed
  notes: text('notes'),
});

export const inventoryItems = sqliteTable('inventory_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  sku: text('sku').notNull().unique(),
  quantity: integer('quantity').notNull().default(0),
  unit: text('unit').notNull(),
  minStock: integer('min_stock').notNull().default(0),
});

export const stockMovements = sqliteTable('stock_movements', {
  id: text('id').primaryKey(),
  itemId: text('item_id').notNull().references(() => inventoryItems.id),
  type: text('type').notNull(), // in, out
  quantity: integer('quantity').notNull(),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  notes: text('notes'),
  jobId: text('job_id').references(() => maintenanceJobs.id),
});

export const guides = sqliteTable('guides', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  steps: text('steps'),
  content: text('content'),
});
