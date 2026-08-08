import express from 'express';
import {
  getAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  stockIn,
  stockOut,
  getRequests,
  approveRequest,
  rejectRequest,
  getLowStockAlerts
} from '../controllers/warehouse.controller.js';

const router = express.Router();

// 1. Data Master & Inventaris Gudang
router.get('/assets', getAssets);
router.post('/assets', createAsset);
router.put('/assets/:id', updateAsset);
router.delete('/assets/:id', deleteAsset);

// 2. Manajemen Transaksi & Stok (In/Out)
router.post('/stock-in', stockIn);
router.post('/stock-out', stockOut);

// 3. Integrasi & Notifikasi dari Permintaan Logistik
router.get('/requests', getRequests);
router.patch('/requests/:id/approve', approveRequest);
router.patch('/requests/:id/reject', rejectRequest);

// 4. Peringatan Stok Kritis (Alerting)
router.get('/alerts/low-stock', getLowStockAlerts);

export default router;
