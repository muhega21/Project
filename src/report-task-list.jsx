import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { CheckCircle, Clock, AlertTriangle, Search, Download, FileText, Image as ImageIcon, Filter } from "lucide-react";
import { loadPlans, loadRecords, getElapsedDays, normalizePic } from "./maintenance-store.js";

const STATUS_COLORS = {
  "Open":"bg-gray-500/20 text-gray-400 border-gray-500/30",
  "On Progress":"bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Waiting on Part":"bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Done":"bg-green-500/20 text-green-400 border-green-500/30",
};
const STATUS_ICONS = {
  "Done":<CheckCircle size={12}/>,
  "On Progress":<Clock size={12}/>,
  "Waiting on Part":<AlertTriangle size={12}/>,
  "Open":<span className="w-2 h-2 rounded-full bg-gray-400 inline-block"/>,
};
const FILTER_OPTIONS = ["Semua","Done","On Progress","Waiting on Part"];

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("id-ID", { day:"2-digit", month:"short", year:"numeric" });
}
function formatDateTime(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("id-ID", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" });
}

/* ── Photo Lightbox ─────────────────────────────────────────────── */
function Lightbox({ src, onClose }) {
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <img src={src} alt="Foto bukti" className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"/>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */
function ReportTaskList() {
  const [plans, setPlans] = useState([]);
  const [records, setRecords] = useState({});
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");

  useEffect(() => {
    setPlans(loadPlans());
    setRecords(loadRecords());
  }, []);

  // Build enriched rows from all plans that have any record
  const allRows = plans.map(plan => {
    const rec = records[plan.id] || { status:"Open", startedAt:null, doneAt:null, waitingReason:null, evidencePhotos:[], archivedAt:null };
    const elapsed = getElapsedDays(rec);
    return { plan, rec, elapsed };
  });

  const filtered = allRows.filter(({ plan, rec }) => {
    const matchStatus = statusFilter === "Semua" || rec.status === statusFilter;
    const matchSearch = !searchQuery
      || plan.assetName.toLowerCase().includes(searchQuery.toLowerCase())
      || plan.taskDescription.toLowerCase().includes(searchQuery.toLowerCase())
      || plan.areaName.toLowerCase().includes(searchQuery.toLowerCase())
      || plan.id.toLowerCase().includes(searchQuery.toLowerCase());
      
    let matchDateRange = true;
    if (startDateFilter || endDateFilter) {
      const taskDateStr = rec.doneAt || rec.startedAt;
      if (taskDateStr) {
        const tDate = new Date(taskDateStr);
        tDate.setHours(0,0,0,0);
        if (startDateFilter) {
           const sDate = new Date(startDateFilter);
           sDate.setHours(0,0,0,0);
           if (tDate < sDate) matchDateRange = false;
        }
        if (endDateFilter) {
           const eDate = new Date(endDateFilter);
           eDate.setHours(23,59,59,999);
           if (tDate > eDate) matchDateRange = false;
        }
      } else {
        matchDateRange = false;
      }
    }

    let matchMonth = true;
    if (monthFilter) {
      const taskDateStr = rec.doneAt || rec.startedAt;
      if (taskDateStr) {
         const tMonth = taskDateStr.substring(0, 7); // YYYY-MM
         if (tMonth !== monthFilter) matchMonth = false;
      } else {
         matchMonth = false;
      }
    }

    // For report: only show tasks that have been touched (not purely Open with no record)
    const hasTouched = !!records[plan.id];
    return matchStatus && matchSearch && matchDateRange && matchMonth && (statusFilter !== "Semua" || hasTouched);
  });

  const stats = {
    done: allRows.filter(r => r.rec.status === "Done").length,
    onProgress: allRows.filter(r => r.rec.status === "On Progress").length,
    waiting: allRows.filter(r => r.rec.status === "Waiting on Part").length,
    total: Object.keys(records).length,
  };

  /* ── PDF Export ─────────────────────────────────────────────────── */
  const exportPDF = async () => {
    setExporting(true);
    const { jsPDF } = window.jspdf;
    if (!jsPDF) { alert("Library PDF belum dimuat. Refresh halaman."); setExporting(false); return; }
    const doc = new jsPDF({ orientation:"landscape", unit:"mm", format:"a4" });
    doc.setFont("helvetica","bold");
    doc.setFontSize(16);
    doc.text("Report Task List — Maintenance", 14, 16);
    doc.setFontSize(9);
    doc.setFont("helvetica","normal");
    doc.setTextColor(120);
    doc.text(`Dicetak: ${new Date().toLocaleString("id-ID")}   Filter: ${statusFilter}`, 14, 22);
    doc.setTextColor(0);

    const rows = filtered.map(({ plan, rec, elapsed }, i) => [
      i+1,
      plan.id,
      plan.areaName,
      plan.assetName,
      plan.taskDescription.length > 50 ? plan.taskDescription.substring(0,50)+"…" : plan.taskDescription,
      normalizePic(plan.pic).join(", ") || "-",
      rec.status,
      elapsed !== null ? `${elapsed} hari` : "-",
      formatDate(rec.startedAt),
      formatDate(rec.doneAt),
      rec.waitingReason ? (rec.waitingReason.length>40 ? rec.waitingReason.substring(0,40)+"…" : rec.waitingReason) : "-",
      rec.evidencePhotos ? rec.evidencePhotos.length : 0,
    ]);

    doc.autoTable({
      head: [["#","ID","Area","Asset","Task Description","PIC","Status","Durasi","Mulai","Selesai","Catatan Kendala","Foto"]],
      body: rows,
      startY: 26,
      theme: "grid",
      headStyles: { fillColor:[30,36,46], textColor:255, fontSize:7, fontStyle:"bold" },
      bodyStyles: { fontSize:7, cellPadding:2 },
      columnStyles: { 4:{ cellWidth:50 }, 5:{ cellWidth:30 }, 10:{ cellWidth:40 } },
      alternateRowStyles: { fillColor:[245,247,250] },
    });

    doc.save(`Report_Task_${new Date().toISOString().split("T")[0]}.pdf`);
    setExporting(false);
  };

  /* ── Excel Export ───────────────────────────────────────────────── */
  const exportExcel = () => {
    setExporting(true);
    const XLSX = window.XLSX;
    if (!XLSX) { alert("Library Excel belum dimuat. Refresh halaman."); setExporting(false); return; }

    const wsData = [
      ["No","ID Task","Kode Area","Nama Area","Nama Asset","Task Description","PIC","Status","Durasi (hari)","Tanggal Mulai","Tanggal Selesai","Alasan Kendala","Jumlah Foto"],
      ...filtered.map(({ plan, rec, elapsed }, i) => [
        i+1,
        plan.id,
        plan.plantCode||plan.areaId||"-",
        plan.areaName,
        plan.assetName,
        plan.taskDescription,
        normalizePic(plan.pic).join(", ") || "-",
        rec.status,
        elapsed !== null ? elapsed : "",
        rec.startedAt ? new Date(rec.startedAt).toLocaleDateString("id-ID") : "",
        rec.doneAt ? new Date(rec.doneAt).toLocaleDateString("id-ID") : "",
        rec.waitingReason || "",
        rec.evidencePhotos ? rec.evidencePhotos.length : 0,
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws["!cols"] = [5,12,12,20,20,40,25,15,12,15,15,30,12].map(w => ({ wch:w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report Task");
    XLSX.writeFile(wb, `Report_Task_${new Date().toISOString().split("T")[0]}.xlsx`);
    setExporting(false);
  };

  return (
    <div className="flex flex-col h-full gap-4 text-text-primary font-sans">
      {lightboxSrc && <Lightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)}/>}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-bg-surface p-4 rounded-xl border border-border-color shadow gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2"><FileText size={20} className="text-[#FF7043]"/> Report Task</h2>
          <p className="text-sm text-text-secondary mt-0.5">Riwayat dan ringkasan hasil kerja maintenance</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={15}/>
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari task..." className="bg-bg-dark border border-border-color rounded-lg py-2 pl-8 pr-3 text-sm focus:outline-none focus:border-[#FF7043] w-44"/>
          </div>
          {/* Export buttons */}
          <button
            onClick={exportPDF}
            disabled={exporting}
            className="flex items-center gap-2 bg-red-600/90 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Download size={15}/> PDF
          </button>
          <button
            onClick={exportExcel}
            disabled={exporting}
            className="flex items-center gap-2 bg-green-700/90 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Download size={15}/> Excel
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:"Total Tercatat", value:stats.total, color:"text-blue-400" },
          { label:"Done", value:stats.done, color:"text-green-400" },
          { label:"On Progress", value:stats.onProgress, color:"text-blue-300" },
          { label:"Waiting on Part", value:stats.waiting, color:"text-yellow-400" },
        ].map((s,i) => (
          <div key={i} className="bg-bg-surface border border-border-color rounded-xl p-4 text-center">
            <div className="text-text-secondary text-xs mb-1">{s.label}</div>
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs & Date filters */}
      <div className="flex flex-col sm:flex-row gap-3 bg-bg-surface border border-border-color rounded-xl p-4">
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-text-secondary"/>
          <div className="flex flex-wrap gap-1">
            {FILTER_OPTIONS.map(o => (
              <button key={o} onClick={() => setStatusFilter(o)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter===o?"bg-[#FF7043] text-white":"text-text-secondary hover:bg-btn-secondary"}`}>{o}</button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 sm:ml-auto items-center">
          <div className="flex items-center gap-2 bg-bg-dark border border-border-color rounded-lg px-2 py-1.5">
            <span className="text-xs text-text-secondary">Rentang:</span>
            <input type="date" value={startDateFilter} onChange={e => { setStartDateFilter(e.target.value); setMonthFilter(""); }} className="bg-transparent text-xs text-text-primary focus:outline-none"/>
            <span className="text-text-secondary text-xs">-</span>
            <input type="date" value={endDateFilter} onChange={e => { setEndDateFilter(e.target.value); setMonthFilter(""); }} className="bg-transparent text-xs text-text-primary focus:outline-none"/>
          </div>
          <div className="flex items-center gap-2 bg-bg-dark border border-border-color rounded-lg px-2 py-1.5">
            <span className="text-xs text-text-secondary">Bulan:</span>
            <input type="month" value={monthFilter} onChange={e => { setMonthFilter(e.target.value); setStartDateFilter(""); setEndDateFilter(""); }} className="bg-transparent text-xs text-text-primary focus:outline-none"/>
          </div>
          <span className="text-xs text-text-secondary ml-2 font-medium">{filtered.length} data</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-bg-surface rounded-xl border border-border-color shadow overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-bg-dark text-text-secondary border-b border-border-color">
              <tr>
                <th className="px-4 py-3 font-medium">No</th>
                <th className="px-4 py-3 font-medium">ID Task</th>
                <th className="px-4 py-3 font-medium">Area / Asset</th>
                <th className="px-4 py-3 font-medium min-w-[200px]">Task Description</th>
                <th className="px-4 py-3 font-medium">PIC</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Durasi</th>
                <th className="px-4 py-3 font-medium">Tgl. Mulai</th>
                <th className="px-4 py-3 font-medium">Tgl. Selesai</th>
                <th className="px-4 py-3 font-medium min-w-[160px]">Catatan Kendala</th>
                <th className="px-4 py-3 font-medium">Foto Bukti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-6 py-16 text-center text-text-secondary">
                    <FileText size={36} className="mx-auto mb-3 opacity-20"/>
                    <p>Belum ada laporan task yang tercatat.</p>
                    <p className="text-xs mt-1 opacity-60">Update status task di menu "Task List" untuk memulai pencatatan.</p>
                  </td>
                </tr>
              ) : filtered.map(({ plan, rec, elapsed }, idx) => {
                const pics = normalizePic(plan.pic);
                return (
                  <tr key={plan.id} className="hover:bg-btn-secondary/50 transition-colors">
                    <td className="px-4 py-3 text-text-secondary font-mono text-xs">{idx+1}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#FF7043]">{plan.id}</td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-text-secondary">{plan.areaName}</div>
                      <div className="font-medium text-blue-400 text-sm">{plan.assetName}</div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary max-w-[200px]" style={{whiteSpace:"normal", wordBreak:"break-word"}}>{plan.taskDescription}</td>
                    <td className="px-4 py-3">
                      {pics.length > 0
                        ? <div className="flex flex-wrap gap-1">{pics.map(n => <span key={n} className="px-1.5 py-0.5 bg-[#FF7043]/20 text-[#FF7043] border border-[#FF7043]/30 rounded text-xs">{n}</span>)}</div>
                        : <span className="text-gray-600 text-xs">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold border flex items-center gap-1 w-fit ${STATUS_COLORS[rec.status]||STATUS_COLORS["Open"]}`}>
                        {STATUS_ICONS[rec.status]}
                        {rec.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {elapsed !== null
                        ? <span className={`text-sm font-bold ${elapsed <= 1 ? "text-green-400" : elapsed <= 3 ? "text-yellow-400" : "text-red-400"}`}>{elapsed} hari</span>
                        : <span className="text-gray-600 text-xs">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{formatDate(rec.startedAt)}</td>
                    <td className="px-4 py-3 text-text-secondary text-xs">{formatDate(rec.doneAt)}</td>
                    <td className="px-4 py-3">
                      {rec.waitingReason
                        ? <span className="text-yellow-300 text-xs" style={{whiteSpace:"normal", wordBreak:"break-word", maxWidth:160, display:"block"}}>{rec.waitingReason}</span>
                        : <span className="text-gray-600 text-xs">—</span>
                      }
                    </td>
                    <td className="px-4 py-3">
                      {rec.evidencePhotos && rec.evidencePhotos.length > 0 ? (
                        <div className="flex gap-1">
                          {rec.evidencePhotos.slice(0,3).map((src,i) => (
                            <button key={i} onClick={() => setLightboxSrc(src)} className="w-9 h-9 rounded-lg overflow-hidden border border-border-color hover:border-green-400 transition-colors">
                              <img src={src} alt={`Foto ${i+1}`} className="w-full h-full object-cover"/>
                            </button>
                          ))}
                          {rec.evidencePhotos.length > 3 && (
                            <div className="w-9 h-9 rounded-lg bg-bg-dark border border-border-color flex items-center justify-center text-[10px] text-text-secondary">+{rec.evidencePhotos.length-3}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs flex items-center gap-1"><ImageIcon size={12}/> —</span>
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
root.render(<ReportTaskList/>);
