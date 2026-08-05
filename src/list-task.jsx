import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Plus, Search, Filter, MoreVertical, CheckCircle, 
  Clock, AlertTriangle, X
} from 'lucide-react';

const INITIAL_TASKS = [
  { id: 'TSK-1001', title: 'Perbaikan Pipa Bocor', asset: 'PLT-102', worker: 'Budi Santoso', priority: 'Tinggi', status: 'In Progress', date: '2026-08-05' },
  { id: 'TSK-1002', title: 'Inspeksi Rutin Boiler', asset: 'PLT-105', worker: 'Agus Setiawan', priority: 'Sedang', status: 'Pending', date: '2026-08-06' },
  { id: 'TSK-1003', title: 'Penggantian Filter RO', asset: 'PLT-201', worker: 'Joko Widodo', priority: 'Tinggi', status: 'Completed', date: '2026-08-04' },
  { id: 'TSK-1004', title: 'Kalibrasi Sensor Suhu', asset: 'PLT-102', worker: 'Budi Santoso', priority: 'Rendah', status: 'Pending', date: '2026-08-07' },
];

function ListTask() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', asset: '', priority: 'Sedang' });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Completed': return <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded text-xs border border-green-500/50 flex items-center gap-1 w-fit"><CheckCircle size={12}/> Selesai</span>;
      case 'In Progress': return <span className="px-2 py-1 bg-blue-500/20 text-blue-500 rounded text-xs border border-blue-500/50 flex items-center gap-1 w-fit"><Clock size={12}/> Berjalan</span>;
      case 'Pending': return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded text-xs border border-yellow-500/50 flex items-center gap-1 w-fit"><AlertTriangle size={12}/> Tertunda</span>;
      default: return null;
    }
  };
  
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'Tinggi': return 'text-red-500';
      case 'Sedang': return 'text-yellow-500';
      case 'Rendah': return 'text-blue-500';
      default: return 'text-gray-400';
    }
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newTask.title || !newTask.asset) return;
    
    const task = {
      id: `TSK-${1000 + tasks.length + 1}`,
      title: newTask.title,
      asset: newTask.asset,
      worker: 'Belum Ditugaskan',
      priority: newTask.priority,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0]
    };
    
    setTasks([task, ...tasks]);
    setShowModal(false);
    setNewTask({ title: '', asset: '', priority: 'Sedang' });
  };

  return (
    <div className="flex flex-col h-full gap-6 text-gray-200 font-sans">
      
      {/* Action Bar */}
      <div className="flex justify-between items-center bg-bg-surface p-4 rounded-xl border border-gray-700 shadow-lg">
        <div className="flex gap-4 items-center w-full max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari tugas, ID, atau nama aset..." 
              className="w-full bg-[#12161A] border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[#FF7043] transition-colors"
            />
          </div>
          <button className="p-2 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors">
            <Filter size={18} />
          </button>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-[#FF7043] to-[#FF3D00] hover:from-[#FF8A65] hover:to-[#FF5722] text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-lg transition-all active:scale-95"
        >
          <Plus size={18} />
          Buat Task
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-bg-surface rounded-xl border border-gray-700 shadow-lg overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#12161A] text-gray-400 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 font-medium">Task ID</th>
                <th className="px-6 py-4 font-medium">Judul Pekerjaan</th>
                <th className="px-6 py-4 font-medium">Aset Terkait</th>
                <th className="px-6 py-4 font-medium">Teknisi</th>
                <th className="px-6 py-4 font-medium">Prioritas</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Tanggal</th>
                <th className="px-6 py-4 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {tasks.map(task => (
                <tr key={task.id} className="hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-gray-300">{task.id}</td>
                  <td className="px-6 py-4 text-white font-medium">{task.title}</td>
                  <td className="px-6 py-4 text-blue-400 hover:underline cursor-pointer">{task.asset}</td>
                  <td className="px-6 py-4 text-gray-300">{task.worker}</td>
                  <td className={`px-6 py-4 font-semibold ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(task.status)}</td>
                  <td className="px-6 py-4 text-gray-400">{task.date}</td>
                  <td className="px-6 py-4 text-center">
                    <button className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
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
          <div className="bg-[#1E242B] border border-gray-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-700 bg-black/20">
              <h2 className="text-xl font-bold text-white">Catat Pekerjaan Baru</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 flex flex-col gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Judul Pekerjaan <span className="text-red-500">*</span></label>
                <input 
                  type="text" required
                  value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})}
                  className="w-full bg-[#12161A] border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-[#FF7043]" 
                  placeholder="Contoh: Perbaikan pompa distribusi"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Aset Terkait <span className="text-red-500">*</span></label>
                <input 
                  type="text" required
                  value={newTask.asset} onChange={e => setNewTask({...newTask, asset: e.target.value})}
                  className="w-full bg-[#12161A] border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-[#FF7043]" 
                  placeholder="Pilih ID Aset (Misal: PLT-102)"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Prioritas</label>
                <select 
                  value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}
                  className="w-full bg-[#12161A] border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-[#FF7043] appearance-none"
                >
                  <option value="Rendah">Rendah</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Tinggi">Tinggi</option>
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Bukti Foto</label>
                <div className="w-full border-2 border-dashed border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-800/50 cursor-pointer transition-colors">
                  <ImageIcon size={28} className="mb-2" />
                  <span className="text-sm">Klik untuk unggah gambar</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-700">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2.5 text-gray-300 hover:text-white font-medium">
                  Batal
                </button>
                <button type="submit" className="bg-gradient-to-r from-[#FF7043] to-[#FF3D00] text-white px-6 py-2.5 rounded-lg font-medium shadow-lg hover:from-[#FF8A65] hover:to-[#FF5722]">
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
