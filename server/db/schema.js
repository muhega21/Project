import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// 1. Data Master & Inventaris Gudang
export const warehouseItems = sqliteTable('warehouse_items', {
  id: text('id').primaryKey(), // e.g. RAW-001
  name: text('name').notNull(),
  category: text('category'), // e.g. Material, Sparepart
  unit: text('unit').notNull(),
  qty: integer('qty').notNull().default(0),
  minQty: integer('min_qty').notNull().default(10),
  location: text('location'), // e.g. Gudang Utama
  image: text('image')
});

// 2. Transaksi Gudang (In/Out)
export const warehouseTransactions = sqliteTable('warehouse_transactions', {
  id: text('id').primaryKey(), // e.g. BM-1001
  date: text('date').notNull(), // ISO string or format 'YYYY-MM-DD HH:mm'
  type: text('type').notNull(), // 'in' or 'out'
  itemId: text('item_id').notNull().references(() => warehouseItems.id),
  itemName: text('item_name').notNull(),
  qty: integer('qty').notNull(),
  worker: text('worker').notNull(), // name or nik
  notes: text('notes'),
  referenceId: text('reference_id') // e.g. WO number or Request ID
});

// 3. Antrean Permintaan Logistik
export const logisticRequests = sqliteTable('logistic_requests', {
  id: text('id').primaryKey(), // e.g. REQ-001
  date: text('date').notNull(),
  item: text('item').notNull(),
  quantity: integer('quantity').notNull(),
  purpose: text('purpose'),
  nik: text('nik').notNull(),
  status: text('status').notNull().default('Pending'), // Pending, Approved, Rejected
  rejectReason: text('reject_reason')
});
