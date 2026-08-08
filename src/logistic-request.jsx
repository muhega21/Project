import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

const LogisticRequestApp = () => {
  const [requests, setRequests] = useState([]);
  const [formData, setFormData] = useState({
    nik: '',
    type: 'Alat / Perkakas',
    item: '',
    quantity: 1,
    purpose: '',
    duration: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('maintainx_logistic_requests');
    if (saved) setRequests(JSON.parse(saved));
    
    // Listen for cross-tab updates (simulating real-time)
    window.addEventListener('storage', (e) => {
      if (e.key === 'maintainx_logistic_requests') {
        setRequests(JSON.parse(e.newValue || '[]'));
      }
    });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newRequest = {
      ...formData,
      id: 'REQ-' + Date.now().toString().slice(-6),
      date: new Date().toLocaleString(),
      status: 'Pending Approval' // Initial status
    };
    
    const updatedRequests = [newRequest, ...requests];
    setRequests(updatedRequests);
    localStorage.setItem('maintainx_logistic_requests', JSON.stringify(updatedRequests));
    
    // Dispatch local event for other components if on same page
    window.dispatchEvent(new CustomEvent('newLogisticRequest', { detail: newRequest }));
    
    alert('Pengajuan berhasil dikirim!');
    
    // Reset form
    setFormData({
      nik: '',
      type: 'Alat / Perkakas',
      item: '',
      quantity: 1,
      purpose: '',
      duration: ''
    });
  };

  return (
    <div style={{ display: 'grid', gap: '32px', gridTemplateColumns: '1fr 1fr' }}>
      {/* Form Section */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Form Pengajuan Logistik</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Nama Pemohon / NIK</label>
            <input required name="nik" value={formData.nik} onChange={handleChange} type="text" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} placeholder="Masukkan Nama atau NIK" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Tipe Pengajuan</label>
            <select required name="type" value={formData.type} onChange={handleChange} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }}>
              <option value="Alat / Perkakas">Alat / Perkakas</option>
              <option value="Barang / Sparepart">Barang / Sparepart</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Item & Jumlah</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input required name="item" value={formData.item} onChange={handleChange} type="text" style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} placeholder="Nama Item" />
              <input required name="quantity" value={formData.quantity} onChange={handleChange} type="number" min="1" style={{ width: '100px', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Keperluan / Lokasi Kerja / No. WO</label>
            <textarea required name="purpose" value={formData.purpose} onChange={handleChange} rows="3" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} placeholder="Detail keperluan..." />
          </div>
          {formData.type === 'Alat / Perkakas' && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Estimasi Durasi Pemakaian</label>
              <input required name="duration" value={formData.duration} onChange={handleChange} type="text" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-primary)' }} placeholder="Misal: 2 Jam, 1 Hari" />
            </div>
          )}
          <button type="submit" className="btn-primary" style={{ padding: '12px', borderRadius: '6px', fontWeight: '600', marginTop: '8px' }}>Ajukan Permintaan</button>
        </form>
      </div>

      {/* Status Tracking Section */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '20px' }}>Status Pengajuan Saya</h2>
        {requests.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>Belum ada riwayat pengajuan.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '500px', overflowY: 'auto' }}>
            {requests.map(req => (
              <div key={req.id} style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600', color: 'var(--accent-primary)' }}>{req.id}</span>
                  <span style={{ 
                    fontSize: '0.85rem', padding: '4px 8px', borderRadius: '12px', fontWeight: '500',
                    background: req.status.includes('Pending') ? '#f59e0b20' : 
                               req.status.includes('In Use') ? '#3b82f620' :
                               req.status.includes('Returned') || req.status.includes('Approved') ? '#10b98120' : '#ef444420',
                    color: req.status.includes('Pending') ? '#f59e0b' : 
                           req.status.includes('In Use') ? '#3b82f6' :
                           req.status.includes('Returned') || req.status.includes('Approved') ? '#10b981' : '#ef4444'
                  }}>{req.status}</span>
                </div>
                <div style={{ fontWeight: '500', marginBottom: '4px' }}>{req.item} (x{req.quantity})</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Tipe: {req.type}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Oleh: {req.nik}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>{req.date}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<LogisticRequestApp />);
