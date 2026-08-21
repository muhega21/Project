import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { CheckCircle, Clock, AlertTriangle, Search, Upload, X, Camera, FileText, CalendarDays } from "lucide-react";
import { loadPlans, loadRecords, setStatus as storeSetStatus, normalizePic, isScheduledOnDate } from "./maintenance-store.js";

const FREQ_COLORS = {
  Daily:"bg-red-500/20 text-red-400", Weekly:"bg-orange-500/20 text-orange-400",
  Monthly:"bg-blue-500/20 text-blue-400", Quarterly:"bg-purple-500/20 text-purple-400",
  Semester:"bg-indigo-500/20 text-indigo-400", Annual:"bg-green-500/20 text-green-400",
  Trienial:"bg-teal-500/20 text-teal-400", Quinquenial:"bg-cyan-500/20 text-cyan-400",
};

/** Hitung apakah task overdue: tanggal jadwal sudah lewat (< hari ini) dan belum Done */
function isOverdue(targetDateStr, status) {
  if (status === "Done") return false;
  if (!targetDateStr) return false;
  const target = new Date(targetDateStr); target.setHours(0,0,0,0);
  const today = new Date(); today.setHours(0,0,0,0);
  return target < today;
}

/** Format date YYYY-MM-DD dari object Date */
function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

