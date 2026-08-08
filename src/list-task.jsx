import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Plus, Search, Filter, MoreVertical, CheckCircle, 
  Clock, AlertTriangle, X
} from 'lucide-react';

const INITIAL_TASKS = [
  { id: 1, areaId: 'AREA-01', eqId: 'EQ-1001', eqName: 'Pompa Distribusi', interval: 'Monthly', start: '2026-08-01', end: '', worker: 'Budi Santoso', note: 'Pengecekan rutin', progress: 'In Progress' },
  { id: 2, areaId: 'AREA-02', eqId: 'EQ-1005', eqName: 'Boiler Utama', interval: 'Annual', start: '2026-08-05', end: '2026-08-06', worker: 'Agus Setiawan', note: 'Overhaul', progress: 'Done' },
  { id: 3, areaId: 'AREA-01', eqId: 'EQ-1010', eqName: 'Filter RO', interval: 'Weekly', start: '2026-08-10', end: '', worker: 'Joko Widodo', note: 'Ganti membran', progress: 'Waiting on Part' },
  { id: 4, areaId: 'AREA-03', eqId: 'EQ-2001', eqName: 'Sensor Suhu', interval: 'Quarterly', start: '2026-08-15', end: '', worker: 'Belum Ditugaskan', note: 'Kalibrasi', progress: 'Open' },
];

