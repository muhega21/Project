import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { mainDb } from '../db/main.js';
import { tenants, tenantUsers } from '../db/main-schema.js';
import { getTenantDb } from '../db/tenant-pool.js';
import { workers, roles } from '../db/tenant-schema.js';
import { createTenantDatabase } from '../db/migrate-tenant.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_prod';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ============================================================
// REGISTRASI TENANT BARU
// POST /api/auth/register-tenant
// Body: { companyName, slug, adminName, adminEmail, adminPassword }
// ============================================================
export async function registerTenant(req, res) {
  try {
    const { companyName, slug, adminName, adminEmail, adminPassword } = req.body;

    // --- Validasi input ---
    if (!companyName || !slug || !adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({ error: 'Semua field wajib diisi' });
    }

    // Slug: hanya huruf kecil, angka, dan tanda hubung
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({
        error: 'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (-)',
      });
    }

    if (adminPassword.length < 8) {
      return res.status(400).json({ error: 'Password minimal 8 karakter' });
    }

    // --- Cek slug sudah dipakai ---
    const existing = mainDb.select().from(tenants).where(eq(tenants.slug, slug)).get();
    if (existing) {
      return res.status(409).json({ error: `Slug '${slug}' sudah digunakan` });
    }

    // --- Buat file DB tenant baru ---
    const dbFilename = createTenantDatabase(slug);

    // --- Simpan tenant ke main.db ---
    const tenantId = `tenant_${Date.now()}`;
    mainDb.insert(tenants).values({
      id: tenantId,
      slug,
      name: companyName,
      dbPath: dbFilename,
      plan: 'free',
      createdAt: new Date().toISOString(),
      isActive: 1,
    }).run();

    // --- Buat worker admin di tenant DB ---
    const tenantDb = getTenantDb(dbFilename);
    const workerId = `WRK-${Date.now()}`;

    tenantDb.insert(workers).values({
      id: workerId,
      name: adminName,
      email: adminEmail,
      role: 'Administrator',
      status: 'active',
      createdAt: new Date().toISOString(),
    }).run();

    // --- Hash password dan simpan ke main.db ---
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    mainDb.insert(tenantUsers).values({
      id: `tu_${Date.now()}`,
      tenantId,
      email: adminEmail,
      passwordHash,
      workerId,
      createdAt: new Date().toISOString(),
      isActive: 1,
    }).run();

    res.status(201).json({
      message: 'Tenant berhasil didaftarkan',
      tenant: { id: tenantId, slug, name: companyName },
      admin: { email: adminEmail, role: 'Administrator' },
    });
  } catch (err) {
    console.error('[registerTenant]', err);
    res.status(500).json({ error: err.message });
  }
}

// ============================================================
// LOGIN
// POST /api/auth/login
// Body: { email, password }
// ============================================================
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }

    // 1. Cari user di main.db berdasarkan email
    const tenantUser = mainDb
      .select()
      .from(tenantUsers)
      .where(eq(tenantUsers.email, email))
      .get();

    if (!tenantUser || !tenantUser.isActive) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    // 2. Verifikasi password
    const valid = await bcrypt.compare(password, tenantUser.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }

    // 3. Ambil info tenant
    const tenant = mainDb
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantUser.tenantId))
      .get();

    if (!tenant || !tenant.isActive) {
      return res.status(403).json({ error: 'Akun tenant tidak aktif' });
    }

    // 4. Ambil data worker + role + permissions dari tenant DB
    const tenantDb = getTenantDb(tenant.dbPath);

    const worker = tenantDb
      .select()
      .from(workers)
      .where(eq(workers.id, tenantUser.workerId))
      .get();

    if (!worker || worker.status !== 'active') {
      return res.status(403).json({ error: 'Akun pekerja tidak aktif' });
    }

    const workerRole = tenantDb
      .select()
      .from(roles)
      .where(eq(roles.name, worker.role))
      .get();

    const permissions = workerRole
      ? JSON.parse(workerRole.permissions)
      : [];

    // 5. Generate JWT
    const token = jwt.sign(
      {
        userId: tenantUser.id,
        workerId: worker.id,
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        role: worker.role,
        permissions,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: {
        id: worker.id,
        name: worker.name,
        email: worker.email,
        role: worker.role,
        permissions,
        tenantSlug: tenant.slug,
        tenantName: tenant.name,
      },
    });
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ error: err.message });
  }
}

// ============================================================
// TAMBAH PEKERJA KE TENANT (Admin only)
// POST /api/auth/add-worker
// Body: { name, email, password, role, nik?, phone?, position?, department? }
// ============================================================
export async function addWorkerWithAuth(req, res) {
  try {
    const { name, email, password, role, nik, phone, position, department } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password, dan role wajib diisi' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password minimal 8 karakter' });
    }

    // Cek email belum dipakai di main.db
    const existing = mainDb
      .select()
      .from(tenantUsers)
      .where(eq(tenantUsers.email, email))
      .get();

    if (existing) {
      return res.status(409).json({ error: 'Email sudah terdaftar' });
    }

    // Tambah worker ke tenant DB
    const workerId = `WRK-${Date.now()}`;
    req.tenantDb.insert(workers).values({
      id: workerId,
      name,
      email,
      nik,
      phone,
      role,
      position,
      department,
      status: 'active',
      createdAt: new Date().toISOString(),
    }).run();

    // Tambah credential ke main.db
    const passwordHash = await bcrypt.hash(password, 12);
    mainDb.insert(tenantUsers).values({
      id: `tu_${Date.now()}`,
      tenantId: req.user.tenantId,
      email,
      passwordHash,
      workerId,
      createdAt: new Date().toISOString(),
      isActive: 1,
    }).run();

    res.status(201).json({
      message: 'Pekerja berhasil ditambahkan',
      worker: { id: workerId, name, email, role },
    });
  } catch (err) {
    console.error('[addWorkerWithAuth]', err);
    res.status(500).json({ error: err.message });
  }
}

// ============================================================
// PROFILE: GET /api/auth/me
// ============================================================
export async function getMe(req, res) {
  try {
    const worker = req.tenantDb
      .select()
      .from(workers)
      .where(eq(workers.id, req.user.workerId))
      .get();

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    res.json({
      id: worker.id,
      name: worker.name,
      email: worker.email,
      role: req.user.role,
      permissions: req.user.permissions,
      tenantSlug: req.user.tenantSlug,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
