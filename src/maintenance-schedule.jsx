import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Calendar, AlertTriangle, CheckCircle, Clock, ChevronLeft, ChevronRight, Search } from 'lucide-react';

const FREQUENCY_OPTIONS = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Semester', 'Annual', 'Trienial', 'Quinquenial'];

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

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function MaintenanceSchedule() {
  const [plans, setPlans] = useState([]);
  const [filterFreq, setFilterFreq] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'calendar'
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const saved = localStorage.getItem('mx_maintenance_plans');
    if (saved) {
      setPlans(JSON.parse(saved));
    } else {
      const defaults = [
        { id: 'MP-001', areaId: 'AREA-01', areaName: 'Lantai Produksi', assetId: 'EQ-1001', assetName: 'Pompa Distribusi', taskDescription: 'Pemeriksaan pelumasan dan kebocoran', frequency: 'Monthly', startDate: '2026-08-01', nextDate: '2026-09-01', pic: 'Budi Santoso', status: 'Active' },
        { id: 'MP-002', areaId: 'AREA-02', areaName: 'Ruang Boiler', assetId: 'EQ-1005', assetName: 'Boiler Utama', taskDescription: 'Pengecekan tekanan dan overhaul tahunan', frequency: 'Annual', startDate: '2026-01-15', nextDate: '2027-01-15', pic: 'Agus Setiawan', status: 'Active' },
        { id: 'MP-003', areaId: 'AREA-01', areaName: 'Lantai Produksi', assetId: 'EQ-1010', assetName: 'Filter RO', taskDescription: 'Penggantian membran filter', frequency: 'Weekly', startDate: '2026-08-04', nextDate: '2026-08-11', pic: 'Joko Widodo', status: 'Active' },
      ];
      setPlans(defaults);
    }
  }, []);

  const isOverdue = (nextDate) => nextDate && new Date(nextDate) < new Date();
  const isDueThisWeek = (nextDate) => {
    if (!nextDate) return false;
    const nd = new Date(nextDate);
    const today = new Date();
    const weekAhead = new Date(); weekAhead.setDate(today.getDate() + 7);
    return nd >= today && nd <= weekAhead;
  };

  const filtered = plans.filter(p => {
    const matchFreq = filterFreq === 'All' || p.frequency === filterFreq;
    const matchSearch = !searchQuery ||
      p.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.areaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.taskDescription.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFreq && matchSearch;
  });

  const getFrequencyBadge = (freq) => {
    const colors = {
      'Daily': 'bg-red-500/20 text-red-400',
      'Weekly': 'bg-orange-500/20 text-orange-400',
      'Monthly': 'bg-blue-500/20 text-blue-400',
      'Quarterly': 'bg-purple-500/20 text-purple-400',
      'Semester': 'bg-indigo-500/20 text-indigo-400',
      'Annual': 'bg-green-500/20 text-green-400',
      'Trienial': 'bg-teal-500/20 text-teal-400',
      'Quinquenial': 'bg-cyan-500/20 text-cyan-400',
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[freq] || 'bg-gray-500/20 text-gray-400'}`}>{freq}</span>;
  };

  // Calendar helpers
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (y, m) => { const fd = new Date(y, m, 1).getDay(); return fd === 0 ? 6 : fd - 1; };

  const plansForDay = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return plans.filter(p => p.nextDate === dateStr || p.startDate === dateStr);
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const offset = getFirstDay(year, month);
    const today = new Date();

    const cells = [];
    for (let i = 0; i < offset; i++) cells.push(<div key={`e-${i}`} className="min-h-[80px] bg-bg-dark/30 border border-border-color p-1" />);
    for (let d = 1; d <= daysInMonth; d++) {
      const dayPlans = plansForDay(d);
      const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      cells.push(
        <div key={d} className={`min-h-[80px] border border-border-color p-1.5 transition-colors hover:bg-btn-secondary/50 ${isToday ? 'ring-2 ring-[#FF7043] ring-inset' : 'bg-bg-surface'}`}>
          <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-[#FF7043] text-white' : 'text-text-secondary'}`}>{d}</span>
          {dayPlans.map(p => (
            <div key={p.id} className="text-[10px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 truncate mb-0.5" title={p.taskDescription}>{p.assetName}</div>
          ))}
        </div>
      );
    }
    const rem = (7 - (cells.length % 7)) % 7;
    for (let i = 0; i < rem; i++) cells.push(<div key={`en-${i}`} className="min-h-[80px] bg-bg-dark/30 border border-border-color p-1" />);
    return cells;
  };

  return (
    <div className="flex flex-col h-full gap-4 text-text-primary font-sans">

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-bg-surface p-4 rounded-xl border border-border-color shadow gap-3">
        <div>
          <h2 className="text-xl font-bold">Jadwal Maintenance</h2>
          <p className="text-sm text-text-secondary mt-0.5">Jadwal maintenance berdasarkan Task Description dari Perencanaan</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={15} />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari jadwal..." className="bg-bg-dark border border-border-color rounded-lg py-2 pl-8 pr-3 text-sm focus:outline-none focus:border-[#FF7043] w-48" />
          </div>
          <select value={filterFreq} onChange={e => setFilterFreq(e.target.value)}
            className="bg-bg-dark border border-border-color rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-[#FF7043] appearance-none">
            <option value="All">Semua Interval</option>
            {FREQUENCY_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
          <div className="flex border border-border-color rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('table')} className={`px-3 py-2 text-sm transition-colors ${viewMode === 'table' ? 'bg-[#FF7043] text-white' : 'bg-bg-dark text-text-secondary hover:bg-btn-secondary'}`}>Tabel</button>
            <button onClick={() => setViewMode('calendar')} className={`px-3 py-2 text-sm transition-colors ${viewMode === 'calendar' ? 'bg-[#FF7043] text-white' : 'bg-bg-dark text-text-secondary hover:bg-btn-secondary'}`}>Kalender</button>
          </div>
          <a href="/maintenance-planning.html" className="bg-bg-dark border border-border-color hover:bg-btn-secondary text-text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5">
            + Tambah Rencana
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Jadwal', value: plans.length, color: 'text-blue-400', icon: <Calendar size={18} /> },
          { label: 'Overdue', value: plans.filter(p => isOverdue(p.nextDate)).length, color: 'text-red-400', icon: <AlertTriangle size={18} /> },
          { label: 'Jatuh Tempo 7 Hari', value: plans.filter(p => isDueThisWeek(p.nextDate)).length, color: 'text-orange-400', icon: <Clock size={18} /> },
          { label: 'Selesai (Bulan ini)', value: 0, color: 'text-green-400', icon: <CheckCircle size={18} /> },
        ].map((s, i) => (
          <div key={i} className="bg-bg-surface border border-border-color rounded-xl p-4 flex items-center gap-3">
            <div className={`${s.color} opacity-70`}>{s.icon}</div>
            <div>
              <div className="text-text-secondary text-xs">{s.label}</div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Content */}
      {viewMode === 'table' ? (
        <div className="bg-bg-surface rounded-xl border border-border-color shadow overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-bg-dark text-text-secondary border-b border-border-color">
                <tr>
                  <th className="px-4 py-3 font-medium">ID Lokasi</th>
                  <th className="px-4 py-3 font-medium">Nama Lokasi/Area</th>
                  <th className="px-4 py-3 font-medium">Nama Asset</th>
                  <th className="px-4 py-3 font-medium">Task Description</th>
                  <th className="px-4 py-3 font-medium">Frequency / Interval</th>
                  <th className="px-4 py-3 font-medium">Start Date</th>
                  <th className="px-4 py-3 font-medium">Next Date Maintenance</th>
                  <th className="px-4 py-3 font-medium">PIC</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color">
                {filtered.length === 0 ? (
                  <tr><td colSpan="9" className="px-6 py-12 text-center text-text-secondary">Tidak ada jadwal yang ditemukan.</td></tr>
                ) : filtered.map(plan => (
                  <tr key={plan.id} className={`hover:bg-btn-secondary/50 transition-colors ${isOverdue(plan.nextDate) ? 'bg-red-500/5' : ''}`}>
                    <td className="px-4 py-3 text-text-secondary">{plan.areaId}</td>
                    <td className="px-4 py-3 font-medium">{plan.areaName}</td>
                    <td className="px-4 py-3 font-medium">{plan.assetName}</td>
                    <td className="px-4 py-3 text-text-secondary max-w-[200px] truncate" title={plan.taskDescription}>{plan.taskDescription}</td>
                    <td className="px-4 py-3">{getFrequencyBadge(plan.frequency)}</td>
                    <td className="px-4 py-3 text-text-secondary">{plan.startDate}</td>
                    <td className="px-4 py-3">
                      <span className={isOverdue(plan.nextDate) ? 'text-red-400 font-semibold' : isDueThisWeek(plan.nextDate) ? 'text-orange-400 font-semibold' : 'text-text-secondary'}>
                        {plan.nextDate}
                        {isOverdue(plan.nextDate) && <span className="ml-2 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">OVERDUE</span>}
                        {!isOverdue(plan.nextDate) && isDueThisWeek(plan.nextDate) && <span className="ml-2 text-[10px] bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded">SOON</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{plan.pic || '-'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">{plan.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-bg-surface rounded-xl border border-border-color shadow flex-1 flex flex-col overflow-hidden">
          {/* Calendar Nav */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-color">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()-1, 1))} className="p-2 hover:bg-btn-secondary rounded-lg transition-colors"><ChevronLeft size={18}/></button>
            <span className="font-bold">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 1))} className="p-2 hover:bg-btn-secondary rounded-lg transition-colors"><ChevronRight size={18}/></button>
          </div>
          <div className="grid grid-cols-7 bg-bg-dark border-b border-border-color">
            {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(d => (
              <div key={d} className="py-2 text-center text-xs text-text-secondary font-semibold">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 flex-1 overflow-y-auto">
            {renderCalendar()}
          </div>
        </div>
      )}
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<MaintenanceSchedule />);