function ListTask() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', asset: '', priority: 'Sedang', worker: '' });
  const [workers, setWorkers] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('mx_workers');
    if (saved) {
      // Hanya ambil pekerja dengan profil Teknisi atau semua, untuk sekarang kita ambil yang perannya Teknisi
      setWorkers(JSON.parse(saved).filter(w => w.profilAkun === 'Teknisi' || w.profilAkun === 'Administrator'));
    }
  }, []);

  const getProgressBadge = (progress) => {
    switch(progress) {
      case 'Done': return <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded text-xs border border-green-500/50 flex items-center gap-1 w-fit"><CheckCircle size={12}/> Done</span>;
      case 'In Progress': return <span className="px-2 py-1 bg-blue-500/20 text-blue-500 rounded text-xs border border-blue-500/50 flex items-center gap-1 w-fit"><Clock size={12}/> In Progress</span>;
      case 'Waiting on Part': return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded text-xs border border-yellow-500/50 flex items-center gap-1 w-fit"><AlertTriangle size={12}/> Waiting on Part</span>;
      case 'Open': return <span className="px-2 py-1 bg-gray-500/20 text-text-secondary rounded text-xs border border-gray-500/50 flex items-center gap-1 w-fit">Open</span>;
      default: return null;
    }
  };
  
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'Tinggi': return 'text-red-500';
      case 'Sedang': return 'text-yellow-500';
      case 'Rendah': return 'text-blue-500';
      default: return 'text-text-secondary';
    }
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.asset) return;
    
    const task = {
      id: `TSK-${1000 + tasks.length + 1}`,
      title: newTask.title,
      asset: newTask.asset,
      worker: newTask.worker || 'Belum Ditugaskan',
      priority: newTask.priority,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0]
    };
    
    setTasks([task, ...tasks]);
    setShowModal(false);
    setNewTask({ title: '', asset: '', priority: 'Sedang', worker: '' });
  };

  return (
    <div className="flex flex-col h-full gap-6 text-text-primary font-sans">
      
      {/* Action Bar */}
      <div className="flex justify-between items-center bg-bg-surface p-4 rounded-xl border border-border-color shadow-lg">
        <div className="flex gap-4 items-center w-full max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
            <input 
              type="text" 
              placeholder="Cari tugas, ID, atau nama aset..." 
              className="w-full bg-bg-dark border border-border-color rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[#FF7043] transition-colors"
            />
          </div>
          <button className="p-2 border border-border-color rounded-lg hover:bg-btn-secondary transition-colors">
            <Filter size={18} />
          </button>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-accent to-accent-secondary hover:from-[#FF8A65] hover:to-[#FF5722] text-text-primary px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-lg transition-all active:scale-95"
        >
          <Plus size={18} />
          Buat Task
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-bg-surface rounded-xl border border-border-color shadow-lg overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-bg-dark text-text-secondary border-b border-border-color">
              <tr>
                <th className="px-6 py-4 font-medium">No</th>
                <th className="px-6 py-4 font-medium">ID Area/Lokasi</th>
                <th className="px-6 py-4 font-medium">ID Equipment</th>
                <th className="px-6 py-4 font-medium">Nama Equipment</th>
                <th className="px-6 py-4 font-medium">Interval</th>
                <th className="px-6 py-4 font-medium">Mulai</th>
                <th className="px-6 py-4 font-medium">Selesai</th>
                <th className="px-6 py-4 font-medium">Teknisi</th>
                <th className="px-6 py-4 font-medium">Note</th>
                <th className="px-6 py-4 font-medium">Progress</th>
                <th className="px-6 py-4 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {tasks.map((task, index) => (
                <tr key={task.id} className="hover:bg-btn-secondary/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-text-secondary">{index + 1}</td>
                  <td className="px-6 py-4 text-blue-400 hover:underline cursor-pointer">{task.areaId}</td>
                  <td className="px-6 py-4 font-mono text-text-secondary">{task.eqId}</td>
                  <td className="px-6 py-4 text-text-primary font-medium">{task.eqName}</td>
                  <td className="px-6 py-4 text-text-secondary">{task.interval}</td>
                  <td className="px-6 py-4 text-text-secondary">{task.start}</td>
                  <td className="px-6 py-4 text-text-secondary">{task.end || '-'}</td>
                  <td className="px-6 py-4 text-text-secondary">{task.worker}</td>
                  <td className="px-6 py-4 text-text-secondary max-w-xs truncate" title={task.note}>{task.note}</td>
                  <td className="px-6 py-4">{getProgressBadge(task.progress)}</td>
                  <td className="px-6 py-4 text-center">
                    <button className="p-1 text-text-secondary hover:text-text-primary hover:bg-gray-700 rounded transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-bg-surface border border-border-color rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-border-color bg-black/20">
              <h2 className="text-xl font-bold text-text-primary">Catat Pekerjaan Baru</h2>
              <button onClick={() => setShowModal(false)} className="text-text-secondary hover:text-text-primary transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 flex flex-col gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">Judul Pekerjaan <span className="text-red-500">*</span></label>
                <input 
                  type="text" required
                  value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})}
                  className="w-full bg-bg-dark border border-border-color rounded-lg p-3 focus:outline-none focus:border-[#FF7043]" 
                  placeholder="Contoh: Perbaikan pompa distribusi"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">Aset Terkait <span className="text-red-500">*</span></label>
                <input 
                  type="text" required
                  value={newTask.asset} onChange={e => setNewTask({...newTask, asset: e.target.value})}
                  className="w-full bg-bg-dark border border-border-color rounded-lg p-3 focus:outline-none focus:border-[#FF7043]" 
                  placeholder="Pilih ID Aset (Misal: PLT-102)"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">Prioritas</label>
                <select 
                  value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}
                  className="w-full bg-bg-dark border border-border-color rounded-lg p-3 focus:outline-none focus:border-[#FF7043] appearance-none"
                >
                  <option value="Rendah">Rendah</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Tinggi">Tinggi</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">Tugaskan Kepada (Teknisi)</label>
                <select 
                  value={newTask.worker} onChange={e => setNewTask({...newTask, worker: e.target.value})}
                  className="w-full bg-bg-dark border border-border-color rounded-lg p-3 focus:outline-none focus:border-[#FF7043] appearance-none"
                >
                  <option value="">Belum Ditugaskan</option>
                  {workers.map(w => (
                    <option key={w.id} value={w.nama}>{w.nama} - {w.posisi}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary">Bukti Foto</label>
                <div className="w-full border-2 border-dashed border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center text-text-secondary hover:bg-btn-secondary/50 cursor-pointer transition-colors">
                  <ImageIcon size={28} className="mb-2" />
                  <span className="text-sm">Klik untuk unggah gambar</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border-color">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-text-secondary hover:text-text-primary font-medium">
                  Batal
                </button>
                <button type="submit" className="bg-gradient-to-r from-accent to-accent-secondary text-text-primary px-6 py-2.5 rounded-lg font-medium shadow-lg hover:from-[#FF8A65] hover:to-[#FF5722]">
                  Simpan Task
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
root.render(<ListTask />);
