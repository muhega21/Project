import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  CheckCircle, Clock, AlertTriangle, Search, Filter, RefreshCw, ChevronDown
} from 'lucide-react';

const STATUS_OPTIONS = ['All', 'On Progress', 'Open', 'Done', 'Waiting on Part'];

function computeNextDate(startDate, frequency) {
  const d = new Date(startDate);
  if (isNaN(d)) return null;
  switch (frequency) {
    case 'Daily': d.setDate(d.getDate() + 1); break;
    case 'Weekly': d.setDate(d.getDate() + 7); break;
    case 'Monthly': d.setMonth(d.getMonth() + 1); break;
    case 'Quarterly': d.setMonth(d.getMonth() + 3); break;
    case 'Semester': d.setMonth(d.getMonth() + 6); break;
    case 'Annual': d.setFullYear(d.getFullYear() + 1); break;
    case 'Trienial': d.setFullYear(d.getFullYear() + 3); break;
    case 'Quinquenial': d.setFullYear(d.getFullYear() + 5); break;
    default: break;
  }
  return d.toISOString().split('T')[0];
}

function isOverdue(nextDate, status) {
  if (status === 'Done') return false;
  return nextDate && new Date(nextDate) < new Date(new Date().toDateString());
}

function getDateCategory(startDate, nextDate) {
  const today = new Date(new Date().toDateString());
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

  const sd = new Date(startDate);
  const nd = nextDate ? new Date(nextDate) : null;

  if (sd.getTime() === today.getTime() || (nd && nd.getTime() === today.getTime())) return 'today';
  if (sd.getTime() === yesterday.getTime() || (nd && nd.getTime() === yesterday.getTime())) return 'yesterday';
  if (sd.getTime() === tomorrow.getTime() || (nd && nd.getTime() === tomorrow.getTime())) return 'tomorrow';
  return 'other';
}

