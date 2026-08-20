import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { CheckCircle, Clock, AlertTriangle, Search, FileText } from 'lucide-react';

const isScheduledOnDate = (startDateStr, frequency, targetDateStr) => {
  if (!startDateStr || !targetDateStr) return false;
  const start = new Date(startDateStr); start.setHours(0,0,0,0);
  const target = new Date(targetDateStr); target.setHours(0,0,0,0);
  if (target < start) return false;
  const diffTime = target - start;
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  switch (frequency) {
    case 'Daily': return true;
    case 'Weekly': return diffDays % 7 === 0;
    case 'Monthly': return start.getDate() === target.getDate();
    case 'Quarterly': {
      const monthDiff = (target.getFullYear() - start.getFullYear()) * 12 + target.getMonth() - start.getMonth();
      return start.getDate() === target.getDate() && monthDiff % 3 === 0;
    }
    case 'Semester': {
      const monthDiff = (target.getFullYear() - start.getFullYear()) * 12 + target.getMonth() - start.getMonth();
      return start.getDate() === target.getDate() && monthDiff % 6 === 0;
    }
    case 'Annual': return start.getDate() === target.getDate() && start.getMonth() === target.getMonth();
    case 'Trienial': return start.getDate() === target.getDate() && start.getMonth() === target.getMonth() && (target.getFullYear() - start.getFullYear()) % 3 === 0;
    case 'Quinquenial': return start.getDate() === target.getDate() && start.getMonth() === target.getMonth() && (target.getFullYear() - start.getFullYear()) % 5 === 0;
    default: return false;
  }
};

const formatDate = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function ReportTaskList() {
  const [plans, setPlans] = useState([]);
  const [taskStatuses, setTaskStatuses] = useState({});
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const savedPlans = localStorage.getItem('mx_maintenance_plans');
    if (savedPlans) setPlans(JSON.parse(savedPlans));
    const savedStatuses = localStorage.getItem('mx_task_statuses');
    if (savedStatuses) setTaskStatuses(JSON.parse(savedStatuses));
  }, []);

  const todayStr = formatDate(new Date());

  // Filter tasks that fall on today
  const todaysTasks = plans.filter(p => isScheduledOnDate(p.startDate, p.frequency, todayStr));

  // Determine actual status (defaults to Open if not found in mx_task_statuses)
  const getTaskStatus = (planId) => taskStatuses[planId] || 'Open';

  const filteredTasks = todaysTasks.filter(p => {
    const s = getTaskStatus(p.id);
    const matchStatus = statusFilter === 'All' || s === statusFilter;
    const matchSearch = !searchQuery || 
      p.assetName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.taskDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSearch;
  });

  const getStatusBadge = (status) => {
    const map = {
      'Open': 'bg-gray-500/20 text-gray-400',
      'On Progress': 'bg-blue-500/20 text-blue-400',
      'Waiting on Part': 'bg-orange-500/20 text-orange-400',
      'Done': 'bg-green-500/20 text-green-400'
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${map[status] || map.Open}`}>{status}</span>;
  };

  const getFrequencyBadge = (freq) => {
    const colors = {
      'Daily': 'bg-red-500/20 text-red-400',
      'Weekly': 'bg-orange-500/20 text-orange-400',
      'Monthly': 'bg-blue-500/20 text-blue-400'
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[freq] || 'bg-purple-500/20 text-purple-400'}`}>{freq}</span>;
  };

  const statCards = [
    { label: 'Total Hari Ini', value: todaysTasks.length, color: 'text-text-primary', icon: <FileText size={18}/> },
    { label: 'Done', value: todaysTasks.filter(p => getTaskStatus(p.id) === 'Done').length, color: 'text-green-400', icon: <CheckCircle size={18}/> },
    { label: 'On Progress', value: todaysTasks.filter(p => getTaskStatus(p.id) === 'On Progress').length, color: 'text-blue-400', icon: <Clock size={18}/> },
    { label: 'Waiting on Part', value: todaysTasks.filter(p => getTaskStatus(p.id) === 'Waiting on Part').length, color: 'text-orange-400', icon: <AlertTriangle size={18}/> },
    { label: 'Open', value: todaysTasks.filter(p => getTaskStatus(p.id) === 'Open').length, color: 'text-gray-400', icon: <AlertTriangle size={18}/> }
  ];

  return (
    <div className="flex flex-col h-full gap-4 text-text-primary font-sans">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {statCards.map((s, i) => (
          <div key={i} className="bg-bg-surface border border-border-color rounded-xl p-4 flex flex-col gap-1 items-center justify-center text-center shadow-sm">
            <div className={`${s.color} opacity-80 mb-1`}>{s.icon}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-text-secondary text-xs">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-bg-surface rounded-xl border border-border-color shadow flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border-color flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="flex bg-bg-dark rounded-lg p-1 overflow-x-auto max-w-full hide-scrollbar">
            {['All', 'Done', 'On Progress', 'Waiting on Part', 'Open'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-4 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap ${statusFilter === s ? 'bg-[#FF7043] text-white font-medium shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}>
                {s}
              </button>
            ))}
          </div>
          <div className="relative w-full xl:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={15} />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari task..." className="w-full bg-bg-dark border border-border-color rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-[#FF7043]" />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-bg-dark text-text-secondary border-b border-border-color">
              <tr>
                <th className="px-4 py-3 font-medium">ID Task</th>
                <th className="px-4 py-3 font-medium">Nama Asset</th>
                <th className="px-4 py-3 font-medium">Deskripsi Pekerjaan</th>
                <th className="px-4 py-3 font-medium">Frequency</th>
                <th className="px-4 py-3 font-medium">PIC</th>
                <th className="px-4 py-3 font-medium">Status Pekerjaan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {filteredTasks.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-text-secondary">Tidak ada laporan pekerjaan yang sesuai.</td></tr>
              ) : filteredTasks.map(plan => (
                <tr key={plan.id} className="hover:bg-btn-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{plan.id}</td>
                  <td className="px-4 py-3 font-medium">{plan.assetName} <br/><span className="text-xs text-text-secondary font-normal">{plan.areaName}</span></td>
                  <td className="px-4 py-3 text-text-secondary max-w-[200px] whitespace-normal">{plan.taskDescription}</td>
                  <td className="px-4 py-3">{getFrequencyBadge(plan.frequency)}</td>
                  <td className="px-4 py-3 text-text-secondary">{plan.pic || '-'}</td>
                  <td className="px-4 py-3">{getStatusBadge(getTaskStatus(plan.id))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<ReportTaskList />);
}
