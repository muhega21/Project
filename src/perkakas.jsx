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
  const [showAddModal, setShowAddModal] = useState(false);
  const [newToolForm, setNewToolForm] = useState({ 
    id: 'TL-', 
    name: '', 
    specification: '', 
    classification: 'Electrical', 
    usage: 'Alat Pengencang dan Pembuka', 
    unit: 'Pcs',
    qty: 1,
    imagePreview: null 
  });

  useEffect(() => {
    const savedTools = localStorage.getItem('maintainx_tools');
    if (savedTools) {
      setTools(JSON.parse(savedTools));
    } else {
      setTools(initialTools);
      localStorage.setItem('maintainx_tools', JSON.stringify(initialTools));
    }

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

  const pendingToolRequests = requests.filter(r => r.type === 'Alat / Perkakas' && r.status === 'Waiting for Approval');
  const approvedToolRequests = requests.filter(r => r.type === 'Alat / Perkakas' && r.status.includes('Approved'));
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
    
    // Add log entry and update tool status
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
      
      // Update tools status
      if (newStatus === 'In Use' || newStatus === 'Returned') {
        const targetStatus = newStatus === 'In Use' ? 'In Use' : 'Available';
        const involvedIds = req.items ? req.items.map(it => it.id) : [];
        if (involvedIds.length > 0) {
          setTools(prevTools => {
            const updatedTools = prevTools.map(t => {
              if (involvedIds.includes(t.id)) {
                return { ...t, status: targetStatus };
              }
              return t;
            });
            localStorage.setItem('maintainx_tools', JSON.stringify(updatedTools));
            return updatedTools;
          });
        }
      }
    }
  };

  const filteredTools = filterCat === 'All' ? tools : tools.filter(t => t.category === filterCat);

  const handleAddToolSubmit = (e) => {
    e.preventDefault();
    const newTool = {
      id: newToolForm.id,
      name: newToolForm.name,
      category: newToolForm.classification,
      status: 'Available',
      img: newToolForm.imagePreview || '🔧',
      specification: newToolForm.specification,
      usage: newToolForm.usage,
      unit: newToolForm.unit,
      qty: parseInt(newToolForm.qty) || 1
    };
    const updatedTools = [newTool, ...tools];
    try {
      localStorage.setItem('maintainx_tools', JSON.stringify(updatedTools));
      setTools(updatedTools);
      setShowAddModal(false);
      setNewToolForm({ 
        id: 'TL-', 
        name: '', 
        specification: '', 
        classification: 'Electrical', 
        usage: 'Alat Pengencang dan Pembuka', 
        unit: 'Pcs',
        qty: 1,
        imagePreview: null 
      });
    } catch (error) {
      console.error("Failed to save tool to localStorage:", error);
      alert("Gagal menyimpan data: Penyimpanan lokal penuh (gambar terlalu besar).");
    }
  };

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
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ padding: '8px 16px', borderRadius: '6px', fontWeight: '500' }}>
                + Tambah Alat
              </button>
              <a href="/data-alat.html" className="btn-secondary" style={{ padding: '8px 16px', borderRadius: '6px', fontWeight: '500', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                Data Alat
              </a>
              <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
                <option value="All">Semua Kategori</option>
                <option value="Perkakas Tangan">Perkakas Tangan</option>
                <option value="Perkakas Mesin">Perkakas Mesin</option>
                <option value="Alat Pneumatik">Alat Pneumatik</option>
                <option value="Perkakas Pengukur">Perkakas Pengukur</option>
              </select>
            </div>
          </div>
          
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead style={{ background: 'var(--bg-dark)', borderBottom: '1px solid var(--border-color)' }}>
                <tr>
                  <th style={{ padding: '12px 16px', fontWeight: '500', color: 'var(--text-secondary)' }}>Gambar Alat</th>
                  <th style={{ padding: '12px 16px', fontWeight: '500', color: 'var(--text-secondary)' }}>ID Alat</th>
                  <th style={{ padding: '12px 16px', fontWeight: '500', color: 'var(--text-secondary)' }}>Nama Alat</th>
                  <th style={{ padding: '12px 16px', fontWeight: '500', color: 'var(--text-secondary)' }}>Spesifikasi Alat</th>
                  <th style={{ padding: '12px 16px', fontWeight: '500', color: 'var(--text-secondary)' }}>Klasifikasi Alat</th>
                  <th style={{ padding: '12px 16px', fontWeight: '500', color: 'var(--text-secondary)' }}>Kegunaan Alat</th>
                  <th style={{ padding: '12px 16px', fontWeight: '500', color: 'var(--text-secondary)' }}>Jumlah</th>
                  <th style={{ padding: '12px 16px', fontWeight: '500', color: 'var(--text-secondary)' }}>Satuan</th>
                  <th style={{ padding: '12px 16px', fontWeight: '500', color: 'var(--text-secondary)' }}>Status Pinjam</th>
                </tr>
              </thead>
              <tbody>
                {filteredTools.map((tool, idx) => (
                  <tr key={tool.id} style={{ borderBottom: idx === filteredTools.length - 1 ? 'none' : '1px solid var(--border-color)', background: 'var(--bg-color)', transition: 'background 0.2s' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-dark)', border: '1px solid var(--border-color)' }}>
                        {tool.img && tool.img.length > 10 ? (
                          <img src={tool.img} alt={tool.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ fontSize: '1.2rem' }}>{tool.img || '🔧'}</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#60a5fa' }}>{tool.id}</td>
                    <td style={{ padding: '12px 16px', fontWeight: '500', color: 'var(--text-primary)' }}>{tool.name}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{tool.specification || '-'}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{tool.classification || tool.category || '-'}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{tool.usage || '-'}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>{tool.qty || 1}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{tool.unit || 'Pcs'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ 
                        fontSize: '0.8rem', padding: '4px 8px', borderRadius: '12px', fontWeight: '500',
                        background: tool.status === 'Available' ? '#10b98120' : tool.status === 'In Use' ? '#3b82f620' : '#f59e0b20',
                        color: tool.status === 'Available' ? '#10b981' : tool.status === 'In Use' ? '#3b82f6' : '#f59e0b',
                        whiteSpace: 'nowrap'
                      }}>
                        {tool.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredTools.length === 0 && (
                  <tr>
                    <td colSpan="9" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      Tidak ada alat yang sesuai kriteria pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'requests' && (
        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Permintaan Masuk */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Permintaan Masuk</h2>
            {pendingToolRequests.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>Tidak ada permintaan alat baru.</p> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px 8px' }}>ID Req</th>
                    <th style={{ padding: '12px 8px' }}>Peminjam</th>
                    <th style={{ padding: '12px 8px' }}>Alat</th>
                    <th style={{ padding: '12px 8px' }}>Tujuan</th>
                    <th style={{ padding: '12px 8px' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingToolRequests.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 8px' }}>{r.id}</td>
                      <td style={{ padding: '12px 8px' }}>{r.nik}</td>
                      <td style={{ padding: '12px 8px' }}>{r.items ? r.items.map(it => `${it.name} (x${it.qty})`).join(', ') : `${r.item} (x${r.quantity})`}</td>
                      <td style={{ padding: '12px 8px' }}>{r.purpose || '-'}</td>
                      <td style={{ padding: '12px 8px', display: 'flex', gap: '8px' }}>
                        <button onClick={() => updateRequestStatus(r.id, 'Approved (Ready to Pick Up)')} style={{ background: '#3b82f6', color: 'white', padding: '6px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>Approve</button>
                        <button onClick={() => {
                          const updated = requests.filter(req => req.id !== r.id);
                          setRequests(updated);
                          localStorage.setItem('maintainx_logistic_requests', JSON.stringify(updated));
                        }} style={{ background: '#ef4444', color: 'white', padding: '6px 12px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}>Tolak</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Menunggu Diambil */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Siap Diambil (Approved)</h2>
            {approvedToolRequests.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>Tidak ada alat yang siap diambil.</p> : (
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
                  {approvedToolRequests.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 8px' }}>{r.id}</td>
                      <td style={{ padding: '12px 8px' }}>{r.nik}</td>
                      <td style={{ padding: '12px 8px' }}>{r.items ? r.items.map(it => `${it.name} (x${it.qty})`).join(', ') : `${r.item} (x${r.quantity})`}</td>
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
                      <td style={{ padding: '12px 8px' }}>{r.items ? r.items.map(it => `${it.name} (x${it.qty})`).join(', ') : `${r.item} (x${r.quantity})`}</td>
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

      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '24px' }}>
          <div className="glass-panel" style={{ padding: '32px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', fontWeight: '600' }}>Form Tambah Alat</h2>
            <form onSubmit={handleAddToolSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
              
              {/* Sisi Kiri: Upload Gambar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ width: '100%', aspectRatio: '1', background: 'var(--bg-color)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '2px dashed var(--border-color)' }}>
                  {newToolForm.imagePreview ? 
                    <img src={newToolForm.imagePreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" /> : 
                    <span style={{ color: 'var(--text-secondary)' }}>Preview Gambar</span>
                  }
                </div>
                <label className="btn-secondary" style={{ padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', width: '100%', textAlign: 'center', fontWeight: '500' }}>
                  Upload Gambar
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        alert('Ukuran gambar maksimal 10MB!');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const img = new Image();
                        img.onload = () => {
                          const canvas = document.createElement('canvas');
                          let width = img.width;
                          let height = img.height;
                          
                          const MAX_DIMENSION = 800;
                          if (width > height && width > MAX_DIMENSION) {
                            height *= MAX_DIMENSION / width;
                            width = MAX_DIMENSION;
                          } else if (height > MAX_DIMENSION) {
                            width *= MAX_DIMENSION / height;
                            height = MAX_DIMENSION;
                          }
                          
                          canvas.width = width;
                          canvas.height = height;
                          const ctx = canvas.getContext('2d');
                          ctx.drawImage(img, 0, 0, width, height);
                          
                          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                          setNewToolForm({ ...newToolForm, imagePreview: compressedBase64 });
                        };
                        img.src = reader.result;
                      };
                      reader.readAsDataURL(file);
                    }
                  }} />
                </label>
                <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>File Max. 10 MB</div>
              </div>

              {/* Sisi Kanan: Form Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>ID Alat</label>
                    <input required value={newToolForm.id} onChange={(e) => {
                      let val = e.target.value;
                      if (!val.startsWith('TL-')) val = 'TL-' + val.replace(/^TL-?/, '');
                      setNewToolForm({ ...newToolForm, id: val });
                    }} type="text" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} placeholder="TL-001" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Nama Alat</label>
                    <input required value={newToolForm.name} onChange={(e) => setNewToolForm({ ...newToolForm, name: e.target.value })} type="text" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} placeholder="Nama Alat" />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Spesifikasi Alat</label>
                  <input required value={newToolForm.specification} onChange={(e) => setNewToolForm({ ...newToolForm, specification: e.target.value })} type="text" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} placeholder="Spesifikasi / Merek / Ukuran" />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Klasifikasi Alat</label>
                    <select required value={newToolForm.classification} onChange={(e) => setNewToolForm({ ...newToolForm, classification: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
                      <option value="Electrical">Electrical</option>
                      <option value="Plumbing">Plumbing</option>
                      <option value="Civil">Civil</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Satuan</label>
                    <select required value={newToolForm.unit} onChange={(e) => setNewToolForm({ ...newToolForm, unit: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
                      <option value="Pcs">Pcs</option>
                      <option value="Set">Set</option>
                      <option value="Unit">Unit</option>
                      <option value="Roll">Roll</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Jumlah</label>
                    <input required type="number" min="1" value={newToolForm.qty} onChange={(e) => setNewToolForm({ ...newToolForm, qty: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Kegunaan Alat</label>
                  <select required value={newToolForm.usage} onChange={(e) => setNewToolForm({ ...newToolForm, usage: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
                    <option value="Alat Pengencang dan Pembuka">Alat Pengencang dan Pembuka</option>
                    <option value="Alat Penjepit dan Pemotong">Alat Penjepit dan Pemotong</option>
                    <option value="Alat Ukur dan Diagnosis">Alat Ukur dan Diagnosis</option>
                    <option value="Alat Bentur dan Khusus">Alat Bentur dan Khusus</option>
                    <option value="Alat Pembersih dan Pelumasan">Alat Pembersih dan Pelumasan</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary" style={{ padding: '10px 24px', borderRadius: '6px', fontWeight: '500' }}>Batal</button>
                  <button type="submit" className="btn-primary" style={{ padding: '10px 24px', borderRadius: '6px', fontWeight: '500' }}>Tambah Alat</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<PerkakasApp />);