function ListTask() {
  const [plans, setPlans] = useState([]);
  const [taskStatuses, setTaskStatuses] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [timeFilter, setTimeFilter] = useState('all'); // all | yesterday | today | tomorrow

  useEffect(() => {
    const savedPlans = localStorage.getItem('mx_maintenance_plans');
    if (savedPlans) {
      setPlans(JSON.parse(savedPlans));
    } else {
      const defaults = [
        { id: 'MP-001', areaId: 'AREA-01', areaName: 'Lantai Produksi', assetId: 'EQ-1001', assetName: 'Pompa Distribusi', taskDescription: 'Pemeriksaan pelumasan dan kebocoran', frequency: 'Monthly', startDate: '2026-08-12', nextDate: computeNextDate('2026-08-12', 'Monthly'), pic: 'Budi Santoso', status: 'Active' },
        { id: 'MP-002', areaId: 'AREA-02', areaName: 'Ruang Boiler', assetId: 'EQ-1005', assetName: 'Boiler Utama', taskDescription: 'Pengecekan tekanan dan overhaul tahunan', frequency: 'Annual', startDate: '2026-08-11', nextDate: computeNextDate('2026-08-11', 'Annual'), pic: 'Agus Setiawan', status: 'Active' },
        { id: 'MP-003', areaId: 'AREA-01', areaName: 'Lantai Produksi', assetId: 'EQ-1010', assetName: 'Filter RO', taskDescription: 'Penggantian membran filter', frequency: 'Weekly', startDate: '2026-08-13', nextDate: computeNextDate('2026-08-13', 'Weekly'), pic: 'Joko Widodo', status: 'Active' },
        { id: 'MP-004', areaId: 'AREA-03', areaName: 'Panel Kontrol', assetId: 'EQ-2001', assetName: 'Sensor Suhu', taskDescription: 'Kalibrasi sensor', frequency: 'Quarterly', startDate: '2026-08-10', nextDate: computeNextDate('2026-08-10', 'Quarterly'), pic: 'Belum Ditugaskan', status: 'Active' },
      ];
      setPlans(defaults);
    }

    const savedStatuses = localStorage.getItem('mx_task_statuses');
    if (savedStatuses) {
      setTaskStatuses(JSON.parse(savedStatuses));
    }
  }, []);

  const updateStatus = (planId, newStatus) => {
    const updated = { ...taskStatuses, [planId]: newStatus };
    setTaskStatuses(updated);
    localStorage.setItem('mx_task_statuses', JSON.stringify(updated));
  };

  const getTaskStatus = (plan) => taskStatuses[plan.id] || 'Open';

  const filtered = plans.filter(plan => {
    const status = getTaskStatus(plan);
    const nd = plan.nextDate;

    const matchStatus = statusFilter === 'All' || status === statusFilter;
    const matchSearch = !searchQuery ||
      plan.assetName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.areaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.taskDescription.toLowerCase().includes(searchQuery.toLowerCase());

    let matchTime = true;
    if (timeFilter !== 'all') {
      matchTime = getDateCategory(plan.startDate, nd) === timeFilter;
    }

    return matchStatus && matchSearch && matchTime;
  });

  const getStatusBadge = (plan) => {
    const status = getTaskStatus(plan);
    const overdue = isOverdue(plan.nextDate, status);

    const badgeMap = {
      'Done':           <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs border border-green-500/40 flex items-center gap-1 w-fit"><CheckCircle size={11}/> Done</span>,
      'On Progress':    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs border border-blue-500/40 flex items-center gap-1 w-fit"><Clock size={11}/> On Progress</span>,
      'Waiting on Part':<span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs border border-yellow-500/40 flex items-center gap-1 w-fit"><AlertTriangle size={11}/> Waiting on Part</span>,
      'Open':           <span className="px-2 py-1 bg-gray-500/20 text-text-secondary rounded text-xs border border-gray-500/40 flex items-center gap-1 w-fit">Open</span>,
    };

    return (
      <div className="flex flex-col gap-1">
        {badgeMap[status] || badgeMap['Open']}
        {overdue && <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px] border border-red-500/40 flex items-center gap-1 w-fit"><AlertTriangle size={10}/> OVERDUE</span>}
      </div>
    );
  };

  const getFrequencyBadge = (freq) => {
    const colors = {
      'Daily': 'bg-red-500/20 text-red-400', 'Weekly': 'bg-orange-500/20 text-orange-400',
      'Monthly': 'bg-blue-500/20 text-blue-400', 'Quarterly': 'bg-purple-500/20 text-purple-400',
      'Semester': 'bg-indigo-500/20 text-indigo-400', 'Annual': 'bg-green-500/20 text-green-400',
      'Trienial': 'bg-teal-500/20 text-teal-400', 'Quinquenial': 'bg-cyan-500/20 text-cyan-400',
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[freq] || 'bg-gray-500/20 text-gray-400'}`}>{freq}</span>;
  };

  const timeTabs = [
    { key: 'all', label: 'Semua' },
    { key: 'yesterday', label: 'Kemarin' },
    { key: 'today', label: 'Hari Ini' },
    { key: 'tomorrow', label: 'Besok' },
  ];

  const statCounts = {
    all: plans.length,
    open: plans.filter(p => getTaskStatus(p) === 'Open').length,
    onProgress: plans.filter(p => getTaskStatus(p) === 'On Progress').length,
    done: plans.filter(p => getTaskStatus(p) === 'Done').length,
    waiting: plans.filter(p => getTaskStatus(p) === 'Waiting on Part').length,
    overdue: plans.filter(p => isOverdue(p.nextDate, getTaskStatus(p))).length,
  };

  return (
    <div className="flex flex-col h-full gap-4 text-text-primary font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-bg-surface p-4 rounded-xl border border-border-color shadow gap-3">
        <div>
          <h2 className="text-xl font-bold">Task List</h2>
          <p className="text-sm text-text-secondary mt-0.5">Status pekerjaan maintenance berdasarkan jadwal</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={15} />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari task..." className="bg-bg-dark border border-border-color rounded-lg py-2 pl-8 pr-3 text-sm focus:outline-none focus:border-[#FF7043] w-48" />
          </div>
          <a href="/maintenance-planning.html" className="bg-bg-dark border border-border-color hover:bg-btn-secondary text-text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">+ Rencana Baru</a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: statCounts.all, color: 'text-text-primary' },
          { label: 'Open', value: statCounts.open, color: 'text-text-secondary' },
          { label: 'On Progress', value: statCounts.onProgress, color: 'text-blue-400' },
          { label: 'Done', value: statCounts.done, color: 'text-green-400' },
          { label: 'Waiting Part', value: statCounts.waiting, color: 'text-yellow-400' },
          { label: 'Overdue', value: statCounts.overdue, color: 'text-red-400' },
        ].map((s, i) => (
          <div key={i} className="bg-bg-surface border border-border-color rounded-xl p-3 text-center">
            <div className="text-text-secondary text-xs mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Time Tabs */}
      <div className="flex items-center gap-2 bg-bg-surface border border-border-color rounded-xl px-4 py-2">
        <Clock size={16} className="text-text-secondary" />
        <div className="flex gap-1">
          {timeTabs.map(tab => (
            <button key={tab.key} onClick={() => setTimeFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${timeFilter === tab.key ? 'bg-[#FF7043] text-white' : 'text-text-secondary hover:bg-btn-secondary'}`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-1">
          {STATUS_OPTIONS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-bg-dark border border-[#FF7043] text-[#FF7043]' : 'text-text-secondary hover:bg-btn-secondary'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-bg-surface rounded-xl border border-border-color shadow overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-bg-dark text-text-secondary border-b border-border-color">
              <tr>
                <th className="px-4 py-3 font-medium">No</th>
                <th className="px-4 py-3 font-medium">Kode Area/Lokasi (Plant)</th>
                <th className="px-4 py-3 font-medium">Lokasi/Area</th>
                <th className="px-4 py-3 font-medium">Nama Asset</th>
                <th className="px-4 py-3 font-medium">Task Description</th>
                <th className="px-4 py-3 font-medium">Interval</th>
                <th className="px-4 py-3 font-medium">Start Date</th>
                <th className="px-4 py-3 font-medium">Next Date</th>
                <th className="px-4 py-3 font-medium">PIC</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {filtered.length === 0 ? (
                <tr><td colSpan="11" className="px-6 py-12 text-center text-text-secondary">Tidak ada task yang sesuai filter.</td></tr>
              ) : filtered.map((plan, idx) => {
                const status = getTaskStatus(plan);
                const overdue = isOverdue(plan.nextDate, status);
                return (
                  <tr key={plan.id} className={`hover:bg-btn-secondary/50 transition-colors ${overdue ? 'bg-red-500/5' : ''}`}>
                    <td className="px-4 py-3 text-text-secondary font-mono text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 text-text-secondary">{plan.plantCode || plan.areaId || '-'}</td>
                    <td className="px-4 py-3 font-medium">{plan.areaName}</td>
                    <td className="px-4 py-3 font-medium text-blue-400">{plan.assetName}</td>
                    <td className="px-4 py-3 text-text-secondary max-w-[180px] truncate" title={plan.taskDescription}>{plan.taskDescription}</td>
                    <td className="px-4 py-3">{getFrequencyBadge(plan.frequency)}</td>
                    <td className="px-4 py-3 text-text-secondary">{plan.startDate}</td>
                    <td className="px-4 py-3">
                      <span className={overdue ? 'text-red-400 font-semibold' : 'text-text-secondary'}>{plan.nextDate || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{plan.pic || '-'}</td>
                    <td className="px-4 py-3">{getStatusBadge(plan)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={status}
                        onChange={e => updateStatus(plan.id, e.target.value)}
                        className="bg-bg-dark border border-border-color rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#FF7043] appearance-none"
                      >
                        <option value="Open">Open</option>
                        <option value="On Progress">On Progress</option>
                        <option value="Waiting on Part">Waiting on Part</option>
                        <option value="Done">Done</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<ListTask />);
