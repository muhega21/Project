import { eq, lte } from 'drizzle-orm';
import {
  warehouseItems,
  warehouseTransactions,
  logisticRequests,
} from '../db/tenant-schema.js';

/**
 * Semua controller di sini menggunakan req.tenantDb
 * yang disuntikkan oleh middleware tenantResolver.
 */

// ----------------------------------------------------------------
// 1. Data Master & Inventaris Gudang
// ----------------------------------------------------------------

export const getAssets = async (req, res) => {
  try {
    const items = req.tenantDb.select().from(warehouseItems).all();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createAsset = async (req, res) => {
  try {
    const item = req.body;
    req.tenantDb.insert(warehouseItems).values(item).run();
    res.status(201).json({ message: 'Item berhasil ditambahkan' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const item = req.body;
    req.tenantDb.update(warehouseItems).set(item).where(eq(warehouseItems.id, id)).run();
    res.json({ message: 'Item berhasil diperbarui' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;
    req.tenantDb.delete(warehouseItems).where(eq(warehouseItems.id, id)).run();
    res.json({ message: 'Item berhasil dihapus' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getLowStockItems = async (req, res) => {
  try {
    const items = req.tenantDb
      .select()
      .from(warehouseItems)
      .where(lte(warehouseItems.qty, warehouseItems.minQty))
      .all();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ----------------------------------------------------------------
// 2. Transaksi Gudang (In/Out)
// ----------------------------------------------------------------

export const getTransactions = async (req, res) => {
  try {
    const transactions = req.tenantDb.select().from(warehouseTransactions).all();
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createTransaction = async (req, res) => {
  try {
    const { id, date, type, itemId, itemName, qty, worker, notes, referenceId } = req.body;

    // Update stok
    const item = req.tenantDb
      .select()
      .from(warehouseItems)
      .where(eq(warehouseItems.id, itemId))
      .get();

    if (!item) {
      return res.status(404).json({ error: 'Item tidak ditemukan' });
    }

    const newQty = type === 'in' ? item.qty + qty : item.qty - qty;
    if (newQty < 0) {
      return res.status(400).json({ error: 'Stok tidak cukup untuk transaksi keluar' });
    }

    req.tenantDb.transaction(() => {
      req.tenantDb
        .update(warehouseItems)
        .set({ qty: newQty })
        .where(eq(warehouseItems.id, itemId))
        .run();

      req.tenantDb.insert(warehouseTransactions).values({
        id,
        date,
        type,
        itemId,
        itemName,
        qty,
        worker: worker || req.user?.workerId || 'Unknown',
        notes,
        referenceId,
      }).run();
    })();

    res.status(201).json({ message: 'Transaksi berhasil dicatat', newQty });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// ----------------------------------------------------------------
// 3. Permintaan Logistik
// ----------------------------------------------------------------

export const getLogisticRequests = async (req, res) => {
  try {
    const requests = req.tenantDb.select().from(logisticRequests).all();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createLogisticRequest = async (req, res) => {
  try {
    const data = req.body;
    req.tenantDb.insert(logisticRequests).values(data).run();
    res.status(201).json({ message: 'Permintaan logistik berhasil dibuat' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateLogisticRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectReason } = req.body;

    req.tenantDb
      .update(logisticRequests)
      .set({ status, rejectReason })
      .where(eq(logisticRequests.id, id))
      .run();

    res.json({ message: 'Status permintaan berhasil diperbarui' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
