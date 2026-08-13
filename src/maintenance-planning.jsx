import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Plus, X, Search, ChevronDown, ClipboardList, Trash2, Edit2, Check
} from 'lucide-react';

const FREQUENCY_OPTIONS = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Semester', 'Annual', 'Trienial', 'Quinquenial'];

const INITIAL_PLANS = [
  { id: 'MP-001', areaId: 'AREA-01', areaName: 'Lantai Produksi', assetId: 'EQ-1001', assetName: 'Pompa Distribusi', taskDescription: 'Pemeriksaan pelumasan dan kebocoran', frequency: 'Monthly', startDate: '2026-08-01', nextDate: '2026-09-01', pic: 'Budi Santoso', status: 'Active' },
  { id: 'MP-002', areaId: 'AREA-02', areaName: 'Ruang Boiler', assetId: 'EQ-1005', assetName: 'Boiler Utama', taskDescription: 'Pengecekan tekanan dan overhaul tahunan', frequency: 'Annual', startDate: '2026-01-15', nextDate: '2027-01-15', pic: 'Agus Setiawan', status: 'Active' },
  { id: 'MP-003', areaId: 'AREA-01', areaName: 'Lantai Produksi', assetId: 'EQ-1010', assetName: 'Filter RO', taskDescription: 'Penggantian membran filter', frequency: 'Weekly', startDate: '2026-08-04', nextDate: '2026-08-11', pic: 'Joko Widodo', status: 'Active' },
];

function computeNextDate(startDate, frequency) {
  const d = new Date(startDate);
  if (isNaN(d)) return startDate;
  switch (frequency) {
    case 'Daily':       d.setDate(d.getDate() + 1); break;
    case 'Weekly':      d.setDate(d.getDate() + 7); break;
    case 'Monthly':     d.setMonth(d.getMonth() + 1); break;
    case 'Quarterly':   d.setMonth(d.getMonth() + 3); break;
    case 'Semester':    d.setMonth(d.getMonth() + 6); break;
    case 'Annual':      d.setFullYear(d.getFullYear() + 1); break;
    case 'Trienial':    d.setFullYear(d.getFullYear() + 3); break;
    case 'Quinquenial': d.setFullYear(d.getFullYear() + 5); break;
    default: break;
  }
  return d.toISOString().split('T')[0];
}

