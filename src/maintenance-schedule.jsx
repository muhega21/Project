import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { Calendar, AlertTriangle, CheckCircle, Clock, ChevronLeft, ChevronRight, Search, X, ChevronDown } from "lucide-react";
import { loadPlans, savePlans, loadRecords, normalizePic } from "./maintenance-store.js";

const monthNames = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const FREQ_COLORS = {
  Daily:"bg-red-500/20 text-red-400", Weekly:"bg-orange-500/20 text-orange-400",
  Monthly:"bg-blue-500/20 text-blue-400", Quarterly:"bg-purple-500/20 text-purple-400",
  Semester:"bg-indigo-500/20 text-indigo-400", Annual:"bg-green-500/20 text-green-400",
  Trienial:"bg-teal-500/20 text-teal-400", Quinquenial:"bg-cyan-500/20 text-cyan-400",
};
const TASK_STATUS_COLORS = {
  "Open":"bg-gray-500/20 text-gray-400 border-gray-500/30",
  "On Progress":"bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Waiting on Part":"bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Done":"bg-green-500/20 text-green-400 border-green-500/30",
};

function computeNextDate(startDate, frequency) {
  const d = new Date(startDate);
  if (isNaN(d)) return startDate;
  switch (frequency) {
    case "Daily": d.setDate(d.getDate()+1); break;
    case "Weekly": d.setDate(d.getDate()+7); break;
    case "Monthly": d.setMonth(d.getMonth()+1); break;
    case "Quarterly": d.setMonth(d.getMonth()+3); break;
    case "Semester": d.setMonth(d.getMonth()+6); break;
    case "Annual": d.setFullYear(d.getFullYear()+1); break;
    case "Trienial": d.setFullYear(d.getFullYear()+3); break;
    case "Quinquenial": d.setFullYear(d.getFullYear()+5); break;
  }
  return d.toISOString().split("T")[0];
}

/* ── PicTagInput ───────────────────────────────────────────────── */
function PicTagInput({ value, onChange, workers }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const selected = normalizePic(value);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const available = workers.filter(w => !selected.includes(w.nama) && (!query || w.nama.toLowerCase().includes(query.toLowerCase())));

  const add = (name) => { onChange([...selected, name]); setQuery(""); };
  const remove = (name) => onChange(selected.filter(n => n !== name));

  return (
    <div ref={ref} className="relative min-w-[200px]">
      <div
        onClick={() => setOpen(o => !o)}
        className="flex flex-wrap gap-1 bg-bg-dark border border-border-color rounded-lg px-2 py-1.5 cursor-pointer hover:border-[#FF7043] transition-colors min-h-[34px]"
      >
        {selected.length === 0 && <span className="text-text-secondary text-xs self-center">— Pilih PIC —</span>}
        {selected.map(name => (
          <span key={name} className="flex items-center gap-1 bg-[#FF7043]/20 text-[#FF7043] border border-[#FF7043]/30 rounded px-1.5 py-0.5 text-xs font-medium">
            {name}
            <button onClick={(e) => { e.stopPropagation(); remove(name); }} className="hover:text-white"><X size={10}/></button>
          </span>
        ))}
        <ChevronDown size={12} className="ml-auto self-center text-text-secondary shrink-0"/>
      </div>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-bg-surface border border-border-color rounded-xl shadow-2xl w-56 max-h-52 overflow-y-auto">
          <div className="p-2 sticky top-0 bg-bg-surface border-b border-border-color">
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Cari pekerja..."
              className="w-full bg-bg-dark border border-border-color rounded-lg px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-[#FF7043]"
              onClick={e => e.stopPropagation()}
            />
          </div>
          {available.length === 0
            ? <div className="px-3 py-4 text-xs text-text-secondary text-center">Tidak ada pekerja tersedia</div>
            : available.map(w => (
              <button key={w.id} onClick={() => add(w.nama)} className="w-full text-left px-3 py-2 text-xs text-text-primary hover:bg-btn-secondary transition-colors">
                {w.nama} <span className="text-text-secondary">({w.jabatan || w.role || ""})</span>
              </button>
            ))
          }
        </div>
      )}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */
function MaintenanceSchedule() {
  const [plans, setPlans] = useState([]);
  const [records, setRecords] = useState({});
  const [workers, setWorkers] = useState([]);
  const [timeToggle, setTimeToggle] = useState("All");
  const [customDateFilter, setCustomDateFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const [currentDate, setCurrentDate] = useState(new Date());

  const reload = () => {
    const p = loadPlans();
    setPlans(p.length ? p : getDefaults());
    setRecords(loadRecords());
    const w = JSON.parse(localStorage.getItem("mx_workers") || "[]");
    setWorkers(w);
  };

  const getDefaults = () => {
    const defaults = [
      { id:"MP-001", areaId:"AREA-01", areaName:"Lantai Produksi", assetId:"EQ-1001", assetName:"Pompa Distribusi", taskDescription:"Pemeriksaan pelumasan dan kebocoran", frequency:"Monthly", startDate:"2026-08-01", nextDate:"2026-09-01", pic:[], status:"Active" },
      { id:"MP-002", areaId:"AREA-02", areaName:"Ruang Boiler", assetId:"EQ-1005", assetName:"Boiler Utama", taskDescription:"Pengecekan tekanan dan overhaul tahunan", frequency:"Annual", startDate:"2026-01-15", nextDate:"2027-01-15", pic:[], status:"Active" },
      { id:"MP-003", areaId:"AREA-01", areaName:"Lantai Produksi", assetId:"EQ-1010", assetName:"Filter RO", taskDescription:"Penggantian membran filter", frequency:"Weekly", startDate:"2026-08-04", nextDate:"2026-08-11", pic:[], status:"Active" },
    ];
    savePlans(defaults);
    return defaults;
  };

  useEffect(() => { reload(); }, []);

  const updatePic = (planId, picArray) => {
    const updated = plans.map(p => p.id === planId ? { ...p, pic: picArray } : p);
    setPlans(updated);
    savePlans(updated);
  };

  const getTaskStatus = (planId) => (records[planId]?.status) || "Open";

  const today = new Date();
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate()-1);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate()+1);
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

  const isScheduledOnDate = (startDateStr, frequency, targetDateStr) => {
    if (!startDateStr || !targetDateStr) return false;
    const start = new Date(startDateStr); start.setHours(0,0,0,0);
    const target = new Date(targetDateStr); target.setHours(0,0,0,0);
    if (target < start) return false;
    const diffDays = Math.round((target - start) / 86400000);
    switch (frequency) {
      case "Daily": return true;
      case "Weekly": return diffDays % 7 === 0;
      case "Monthly": return start.getDate() === target.getDate();
      case "Quarterly": { const md=(target.getFullYear()-start.getFullYear())*12+target.getMonth()-start.getMonth(); return start.getDate()===target.getDate()&&md%3===0; }
      case "Semester": { const md=(target.getFullYear()-start.getFullYear())*12+target.getMonth()-start.getMonth(); return start.getDate()===target.getDate()&&md%6===0; }
      case "Annual": return start.getDate()===target.getDate()&&start.getMonth()===target.getMonth();
      case "Trienial": return start.getDate()===target.getDate()&&start.getMonth()===target.getMonth()&&(target.getFullYear()-start.getFullYear())%3===0;
      case "Quinquenial": return start.getDate()===target.getDate()&&start.getMonth()===target.getMonth()&&(target.getFullYear()-start.getFullYear())%5===0;
      default: return false;
    }
  };

  const isOverdue = (nd) => nd && new Date(nd) < new Date();
  const isDueThisWeek = (nd) => { if (!nd) return false; const n=new Date(nd),t=new Date(),w=new Date(); w.setDate(t.getDate()+7); return n>=t&&n<=w; };

  const filtered = plans.filter(p => {
    const matchSearch = !searchQuery || p.assetName.toLowerCase().includes(searchQuery.toLowerCase()) || p.areaName.toLowerCase().includes(searchQuery.toLowerCase()) || p.taskDescription.toLowerCase().includes(searchQuery.toLowerCase());
    let matchTime = true;
    if (timeToggle === "Today") matchTime = isScheduledOnDate(p.startDate, p.frequency, fmt(today));
    else if (timeToggle === "Yesterday") matchTime = isScheduledOnDate(p.startDate, p.frequency, fmt(yesterday));
    else if (timeToggle === "Tomorrow") matchTime = isScheduledOnDate(p.startDate, p.frequency, fmt(tomorrow));
    else if (timeToggle === "Custom" && customDateFilter) matchTime = isScheduledOnDate(p.startDate, p.frequency, customDateFilter);
    return matchSearch && matchTime;
  });

  /* Calendar */
  const getDaysInMonth = (y,m) => new Date(y,m+1,0).getDate();
  const getFirstDay = (y,m) => { const fd=new Date(y,m,1).getDay(); return fd===0?6:fd-1; };
  const plansForDay = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return plans.filter(p => isScheduledOnDate(p.startDate, p.frequency, dateStr));
  };
  const renderCalendar = () => {
    const y=currentDate.getFullYear(), m=currentDate.getMonth();
    const daysInMonth=getDaysInMonth(y,m), offset=getFirstDay(y,m);
    const cells = [];
    for (let i=0;i<offset;i++) cells.push(<div key={`e-${i}`} className="min-h-[80px] bg-bg-dark/30 border border-border-color p-1"/>);
    for (let d=1;d<=daysInMonth;d++) {
      const dayPlans=plansForDay(d);
      const isToday = d===today.getDate()&&m===today.getMonth()&&y===today.getFullYear();
      cells.push(
        <div key={d} className={`min-h-[80px] border border-border-color p-1.5 transition-colors hover:bg-btn-secondary/50 ${isToday?"ring-2 ring-[#FF7043] ring-inset":"bg-bg-surface"}`}>
          <span className={`text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full mb-1 ${isToday?"bg-[#FF7043] text-white":"text-text-secondary"}`}>{d}</span>
          {dayPlans.map(p => (
            <div key={p.id} className="text-[10px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 truncate mb-0.5" title={p.taskDescription}>{p.assetName}</div>
          ))}
        </div>
      );
    }
    const rem=(7-(cells.length%7))%7;
    for (let i=0;i<rem;i++) cells.push(<div key={`en-${i}`} className="min-h-[80px] bg-bg-dark/30 border border-border-color p-1"/>);
    return cells;
  };

  return (
    <div className="flex flex-col h-full gap-4 text-text-primary font-sans">

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-start items-start sm:items-center bg-bg-surface p-4 rounded-xl border border-border-color shadow gap-3">
        <div className="flex gap-3 flex-wrap items-center w-full">
          <div className="flex border border-border-color rounded-lg overflow-hidden shrink-0">
            {[["All","Semua"],["Yesterday","Kemarin"],["Today","Hari Ini"],["Tomorrow","Besok"]].map(([k,l]) => (
              <button key={k} onClick={() => { setTimeToggle(k); setCustomDateFilter(""); }} className={`px-3 py-2 text-sm font-medium transition-colors ${timeToggle===k&&!customDateFilter?"bg-[#FF7043] text-white":"bg-bg-dark text-text-secondary hover:bg-btn-secondary"}`}>{l}</button>
            ))}
          </div>
          <input type="date" value={customDateFilter} onChange={(e) => { setCustomDateFilter(e.target.value); setTimeToggle("Custom"); }} className="bg-bg-dark border border-border-color rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-[#FF7043] shrink-0"/>
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={15}/>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari jadwal..." className="bg-bg-dark border border-border-color rounded-lg py-2 pl-8 pr-3 text-sm focus:outline-none focus:border-[#FF7043] w-48"/>
          </div>
          <div className="flex border border-border-color rounded-lg overflow-hidden shrink-0">
            <button onClick={() => setViewMode("table")} className={`px-3 py-2 text-sm transition-colors ${viewMode==="table"?"bg-[#FF7043] text-white":"bg-bg-dark text-text-secondary hover:bg-btn-secondary"}`}>Tabel</button>
            <button onClick={() => setViewMode("calendar")} className={`px-3 py-2 text-sm transition-colors ${viewMode==="calendar"?"bg-[#FF7043] text-white":"bg-bg-dark text-text-secondary hover:bg-btn-secondary"}`}>Kalender</button>
          </div>
        </div>
      </div>


      {/* Content */}
      {viewMode === "table" ? (
        <div className="bg-bg-surface rounded-xl border border-border-color shadow overflow-hidden flex-1 flex flex-col">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-bg-dark text-text-secondary border-b border-border-color">
                <tr>
                  <th className="px-4 py-3 font-medium">Kode Area/Lokasi</th>
                  <th className="px-4 py-3 font-medium">Nama Lokasi/Area</th>
                  <th className="px-4 py-3 font-medium">Nama Asset</th>
                  <th className="px-4 py-3 font-medium">Task Description</th>
                  <th className="px-4 py-3 font-medium">Frequency</th>
                  <th className="px-4 py-3 font-medium">PIC (Multi)</th>
                  <th className="px-4 py-3 font-medium">Status Task</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color">
                {filtered.length === 0 ? (
                  <tr><td colSpan="7" className="px-6 py-12 text-center text-text-secondary">Tidak ada jadwal yang ditemukan.</td></tr>
                ) : filtered.map(plan => {
                  const ts = getTaskStatus(plan.id);
                  const overdue = isOverdue(plan.nextDate);
                  return (
                    <tr key={plan.id} className={`hover:bg-btn-secondary/50 transition-colors ${overdue && ts !== "Done" ? "bg-red-500/5" : ""}`}>
                      <td className="px-4 py-3 text-text-secondary font-mono text-xs">{plan.plantCode || plan.areaId || "-"}</td>
                      <td className="px-4 py-3 font-medium">{plan.areaName}</td>
                      <td className="px-4 py-3 font-medium text-blue-400">{plan.assetName}</td>
                      <td className="px-4 py-3 text-text-secondary max-w-[200px]" style={{whiteSpace:"normal"}}>{plan.taskDescription}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-semibold ${FREQ_COLORS[plan.frequency]||"bg-gray-500/20 text-gray-400"}`}>{plan.frequency}</span></td>
                      <td className="px-4 py-3">
                        <PicTagInput value={plan.pic} onChange={(v) => updatePic(plan.id, v)} workers={workers}/>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${TASK_STATUS_COLORS[ts]||TASK_STATUS_COLORS["Open"]}`}>{ts}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-bg-surface rounded-xl border border-border-color shadow flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-color">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()-1, 1))} className="p-2 hover:bg-btn-secondary rounded-lg transition-colors"><ChevronLeft size={18}/></button>
            <span className="font-bold">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 1))} className="p-2 hover:bg-btn-secondary rounded-lg transition-colors"><ChevronRight size={18}/></button>
          </div>
          <div className="grid grid-cols-7 bg-bg-dark border-b border-border-color">
            {["Sen","Sel","Rab","Kam","Jum","Sab","Min"].map(d => <div key={d} className="py-2 text-center text-xs text-text-secondary font-semibold">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 flex-1 overflow-y-auto">{renderCalendar()}</div>
        </div>
      )}
    </div>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<MaintenanceSchedule/>);
