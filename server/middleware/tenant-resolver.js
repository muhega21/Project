import jwt from 'jsonwebtoken';
import { mainDb } from '../db/main.js';
import { tenants } from '../db/main-schema.js';
import { getTenantDb } from '../db/tenant-pool.js';
import { eq } from 'drizzle-orm';

/**
 * Middleware: Deteksi tenant dari JWT, buka koneksi DB tenant,
 * dan suntikkan req.tenantDb + req.user ke setiap request.
 */
export async function tenantResolver(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.slice(7);
    let payload;

    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_in_prod');
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired, please login again' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Ambil data tenant dari main.db (bisa di-cache Redis di produksi)
    const tenant = mainDb
      .select()
      .from(tenants)
      .where(eq(tenants.id, payload.tenantId))
      .get();

    if (!tenant || !tenant.isActive) {
      return res.status(403).json({ error: 'Tenant not found or inactive' });
    }

    // Ambil koneksi DB tenant dari pool
    req.tenantDb = getTenantDb(tenant.dbPath);

    // Suntikkan info user ke request
    req.user = {
      id: payload.userId,
      workerId: payload.workerId,
      tenantId: payload.tenantId,
      tenantSlug: payload.tenantSlug,
      role: payload.role,
      permissions: payload.permissions || [],
    };

    next();
  } catch (err) {
    console.error('[TenantResolver] Unexpected error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware factory: Cek apakah user memiliki permission tertentu.
 * Harus dipasang setelah tenantResolver.
 *
 * @param {string} permission - e.g. "warehouse:edit"
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user?.permissions?.includes(permission)) {
      return res.status(403).json({
        error: `Forbidden: requires permission '${permission}'`,
        yourRole: req.user?.role,
      });
    }
    next();
  };
}

/**
 * Middleware: Hanya Administrator yang boleh akses.
 */
export function adminOnly(req, res, next) {
  if (req.user?.role !== 'Administrator') {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
}
