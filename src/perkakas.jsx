import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

const initialTools = [
  { id: 'TL-001', name: 'Kunci Pas Set 8-24mm', category: 'Perkakas Tangan', status: 'Available', img: '🔧' },
  { id: 'TL-002', name: 'Bor Listrik Bosch', category: 'Perkakas Mesin', status: 'In Use', img: '🔩' },
  { id: 'TL-003', name: 'Impact Wrench Air', category: 'Alat Pneumatik', status: 'Available', img: '🔫' },
  { id: 'TL-004', name: 'Jangka Sorong Digital', category: 'Perkakas Pengukur', status: 'Calibration Due', img: '📏' }
];

const PerkakasApp = () => {
  const [activeTab, setActiveTab] = useState('inventory'); // inventory, requests, logs
  const [tools, setTools] = useState(initialTools);
  const [requests, setRequests] = useState([]);
  const [logs, setLogs] = useState([]);
  const [filterCat, setFilterCat] = useState('All');

  useEffect(() => {
    const savedReqs = localStorage.getItem('maintainx_logistic_requests');
    if (savedReqs) {
      setRequests(JSON.parse(savedReqs));
    }
    const savedLogs = localStorage.getItem('maintainx_tool_logs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }

    const handleStorage = (e) => {
      if (e.key === 'maintainx_logistic_requests') {
        setRequests(JSON.parse(e.newValue || '[]'));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const pendingToolRequests = requests.filter(r => r.type === 'Alat / Perkakas' && r.status === 'Pending Approval');
  const activeToolRequests = requests.filter(r => r.type === 'Alat / Perkakas' && r.status === 'In Use');

  const updateRequestStatus = (id, newStatus, condition = null) => {
    const updatedReqs = requests.map(r => {
      if (r.id === id) {
        return { ...r, status: newStatus };
      }
      return r;
    });
    setRequests(updatedReqs);
    localStorage.setItem('maintainx_logistic_requests', JSON.stringify(updatedReqs));
    
    // Add log entry
    const req = requests.find(r => r.id === id);
    if (req) {
      const newLog = {
        id: 'LOG-' + Date.now().toString().slice(-6),
        reqId: req.id,
        item: req.item,
        borrower: req.nik,
        action: newStatus === 'In Use' ? 'Check-Out' : 'Check-In',
        date: new Date().toLocaleString(),
        condition: condition || (newStatus === 'In Use' ? 'Baik' : 'N/A')
      };
      const newLogs = [newLog, ...logs];
      setLogs(newLogs);
      localStorage.setItem('maintainx_tool_logs', JSON.stringify(newLogs));
    }
  };

  const filteredTools = filterCat === 'All' ? tools : tools.filter(t => t.category === filterCat);

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
        <button 
          onClick={() => setActiveTab('inventory')}
          style={{ padding: '8px 16px', background: activeTab === 'inventory' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'inventory' ? '#fff' : 'var(--text-primary)', borderRadius: '6px', fontWeight: '500' }}>
          Inventaris Alat
        </button>
        <button 
          onClick={() => setActiveTab('requests')}
          style={{ padding: '8px 16px', background: activeTab === 'requests' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'requests' ? '#fff' : 'var(--text-primary)', borderRadius: '6px', fontWeight: '500', position: 'relative' }}>
          Permintaan Masuk 
          {pendingToolRequests.length > 0 && <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#ef4444', color: '#fff', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px' }}>{pendingToolRequests.length}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          style={{ padding: '8px 16px', background: activeTab === 'logs' ? 'var(--accent-primary)' : 'transparent', color: activeTab === 'logs' ? '#fff' : 'var(--text-primary)', borderRadius: '6px', fontWeight: '500' }}>
          Log Check-In/Out
        </button>
      </div>

      {activeTab === 'inventory' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.2rem' }}>Daftar Perkakas Kerja</h2>
            <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
              <option value="All">Semua Kategori</option>
              <option value="Perkakas Tangan">Perkakas Tangan</option>
              <option value="Perkakas Mesin">Perkakas Mesin</option>
              <option value="Alat Pneumatik">Alat Pneumatik</option>
              <option value="Perkakas Pengukur">Perkakas Pengukur</option>
            </select>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
            {filteredTools.map(tool => (
              <div key={tool.id} style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', background: 'var(--bg-color)' }}>
                <div style={{ fontSize: '2.5rem', textAlign: 'center', marginBottom: '12px' }}>{tool.img}</div>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>{tool.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>{tool.id} • {tool.category}</div>
                <span style={{ 
                  fontSize: '0.8rem', padding: '4px 8px', borderRadius: '12px', fontWeight: '500',
                  background: tool.status === 'Available' ? '#10b98120' : tool.status === 'In Use' ? '#3b82f620' : '#f59e0b20',
                  color: tool.status === 'Available' ? '#10b981' : tool.status === 'In Use' ? '#3b82f6' : '#f59e0b'
                }}>
                  {tool.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div style={{ display: 'grid', gap: '24px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Permintaan Menunggu Check-Out</h2>
            {pendingToolRequests.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>Tidak ada permintaan alat baru.</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px 8px' }}>ID Req</th>
                    <th style={{ padding: '12px 8px' }}>Peminjam</th>
                    <th style={{ padding: '12px 8px' }}>Alat</th>
                    <th style={{ padding: '12px 8px' }}>Durasi</th>
                    <th style={{ padding: '12px 8px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingToolRequests.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 8px' }}>{r.id}</td>
                      <td style={{ padding: '12px 8px' }}>{r.nik}</td>
                      <td style={{ padding: '12px 8px' }}>{r.item} (x{r.quantity})</td>
                      <td style={{ padding: '12px 8px' }}>{r.duration}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <button onClick={() => updateRequestStatus(r.id, 'In Use')} style={{ background: '#10b981', color: 'white', padding: '6px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>Check-Out</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Alat Sedang Dipinjam (Menunggu Check-In)</h2>
            {activeToolRequests.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>Tidak ada alat yang sedang dipinjam.</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px 8px' }}>ID Req</th>
                    <th style={{ padding: '12px 8px' }}>Peminjam</th>
                    <th style={{ padding: '12px 8px' }}>Alat</th>
                    <th style={{ padding: '12px 8px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {activeToolRequests.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 8px' }}>{r.id}</td>
                      <td style={{ padding: '12px 8px' }}>{r.nik}</td>
                      <td style={{ padding: '12px 8px' }}>{r.item} (x{r.quantity})</td>
                      <td style={{ padding: '12px 8px' }}>
                        <button onClick={() => {
                          const cond = prompt("Kondisi saat kembali (Baik/Rusak):", "Baik");
                          if (cond) updateRequestStatus(r.id, 'Returned', cond);
                        }} style={{ background: '#3b82f6', color: 'white', padding: '6px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>Check-In</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Riwayat Transaksi Check-In & Check-Out</h2>
          {logs.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>Belum ada log transaksi.</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 8px' }}>Waktu</th>
                  <th style={{ padding: '12px 8px' }}>Aksi</th>
                  <th style={{ padding: '12px 8px' }}>Peminjam</th>
                  <th style={{ padding: '12px 8px' }}>Alat</th>
                  <th style={{ padding: '12px 8px' }}>Kondisi</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 8px', fontSize: '0.9rem' }}>{log.date}</td>
                    <td style={{ padding: '12px 8px' }}>
                      <span style={{ color: log.action === 'Check-Out' ? '#f59e0b' : '#10b981', fontWeight: '500' }}>{log.action}</span>
                    </td>
                    <td style={{ padding: '12px 8px' }}>{log.borrower}</td>
                    <td style={{ padding: '12px 8px' }}>{log.item}</td>
                    <td style={{ padding: '12px 8px' }}>{log.condition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<PerkakasApp />);