function MaintenancePlanning() {
  const [plans, setPlans] = useState(() => {
    const saved = localStorage.getItem('mx_maintenance_plans');
    return saved ? JSON.parse(saved) : INITIAL_PLANS;
  });
  const [assets, setAssets] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [assetSearch, setAssetSearch] = useState('');
  const [showAssetDropdown, setShowAssetDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({
    areaId: '', areaName: '', assetId: '', assetName: '',
    taskDescription: '', frequency: 'Monthly', startDate: new Date().toISOString().split('T')[0], pic: ''
  });

  useEffect(() => {
    localStorage.setItem('mx_maintenance_plans', JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    // Load assets from Asset Register
    const savedAssets = localStorage.getItem('maintainx_assets');
    if (savedAssets) {
      setAssets(JSON.parse(savedAssets));
    } else {
      // fallback demo assets
      setAssets([
        { id: 'EQ-1001', name: 'Pompa Distribusi', location: 'Lantai Produksi', locationId: 'AREA-01' },
        { id: 'EQ-1005', name: 'Boiler Utama', location: 'Ruang Boiler', locationId: 'AREA-02' },
        { id: 'EQ-1010', name: 'Filter RO', location: 'Lantai Produksi', locationId: 'AREA-01' },
        { id: 'EQ-2001', name: 'Sensor Suhu', location: 'Panel Kontrol', locationId: 'AREA-03' },
        { id: 'EQ-2005', name: 'Kompresor Udara', location: 'Ruang Utilitas', locationId: 'AREA-04' },
      ]);
    }
    const savedWorkers = localStorage.getItem('mx_workers');
    if (savedWorkers) {
      setWorkers(JSON.parse(savedWorkers).filter(w => w.profilAkun === 'Teknisi' || w.profilAkun === 'Administrator'));
    }
  }, []);

  const filteredAssets = assetSearch
    ? assets.filter(a => a.name.toLowerCase().includes(assetSearch.toLowerCase()) || a.id.toLowerCase().includes(assetSearch.toLowerCase()))
    : assets;

  const filteredPlans = plans.filter(p =>
    p.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.taskDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.areaName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAsset = (asset) => {
    setForm(prev => ({
      ...prev,
      assetId: asset.id,
      assetName: asset.name,
      areaId: asset.locationId || '',
      areaName: asset.location || ''
    }));
    setAssetSearch(asset.name);
    setShowAssetDropdown(false);
  };

  const resetForm = () => {
    setForm({ areaId: '', areaName: '', assetId: '', assetName: '', taskDescription: '', frequency: 'Monthly', startDate: new Date().toISOString().split('T')[0], pic: '' });
    setAssetSearch('');
    setEditId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (plan) => {
    setForm({
      areaId: plan.areaId, areaName: plan.areaName,
      assetId: plan.assetId, assetName: plan.assetName,
      taskDescription: plan.taskDescription, frequency: plan.frequency,
      startDate: plan.startDate, pic: plan.pic || ''
    });
    setAssetSearch(plan.assetName);
    setEditId(plan.id);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    if (confirm('Hapus rencana maintenance ini?')) {
      setPlans(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.assetId) return alert('Pilih asset terlebih dahulu!');
    if (!form.taskDescription) return alert('Task Description wajib diisi!');

    const nextDate = computeNextDate(form.startDate, form.frequency);

    if (editId) {
      setPlans(prev => prev.map(p => p.id === editId ? { ...p, ...form, nextDate } : p));
    } else {
      const newPlan = {
        id: 'MP-' + Date.now().toString().slice(-5),
        ...form,
        nextDate,
        status: 'Active'
      };
      setPlans(prev => [newPlan, ...prev]);
    }
    setShowModal(false);
    resetForm();
  };

  const getFrequencyBadge = (freq) => {
    const colors = {
      'Daily':       'bg-red-500/20 text-red-400',
      'Weekly':      'bg-orange-500/20 text-orange-400',
      'Monthly':     'bg-blue-500/20 text-blue-400',
      'Quarterly':   'bg-purple-500/20 text-purple-400',
      'Semester':    'bg-indigo-500/20 text-indigo-400',
      'Annual':      'bg-green-500/20 text-green-400',
      'Trienial':    'bg-teal-500/20 text-teal-400',
      'Quinquenial': 'bg-cyan-500/20 text-cyan-400',
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[freq] || 'bg-gray-500/20 text-gray-400'}`}>{freq}</span>;
  };

  const isOverdue = (nextDate) => nextDate && new Date(nextDate) < new Date();

  return (
    <div className="flex flex-col h-full gap-4 text-text-primary font-sans">

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-bg-surface p-4 rounded-xl border border-border-color shadow gap-3">
        <div>
          <h2 className="text-xl font-bold">Perencanaan Maintenance</h2>
          <p className="text-sm text-text-secondary mt-0.5">Kelola rencana pemeliharaan rutin untuk setiap Asset & Equipment</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
            <input
              type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari aset atau task..."
              className="w-full bg-bg-dark border border-border-color rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-[#FF7043]"
            />
          </div>
          <button
            onClick={handleOpenAdd}
            className="bg-gradient-to-r from-accent to-accent-secondary hover:from-[#FF8A65] hover:to-[#FF5722] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus size={18} /> Tambah Task Description
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Rencana', value: plans.length, color: 'text-blue-400' },
          { label: 'Aktif', value: plans.filter(p => p.status === 'Active').length, color: 'text-green-400' },
          { label: 'Overdue', value: plans.filter(p => isOverdue(p.nextDate)).length, color: 'text-red-400' },
          { label: 'Frekuensi Harian', value: plans.filter(p => p.frequency === 'Daily').length, color: 'text-orange-400' },
        ].map((card, i) => (
          <div key={i} className="bg-bg-surface border border-border-color rounded-xl p-4">
            <div className="text-text-secondary text-sm">{card.label}</div>
            <div className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-bg-surface rounded-xl border border-border-color shadow overflow-hidden flex-1 flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 border-b border-border-color">
          <span className="font-semibold flex items-center gap-2"><ClipboardList size={18} className="text-[#FF7043]" /> Daftar Task Description Maintenance</span>
          <span className="text-sm text-text-secondary">{filteredPlans.length} rencana</span>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-bg-dark text-text-secondary border-b border-border-color">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">ID Lokasi</th>
                <th className="px-4 py-3 font-medium">Lokasi / Area</th>
                <th className="px-4 py-3 font-medium">ID Asset</th>
                <th className="px-4 py-3 font-medium">Nama Asset</th>
                <th className="px-4 py-3 font-medium">Task Description</th>
                <th className="px-4 py-3 font-medium">Frequency</th>
                <th className="px-4 py-3 font-medium">Start Date</th>
                <th className="px-4 py-3 font-medium">PIC</th>
                <th className="px-4 py-3 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-12 text-center text-text-secondary">
                    Belum ada rencana maintenance. Klik "+ Tambah Task Description" untuk mulai.
                  </td>
                </tr>
              ) : filteredPlans.map(plan => (
                <tr key={plan.id} className="hover:bg-btn-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-blue-400">{plan.id}</td>
                  <td className="px-4 py-3 text-text-secondary">{plan.areaId}</td>
                  <td className="px-4 py-3 font-medium">{plan.areaName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">{plan.assetId}</td>
                  <td className="px-4 py-3 font-medium">{plan.assetName}</td>
                  <td className="px-4 py-3 text-text-secondary max-w-[200px] truncate" title={plan.taskDescription}>{plan.taskDescription}</td>
                  <td className="px-4 py-3">{getFrequencyBadge(plan.frequency)}</td>
                  <td className="px-4 py-3 text-text-secondary">{plan.startDate}</td>
                  <td className="px-4 py-3 text-text-secondary">{plan.pic || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => handleEdit(plan)} className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400 transition-colors" title="Edit"><Edit2 size={15} /></button>
                      <button onClick={() => handleDelete(plan.id)} className="p-1.5 rounded hover:bg-red-500/20 text-red-400 transition-colors" title="Hapus"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-bg-surface border border-border-color rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-border-color bg-black/20">
              <h2 className="text-xl font-bold">{editId ? 'Edit Task Description' : 'Tambah Task Description'}</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-text-secondary hover:text-text-primary">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
              {/* Asset Search */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Pilih Asset / Equipment <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                  <input
                    type="text" value={assetSearch}
                    onChange={e => { setAssetSearch(e.target.value); setShowAssetDropdown(true); }}
                    onFocus={() => setShowAssetDropdown(true)}
                    placeholder="Ketik nama atau ID asset..."
                    className="w-full bg-bg-dark border border-border-color rounded-lg py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-[#FF7043]"
                  />
                  {showAssetDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-bg-surface border border-border-color rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {filteredAssets.length > 0 ? filteredAssets.map(a => (
                        <div key={a.id} onClick={() => handleSelectAsset(a)}
                          className="px-4 py-2.5 hover:bg-btn-secondary cursor-pointer border-b border-border-color last:border-0 flex justify-between items-center">
                          <div>
                            <div className="font-medium text-sm">{a.name}</div>
                            <div className="text-xs text-text-secondary">{a.id} — {a.location}</div>
                          </div>
                          {form.assetId === a.id && <Check size={14} className="text-green-500" />}
                        </div>
                      )) : (
                        <div className="px-4 py-3 text-sm text-text-secondary text-center">Asset tidak ditemukan</div>
                      )}
                    </div>
                  )}
                </div>
                {form.assetId && (
                  <div className="mt-2 text-xs text-green-500 flex items-center gap-1">
                    <Check size={12} /> Dipilih: {form.assetId} — {form.areaName}
                  </div>
                )}
              </div>

              {/* Task Description */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Task Description <span className="text-red-500">*</span></label>
                <textarea
                  value={form.taskDescription}
                  onChange={e => setForm(prev => ({ ...prev, taskDescription: e.target.value }))}
                  rows={3} required
                  placeholder="Contoh: Pemeriksaan pelumasan, kebocoran, dan kondisi bearing..."
                  className="w-full bg-bg-dark border border-border-color rounded-lg p-3 text-sm focus:outline-none focus:border-[#FF7043] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Frequency */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Frequency / Interval <span className="text-red-500">*</span></label>
                  <select
                    value={form.frequency}
                    onChange={e => setForm(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043] appearance-none"
                  >
                    {FREQUENCY_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Start Date <span className="text-red-500">*</span></label>
                  <input
                    type="date" value={form.startDate} required
                    onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043]"
                  />
                </div>
              </div>

              {/* PIC */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">PIC (Teknisi/Penanggung Jawab)</label>
                {workers.length > 0 ? (
                  <select
                    value={form.pic}
                    onChange={e => setForm(prev => ({ ...prev, pic: e.target.value }))}
                    className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043] appearance-none"
                  >
                    <option value="">— Pilih Teknisi —</option>
                    {workers.map(w => <option key={w.id} value={w.nama}>{w.nama} ({w.posisi})</option>)}
                  </select>
                ) : (
                  <input
                    type="text" value={form.pic} placeholder="Nama teknisi / PIC..."
                    onChange={e => setForm(prev => ({ ...prev, pic: e.target.value }))}
                    className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043]"
                  />
                )}
              </div>

              {/* Next date preview */}
              {form.startDate && form.frequency && (
                <div className="text-sm bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-blue-300">
                  📅 Next Maintenance Date: <strong>{computeNextDate(form.startDate, form.frequency)}</strong>
                  <span className="text-text-secondary ml-2">({form.frequency} dari {form.startDate})</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-border-color">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-5 py-2.5 text-text-secondary hover:text-text-primary font-medium">Batal</button>
                <button type="submit" className="bg-gradient-to-r from-accent to-accent-secondary text-white px-6 py-2.5 rounded-lg font-medium shadow-lg hover:from-[#FF8A65] hover:to-[#FF5722]">
                  {editId ? 'Simpan Perubahan' : 'Tambah Rencana'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<MaintenancePlanning />);
