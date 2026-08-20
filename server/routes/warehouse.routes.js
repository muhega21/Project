import { Router } from 'express';
import { tenantResolver, requirePermission } from '../middleware/tenant-resolver.js';
import {
  getAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  getLowStockItems,
  getTransactions,
  createTransaction,
  getLogisticRequests,
  createLogisticRequest,
  updateLogisticRequestStatus,
} from '../controllers/warehouse.controller.js';

const router = Router();

// Semua route warehouse butuh autentikasi & tenant yang valid
router.use(tenantResolver);

// --- Items ---
router.get('/items', requirePermission('warehouse:view'), getAssets);
router.post('/items', requirePermission('warehouse:edit'), createAsset);
router.put('/items/:id', requirePermission('warehouse:edit'), updateAsset);
router.delete('/items/:id', requirePermission('warehouse:delete'), deleteAsset);
router.get('/items/low-stock', requirePermission('warehouse:view'), getLowStockItems);

// --- Transaksi ---
router.get('/transactions', requirePermission('warehouse:view'), getTransactions);
router.post('/transactions', requirePermission('warehouse:edit'), createTransaction);

// --- Logistic Requests ---
router.get('/logistic-requests', requirePermission('warehouse:view'), getLogisticRequests);
router.post('/logistic-requests', requirePermission('warehouse:edit'), createLogisticRequest);
router.patch('/logistic-requests/:id/status', requirePermission('warehouse:edit'), updateLogisticRequestStatus);

export default router;
