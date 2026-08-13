import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

const DataAlatApp = () => {
  const [tools, setTools] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const savedTools = localStorage.getItem('maintainx_tools');
    if (savedTools) {
      setTools(JSON.parse(savedTools));
    } else {
      // Default initial tools if empty
      const initialTools = [
        { id: 'TL-001', name: 'Kunci Pas Set 8-24mm', category: 'Perkakas Tangan', status: 'Available', img: '🔧' },
        { id: 'TL-002', name: 'Bor Listrik Bosch', category: 'Perkakas Mesin', status: 'In Use', img: '🔩' },
        { id: 'TL-003', name: 'Impact Wrench Air', category: 'Alat Pneumatik', status: 'Available', img: '🔫' },
        { id: 'TL-004', name: 'Jangka Sorong Digital', category: 'Perkakas Pengukur', status: 'Calibration Due', img: '📏' }
      ];
      setTools(initialTools);
      localStorage.setItem('maintainx_tools', JSON.stringify(initialTools));
    }
  }, []);

  const filteredTools = tools.filter(tool => 
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    tool.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusChange = (toolId, newStatus) => {
    const updatedTools = tools.map(t => t.id === toolId ? { ...t, status: newStatus } : t);
    setTools(updatedTools);
    localStorage.setItem('maintainx_tools', JSON.stringify(updatedTools));
  };

  const handleDeleteTool = (toolId) => {
    if (confirm('Apakah Anda yakin ingin menghapus alat ini?')) {
      const updatedTools = tools.filter(t => t.id !== toolId);
      setTools(updatedTools);
      localStorage.setItem('maintainx_tools', JSON.stringify(updatedTools));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>Master Data Alat (Perkakas)</h2>
        <a href="/perkakas.html" className="btn-secondary" style={{ padding: '8px 16px', borderRadius: '6px' }}>
          Kembali ke Gudang Perkakas
        </a>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="Cari alat..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)', width: '300px' }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Gambar Alat</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>ID Alat</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Nama Alat</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Spesifikasi Alat</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Klasifikasi Alat</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Kegunaan Alat</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Satuan</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>Status Alat</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', textAlign: 'center' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredTools.length > 0 ? filteredTools.map(tool => (
                <tr key={tool.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px', fontSize: '1.5rem', textAlign: 'center' }}>
                    {tool.img && tool.img.length > 10 ? <img src={tool.img} alt="Alat" style={{width:'32px', height:'32px', objectFit:'cover', borderRadius:'4px'}}/> : (tool.img || '🔧')}
                  </td>
                  <td style={{ padding: '16px', fontWeight: '500' }}>{tool.id}</td>
                  <td style={{ padding: '16px' }}>{tool.name}</td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{tool.specification || '-'}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '0.85rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)' }}>
                      {tool.category || '-'}
                    </span>
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{tool.usage || '-'}</td>
                  <td style={{ padding: '16px' }}>{tool.unit || '-'}</td>
                  <td style={{ padding: '16px' }}>
                    <select 
                      value={tool.status === 'Baik' || tool.status === 'Rusak' ? tool.status : 'Baik'} 
                      onChange={(e) => handleStatusChange(tool.id, e.target.value)}
                      style={{ 
                        padding: '6px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '500', border: '1px solid var(--border-color)',
                        background: (tool.status === 'Baik' || tool.status === 'Available') ? '#10b98120' : '#ef444420',
                        color: (tool.status === 'Baik' || tool.status === 'Available') ? '#10b981' : '#ef4444',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Baik" style={{ color: 'var(--text-primary)', background: 'var(--bg-color)' }}>Baik</option>
                      <option value="Rusak" style={{ color: 'var(--text-primary)', background: 'var(--bg-color)' }}>Rusak</option>
                    </select>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleDeleteTool(tool.id)}
                      style={{ 
                        background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', 
                        borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '500'
                      }}
                    >
                      Hapus Alat
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="9" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    Tidak ada data alat ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<DataAlatApp />);
