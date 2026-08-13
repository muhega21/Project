import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  QrCode, FileText, CheckCircle, Clock, AlertCircle, Camera,
  User, MapPin, Wrench, ChevronRight, X, Upload, Check
} from 'lucide-react';

const WO_STATUS_FLOW = ['Draft', 'Pending Approval', 'Approved', 'In Progress', 'Completed', 'Rejected'];

function WorkOrder() {
  const [workOrders, setWorkOrders] = useState([]);
  const [view, setView] = useState('list'); // list | form | detail
  const [selectedWO, setSelectedWO] = useState(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodeScanned, setBarcodeScanned] = useState(false);
  const [assets, setAssets] = useState([]);
  const [form, setForm] = useState({
    complainant: '', location: '', assetId: '', assetName: '',
    description: '', priority: 'Medium', photos: []
  });
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvalTarget, setApprovalTarget] = useState(null);
  const [approverName, setApproverName] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('mx_work_orders');
    if (saved) setWorkOrders(JSON.parse(saved));

    const savedAssets = localStorage.getItem('maintainx_assets');
    if (savedAssets) {
      setAssets(JSON.parse(savedAssets));
    } else {
      setAssets([
        { id: 'EQ-1001', name: 'Pompa Distribusi', location: 'Lantai Produksi' },
        { id: 'EQ-1005', name: 'Boiler Utama', location: 'Ruang Boiler' },
        { id: 'EQ-2001', name: 'Sensor Suhu', location: 'Panel Kontrol' },
      ]);
    }
  }, []);

  const saveWOs = (wos) => {
    setWorkOrders(wos);
    localStorage.setItem('mx_work_orders', JSON.stringify(wos));
    // Also notify dashboard
    window.dispatchEvent(new StorageEvent('storage', { key: 'mx_work_orders' }));
  };

  const handleBarcodeScan = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const found = assets.find(a => a.id.toLowerCase() === barcodeInput.toLowerCase() || a.name.toLowerCase().includes(barcodeInput.toLowerCase()));
    if (found) {
      setForm(prev => ({ ...prev, assetId: found.id, assetName: found.name, location: found.location }));
      setBarcodeScanned(true);
      setView('form');
    } else {
      setForm(prev => ({ ...prev, assetId: barcodeInput, assetName: '', location: '' }));
      setBarcodeScanned(true);
      setView('form');
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Ukuran foto maksimal 5MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        const MAX = 600;
        if (w > h && w > MAX) { h *= MAX / w; w = MAX; }
        else if (h > MAX) { w *= MAX / h; h = MAX; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        setForm(prev => ({ ...prev, photos: [...prev.photos, canvas.toDataURL('image/jpeg', 0.7)] }));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitWO = (e) => {
    e.preventDefault();
    const newWO = {
      id: 'WO-' + Date.now().toString().slice(-6),
      ...form,
      status: 'Pending Approval',
      submittedAt: new Date().toLocaleString('id-ID'),
      approvedBy: null,
      approvedAt: null,
    };
    const updated = [newWO, ...workOrders];
    saveWOs(updated);
    setView('list');
    setForm({ complainant: '', location: '', assetId: '', assetName: '', description: '', priority: 'Medium', photos: [] });
    setBarcodeInput('');
    setBarcodeScanned(false);
    alert(`Work Order ${newWO.id} telah diajukan dan menunggu persetujuan Supervisor.`);
  };

  const handleApprove = (wo) => {
    setApprovalTarget(wo);
    setShowApproveModal(true);
  };

  const confirmApprove = (action) => {
    if (!approvalTarget) return;
    const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
    const updated = workOrders.map(w => w.id === approvalTarget.id ? {
      ...w, status: newStatus,
      approvedBy: approverName || 'Supervisor',
      approvedAt: new Date().toLocaleString('id-ID')
    } : w);
    saveWOs(updated);
    setShowApproveModal(false);
    setApprovalTarget(null);
    setApproverName('');
  };

  const getStatusBadge = (status) => {
    const map = {
      'Draft':            'bg-gray-500/20 text-gray-400',
      'Pending Approval': 'bg-yellow-500/20 text-yellow-400',
      'Approved':         'bg-blue-500/20 text-blue-400',
      'In Progress':      'bg-purple-500/20 text-purple-400',
      'Completed':        'bg-green-500/20 text-green-400',
      'Rejected':         'bg-red-500/20 text-red-400',
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${map[status] || 'bg-gray-500/20 text-gray-400'}`}>{status}</span>;
  };

  const getPriorityBadge = (p) => {
    const map = { 'High': 'text-red-400', 'Medium': 'text-yellow-400', 'Low': 'text-green-400' };
    return <span className={`font-semibold text-xs ${map[p]}`}>{p}</span>;
  };

  // ----- VIEWS -----

  if (view === 'form') {
    return (
      <div className="flex flex-col h-full gap-4 text-text-primary font-sans">
        <div className="flex items-center gap-3 bg-bg-surface p-4 rounded-xl border border-border-color shadow">
          <button onClick={() => { setView('list'); setBarcodeScanned(false); }} className="p-2 hover:bg-btn-secondary rounded-lg transition-colors">
            <ChevronRight size={20} className="rotate-180" />
          </button>
          <div>
            <h2 className="text-xl font-bold">Form Work Order</h2>
            <p className="text-sm text-text-secondary">Isi detail laporan kerusakan / permintaan perbaikan</p>
          </div>
          {form.assetId && (
            <div className="ml-auto flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-1.5">
              <QrCode size={16} className="text-green-400" />
              <span className="text-green-400 text-sm font-semibold">{form.assetId}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmitWO} className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Column */}
            <div className="flex flex-col gap-4">
              <div className="bg-bg-surface border border-border-color rounded-xl p-5 flex flex-col gap-4">
                <h3 className="font-semibold flex items-center gap-2"><User size={16} className="text-[#FF7043]" /> Informasi Pemohon</h3>
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">Nama Pemohon <span className="text-red-500">*</span></label>
                  <input required type="text" value={form.complainant} onChange={e => setForm(p => ({ ...p, complainant: e.target.value }))}
                    placeholder="Nama lengkap pemohon"
                    className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043]" />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">Prioritas</label>
                  <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                    className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043] appearance-none">
                    <option value="Low">Low — Tidak Mendesak</option>
                    <option value="Medium">Medium — Perlu Segera</option>
                    <option value="High">High — Kritis / Emergency</option>
                  </select>
                </div>
              </div>

              <div className="bg-bg-surface border border-border-color rounded-xl p-5 flex flex-col gap-4">
                <h3 className="font-semibold flex items-center gap-2"><MapPin size={16} className="text-[#FF7043]" /> Lokasi & Asset</h3>
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">ID Asset / Equipment</label>
                  <input type="text" value={form.assetId} onChange={e => setForm(p => ({ ...p, assetId: e.target.value }))}
                    placeholder="Contoh: EQ-1001"
                    className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043]" />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">Nama Asset</label>
                  <input type="text" value={form.assetName} onChange={e => setForm(p => ({ ...p, assetName: e.target.value }))}
                    placeholder="Nama mesin / peralatan"
                    className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043]" />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">Lokasi / Area</label>
                  <input type="text" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                    placeholder="Contoh: Lantai Produksi - Area A"
                    className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043]" />
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-4">
              <div className="bg-bg-surface border border-border-color rounded-xl p-5 flex flex-col gap-4">
                <h3 className="font-semibold flex items-center gap-2"><Wrench size={16} className="text-[#FF7043]" /> Detail Masalah</h3>
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">Deskripsi Masalah <span className="text-red-500">*</span></label>
                  <textarea required value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={5} placeholder="Jelaskan masalah secara detail: gejala, kapan terjadi, dampak yang dirasakan..."
                    className="w-full bg-bg-dark border border-border-color rounded-lg p-3 text-sm focus:outline-none focus:border-[#FF7043] resize-none" />
                </div>
              </div>

              <div className="bg-bg-surface border border-border-color rounded-xl p-5 flex flex-col gap-4">
                <h3 className="font-semibold flex items-center gap-2"><Camera size={16} className="text-[#FF7043]" /> Foto Bukti</h3>
                <label className="w-full border-2 border-dashed border-border-color rounded-lg p-6 flex flex-col items-center justify-center text-text-secondary hover:bg-btn-secondary/50 cursor-pointer transition-colors">
                  <Upload size={24} className="mb-2" />
                  <span className="text-sm">Klik untuk upload foto (maks 5MB)</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
                {form.photos.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {form.photos.map((ph, i) => (
                      <div key={i} className="relative">
                        <img src={ph} alt="foto" className="w-20 h-20 object-cover rounded-lg border border-border-color" />
                        <button type="button" onClick={() => setForm(p => ({ ...p, photos: p.photos.filter((_, pi) => pi !== i) }))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <button type="button" onClick={() => { setView('list'); setBarcodeScanned(false); }} className="px-6 py-2.5 text-text-secondary hover:text-text-primary font-medium">Batal</button>
            <button type="submit" className="bg-gradient-to-r from-accent to-accent-secondary text-white px-6 py-2.5 rounded-lg font-medium shadow-lg hover:from-[#FF8A65] hover:to-[#FF5722] flex items-center gap-2">
              <FileText size={18} /> Ajukan Work Order
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ---- LIST VIEW ----
  return (
    <div className="flex flex-col h-full gap-4 text-text-primary font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-bg-surface p-4 rounded-xl border border-border-color shadow gap-3">
        <div>
          <h2 className="text-xl font-bold">Work Order</h2>
          <p className="text-sm text-text-secondary mt-0.5">Kelola Work Order dari laporan kerusakan / keluhan pengguna</p>
        </div>
        <button
          onClick={() => setView('scan')}
          className="bg-gradient-to-r from-accent to-accent-secondary hover:from-[#FF8A65] hover:to-[#FF5722] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg transition-all active:scale-95"
        >
          <QrCode size={18} /> Buat Work Order
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[
          { label: 'Total WO', value: workOrders.length, color: 'text-text-primary' },
          { label: 'Pending', value: workOrders.filter(w => w.status === 'Pending Approval').length, color: 'text-yellow-400' },
          { label: 'Approved', value: workOrders.filter(w => w.status === 'Approved').length, color: 'text-blue-400' },
          { label: 'In Progress', value: workOrders.filter(w => w.status === 'In Progress').length, color: 'text-purple-400' },
          { label: 'Completed', value: workOrders.filter(w => w.status === 'Completed').length, color: 'text-green-400' },
          { label: 'Rejected', value: workOrders.filter(w => w.status === 'Rejected').length, color: 'text-red-400' },
        ].map((s, i) => (
          <div key={i} className="bg-bg-surface border border-border-color rounded-xl p-3 text-center">
            <div className="text-text-secondary text-xs mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-bg-surface rounded-xl border border-border-color shadow overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-bg-dark text-text-secondary border-b border-border-color">
              <tr>
                <th className="px-4 py-3 font-medium">ID WO</th>
                <th className="px-4 py-3 font-medium">Pemohon</th>
                <th className="px-4 py-3 font-medium">Asset</th>
                <th className="px-4 py-3 font-medium">Lokasi</th>
                <th className="px-4 py-3 font-medium">Deskripsi</th>
                <th className="px-4 py-3 font-medium">Prioritas</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Diajukan</th>
                <th className="px-4 py-3 font-medium">Disetujui Oleh</th>
                <th className="px-4 py-3 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {workOrders.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-text-secondary">
                    <QrCode size={32} className="mx-auto mb-3 opacity-30" />
                    Belum ada Work Order. Klik "Buat Work Order" untuk mulai.
                  </td>
                </tr>
              ) : workOrders.map(wo => (
                <tr key={wo.id} className="hover:bg-btn-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-blue-400 font-semibold">{wo.id}</td>
                  <td className="px-4 py-3 font-medium">{wo.complainant}</td>
                  <td className="px-4 py-3 text-text-secondary">{wo.assetName || wo.assetId || '-'}</td>
                  <td className="px-4 py-3 text-text-secondary">{wo.location || '-'}</td>
                  <td className="px-4 py-3 text-text-secondary max-w-[160px] truncate" title={wo.description}>{wo.description}</td>
                  <td className="px-4 py-3">{getPriorityBadge(wo.priority)}</td>
                  <td className="px-4 py-3">{getStatusBadge(wo.status)}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{wo.submittedAt}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{wo.approvedBy ? `${wo.approvedBy}` : '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-center">
                      {wo.status === 'Pending Approval' && (
                        <button onClick={() => handleApprove(wo)}
                          className="px-2 py-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 rounded text-xs font-semibold transition-colors">
                          Review
                        </button>
                      )}
                      {wo.status === 'Approved' && (
                        <button onClick={() => {
                          const updated = workOrders.map(w => w.id === wo.id ? { ...w, status: 'In Progress' } : w);
                          saveWOs(updated);
                        }} className="px-2 py-1 bg-purple-500/20 text-purple-400 hover:bg-purple-500/40 rounded text-xs font-semibold transition-colors">
                          Mulai
                        </button>
                      )}
                      {wo.status === 'In Progress' && (
                        <button onClick={() => {
                          const updated = workOrders.map(w => w.id === wo.id ? { ...w, status: 'Completed' } : w);
                          saveWOs(updated);
                        }} className="px-2 py-1 bg-green-500/20 text-green-400 hover:bg-green-500/40 rounded text-xs font-semibold transition-colors">
                          Selesai
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && approvalTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-bg-surface border border-border-color rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-lg font-bold mb-1">Review Work Order</h3>
            <p className="text-text-secondary text-sm mb-4">{approvalTarget.id} — {approvalTarget.description}</p>
            <div className="bg-bg-dark rounded-lg p-3 mb-4 text-sm space-y-1">
              <div><span className="text-text-secondary">Pemohon:</span> <span className="font-medium">{approvalTarget.complainant}</span></div>
              <div><span className="text-text-secondary">Asset:</span> <span className="font-medium">{approvalTarget.assetName || approvalTarget.assetId}</span></div>
              <div><span className="text-text-secondary">Lokasi:</span> <span className="font-medium">{approvalTarget.location}</span></div>
              <div><span className="text-text-secondary">Prioritas:</span> {getPriorityBadge(approvalTarget.priority)}</div>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-text-secondary mb-1.5">Nama Supervisor / Approver</label>
              <input type="text" value={approverName} onChange={e => setApproverName(e.target.value)}
                placeholder="Nama supervisor yang menyetujui..."
                className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043]" />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowApproveModal(false); setApprovalTarget(null); }} className="px-4 py-2 text-text-secondary hover:text-text-primary">Batal</button>
              <button onClick={() => confirmApprove('reject')} className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-lg font-medium transition-colors">Tolak</button>
              <button onClick={() => confirmApprove('approve')} className="px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded-lg font-medium transition-colors flex items-center gap-2">
                <Check size={16} /> Setujui
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Scan / Barcode view as separate component rendered conditionally
function WorkOrderApp() {
  const [appView, setAppView] = useState('list'); // list | scan
  const [barcodeInput, setBarcodeInput] = useState('');
  const [assets, setAssets] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [form, setForm] = useState({
    complainant: '', location: '', assetId: '', assetName: '',
    description: '', priority: 'Medium', photos: []
  });
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approvalTarget, setApprovalTarget] = useState(null);
  const [approverName, setApproverName] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('mx_work_orders');
    if (saved) setWorkOrders(JSON.parse(saved));
    const savedAssets = localStorage.getItem('maintainx_assets');
    if (savedAssets) setAssets(JSON.parse(savedAssets));
    else setAssets([
      { id: 'EQ-1001', name: 'Pompa Distribusi', location: 'Lantai Produksi' },
      { id: 'EQ-1005', name: 'Boiler Utama', location: 'Ruang Boiler' },
      { id: 'EQ-2001', name: 'Sensor Suhu', location: 'Panel Kontrol' },
    ]);
  }, []);

  const saveWOs = (wos) => {
    setWorkOrders(wos);
    localStorage.setItem('mx_work_orders', JSON.stringify(wos));
  };

  const handleBarcodeScan = (e) => {
    e.preventDefault();
    const found = assets.find(a => a.id.toLowerCase() === barcodeInput.toLowerCase() || a.name.toLowerCase().includes(barcodeInput.toLowerCase()));
    if (found) {
      setForm(p => ({ ...p, assetId: found.id, assetName: found.name, location: found.location }));
    } else {
      setForm(p => ({ ...p, assetId: barcodeInput }));
    }
    setAppView('form');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        const MAX = 600;
        if (w > h && w > MAX) { h *= MAX / w; w = MAX; }
        else if (h > MAX) { w *= MAX / h; h = MAX; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        setForm(p => ({ ...p, photos: [...p.photos, canvas.toDataURL('image/jpeg', 0.7)] }));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitWO = (e) => {
    e.preventDefault();
    const newWO = {
      id: 'WO-' + Date.now().toString().slice(-6),
      ...form,
      status: 'Pending Approval',
      submittedAt: new Date().toLocaleString('id-ID'),
      approvedBy: null, approvedAt: null,
    };
    const updated = [newWO, ...workOrders];
    saveWOs(updated);
    setAppView('list');
    setForm({ complainant: '', location: '', assetId: '', assetName: '', description: '', priority: 'Medium', photos: [] });
    setBarcodeInput('');
    alert(`Work Order ${newWO.id} telah diajukan dan menunggu persetujuan Supervisor.`);
  };

  const confirmApprove = (action) => {
    const newStatus = action === 'approve' ? 'Approved' : 'Rejected';
    const updated = workOrders.map(w => w.id === approvalTarget.id ? {
      ...w, status: newStatus,
      approvedBy: approverName || 'Supervisor',
      approvedAt: new Date().toLocaleString('id-ID')
    } : w);
    saveWOs(updated);
    setShowApproveModal(false);
    setApprovalTarget(null);
    setApproverName('');
  };

  const getStatusBadge = (status) => {
    const map = {
      'Pending Approval': 'bg-yellow-500/20 text-yellow-400',
      'Approved': 'bg-blue-500/20 text-blue-400',
      'In Progress': 'bg-purple-500/20 text-purple-400',
      'Completed': 'bg-green-500/20 text-green-400',
      'Rejected': 'bg-red-500/20 text-red-400',
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${map[status] || 'bg-gray-500/20 text-gray-400'}`}>{status}</span>;
  };

  const getPriorityBadge = (p) => {
    const map = { 'High': 'text-red-400', 'Medium': 'text-yellow-400', 'Low': 'text-green-400' };
    return <span className={`font-semibold text-xs ${map[p]}`}>{p}</span>;
  };

  // SCAN VIEW
  if (appView === 'scan') {
    return (
      <div className="flex flex-col h-full gap-4 text-text-primary font-sans items-center justify-center">
        <div className="bg-bg-surface border border-border-color rounded-2xl p-8 w-full max-w-md shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-[#FF7043]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <QrCode size={32} className="text-[#FF7043]" />
            </div>
            <h2 className="text-xl font-bold">Scan Barcode Asset</h2>
            <p className="text-text-secondary text-sm mt-1">Scan barcode atau ketik ID / nama asset yang bermasalah</p>
          </div>

          <form onSubmit={handleBarcodeScan} className="flex flex-col gap-4">
            <div className="relative">
              <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input
                type="text" value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)}
                placeholder="Scan / ketik barcode atau ID Asset (EQ-1001)..."
                autoFocus
                className="w-full bg-bg-dark border-2 border-[#FF7043]/50 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-[#FF7043] transition-colors"
              />
            </div>
            <div className="text-xs text-text-secondary text-center">
              Atau pilih dari daftar:
            </div>
            <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
              {assets.map(a => (
                <button key={a.id} type="button" onClick={() => { setBarcodeInput(a.id); }}
                  className={`text-left px-3 py-2 rounded-lg text-sm transition-colors border ${barcodeInput === a.id ? 'border-[#FF7043] bg-[#FF7043]/10 text-[#FF7043]' : 'border-border-color hover:bg-btn-secondary text-text-primary'}`}>
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-text-secondary">{a.id} — {a.location}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-2">
              <button type="button" onClick={() => setAppView('list')} className="flex-1 px-4 py-2.5 border border-border-color rounded-lg text-text-secondary hover:text-text-primary transition-colors">Batal</button>
              <button type="submit" disabled={!barcodeInput.trim()}
                className="flex-1 bg-gradient-to-r from-accent to-accent-secondary text-white py-2.5 rounded-lg font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <ChevronRight size={18} /> Lanjut ke Form
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // FORM VIEW
  if (appView === 'form') {
    return (
      <div className="flex flex-col h-full gap-4 text-text-primary font-sans">
        <div className="flex items-center gap-3 bg-bg-surface p-4 rounded-xl border border-border-color shadow">
          <button onClick={() => setAppView('scan')} className="p-2 hover:bg-btn-secondary rounded-lg transition-colors">
            <ChevronRight size={20} className="rotate-180" />
          </button>
          <div>
            <h2 className="text-xl font-bold">Form Work Order</h2>
            <p className="text-sm text-text-secondary">Isi detail laporan kerusakan / permintaan perbaikan</p>
          </div>
          {form.assetId && (
            <div className="ml-auto flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-1.5">
              <QrCode size={16} className="text-green-400" />
              <span className="text-green-400 text-sm font-semibold">{form.assetId}</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmitWO} className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col gap-4">
              <div className="bg-bg-surface border border-border-color rounded-xl p-5 flex flex-col gap-4">
                <h3 className="font-semibold flex items-center gap-2"><User size={16} className="text-[#FF7043]" /> Informasi Pemohon</h3>
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">Nama Pemohon <span className="text-red-500">*</span></label>
                  <input required type="text" value={form.complainant} onChange={e => setForm(p => ({ ...p, complainant: e.target.value }))}
                    placeholder="Nama lengkap pemohon"
                    className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043]" />
                </div>
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">Prioritas</label>
                  <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                    className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043] appearance-none">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High — Kritis</option>
                  </select>
                </div>
              </div>

              <div className="bg-bg-surface border border-border-color rounded-xl p-5 flex flex-col gap-4">
                <h3 className="font-semibold flex items-center gap-2"><MapPin size={16} className="text-[#FF7043]" /> Lokasi & Asset</h3>
                <div><label className="block text-sm text-text-secondary mb-1.5">ID Asset</label>
                  <input type="text" value={form.assetId} onChange={e => setForm(p => ({ ...p, assetId: e.target.value }))} className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043]" />
                </div>
                <div><label className="block text-sm text-text-secondary mb-1.5">Nama Asset</label>
                  <input type="text" value={form.assetName} onChange={e => setForm(p => ({ ...p, assetName: e.target.value }))} placeholder="Nama mesin / peralatan" className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043]" />
                </div>
                <div><label className="block text-sm text-text-secondary mb-1.5">Lokasi / Area</label>
                  <input type="text" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="Contoh: Lantai Produksi" className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043]" />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-bg-surface border border-border-color rounded-xl p-5 flex flex-col gap-4">
                <h3 className="font-semibold flex items-center gap-2"><Wrench size={16} className="text-[#FF7043]" /> Detail Masalah</h3>
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">Deskripsi Masalah <span className="text-red-500">*</span></label>
                  <textarea required value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={6} placeholder="Jelaskan masalah secara detail..."
                    className="w-full bg-bg-dark border border-border-color rounded-lg p-3 text-sm focus:outline-none focus:border-[#FF7043] resize-none" />
                </div>
              </div>

              <div className="bg-bg-surface border border-border-color rounded-xl p-5 flex flex-col gap-4">
                <h3 className="font-semibold flex items-center gap-2"><Camera size={16} className="text-[#FF7043]" /> Foto Bukti</h3>
                <label className="w-full border-2 border-dashed border-border-color rounded-lg p-5 flex flex-col items-center justify-center text-text-secondary hover:bg-btn-secondary/50 cursor-pointer transition-colors">
                  <Upload size={22} className="mb-2" />
                  <span className="text-sm">Upload foto (maks 5MB)</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
                {form.photos.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {form.photos.map((ph, i) => (
                      <div key={i} className="relative">
                        <img src={ph} alt="foto" className="w-20 h-20 object-cover rounded-lg border border-border-color" />
                        <button type="button" onClick={() => setForm(p => ({ ...p, photos: p.photos.filter((_, pi) => pi !== i) }))}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <button type="button" onClick={() => setAppView('list')} className="px-6 py-2.5 text-text-secondary hover:text-text-primary font-medium">Batal</button>
            <button type="submit" className="bg-gradient-to-r from-accent to-accent-secondary text-white px-6 py-2.5 rounded-lg font-medium shadow-lg hover:from-[#FF8A65] hover:to-[#FF5722] flex items-center gap-2">
              <FileText size={18} /> Ajukan Work Order
            </button>
          </div>
        </form>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="flex flex-col h-full gap-4 text-text-primary font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-bg-surface p-4 rounded-xl border border-border-color shadow gap-3">
        <div>
          <h2 className="text-xl font-bold">Work Order</h2>
          <p className="text-sm text-text-secondary mt-0.5">Kelola laporan kerusakan / keluhan pengguna</p>
        </div>
        <button onClick={() => setAppView('scan')}
          className="bg-gradient-to-r from-accent to-accent-secondary hover:from-[#FF8A65] hover:to-[#FF5722] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg transition-all active:scale-95">
          <QrCode size={18} /> Buat Work Order
        </button>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: workOrders.length, color: 'text-text-primary' },
          { label: 'Pending', value: workOrders.filter(w => w.status === 'Pending Approval').length, color: 'text-yellow-400' },
          { label: 'Approved', value: workOrders.filter(w => w.status === 'Approved').length, color: 'text-blue-400' },
          { label: 'In Progress', value: workOrders.filter(w => w.status === 'In Progress').length, color: 'text-purple-400' },
          { label: 'Completed', value: workOrders.filter(w => w.status === 'Completed').length, color: 'text-green-400' },
          { label: 'Rejected', value: workOrders.filter(w => w.status === 'Rejected').length, color: 'text-red-400' },
        ].map((s, i) => (
          <div key={i} className="bg-bg-surface border border-border-color rounded-xl p-3 text-center">
            <div className="text-text-secondary text-xs mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-bg-surface rounded-xl border border-border-color shadow overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-bg-dark text-text-secondary border-b border-border-color">
              <tr>
                <th className="px-4 py-3 font-medium">ID WO</th>
                <th className="px-4 py-3 font-medium">Pemohon</th>
                <th className="px-4 py-3 font-medium">Asset</th>
                <th className="px-4 py-3 font-medium">Lokasi</th>
                <th className="px-4 py-3 font-medium">Deskripsi</th>
                <th className="px-4 py-3 font-medium">Prioritas</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Diajukan</th>
                <th className="px-4 py-3 font-medium">Supervisor</th>
                <th className="px-4 py-3 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {workOrders.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-text-secondary">
                    <QrCode size={32} className="mx-auto mb-3 opacity-30" />
                    Belum ada Work Order. Klik "Buat Work Order" untuk mulai.
                  </td>
                </tr>
              ) : workOrders.map(wo => (
                <tr key={wo.id} className="hover:bg-btn-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-blue-400 font-semibold">{wo.id}</td>
                  <td className="px-4 py-3 font-medium">{wo.complainant}</td>
                  <td className="px-4 py-3 text-text-secondary">{wo.assetName || wo.assetId || '-'}</td>
                  <td className="px-4 py-3 text-text-secondary">{wo.location || '-'}</td>
                  <td className="px-4 py-3 text-text-secondary max-w-[150px] truncate" title={wo.description}>{wo.description}</td>
                  <td className="px-4 py-3">{getPriorityBadge(wo.priority)}</td>
                  <td className="px-4 py-3">{getStatusBadge(wo.status)}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{wo.submittedAt}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs">{wo.approvedBy || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-center">
                      {wo.status === 'Pending Approval' && (
                        <button onClick={() => { setApprovalTarget(wo); setShowApproveModal(true); }}
                          className="px-2 py-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/40 rounded text-xs font-semibold">Review</button>
                      )}
                      {wo.status === 'Approved' && (
                        <button onClick={() => saveWOs(workOrders.map(w => w.id === wo.id ? { ...w, status: 'In Progress' } : w))}
                          className="px-2 py-1 bg-purple-500/20 text-purple-400 hover:bg-purple-500/40 rounded text-xs font-semibold">Mulai</button>
                      )}
                      {wo.status === 'In Progress' && (
                        <button onClick={() => saveWOs(workOrders.map(w => w.id === wo.id ? { ...w, status: 'Completed' } : w))}
                          className="px-2 py-1 bg-green-500/20 text-green-400 hover:bg-green-500/40 rounded text-xs font-semibold">Selesai</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showApproveModal && approvalTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-bg-surface border border-border-color rounded-2xl w-full max-w-md shadow-2xl p-6">
            <h3 className="text-lg font-bold mb-1">Review Work Order</h3>
            <p className="text-text-secondary text-sm mb-4">{approvalTarget.id} — {approvalTarget.description}</p>
            <div className="bg-bg-dark rounded-lg p-3 mb-4 text-sm space-y-1.5">
              <div><span className="text-text-secondary">Pemohon:</span> <span className="font-medium">{approvalTarget.complainant}</span></div>
              <div><span className="text-text-secondary">Asset:</span> <span className="font-medium">{approvalTarget.assetName || approvalTarget.assetId}</span></div>
              <div><span className="text-text-secondary">Lokasi:</span> <span className="font-medium">{approvalTarget.location}</span></div>
              <div><span className="text-text-secondary">Prioritas:</span> {getPriorityBadge(approvalTarget.priority)}</div>
              {approvalTarget.photos?.length > 0 && (
                <div className="flex gap-2 pt-1">{approvalTarget.photos.map((p, i) => <img key={i} src={p} alt="foto" className="w-16 h-16 object-cover rounded" />)}</div>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm text-text-secondary mb-1.5">Nama Supervisor</label>
              <input type="text" value={approverName} onChange={e => setApproverName(e.target.value)}
                placeholder="Nama supervisor..." className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043]" />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowApproveModal(false); setApprovalTarget(null); }} className="px-4 py-2 text-text-secondary hover:text-text-primary">Batal</button>
              <button onClick={() => confirmApprove('reject')} className="px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-lg font-medium">Tolak</button>
              <button onClick={() => confirmApprove('approve')} className="px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded-lg font-medium flex items-center gap-2">
                <Check size={16} /> Setujui
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<WorkOrderApp />);