/** Format tanggal ke "DD Mon YYYY" */
function displayDate(str) {
  if (!str) return "-";
  return new Date(str).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" });
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
          setPhotos(prev => [...prev, canvas.toDataURL("image/jpeg", 0.75)]);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#1A2028] border border-border-color rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-color bg-[#12161A] rounded-t-2xl">
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-green-400"/>
            <h3 className="text-lg font-bold text-white">Konfirmasi: Task Selesai</h3>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-white"><X size={22}/></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          <div className="bg-black/30 border border-border-color rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">Task Description</div>
            <div className="text-white font-medium">{plan.taskDescription}</div>
            <div className="flex gap-4 mt-3">
              <div><span className="text-xs text-gray-400">Asset: </span><span className="text-sm text-blue-400">{plan.assetName}</span></div>
              <div><span className="text-xs text-gray-400">Area: </span><span className="text-sm text-white">{plan.areaName}</span></div>
            </div>
          </div>
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
              <p className="text-sm text-gray-400">Drag &amp; drop foto, atau <span className="text-green-400 font-medium">klik untuk pilih</span></p>
              <p className="text-xs text-gray-600 mt-1">JPG, PNG • Max 5MB per foto</p>
              <input ref={fileRef} type="file" multiple accept="image/*" className="hidden" onChange={e => processFiles(e.target.files)}/>
            </div>
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
        <div className="flex items-center justify-between px-6 py-4 border-t border-border-color bg-[#12161A] rounded-b-2xl">
          <span className="text-xs text-gray-500">{photos.length > 0 ? `${photos.length} foto terlampir ✓` : "Belum ada foto"}</span>
          <div className="flex gap-3">
            <button onClick={onCancel} className="px-5 py-2.5 bg-btn-secondary hover:bg-gray-700 text-white rounded-lg border border-border-color transition-colors font-medium">Batal</button>
            <button
              disabled={photos.length === 0}
              onClick={() => onConfirm(photos)}
              className={`px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all ${photos.length > 0 ? "bg-green-600 hover:bg-green-700 text-white cursor-pointer" : "bg-gray-700 text-gray-500 cursor-not-allowed"}`}
            >
              <CheckCircle size={16}/>Konfirmasi Selesai
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
              placeholder="Tuliskan alasan mengapa part belum tersedia..."
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
  const [plans, setPlans]         = useState([]);
  const [records, setRecords]     = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [timeFilter, setTimeFilter]     = useState("today");
  const [doneModal, setDoneModal]       = useState(null); // { plan, targetDateStr }
  const [waitingModal, setWaitingModal] = useState(null); // { plan, targetDateStr }

  const reload = () => {
    setPlans(loadPlans());
    setRecords(loadRecords());
  };

  useEffect(() => {
    reload();
    const iv = setInterval(reload, 60000);
    return () => clearInterval(iv);
  }, []);

  /* ── Date helpers ──────────────────────────────────────────── */
  const todayStr    = fmtDate(new Date());
  const yesterdayStr = fmtDate(Object.assign(new Date(), { date: new Date().getDate()-1 }) && (() => { const d = new Date(); d.setDate(d.getDate()-1); return d; })());
  const tomorrowStr  = (() => { const d = new Date(); d.setDate(d.getDate()+1); return fmtDate(d); })();

  const getSingleTargetDate = () => {
    if (timeFilter === "yesterday") return yesterdayStr;
    if (timeFilter === "tomorrow")  return tomorrowStr;
    return todayStr; // "today" default
  };

  const getTaskStatus = (planId, dateStr) => {
    const key = `${planId}_${dateStr}`;
    return records[key]?.status || "Open";
  };

  /* ── Build instances (per plan per date) ──────────────────── */
  const buildInstances = () => {
    const datesToScan = timeFilter === "all"
      ? [yesterdayStr, todayStr, tomorrowStr]
      : [getSingleTargetDate()];

    const inst = [];
    plans.forEach(plan => {
      datesToScan.forEach(dateStr => {
        if (!isScheduledOnDate(plan.startDate, plan.frequency, dateStr)) return;
        const status = getTaskStatus(plan.id, dateStr);
        // Filter "Semua": hanya tampilkan yang belum Done
        if (timeFilter === "all" && status === "Done") return;
        inst.push({ plan, targetDateStr: dateStr });
      });
    });
    return inst;
  };

  const instances = buildInstances();

  /* ── Filtered instances ───────────────────────────────────── */
  const filtered = instances.filter(({ plan, targetDateStr }) => {
    const status = getTaskStatus(plan.id, targetDateStr);

    // Untuk filter waktu spesifik (bukan "all"): sembunyikan Done kecuali filter Done diklik
    if (timeFilter !== "all" && status === "Done" && statusFilter !== "Done") return false;

    const overdue = isOverdue(targetDateStr, status);
    if (statusFilter === "Overdue" && !overdue) return false;

    const matchStatus = statusFilter === "All" || statusFilter === "Overdue" || status === statusFilter;
    const matchSearch = !searchQuery
      || plan.assetName.toLowerCase().includes(searchQuery.toLowerCase())
      || plan.areaName.toLowerCase().includes(searchQuery.toLowerCase())
      || plan.taskDescription.toLowerCase().includes(searchQuery.toLowerCase());

    return matchStatus && matchSearch;
  });

  /* ── Stat counts ──────────────────────────────────────────── */
  const statCounts = {
    total:      instances.length,
    open:       instances.filter(({plan,targetDateStr}) => getTaskStatus(plan.id,targetDateStr) === "Open").length,
    onProgress: instances.filter(({plan,targetDateStr}) => getTaskStatus(plan.id,targetDateStr) === "On Progress").length,
    done:       instances.filter(({plan,targetDateStr}) => getTaskStatus(plan.id,targetDateStr) === "Done").length,
    waiting:    instances.filter(({plan,targetDateStr}) => getTaskStatus(plan.id,targetDateStr) === "Waiting on Part").length,
    overdue:    instances.filter(({plan,targetDateStr}) => isOverdue(targetDateStr, getTaskStatus(plan.id,targetDateStr))).length,
  };

  /* ── Status badge ─────────────────────────────────────────── */
  const getStatusBadge = (status, overdue) => {
    const map = {
      "Done":           <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs border border-green-500/40 flex items-center gap-1 w-fit"><CheckCircle size={11}/> Done</span>,
      "On Progress":    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs border border-blue-500/40 flex items-center gap-1 w-fit"><Clock size={11}/> On Progress</span>,
      "Waiting on Part":<span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs border border-yellow-500/40 flex items-center gap-1 w-fit"><AlertTriangle size={11}/> Waiting on Part</span>,
      "Open":           <span className="px-2 py-1 bg-gray-500/20 text-text-secondary rounded text-xs border border-gray-500/40 w-fit">Open</span>,
    };
    return (
      <div className="flex flex-col gap-1">
        {map[status] || map["Open"]}
        {overdue && <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px] border border-red-500/40 flex items-center gap-1 w-fit"><AlertTriangle size={10}/> OVERDUE</span>}
      </div>
    );
  };

  /**
   * Durasi dihitung dari tanggal jadwal (targetDateStr) hingga hari ini.
   * Ini mengukur seberapa lama task tersebut belum diselesaikan sejak jadwalnya.
   * Jika sudah Done, durasi dihitung dari targetDateStr ke doneAt.
   */
  const getDuration = (plan, targetDateStr) => {
    const key = `${plan.id}_${targetDateStr}`;
    const rec = records[key];
    const startD = new Date(targetDateStr); startD.setHours(0,0,0,0);
    const endD   = (rec?.doneAt) ? new Date(rec.doneAt) : new Date();
    endD.setHours(0,0,0,0);
    const days = Math.max(0, Math.floor((endD - startD) / 86400000));
    const color = days === 0 ? "text-green-400" : days <= 3 ? "text-yellow-400" : "text-red-400";
    return <span className={`text-sm font-bold ${color}`}>{days} hari</span>;
  };

  /* ── Status change handler ────────────────────────────────── */
  const handleStatusChange = (plan, targetDateStr, newStatus) => {
    const current = getTaskStatus(plan.id, targetDateStr);
    if (newStatus === current) return;
    if (newStatus === "Done")            { setDoneModal({ plan, targetDateStr }); return; }
    if (newStatus === "Waiting on Part") { setWaitingModal({ plan, targetDateStr }); return; }
    storeSetStatus(plan.id, targetDateStr, newStatus);
    reload();
  };

  const confirmDone = (modalState, photos) => {
    storeSetStatus(modalState.plan.id, modalState.targetDateStr, "Done", { evidencePhotos: photos });
    setDoneModal(null);
    reload();
  };

  const confirmWaiting = (modalState, reason) => {
    storeSetStatus(modalState.plan.id, modalState.targetDateStr, "Waiting on Part", { waitingReason: reason });
    setWaitingModal(null);
    reload();
  };

  const timeTabs = [
    ["all",       "Semua"],
    ["yesterday", "Kemarin"],
    ["today",     "Hari Ini"],
    ["tomorrow",  "Besok"],
  ];

  const statCards = [
    { label:"Total",        filter:"All",              value:statCounts.total,      color:"text-text-primary" },
    { label:"Open",         filter:"Open",             value:statCounts.open,       color:"text-text-secondary" },
    { label:"On Progress",  filter:"On Progress",      value:statCounts.onProgress, color:"text-blue-400" },
    { label:"Done",         filter:"Done",             value:statCounts.done,       color:"text-green-400" },
    { label:"Waiting Part", filter:"Waiting on Part",  value:statCounts.waiting,    color:"text-yellow-400" },
    { label:"Overdue",      filter:"Overdue",          value:statCounts.overdue,    color:"text-red-400" },
  ];

  return (
    <div className="flex flex-col h-full gap-4 text-text-primary font-sans">

      {/* Modals */}
      {doneModal    && <DoneModal    plan={doneModal.plan}    onConfirm={photos  => confirmDone(doneModal, photos)}      onCancel={() => setDoneModal(null)}/>}
      {waitingModal && <WaitingModal plan={waitingModal.plan} onConfirm={reason  => confirmWaiting(waitingModal, reason)} onCancel={() => setWaitingModal(null)}/>}

      {/* Stat Cards */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {statCards.map((s,i) => (
          <div key={i} onClick={() => setStatusFilter(s.filter)}
            className={`cursor-pointer bg-bg-surface border rounded-xl p-3 text-center transition-all hover:border-[#FF7043] ${statusFilter===s.filter?"border-[#FF7043] ring-1 ring-[#FF7043]":"border-border-color"}`}>
            <div className="text-text-secondary text-xs mb-1">{s.label}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-bg-surface border border-border-color rounded-xl px-4 py-2">
        <Clock size={16} className="text-text-secondary shrink-0"/>
        <div className="flex gap-1">
          {timeTabs.map(([k,l]) => (
            <button key={k} onClick={() => { setTimeFilter(k); setStatusFilter("All"); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${timeFilter===k?"bg-[#FF7043] text-white":"text-text-secondary hover:bg-btn-secondary"}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={14}/>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari task..."
            className="bg-bg-dark border border-border-color rounded-lg py-1.5 pl-8 pr-3 text-sm focus:outline-none focus:border-[#FF7043] w-44"
          />
        </div>
      </div>

      {/* Info banner for "Semua" */}
      {timeFilter === "all" && (
        <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-2 text-xs text-blue-300">
          <CalendarDays size={14}/>
          Menampilkan semua task yang <strong className="text-blue-200 mx-1">belum selesai</strong> dari Kemarin, Hari Ini, dan Besok (terintegrasi dengan Jadwal Maintenance)
        </div>
      )}

      {/* Table */}
      <div className="bg-bg-surface rounded-xl border border-border-color shadow overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-bg-dark text-text-secondary border-b border-border-color">
              <tr>
                <th className="px-4 py-3 font-medium">No</th>
                <th className="px-4 py-3 font-medium">Tgl. Jadwal</th>
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
                <tr>
                  <td colSpan="11" className="px-6 py-12 text-center text-text-secondary">
                    {timeFilter === "all"
                      ? "🎉 Semua task sudah selesai atau belum ada jadwal untuk 3 hari ini."
                      : "Tidak ada task yang sesuai filter."}
                  </td>
                </tr>
              ) : filtered.map(({ plan, targetDateStr }, idx) => {
                const status  = getTaskStatus(plan.id, targetDateStr);
                const overdue = isOverdue(targetDateStr, status);
                const recKey  = `${plan.id}_${targetDateStr}`;
                const pic     = records[recKey]?.pic !== undefined && records[recKey]?.pic !== null
                  ? records[recKey].pic
                  : plan.pic;
                const pics = normalizePic(pic);
                const isDone  = status === "Done";

                return (
                  <tr key={recKey} className={`hover:bg-btn-secondary/50 transition-colors ${overdue ? "bg-red-500/5" : ""}`}>
                    <td className="px-4 py-3 text-text-secondary font-mono text-xs">{idx+1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays size={13} className="text-text-secondary shrink-0"/>
                        <span className={`text-xs font-mono ${overdue ? "text-red-400" : "text-text-secondary"}`}>
                          {displayDate(targetDateStr)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs font-mono">{plan.plantCode || plan.areaId || "-"}</td>
                    <td className="px-4 py-3 font-medium">{plan.areaName}</td>
                    <td className="px-4 py-3 font-medium text-blue-400">{plan.assetName}</td>
                    <td className="px-4 py-3 text-text-secondary max-w-[200px]" style={{whiteSpace:"normal",wordBreak:"break-word"}}>{plan.taskDescription}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${FREQ_COLORS[plan.frequency]||"bg-gray-500/20 text-gray-400"}`}>{plan.frequency}</span>
                    </td>
                    <td className="px-4 py-3">
                      {pics.length > 0
                        ? <div className="flex flex-wrap gap-1">{pics.map(n => <span key={n} className="px-1.5 py-0.5 bg-[#FF7043]/20 text-[#FF7043] border border-[#FF7043]/30 rounded text-xs">{n}</span>)}</div>
                        : <span className="text-gray-600 text-xs">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(status, overdue)}</td>
                    <td className="px-4 py-3">{getDuration(plan, targetDateStr)}</td>
                    <td className="px-4 py-3">
                      {isDone ? (
                        <span className="text-gray-500 text-xs italic">Selesai (Read-only)</span>
                      ) : (
                        <select
                          value={status}
                          onChange={e => handleStatusChange(plan, targetDateStr, e.target.value)}
                          className="bg-bg-dark border border-border-color rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#FF7043]"
                        >
                          <option value="Open">Open</option>
                          <option value="On Progress">On Progress</option>
                          <option value="Waiting on Part">Waiting on Part</option>
                          <option value="Done">Done</option>
                        </select>
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
