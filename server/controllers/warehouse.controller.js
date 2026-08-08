import { eq, lte } from 'drizzle-orm';
import { db } from '../db/index.js';
import { warehouseItems, warehouseTransactions, logisticRequests } from '../db/schema.js';

// 1. Data Master & Inventaris Gudang
export const getAssets = async (req, res) => {
  try {
    const assets = await db.select().from(warehouseItems);
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createAsset = async (req, res) => {
  try {
    const item = req.body;
    await db.insert(warehouseItems).values(item);
    res.status(201).json({ message: 'Asset created successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const item = req.body;
    await db.update(warehouseItems).set(item).where(eq(warehouseItems.id, id));
    res.json({ message: 'Asset updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(warehouseItems).where(eq(warehouseItems.id, id));
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 2. Manajemen Transaksi & Stok (In/Out)
export const stockIn = async (req, res) => {
  try {
    const trxData = req.body; // id, date, type='in', itemId, itemName, qty, worker, notes
    
    await db.transaction(async (tx) => {
      // 1. Catat transaksi
      await tx.insert(warehouseTransactions).values(trxData);
      
      // 2. Ambil stok saat ini
      const [item] = await tx.select().from(warehouseItems).where(eq(warehouseItems.id, trxData.itemId));
      if (!item) throw new Error('Item not found');
      
      // 3. Tambah stok
      await tx.update(warehouseItems).set({ qty: item.qty + trxData.qty }).where(eq(warehouseItems.id, trxData.itemId));
    });
    
    res.status(201).json({ message: 'Stock In recorded successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const stockOut = async (req, res) => {
  try {
    const trxData = req.body;
    
    await db.transaction(async (tx) => {
      // 1. Ambil dan kunci row item
      const [item] = await tx.select().from(warehouseItems).where(eq(warehouseItems.id, trxData.itemId));
      if (!item) throw new Error('Item not found');
      
      // 2. Validasi Anti Race-Condition: Stok minus
      if (item.qty < trxData.qty) {
        throw new Error(`Insufficient stock. Current stock: ${item.qty}, Requested: ${trxData.qty}`);
      }
      
      // 3. Catat transaksi
      await tx.insert(warehouseTransactions).values(trxData);
      
      // 4. Kurangi stok
      await tx.update(warehouseItems).set({ qty: item.qty - trxData.qty }).where(eq(warehouseItems.id, trxData.itemId));
    });
    
    res.status(201).json({ message: 'Stock Out recorded successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 3. Integrasi & Notifikasi dari Permintaan Logistik
export const getRequests = async (req, res) => {
  try {
    const requests = await db.select().from(logisticRequests);
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.transaction(async (tx) => {
      const [request] = await tx.select().from(logisticRequests).where(eq(logisticRequests.id, id));
      if (!request) throw new Error('Request not found');
      if (request.status === 'Approved') throw new Error('Request is already approved');
      
      // Cari Item di inventory berdasarkan nama (atau id jika formatnya disesuaikan)
      // Dalam request, kita anggap 'item' menyimpan Nama atau ID
      // Coba cari berdasarkan ID (asumsi 'item' menyimpan id, atau nama)
      const items = await tx.select().from(warehouseItems);
      const targetItem = items.find(i => i.id === request.item || i.name.toLowerCase() === request.item.toLowerCase());
      
      if (!targetItem) {
        throw new Error(`Item ${request.item} not found in inventory.`);
      }

      if (targetItem.qty < request.quantity) {
        throw new Error(`Insufficient stock to approve this request. Stock: ${targetItem.qty}`);
      }

      // Kurangi stok
      await tx.update(warehouseItems).set({ qty: targetItem.qty - request.quantity }).where(eq(warehouseItems.id, targetItem.id));
      
      // Update status
      await tx.update(logisticRequests).set({ status: 'Approved' }).where(eq(logisticRequests.id, id));
      
      // Buat riwayat Stock Out otomatis
      await tx.insert(warehouseTransactions).values({
        id: `BK-${Date.now()}`,
        date: new Date().toISOString(),
        type: 'out',
        itemId: targetItem.id,
        itemName: targetItem.name,
        qty: request.quantity,
        worker: request.nik,
        notes: `Approved Request: ${request.purpose}`,
        referenceId: request.id
      });
    });
    
    res.json({ message: 'Request approved and stock deducted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    await db.update(logisticRequests)
      .set({ status: 'Rejected', rejectReason: reason || 'Ditolak oleh admin' })
      .where(eq(logisticRequests.id, id));
      
    res.json({ message: 'Request rejected' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 4. Peringatan Stok Kritis (Alerting)
export const getLowStockAlerts = async (req, res) => {
  try {
    // SELECT * FROM warehouse_items WHERE qty <= minQty
    // Karena Drizzle SQLite belum support query qty <= minQty secara langsung dalam satu tabel pakai helper simpel,
    // kita akan fetch dan filter, atau pakai sql helper
    // Untuk lebih safe cross-DB, filter di memori atau raw query:
    const allItems = await db.select().from(warehouseItems);
    const alerts = allItems.filter(item => item.qty <= item.minQty);
    
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
