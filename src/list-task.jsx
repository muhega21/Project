import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { CheckCircle, Clock, AlertTriangle, Search, Upload, X, Camera, FileText } from "lucide-react";
import { loadPlans, loadRecords, setStatus as storeSetStatus, getRecord, getElapsedDays, normalizePic, isScheduledOnDate } from "./maintenance-store.js";

const STATUS_OPTIONS = ["All","On Progress","Open","Waiting on Part"];
const FREQ_COLORS = {
  Daily:"bg-red-500/20 text-red-400", Weekly:"bg-orange-500/20 text-orange-400",
  Monthly:"bg-blue-500/20 text-blue-400", Quarterly:"bg-purple-500/20 text-purple-400",
  Semester:"bg-indigo-500/20 text-indigo-400", Annual:"bg-green-500/20 text-green-400",
  Trienial:"bg-teal-500/20 text-teal-400", Quinquenial:"bg-cyan-500/20 text-cyan-400",
};

function computeNextDate(startDate, frequency) {
  const d = new Date(startDate);
  if (isNaN(d)) return null;
  switch (frequency) {
    case "Daily": d.setDate(d.getDate()+1); break;
    case "Weekly": d.setDate(d.getDate()+7); break;
    case "Monthly": d.setMonth(d.getMonth()+1); break;
    case "Quarterly": d.setMonth(d.getMonth()+3); break;
    case "Semester": d.setMonth(d.getMonth()+6); break;
    case "Annual": d.setFullYear(d.getFullYear()+1); break;
    case "Trienial": d.setFullYear(d.getFullYear()+3); break;
    case "Quinquenial": d.setFullYear(d.getFullYear()+5); break;
    default: break;
  }
  return d.toISOString().split("T")[0];
}

function isOverdue(targetDateStr, status) {
  if (status === "Done") return false;
  return targetDateStr && new Date(targetDateStr) < new Date(new Date().toDateString());
}


