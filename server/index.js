import express from 'express';
import cors from 'cors';
import { closeAllConnections } from './db/tenant-pool.js';
import authRoutes from './routes/auth.routes.js';
import warehouseRoutes from './routes/warehouse.routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? /\.maintainx\.app$/ // hanya izinkan subdomain app di produksi
    : '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// ── Request logging (development) ──────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// ── Routes ─────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ status: 'ok', app: 'MaintainX API', version: '2.0.0' });
});

// Auth & tenant management (public + protected)
app.use('/api/auth', authRoutes);

// Warehouse (semua butuh auth via tenantResolver)
app.use('/api/warehouse', warehouseRoutes);

// Pool stats (debug endpoint — hapus di produksi)
if (process.env.NODE_ENV !== 'production') {
  const { getPoolStats } = await import('./db/tenant-pool.js');
  app.get('/api/_debug/pool', (_req, res) => res.json(getPoolStats()));
}

// ── 404 handler ────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Error handler ──────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start server ───────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`✅ MaintainX API v2.0 running on http://localhost:${PORT}`);
  console.log(`   Mode: ${process.env.NODE_ENV || 'development'}`);
});

// ── Graceful shutdown ──────────────────────────────────────
const shutdown = (signal) => {
  console.log(`\n[${signal}] Shutting down gracefully...`);
  server.close(() => {
    closeAllConnections();
    console.log('Server closed. Bye!');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
