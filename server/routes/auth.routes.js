import { Router } from 'express';
import {
  registerTenant,
  login,
  addWorkerWithAuth,
  getMe,
} from '../controllers/auth.controller.js';
import { tenantResolver, requirePermission } from '../middleware/tenant-resolver.js';

const router = Router();

// === PUBLIC ROUTES ===
// Registrasi tenant baru (tidak butuh auth)
router.post('/register-tenant', registerTenant);

// Login (tidak butuh auth)
router.post('/login', login);

// === PROTECTED ROUTES ===
// Semua route di bawah ini butuh token yang valid
router.use(tenantResolver);

// Profil user yang sedang login
router.get('/me', getMe);

// Tambah pekerja baru (hanya Administrator)
router.post('/add-worker', requirePermission('worker:edit'), addWorkerWithAuth);

export default router;
