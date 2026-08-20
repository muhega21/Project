import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// ============================================================
// TENANT DATABASE SCHEMA
// Berisi semua data operasional per tenant/perusahaan
// ============================================================

// --- RBAC ---

/**
 * Role yang tersedia dalam tenant.
 * permissions: JSON array of strings, e.g. ["dashboard:view","warehouse:edit"]
 */
export const roles = sqliteTable('roles', {
  name: text('name').primaryKey(),
  description: text('description'),
  permissions: text('permissions').notNull(), // JSON string
});

/**
 * Daftar pekerja (mirror data dari menu "Pekerja" di frontend)
 */
export const workers = sqliteTable('workers', {
  id: text('id').primaryKey(),                        // e.g. "WRK-001"
  name: text('name').notNull(),
  email: text('email').unique().notNull(),
  nik: text('nik').unique(),
  phone: text('phone'),
  role: text('role').notNull().references(() => roles.name),
  position: text('position'),
  department: text('department'),
  status: text('status').notNull().default('active'), // active | inactive
  avatarUrl: text('avatar_url'),
  createdAt: text('created_at').notNull(),
});

// --- WAREHOUSE ---

export const warehouseItems = sqliteTable('warehouse_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category'),
  unit: text('unit').notNull(),
  qty: integer('qty').notNull().default(0),
  minQty: integer('min_qty').notNull().default(10),
  location: text('location'),
  image: text('image'),
});

export const warehouseTransactions = sqliteTable('warehouse_transactions', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  type: text('type').notNull(), // 'in' | 'out'
  itemId: text('item_id').notNull().references(() => warehouseItems.id),
  itemName: text('item_name').notNull(),
  qty: integer('qty').notNull(),
  worker: text('worker').notNull(),
  notes: text('notes'),
  referenceId: text('reference_id'),
});

export const logisticRequests = sqliteTable('logistic_requests', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  item: text('item').notNull(),
  quantity: integer('quantity').notNull(),
  purpose: text('purpose'),
  nik: text('nik').notNull(),
  status: text('status').notNull().default('Pending'), // Pending|Approved|Rejected
  rejectReason: text('reject_reason'),
});

// --- MAINTENANCE ---

export const areas = sqliteTable('areas', {
  id: text('id').primaryKey(),
  plantCode: text('plant_code'),
  name: text('name').notNull(),
  description: text('description'),
});

export const assets = sqliteTable('assets', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  areaId: text('area_id').references(() => areas.id),
  category: text('category'),
  brand: text('brand'),
  serialNumber: text('serial_number'),
  status: text('status').default('Active'),
  installDate: text('install_date'),
});

export const maintenancePlans = sqliteTable('maintenance_plans', {
  id: text('id').primaryKey(),
  areaId: text('area_id'),
  areaName: text('area_name'),
  assetId: text('asset_id'),
  assetName: text('asset_name'),
  taskDescription: text('task_description').notNull(),
  frequency: text('frequency').notNull(), // Daily|Weekly|Monthly|Quarterly|Semester|Annual|Trienial|Quinquenial
  startDate: text('start_date').notNull(),
  pic: text('pic'),
  status: text('status').notNull().default('Active'), // Active|Inactive
  priority: text('priority').default('Normal'),
  createdAt: text('created_at').notNull(),
});

export const taskStatuses = sqliteTable('task_statuses', {
  planId: text('plan_id').primaryKey().references(() => maintenancePlans.id),
  status: text('status').notNull().default('Open'), // Open|On Progress|Waiting on Part|Done
  updatedAt: text('updated_at').notNull(),
  updatedBy: text('updated_by'),
  notes: text('notes'),
});

export const workOrders = sqliteTable('work_orders', {
  id: text('id').primaryKey(),
  description: text('description').notNull(),
  priority: text('priority').notNull().default('Medium'), // Critical|High|Medium|Low
  status: text('status').notNull().default('Pending Approval'),
  submittedAt: text('submitted_at').notNull(),
  submittedBy: text('submitted_by'),
  approvedBy: text('approved_by'),
  approvedAt: text('approved_at'),
  assetId: text('asset_id'),
});

// --- SCHEMA MIGRATION TRACKING ---

export const schemaMigrations = sqliteTable('schema_migrations', {
  version: text('version').primaryKey(),
  appliedAt: text('applied_at').notNull(),
});

// ============================================================
// DEFAULT ROLES & PERMISSIONS
// ============================================================

export const DEFAULT_ROLES = [
  {
    name: 'Administrator',
    description: 'Akses penuh ke semua fitur',
    permissions: JSON.stringify([
      'dashboard:view',
      'asset:view', 'asset:edit', 'asset:delete',
      'warehouse:view', 'warehouse:edit', 'warehouse:delete',
      'maintenance:view', 'maintenance:edit', 'maintenance:delete',
      'report:view', 'report:export',
      'worker:view', 'worker:edit', 'worker:delete',
      'settings:view', 'settings:edit',
    ]),
  },
  {
    name: 'Supervisor',
    description: 'Dapat melihat dan mengelola semua kecuali Pengaturan',
    permissions: JSON.stringify([
      'dashboard:view',
      'asset:view', 'asset:edit',
      'warehouse:view', 'warehouse:edit',
      'maintenance:view', 'maintenance:edit',
      'report:view', 'report:export',
      'worker:view',
    ]),
  },
  {
    name: 'Admin',
    description: 'Kelola data operasional, tanpa pengaturan dan pekerja',
    permissions: JSON.stringify([
      'dashboard:view',
      'asset:view', 'asset:edit',
      'warehouse:view', 'warehouse:edit',
      'maintenance:view', 'maintenance:edit',
      'report:view',
    ]),
  },
  {
    name: 'Foreman',
    description: 'Fokus pada maintenance dan gudang',
    permissions: JSON.stringify([
      'dashboard:view',
      'warehouse:view',
      'maintenance:view', 'maintenance:edit',
      'report:view',
      'worker:view',
    ]),
  },
  {
    name: 'Teknisi',
    description: 'Fokus pada task maintenance',
    permissions: JSON.stringify([
      'dashboard:view',
      'asset:view',
      'maintenance:view', 'maintenance:edit',
    ]),
  },
  {
    name: 'Warehouse',
    description: 'Fokus pada manajemen gudang',
    permissions: JSON.stringify([
      'dashboard:view',
      'warehouse:view', 'warehouse:edit',
    ]),
  },
  {
    name: 'Visitor',
    description: 'Hanya bisa melihat dashboard dan report',
    permissions: JSON.stringify([
      'dashboard:view',
      'report:view',
    ]),
  },
];
