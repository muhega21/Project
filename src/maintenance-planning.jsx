import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Plus, X, Search, ClipboardList, Trash2, Check, Save, CalendarRange, ArrowRight, CheckCircle, AlertTriangle
} from 'lucide-react';

const FREQUENCY_OPTIONS = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Semester', 'Annual', 'Trienial', 'Quinquenial'];

const genTaskId = (type) => {
  const prefix = type === 'Corrective' ? 'C' : 'P';
  return `${prefix}-${Date.now().toString().slice(-5)}`;
};

const INITIAL_PLANS = [
  { id: 'P-00001', taskType: 'Preventive', plantCode: 'AREA-01', areaId: 'AREA-01', areaName: 'Lantai Produksi', assetId: 'EQ-1001', assetName: 'Pompa Distribusi', taskDescription: 'Pemeriksaan pelumasan dan kebocoran', frequency: 'Monthly', startDate: '2026-08-01', nextDate: '2026-09-01', pic: 'Budi Santoso', status: 'Active' },
  { id: 'P-00002', taskType: 'Preventive', plantCode: 'AREA-02', areaId: 'AREA-02', areaName: 'Ruang Boiler', assetId: 'EQ-1005', assetName: 'Boiler Utama', taskDescription: 'Pengecekan tekanan dan overhaul tahunan', frequency: 'Annual', startDate: '2026-01-15', nextDate: '2027-01-15', pic: 'Agus Setiawan', status: 'Active' },
  { id: 'C-00003', taskType: 'Corrective', plantCode: 'AREA-01', areaId: 'AREA-01', areaName: 'Lantai Produksi', assetId: 'EQ-1010', assetName: 'Filter RO', taskDescription: 'Penggantian membran filter akibat penyumbatan', frequency: 'Weekly', startDate: '2026-08-04', nextDate: '2026-08-11', pic: 'Joko Widodo', status: 'Active' },
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

/* ── In-App Toast ─────────────────────────────────────────────────── */
function Toast({ toasts }) {
  return (
    <div className="fixed top-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded-xl border shadow-2xl text-sm font-medium animate-fade-in pointer-events-auto
          ${t.type === 'success' ? 'bg-green-900/90 border-green-500/40 text-green-200' :
            t.type === 'error'   ? 'bg-red-900/90 border-red-500/40 text-red-200' :
            'bg-bg-surface border-border-color text-text-primary'}`}>
          {t.type === 'success' ? <CheckCircle size={15}/> : <AlertTriangle size={15}/>}
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* ── Confirm Modal ────────────────────────────────────────────────── */
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1A2028] border border-border-color rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border-color">
          <AlertTriangle size={20} className="text-red-400 shrink-0"/>
          <h3 className="text-base font-bold text-white">Konfirmasi Hapus</h3>
        </div>
        <div className="px-6 py-4 text-sm text-text-secondary">{message}</div>
        <div className="flex gap-3 px-6 py-4 border-t border-border-color justify-end">
          <button onClick={onCancel} className="px-4 py-2 bg-btn-secondary hover:bg-gray-700 text-white rounded-lg border border-border-color transition-colors text-sm font-medium">Batal</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-colors flex items-center gap-1.5">
            <Trash2 size={14}/> Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

function MaintenancePlanning() {
  const [plans, setPlans] = useState(() => {
    const saved = localStorage.getItem('mx_maintenance_plans');
    return saved ? JSON.parse(saved) : INITIAL_PLANS;
  });
  const [assets, setAssets]   = useState([]);
  const [plants, setPlants]   = useState([]);
  const [zones, setZones]     = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId]       = useState(null);
  const [assetSearch, setAssetSearch]           = useState('');
  const [showAssetDropdown, setShowAssetDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterArea, setFilterArea] = useState('All');
  const [filterFreq, setFilterFreq] = useState('All');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [detailForm, setDetailForm]     = useState(null);
  const [toasts, setToasts]     = useState([]);
  const [confirmModal, setConfirmModal] = useState(null); // { message, onConfirm }

  const [form, setForm] = useState({
    taskType: 'Preventive',
    areaId: '', areaName: '', plantCode: '',
    assetId: '', assetName: '',
    taskDescription: '', frequency: 'Monthly',
    startDate: new Date().toISOString().split('T')[0], pic: ''
  });

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  useEffect(() => {
    localStorage.setItem('mx_maintenance_plans', JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    if (form.plantCode) {
      const savedZones = localStorage.getItem('maintainx_zones_' + form.plantCode);
      if (savedZones) setZones(JSON.parse(savedZones));
      else setZones([]);
    } else {
      setZones([]);
    }
  }, [form.plantCode]);

  useEffect(() => {
    const savedAssets = localStorage.getItem('maintainx_assets');
    if (savedAssets) setAssets(JSON.parse(savedAssets));
    else setAssets([
      { id: 'EQ-1001', name: 'Pompa Distribusi', location: 'Lantai Produksi', locationId: 'AREA-01' },
      { id: 'EQ-1005', name: 'Boiler Utama',     location: 'Ruang Boiler',    locationId: 'AREA-02' },
      { id: 'EQ-1010', name: 'Filter RO',         location: 'Lantai Produksi', locationId: 'AREA-01' },
      { id: 'EQ-2001', name: 'Sensor Suhu',        location: 'Panel Kontrol',  locationId: 'AREA-03' },
      { id: 'EQ-2005', name: 'Kompresor Udara',    location: 'Ruang Utilitas', locationId: 'AREA-04' },
    ]);

    const savedPlants = localStorage.getItem('maintainx_plants');
    if (savedPlants) setPlants(JSON.parse(savedPlants));
  }, []);

  const filteredAssets = assets.filter(a => {
    if (form.plantCode && a.plantCode !== form.plantCode) return false;
    if (form.areaId && a.zoneId !== form.areaId) return false;
    if (assetSearch && !a.name.toLowerCase().includes(assetSearch.toLowerCase()) && !a.id.toLowerCase().includes(assetSearch.toLowerCase())) return false;
    return true;
  });

  const filteredPlans = plans.filter(p => {
    const matchSearch = !searchQuery ||
      p.assetName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.taskDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.areaName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchArea = filterArea === 'All' || p.areaName === filterArea;
    const matchFreq = filterFreq === 'All' || p.frequency === filterFreq;
    return matchSearch && matchArea && matchFreq;
  });

  const uniqueAreas = Array.from(new Set(plans.map(p => p.areaName))).filter(Boolean).sort();

  const handleSelectAsset = (asset) => {
    setForm(prev => ({ ...prev, assetId: asset.id, assetName: asset.name }));
    setAssetSearch(asset.name);
    setShowAssetDropdown(false);
  };

  const resetForm = () => {
    setForm({ taskType:'Preventive', areaId:'', areaName:'', plantCode:'', assetId:'', assetName:'', taskDescription:'', frequency:'Monthly', startDate: new Date().toISOString().split('T')[0], pic:'' });
    setAssetSearch('');
    setEditId(null);
  };

  const handleOpenAdd = () => { resetForm(); setShowModal(true); };

  const handleRowClick = (plan) => {
    setSelectedPlan(plan);
    setDetailForm({ ...plan });
  };

  const handleDetailUpdate = () => {
    if (!detailForm.taskDescription.trim()) {
      addToast('Task Description tidak boleh kosong!', 'error');
      return;
    }
    const nextDate = computeNextDate(detailForm.startDate, detailForm.frequency);
    setPlans(prev => prev.map(p => p.id === detailForm.id ? { ...detailForm, nextDate } : p));
    setSelectedPlan({ ...detailForm, nextDate });
    addToast('Task berhasil diperbarui!', 'success');
  };

  const handleDetailDelete = () => {
    setConfirmModal({
      message: `Hapus task "${detailForm.taskDescription}" untuk ${detailForm.assetName}? Task ini juga akan hilang dari Jadwal Maintenance.`,
      onConfirm: () => {
        setPlans(prev => prev.filter(p => p.id !== detailForm.id));
        setSelectedPlan(null);
        setDetailForm(null);
        setConfirmModal(null);
        addToast('Task berhasil dihapus.', 'success');
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.assetId) { addToast('Pilih asset terlebih dahulu!', 'error'); return; }
    if (!form.taskDescription) { addToast('Task Description wajib diisi!', 'error'); return; }

    const nextDate = computeNextDate(form.startDate, form.frequency);

    if (editId) {
      setPlans(prev => prev.map(p => p.id === editId ? { ...p, ...form, nextDate } : p));
    } else {
      const newPlan = { id: genTaskId(form.taskType), ...form, nextDate, status: 'Active' };
      setPlans(prev => [newPlan, ...prev]);
    }
    setShowModal(false);
    resetForm();
    addToast('Task Description berhasil ditambahkan!', 'success');
  };

  const getFrequencyBadge = (freq) => {
    const colors = {
      'Daily':'bg-red-500/20 text-red-400','Weekly':'bg-orange-500/20 text-orange-400',
      'Monthly':'bg-blue-500/20 text-blue-400','Quarterly':'bg-purple-500/20 text-purple-400',
      'Semester':'bg-indigo-500/20 text-indigo-400','Annual':'bg-green-500/20 text-green-400',
      'Trienial':'bg-teal-500/20 text-teal-400','Quinquenial':'bg-cyan-500/20 text-cyan-400',
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[freq] || 'bg-gray-500/20 text-gray-400'}`}>{freq}</span>;
  };

  const getTaskTypeBadge = (type) => {
    if (type === 'Corrective')
      return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-red-500/20 text-red-400">C</span>;
    return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-500/20 text-blue-400">P</span>;
  };

  const isOverdue = (nextDate) => nextDate && new Date(nextDate) < new Date();

  return (
    <div className="flex flex-col h-full gap-4 text-text-primary font-sans">
      <Toast toasts={toasts}/>
      {confirmModal && (
        <ConfirmModal
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)}
        />
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-bg-surface p-4 rounded-xl border border-border-color shadow gap-3">
        <div>
          <h2 className="text-xl font-bold">Perencanaan Maintenance</h2>
          <p className="text-sm text-text-secondary mt-0.5">Kelola rencana pemeliharaan rutin untuk setiap Asset &amp; Equipment</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <select value={filterArea} onChange={e => setFilterArea(e.target.value)}
            className="bg-bg-dark border border-border-color rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-[#FF7043] appearance-none">
            <option value="All">Semua Lokasi</option>
            {uniqueAreas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <select value={filterFreq} onChange={e => setFilterFreq(e.target.value)}
            className="bg-bg-dark border border-border-color rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-[#FF7043] appearance-none">
            <option value="All">Semua Interval</option>
            {FREQUENCY_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari aset, task, atau ID..."
              className="w-full bg-bg-dark border border-border-color rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-[#FF7043]"
            />
          </div>
          <button
            onClick={() => window.location.href = '/maintenance-schedule.html'}
            className="flex items-center gap-2 bg-bg-dark border border-border-color hover:border-[#FF7043] hover:text-white text-text-secondary px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap"
          >
            <CalendarRange size={16}/> Jadwal Maintenance
          </button>
          <button onClick={handleOpenAdd}
            className="bg-gradient-to-r from-accent to-accent-secondary hover:from-[#FF8A65] hover:to-[#FF5722] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg transition-all active:scale-95 whitespace-nowrap">
            <Plus size={18} /> Tambah Task Description
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Rencana',   value: plans.length,                                    color: 'text-blue-400' },
          { label: 'Preventive (P)',  value: plans.filter(p => p.taskType !== 'Corrective').length, color: 'text-blue-400' },
          { label: 'Corrective (C)',  value: plans.filter(p => p.taskType === 'Corrective').length, color: 'text-red-400' },
          { label: 'Overdue',         value: plans.filter(p => isOverdue(p.nextDate)).length,  color: 'text-red-400' },
        ].map((card, i) => (
          <div key={i} className="bg-bg-surface border border-border-color rounded-xl p-4">
            <div className="text-text-secondary text-sm">{card.label}</div>
            <div className={`text-3xl font-bold mt-1 ${card.color}`}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Integration Info Banner */}
      <div className="flex items-center gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-2.5 text-xs text-blue-300">
        <CalendarRange size={15} className="shrink-0"/>
        <span>
          Task Description yang dibuat di sini akan otomatis tampil di <strong className="text-blue-200">Jadwal Maintenance</strong> sesuai Frequency dan Start Date yang diatur.
        </span>
        <button onClick={() => window.location.href = '/maintenance-schedule.html'} className="ml-auto flex items-center gap-1.5 text-blue-200 hover:text-white font-semibold shrink-0 transition-colors">
          Buka Jadwal <ArrowRight size={13}/>
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-text-secondary">
        <span className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded font-bold bg-blue-500/20 text-blue-400">P</span>
          Preventive — ID dimulai dengan <strong className="text-blue-400">P-</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded font-bold bg-red-500/20 text-red-400">C</span>
          Corrective — ID dimulai dengan <strong className="text-red-400">C-</strong>
        </span>
      </div>

      {/* Table + Detail Panel side-by-side */}
      <div className="flex gap-4 flex-1 overflow-hidden">

        {/* Table */}
        <div className="bg-bg-surface rounded-xl border border-border-color shadow overflow-hidden flex flex-col" style={{ flex: selectedPlan ? '1 1 60%' : '1 1 100%', transition:'flex 0.3s' }}>
          <div className="flex items-center justify-between px-6 py-3 border-b border-border-color">
            <span className="font-semibold flex items-center gap-2"><ClipboardList size={18} className="text-[#FF7043]" /> Daftar Task Description Maintenance</span>
            <span className="text-sm text-text-secondary">{filteredPlans.length} rencana</span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-bg-dark text-text-secondary border-b border-border-color">
                <tr>
                  <th className="px-3 py-3 font-medium text-center">No</th>
                  <th className="px-3 py-3 font-medium">ID Task</th>
                  <th className="px-3 py-3 font-medium">ID Plant</th>
                  <th className="px-3 py-3 font-medium">Lokasi/Area</th>
                  <th className="px-3 py-3 font-medium">ID Asset</th>
                  <th className="px-3 py-3 font-medium">Nama Asset</th>
                  <th className="px-3 py-3 font-medium">Task Description</th>
                  <th className="px-3 py-3 font-medium">Frequency</th>
                  <th className="px-3 py-3 font-medium">Start Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color">
                {filteredPlans.length === 0 ? (
                  <tr><td colSpan="9" className="px-6 py-12 text-center text-text-secondary">Belum ada rencana maintenance. Klik "+ Tambah Task Description" untuk mulai.</td></tr>
                ) : filteredPlans.map((plan, idx) => {
                  const isSelected = selectedPlan?.id === plan.id;
                  return (
                    <tr key={plan.id}
                      onClick={() => handleRowClick(plan)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#FF7043]/10 border-l-2 border-[#FF7043]'
                          : 'hover:bg-btn-secondary/50'
                      }`}>
                      <td className="px-3 py-3 text-center text-text-secondary text-xs">{idx + 1}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          {getTaskTypeBadge(plan.taskType)}
                          <span className="font-mono text-xs text-blue-400">{plan.id}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-mono text-xs text-text-secondary">{plan.plantCode || plan.areaId || '-'}</td>
                      <td className="px-3 py-3 font-medium">{plan.areaName}</td>
                      <td className="px-3 py-3 font-mono text-xs text-text-secondary">{plan.assetId}</td>
                      <td className="px-3 py-3 font-medium">{plan.assetName}</td>
                      <td className="px-3 py-3 text-text-secondary max-w-[180px] truncate" title={plan.taskDescription}>{plan.taskDescription}</td>
                      <td className="px-3 py-3">{getFrequencyBadge(plan.frequency)}</td>
                      <td className="px-3 py-3 text-text-secondary text-xs">{plan.startDate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail / Edit Panel */}
        {selectedPlan && detailForm && (
          <div className="bg-bg-surface border border-border-color rounded-xl shadow-2xl flex flex-col overflow-hidden" style={{ width: 340, flexShrink: 0 }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border-color bg-black/20">
              <div>
                <div className="flex items-center gap-2">
                  {getTaskTypeBadge(detailForm.taskType)}
                  <span className="font-mono text-sm text-blue-400 font-semibold">{detailForm.id}</span>
                </div>
                <p className="text-xs text-text-secondary mt-0.5">Klik field untuk mengedit</p>
              </div>
              <button onClick={() => { setSelectedPlan(null); setDetailForm(null); }} className="text-text-secondary hover:text-text-primary">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

              <div>
                <label className="block text-xs text-text-secondary mb-1">Tipe Task</label>
                <select value={detailForm.taskType}
                  onChange={e => setDetailForm(prev => ({ ...prev, taskType: e.target.value }))}
                  className="w-full bg-bg-dark border border-border-color rounded-lg p-2 text-sm focus:outline-none focus:border-[#FF7043] appearance-none">
                  <option value="Preventive">Preventive (P-)</option>
                  <option value="Corrective">Corrective (C-)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1">ID Plant</label>
                <input type="text" value={detailForm.plantCode || detailForm.areaId || ''}
                  onChange={e => setDetailForm(prev => ({ ...prev, plantCode: e.target.value }))}
                  className="w-full bg-bg-dark border border-border-color rounded-lg p-2 text-sm focus:outline-none focus:border-[#FF7043] font-mono" />
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1">Lokasi / Area</label>
                <input type="text" value={detailForm.areaName}
                  onChange={e => setDetailForm(prev => ({ ...prev, areaName: e.target.value }))}
                  className="w-full bg-bg-dark border border-border-color rounded-lg p-2 text-sm focus:outline-none focus:border-[#FF7043]" />
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1">ID Asset</label>
                <input type="text" value={detailForm.assetId}
                  onChange={e => setDetailForm(prev => ({ ...prev, assetId: e.target.value }))}
                  className="w-full bg-bg-dark border border-border-color rounded-lg p-2 text-sm focus:outline-none focus:border-[#FF7043] font-mono" />
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1">Nama Asset</label>
                <input type="text" value={detailForm.assetName}
                  onChange={e => setDetailForm(prev => ({ ...prev, assetName: e.target.value }))}
                  className="w-full bg-bg-dark border border-border-color rounded-lg p-2 text-sm focus:outline-none focus:border-[#FF7043]" />
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1">Task Description <span className="text-red-500">*</span></label>
                <textarea value={detailForm.taskDescription} rows={3}
                  onChange={e => setDetailForm(prev => ({ ...prev, taskDescription: e.target.value }))}
                  className="w-full bg-bg-dark border border-border-color rounded-lg p-2 text-sm focus:outline-none focus:border-[#FF7043] resize-none" />
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1">Frequency</label>
                <select value={detailForm.frequency}
                  onChange={e => setDetailForm(prev => ({ ...prev, frequency: e.target.value }))}
                  className="w-full bg-bg-dark border border-border-color rounded-lg p-2 text-sm focus:outline-none focus:border-[#FF7043] appearance-none">
                  {FREQUENCY_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1">Start Date</label>
                <input type="date" value={detailForm.startDate}
                  onChange={e => setDetailForm(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full bg-bg-dark border border-border-color rounded-lg p-2 text-sm focus:outline-none focus:border-[#FF7043]" />
              </div>

              {detailForm.startDate && detailForm.frequency && (
                <div className="text-xs bg-blue-500/10 border border-blue-500/30 rounded-lg p-2.5 text-blue-300">
                  📅 Next Date: <strong>{computeNextDate(detailForm.startDate, detailForm.frequency)}</strong>
                </div>
              )}

              <div className="text-xs bg-green-500/10 border border-green-500/30 rounded-lg p-2.5 text-green-300 flex items-center gap-2">
                <CalendarRange size={13} className="shrink-0"/>
                <span>Task ini aktif di <strong>Jadwal Maintenance</strong> sesuai frekuensi yang diatur.</span>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-border-color flex gap-2">
              <button onClick={handleDetailUpdate}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-accent to-accent-secondary text-white font-semibold text-sm hover:from-[#FF8A65] hover:to-[#FF5722] shadow transition-all active:scale-95">
                <Save size={15} /> Update
              </button>
              <button onClick={handleDetailDelete}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/35 font-semibold text-sm transition-colors">
                <Trash2 size={15} /> Hapus
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-bg-surface border border-border-color rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-border-color bg-black/20">
              <h2 className="text-xl font-bold">Tambah Task Description</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-text-secondary hover:text-text-primary"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Kode Area/Lokasi (Plant) <span className="text-red-500">*</span></label>
                  <select value={form.plantCode} required
                    onChange={(e) => {
                      const pc = e.target.value;
                      setForm(prev => ({ ...prev, plantCode: pc, areaId: '', areaName: '', assetId: '', assetName: '' }));
                      setAssetSearch('');
                    }}
                    className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043] appearance-none">
                    <option value="">— Pilih Plant —</option>
                    {plants.map(p => <option key={p.code} value={p.code}>{p.code} — {p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Area/Lokasi (Zone) <span className="text-red-500">*</span></label>
                  <select value={form.areaId} required disabled={!form.plantCode}
                    onChange={(e) => {
                      const zone = zones.find(z => z.id === e.target.value);
                      setForm(prev => ({ ...prev, areaId: e.target.value, areaName: zone ? zone.name : '', assetId: '', assetName: '' }));
                      setAssetSearch('');
                    }}
                    className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043] appearance-none disabled:opacity-50 disabled:cursor-not-allowed">
                    <option value="">— Pilih Zone —</option>
                    {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Pilih Asset / Equipment <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                  <input type="text" value={assetSearch}
                    disabled={!form.areaId}
                    onChange={e => { setAssetSearch(e.target.value); setShowAssetDropdown(true); }}
                    onFocus={() => setShowAssetDropdown(true)}
                    placeholder={form.areaId ? "Ketik nama atau ID asset..." : "Pilih Plant & Zone terlebih dahulu"}
                    className="w-full bg-bg-dark border border-border-color rounded-lg py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:border-[#FF7043] disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {showAssetDropdown && form.areaId && (
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
                        <div className="px-4 py-3 text-sm text-text-secondary text-center">Asset tidak ditemukan di area ini</div>
                      )}
                    </div>
                  )}
                </div>
                {form.assetId && (
                  <div className="mt-2 text-xs text-green-500 flex items-center gap-1">
                    <Check size={12} /> Dipilih: {form.assetId} — {form.assetName}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Task Description <span className="text-red-500">*</span></label>
                <textarea value={form.taskDescription}
                  onChange={e => setForm(prev => ({ ...prev, taskDescription: e.target.value }))}
                  rows={3} required
                  placeholder="Contoh: Pemeriksaan pelumasan, kebocoran, dan kondisi bearing..."
                  className="w-full bg-bg-dark border border-border-color rounded-lg p-3 text-sm focus:outline-none focus:border-[#FF7043] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Frequency / Interval <span className="text-red-500">*</span></label>
                  <select value={form.frequency} onChange={e => setForm(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043] appearance-none">
                    {FREQUENCY_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Start Date <span className="text-red-500">*</span></label>
                  <input type="date" value={form.startDate} required
                    onChange={e => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043]" />
                </div>
              </div>

              {form.startDate && form.frequency && (
                <div className="text-sm bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-blue-300">
                  📅 Next Maintenance Date: <strong>{computeNextDate(form.startDate, form.frequency)}</strong>
                  <span className="text-text-secondary ml-2">({form.frequency} dari {form.startDate})</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-border-color">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-5 py-2.5 text-text-secondary hover:text-text-primary font-medium">Batal</button>
                <button type="submit" className="bg-gradient-to-r from-accent to-accent-secondary text-white px-6 py-2.5 rounded-lg font-medium shadow-lg hover:from-[#FF8A65] hover:to-[#FF5722]">
                  Tambah Rencana
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