/* ── Done Modal ─────────────────────────────────────────────────── */
function DoneModal({ plan, onConfirm, onCancel }) {
  const [photos, setPhotos] = useState([]);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const processFiles = (files) => {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const max = 800;
          let w = img.width, h = img.height;
          if (w > max) { h = h*max/w; w = max; }
          if (h > max) { w = w*max/h; h = max; }
          canvas.width = w; canvas.height = h;
          canvas.getContext("2d").drawImage(img, 0, 0, w, h);
          const b64 = canvas.toDataURL("image/jpeg", 0.75);
          setPhotos(prev => [...prev, b64]);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1A2028] border border-border-color rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-color bg-[#12161A] rounded-t-2xl">
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-green-400"/>
            <h3 className="text-lg font-bold text-white">Konfirmasi: Task Selesai</h3>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-white"><X size={22}/></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {/* Task info */}
          <div className="bg-black/30 border border-border-color rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">Task Description</div>
            <div className="text-white font-medium">{plan.taskDescription}</div>
            <div className="flex gap-4 mt-3">
              <div><span className="text-xs text-gray-400">Asset: </span><span className="text-sm text-blue-400">{plan.assetName}</span></div>
              <div><span className="text-xs text-gray-400">Area: </span><span className="text-sm text-white">{plan.areaName}</span></div>
            </div>
          </div>

          {/* Upload area */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Camera size={16} className="text-orange-400"/>
              <span className="text-sm font-semibold text-white">Foto Bukti Hasil Kerja <span className="text-red-400">*</span></span>
              <span className="text-xs text-gray-500">(minimal 1 foto wajib)</span>
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); processFiles(e.dataTransfer.files); }}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${dragging ? "border-green-400 bg-green-400/10" : "border-border-color hover:border-green-400/60 hover:bg-green-400/5"}`}
            >
              <Upload size={28} className="mx-auto mb-2 text-gray-500"/>
              <p className="text-sm text-gray-400">Drag & drop foto, atau <span className="text-green-400 font-medium">klik untuk pilih</span></p>
              <p className="text-xs text-gray-600 mt-1">JPG, PNG • Max 5MB per foto</p>
              <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={e => processFiles(e.target.files)}/>
            </div>

            {/* Previews */}
            {photos.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3">
                {photos.map((src, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border-color group">
                    <img src={src} alt={`Foto ${i+1}`} className="w-full h-full object-cover"/>
                    <button onClick={() => setPhotos(p => p.filter((_,j) => j!==i))} className="absolute inset-0 bg-black/60 hidden group-hover:flex items-center justify-center text-red-400">
                      <X size={18}/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border-color bg-[#12161A] rounded-b-2xl">
          <span className="text-xs text-gray-500">{photos.length > 0 ? `${photos.length} foto terlampir ✓` : "Belum ada foto"}</span>
          <div className="flex gap-3">
            <button onClick={onCancel} className="px-5 py-2.5 bg-btn-secondary hover:bg-gray-700 text-white rounded-lg border border-border-color transition-colors font-medium">Batal</button>
            <button
              disabled={photos.length === 0}
              onClick={() => onConfirm(photos)}
              className={`px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all ${photos.length > 0 ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer" : "bg-gray-700 text-gray-500 cursor-not-allowed"}`}
            >
              <CheckCircle size={16}/>
              Konfirmasi Selesai
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Waiting Modal ───────────────────────────────────────────────── */
function WaitingModal({ plan, onConfirm, onCancel }) {
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1A2028] border border-border-color rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-color bg-[#12161A] rounded-t-2xl">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-yellow-400"/>
            <h3 className="text-lg font-bold text-white">Waiting on Part — Kendala</h3>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-white"><X size={22}/></button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="bg-black/30 border border-border-color rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">Task</div>
            <div className="text-white text-sm font-medium">{plan.taskDescription}</div>
          </div>
          <div>
            <label className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
              <FileText size={14} className="text-yellow-400"/>
              Alasan / Kendala Part <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={4}
              placeholder="Tuliskan alasan mengapa part belum tersedia (e.g. part dalam pemesanan, part langka, menunggu approval, dll)..."
              className="w-full bg-[#12161A] border border-border-color text-white px-4 py-3 rounded-xl outline-none focus:border-yellow-400 resize-none text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">{reason.length} karakter</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-color bg-[#12161A] rounded-b-2xl">
          <button onClick={onCancel} className="px-5 py-2.5 bg-btn-secondary hover:bg-gray-700 text-white rounded-lg border border-border-color transition-colors font-medium">Batal</button>
          <button
            disabled={reason.trim().length < 5}
            onClick={() => onConfirm(reason.trim())}
            className={`px-5 py-2.5 rounded-lg font-medium transition-all ${reason.trim().length >= 5 ? "bg-yellow-600 hover:bg-yellow-700 text-white cursor-pointer" : "bg-gray-700 text-gray-500 cursor-not-allowed"}`}
          >
            Simpan Alasan
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */
function ListTask() {
  const [plans, setPlans] = useState([]);
  const [records, setRecords] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [timeFilter, setTimeFilter] = useState("today");
  const [doneModal, setDoneModal] = useState(null);   // plan object
  const [waitingModal, setWaitingModal] = useState(null); // plan object
  const [tick, setTick] = useState(0); // force re-render for elapsed timer

  const reload = () => {
    const p = loadPlans();
    if (!p.length) {
      const defaults = [
        { id:"MP-001", areaId:"AREA-01", areaName:"Lantai Produksi", assetId:"EQ-1001", assetName:"Pompa Distribusi", taskDescription:"Pemeriksaan pelumasan dan kebocoran", frequency:"Monthly", startDate:"2026-08-12", nextDate:computeNextDate("2026-08-12","Monthly"), pic:[], status:"Active" },
        { id:"MP-002", areaId:"AREA-02", areaName:"Ruang Boiler", assetId:"EQ-1005", assetName:"Boiler Utama", taskDescription:"Pengecekan tekanan dan overhaul tahunan", frequency:"Annual", startDate:"2026-08-11", nextDate:computeNextDate("2026-08-11","Annual"), pic:[], status:"Active" },
        { id:"MP-003", areaId:"AREA-01", areaName:"Lantai Produksi", assetId:"EQ-1010", assetName:"Filter RO", taskDescription:"Penggantian membran filter", frequency:"Weekly", startDate:"2026-08-13", nextDate:computeNextDate("2026-08-13","Weekly"), pic:[], status:"Active" },
        { id:"MP-004", areaId:"AREA-03", areaName:"Panel Kontrol", assetId:"EQ-2001", assetName:"Sensor Suhu", taskDescription:"Kalibrasi sensor", frequency:"Quarterly", startDate:"2026-08-10", nextDate:computeNextDate("2026-08-10","Quarterly"), pic:[], status:"Active" },
      ];
      setPlans(defaults);
    } else setPlans(p);
    setRecords(loadRecords());
  };

  useEffect(() => {
    reload();
    const interval = setInterval(() => setTick(t => t+1), 60000); // refresh elapsed every minute
    return () => clearInterval(interval);
  }, []);

  const getTargetDateStr = () => {
    const today = new Date();
    const targetDate = new Date(today);
    if (timeFilter === "yesterday") targetDate.setDate(today.getDate() - 1);
    if (timeFilter === "tomorrow") targetDate.setDate(today.getDate() + 1);
    return `${targetDate.getFullYear()}-${String(targetDate.getMonth()+1).padStart(2,"0")}-${String(targetDate.getDate()).padStart(2,"0")}`;
  };

  const getTaskStatus = (planId, targetDateStr) => {
    const key = `${planId}_${targetDateStr}`;
    return records[key]?.status || "Open";
  };

  // Smart status handler
  const handleStatusChange = (plan, newStatus) => {
    const targetDateStr = getTargetDateStr();
    const current = getTaskStatus(plan.id, targetDateStr);
    if (newStatus === current) return;
    if (newStatus === "Done") { setDoneModal(plan); return; }
    if (newStatus === "Waiting on Part") { setWaitingModal(plan); return; }
    // On Progress or Open — direct
    storeSetStatus(plan.id, targetDateStr, newStatus);
    setRecords(loadRecords());
  };

  const confirmDone = (plan, photos) => {
    const targetDateStr = getTargetDateStr();
    storeSetStatus(plan.id, targetDateStr, "Done", { evidencePhotos: photos });
    setDoneModal(null);
    setRecords(loadRecords());
  };

  const confirmWaiting = (plan, reason) => {
    const targetDateStr = getTargetDateStr();
    storeSetStatus(plan.id, targetDateStr, "Waiting on Part", { waitingReason: reason });
    setWaitingModal(null);
    setRecords(loadRecords());
  };

  const filtered = plans.filter(plan => {
    const targetDateStr = getTargetDateStr();
    const status = getTaskStatus(plan.id, targetDateStr);
    
    // Sembunyikan "Done" kecuali sedang difilter khusus "Done"
    if (status === "Done" && statusFilter !== "Done") return false;
    
    const isTaskOverdue = isOverdue(targetDateStr, status);
    if (statusFilter === "Overdue" && !isTaskOverdue) return false;
    
    const matchStatus = statusFilter === "All" || statusFilter === "Overdue" || status === statusFilter;
    const matchSearch = !searchQuery || plan.assetName.toLowerCase().includes(searchQuery.toLowerCase()) || plan.areaName.toLowerCase().includes(searchQuery.toLowerCase()) || plan.taskDescription.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchTime = isScheduledOnDate(plan.startDate, plan.frequency, targetDateStr);
    
    return matchStatus && matchSearch && matchTime;
  });

  const getStatusBadge = (plan) => {
    const targetDateStr = getTargetDateStr();
    const status = getTaskStatus(plan.id, targetDateStr);
    const overdue = isOverdue(targetDateStr, status);
    const map = {
      "Done": <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs border border-green-500/40 flex items-center gap-1 w-fit"><CheckCircle size={11}/> Done</span>,
      "On Progress": <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs border border-blue-500/40 flex items-center gap-1 w-fit"><Clock size={11}/> On Progress</span>,
      "Waiting on Part": <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs border border-yellow-500/40 flex items-center gap-1 w-fit"><AlertTriangle size={11}/> Waiting on Part</span>,
      "Open": <span className="px-2 py-1 bg-gray-500/20 text-text-secondary rounded text-xs border border-gray-500/40 flex items-center gap-1 w-fit">Open</span>,
    };
    return <div className="flex flex-col gap-1">{map[status]||map["Open"]}{overdue && <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px] border border-red-500/40 flex items-center gap-1 w-fit"><AlertTriangle size={10}/> OVERDUE</span>}</div>;
  };

  const getElapsedBadge = (plan) => {
    const targetDateStr = getTargetDateStr();
    const key = `${plan.id}_${targetDateStr}`;
    const rec = records[key];
    
    const startDate = (rec && rec.startedAt) ? new Date(rec.startedAt) : new Date(targetDateStr);
    const endDate = (rec && rec.doneAt) ? new Date(rec.doneAt) : new Date();
    
    startDate.setHours(0,0,0,0);
    endDate.setHours(0,0,0,0);
    
    const days = Math.floor((endDate - startDate) / 86400000);
    const displayDays = Math.max(0, days);
    const color = displayDays <= 1 ? "text-green-400" : displayDays <= 3 ? "text-yellow-400" : "text-red-400";
    
    return (
      <div>
        <span className={`text-sm font-bold ${color}`}>{displayDays} hari</span>
        {rec && rec.status !== "Done" && rec.startedAt && <span className="block text-[10px] font-normal text-gray-500">{new Date(rec.startedAt).toLocaleDateString("id-ID")}</span>}
      </div>
    );
  };

  const statCounts = {
    all: plans.filter(p => isScheduledOnDate(p.startDate, p.frequency, getTargetDateStr())).length,
    open: plans.filter(p => isScheduledOnDate(p.startDate, p.frequency, getTargetDateStr()) && getTaskStatus(p.id, getTargetDateStr()) === "Open").length,
    onProgress: plans.filter(p => isScheduledOnDate(p.startDate, p.frequency, getTargetDateStr()) && getTaskStatus(p.id, getTargetDateStr()) === "On Progress").length,
    done: plans.filter(p => isScheduledOnDate(p.startDate, p.frequency, getTargetDateStr()) && getTaskStatus(p.id, getTargetDateStr()) === "Done").length,
    waiting: plans.filter(p => isScheduledOnDate(p.startDate, p.frequency, getTargetDateStr()) && getTaskStatus(p.id, getTargetDateStr()) === "Waiting on Part").length,
    overdue: plans.filter(p => isScheduledOnDate(p.startDate, p.frequency, getTargetDateStr()) && isOverdue(getTargetDateStr(), getTaskStatus(p.id, getTargetDateStr()))).length,
  };

  const timeTabs = [["yesterday","Kemarin"],["today","Hari Ini"],["tomorrow","Besok"]];

  return (
    <div className="flex flex-col h-full gap-4 text-text-primary font-sans">

      {/* Modals */}
      {doneModal && <DoneModal plan={doneModal} onConfirm={(photos) => confirmDone(doneModal, photos)} onCancel={() => setDoneModal(null)}/>}
      {waitingModal && <WaitingModal plan={waitingModal} onConfirm={(reason) => confirmWaiting(waitingModal, reason)} onCancel={() => setWaitingModal(null)}/>}


      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[
          { label:"Total", filter:"All", value:statCounts.all, color:"text-text-primary" },
          { label:"Open", filter:"Open", value:statCounts.open, color:"text-text-secondary" },
          { label:"On Progress", filter:"On Progress", value:statCounts.onProgress, color:"text-blue-400" },
          { label:"Done", filter:"Done", value:statCounts.done, color:"text-green-400" },
          { label:"Waiting Part", filter:"Waiting on Part", value:statCounts.waiting, color:"text-yellow-400" },
          { label:"Overdue", filter:"Overdue", value:statCounts.overdue, color:"text-red-400" },
        ].map((s,i) => (
          <div key={i} onClick={() => setStatusFilter(s.filter)} className={`cursor-pointer bg-bg-surface border rounded-xl p-3 text-center transition-colors hover:border-[#FF7043] ${statusFilter === s.filter ? "border-[#FF7043] ring-1 ring-[#FF7043]" : "border-border-color"}`}>
            <div className="text-text-secondary text-xs mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Time Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-bg-surface border border-border-color rounded-xl px-4 py-2">
        <Clock size={16} className="text-text-secondary"/>
        <div className="flex gap-1">
          {timeTabs.map(([k,l]) => (
            <button key={k} onClick={() => setTimeFilter(k)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${timeFilter===k?"bg-[#FF7043] text-white":"text-text-secondary hover:bg-btn-secondary"}`}>{l}</button>
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
                <th className="px-4 py-3 font-medium">Kode Area</th>
                <th className="px-4 py-3 font-medium">Lokasi/Area</th>
                <th className="px-4 py-3 font-medium">Nama Asset</th>
                <th className="px-4 py-3 font-medium">Task Description</th>
                <th className="px-4 py-3 font-medium">Interval</th>
                <th className="px-4 py-3 font-medium">PIC</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Durasi</th>
                <th className="px-4 py-3 font-medium">Update Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {filtered.length === 0 ? (
                <tr><td colSpan="10" className="px-6 py-12 text-center text-text-secondary">Tidak ada task yang sesuai filter.</td></tr>
              ) : filtered.map((plan, idx) => {
                const targetDateStr = getTargetDateStr();
                const status = getTaskStatus(plan.id, targetDateStr);
                const overdue = isOverdue(targetDateStr, status);
                const key = `${plan.id}_${targetDateStr}`;
                const pic = records[key]?.pic !== undefined && records[key]?.pic !== null ? records[key].pic : plan.pic;
                const pics = normalizePic(pic);
                return (
                  <tr key={plan.id} className={`hover:bg-btn-secondary/50 transition-colors ${overdue&&status!=="Done"?"bg-red-500/5":""}`}>
                    <td className="px-4 py-3 text-text-secondary font-mono text-xs">{idx+1}</td>
                    <td className="px-4 py-3 text-text-secondary">{plan.plantCode||plan.areaId||"-"}</td>
                    <td className="px-4 py-3 font-medium">{plan.areaName}</td>
                    <td className="px-4 py-3 font-medium text-blue-400">{plan.assetName}</td>
                    <td className="px-4 py-3 text-text-secondary max-w-[180px] truncate" title={plan.taskDescription}>{plan.taskDescription}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-semibold ${FREQ_COLORS[plan.frequency]||"bg-gray-500/20 text-gray-400"}`}>{plan.frequency}</span></td>
                    <td className="px-4 py-3">
                      {pics.length > 0
                        ? <div className="flex flex-wrap gap-1">{pics.map(n => <span key={n} className="px-1.5 py-0.5 bg-[#FF7043]/20 text-[#FF7043] border border-[#FF7043]/30 rounded text-xs">{n}</span>)}</div>
                        : <span className="text-gray-600 text-xs">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(plan)}</td>
                    <td className="px-4 py-3">{getElapsedBadge(plan)}</td>
                    <td className="px-4 py-3">
                      {status !== "Done" ? (
                        <select
                          value={status}
                          onChange={(e) => handleStatusChange(plan, e.target.value)}
                          className="bg-bg-dark border border-border-color rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#FF7043]"
                        >
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <span className="text-gray-500 text-xs italic">Read-only (Selesai)</span>
                      )}
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

const root = createRoot(document.getElementById("root"));
root.render(<ListTask/>);
