import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Eye, EyeOff, Plus, Trash2, Shield, Settings, UserCircle, Edit2, Check, X, Camera, MapPin, Phone, Building, Briefcase, Mail } from 'lucide-react';

const COUNTRIES = [
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  { code: 'SG', name: 'Singapura', flag: '🇸🇬' },
  { code: 'US', name: 'Amerika Serikat', flag: '🇺🇸' },
  { code: 'JP', name: 'Jepang', flag: '🇯🇵' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
];

const ROLES = ['Administrator', 'Supervisor', 'Admin', 'Visitor', 'Foreman', 'Warehouse', 'Teknisi'];

// Default mock data
const defaultWorkers = [
  { id: 1, nama: 'Budi Santoso', nik: '100201', email: 'budi@maintainx.com', password: 'password123', perusahaan: 'PT. Maju Jaya', profilAkun: 'Teknisi', posisi: 'Mekanik Senior', negara: 'ID', noHandphone: '081234567890', foto: null, status: 'On Site' },
  { id: 2, nama: 'Admin User', nik: '100001', email: 'admin@maintainx.com', password: '12345', perusahaan: 'PT. Maju Jaya', profilAkun: 'Administrator', posisi: 'Manager Maintenance', negara: 'ID', noHandphone: '081298765432', foto: null, status: 'On Site' },
  { id: 3, nama: 'Joko Anwar', nik: '100203', email: 'joko@maintainx.com', password: 'password123', perusahaan: 'PT. Maju Jaya', profilAkun: 'Foreman', posisi: 'Kepala Regu Shift A', negara: 'ID', noHandphone: '085612341234', foto: null, status: 'On Site' },
  { id: 4, nama: 'Andi Pratama', nik: '100204', email: 'andi@maintainx.com', password: 'password123', perusahaan: 'PT. Maju Jaya', profilAkun: 'Warehouse', posisi: 'Staff Gudang', negara: 'ID', noHandphone: '081122334455', foto: null, status: 'On Site' },
];

function PekerjaApp() {
  const [workers, setWorkers] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState('Administrator');
  const [showPasswords, setShowPasswords] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  
  // Modal State
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  
  useEffect(() => {
    // Get user role for RBAC
    const role = localStorage.getItem('userRole') || 'Administrator';
    setCurrentUserRole(role);
    
    // Load workers from localStorage or set default
    const saved = localStorage.getItem('mx_workers');
    if (saved) {
      // Migrate old data if missing fields
      let parsed = JSON.parse(saved);
      parsed = parsed.map(w => ({
        ...w,
        negara: w.negara || 'ID',
        noHandphone: w.noHandphone || '-',
        foto: w.foto || null,
        status: w.status || 'On Site'
      }));
      setWorkers(parsed);
    } else {
      setWorkers(defaultWorkers);
      localStorage.setItem('mx_workers', JSON.stringify(defaultWorkers));
    }
  }, []);

  const saveWorkers = (newWorkers) => {
    setWorkers(newWorkers);
    localStorage.setItem('mx_workers', JSON.stringify(newWorkers));
  };

  const isAdmin = currentUserRole === 'Administrator';

  const togglePassword = (id) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSelection = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Yakin ingin menghapus ${selectedIds.size} pekerja?`)) {
      const updated = workers.filter(w => !selectedIds.has(w.id));
      saveWorkers(updated);
      setSelectedIds(new Set());
      setIsEditMode(false);
    }
  };

  const toggleWorkerStatus = (id) => {
    const updated = workers.map(w => {
      if (w.id === id) {
        return { ...w, status: w.status === 'On Site' ? 'Off Site' : 'On Site' };
      }
      return w;
    });
    saveWorkers(updated);
  };

  const handleAddWorker = () => {
    const newNama = prompt('Nama Pekerja Baru:');
    if (!newNama) return;
    const newWorker = {
      id: Date.now(),
      nama: newNama,
      nik: `100${Math.floor(Math.random() * 900) + 100}`,
      email: `${newNama.toLowerCase().replace(/\s/g, '')}@maintainx.com`,
      password: 'password123',
      perusahaan: 'PT. Maju Jaya',
      profilAkun: 'Teknisi',
      posisi: 'Staff Baru',
      negara: 'ID',
      noHandphone: '-',
      foto: null,
      status: 'On Site'
    };
    saveWorkers([...workers, newWorker]);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Actions Panel */}
      <div className="flex justify-between items-center bg-bg-dark p-4 rounded-xl border border-border-color">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-[#FF7043]/20 text-accent rounded-lg flex items-center justify-center">
            <UserCircle size={24} />
          </div>
          <div>
            <h2 className="text-text-primary font-semibold">Direktori Pekerja</h2>
            <p className="text-text-secondary text-sm">Total {workers.length} akun terdaftar</p>
          </div>
        </div>
        
        {isAdmin && (
          <div className="flex gap-3">
            <button 
              className="px-4 py-2 bg-btn-secondary text-text-primary rounded-lg text-sm font-medium hover:bg-gray-700 flex items-center gap-2 border border-border-color transition-colors"
              onClick={() => alert("Fitur Ubah Role secara massal akan tersedia. Silakan gunakan menu Edit individual.")}
            >
              <Shield size={16} /> User Role
            </button>
            
            <button 
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border ${isEditMode ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30' : 'bg-btn-secondary text-text-primary border-border-color hover:bg-gray-700'}`}
              onClick={() => {
                setIsEditMode(!isEditMode);
                setSelectedIds(new Set());
              }}
            >
              <Edit2 size={16} /> {isEditMode ? 'Batal Edit' : 'Edit'}
            </button>
            
            {isEditMode && selectedIds.size > 0 && (
              <button 
                className="px-4 py-2 bg-red-600 text-text-primary rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-2 shadow-lg shadow-red-500/20"
                onClick={handleDeleteSelected}
              >
                <Trash2 size={16} /> Hapus ({selectedIds.size})
              </button>
            )}

            <button 
              className="px-4 py-2 bg-gradient-to-r from-accent to-accent-secondary text-text-primary rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2 shadow-lg shadow-accent/20"
              onClick={handleAddWorker}
            >
              <Plus size={16} /> Tambah Pekerja
            </button>
          </div>
        )}
      </div>

      {/* Warning Alert if Not Admin */}
      {!isAdmin && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex gap-3 text-yellow-400">
          <Shield size={20} className="shrink-0" />
          <div className="text-sm">
            <strong className="block mb-1">Mode Hanya-Baca (Read-Only)</strong>
            Akun Anda (<strong>{currentUserRole}</strong>) tidak memiliki akses untuk mengubah profil pekerja.
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-bg-dark border border-border-color rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-bg-surface border-b border-border-color text-text-secondary">
              <tr>
                {isEditMode && isAdmin && <th className="p-4 w-10 text-center">#</th>}
                <th className="p-4 font-medium">No</th>
                <th className="p-4 font-medium">Nama</th>
                <th className="p-4 font-medium">NIK</th>
                <th className="p-4 font-medium">Email</th>
                <th className="p-4 font-medium">Password</th>
                <th className="p-4 font-medium">Perusahaan</th>
                <th className="p-4 font-medium">Profil Akun</th>
                <th className="p-4 font-medium">Posisi</th>
                <th className="p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {workers.map((worker, index) => (
                <tr key={worker.id} className="hover:bg-btn-secondary/50 transition-colors group">
                  {isEditMode && isAdmin && (
                    <td className="p-4 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-accent focus:ring-[#FF7043]"
                        checked={selectedIds.has(worker.id)}
                        onChange={() => toggleSelection(worker.id)}
                      />
                    </td>
                  )}
                  <td className="p-4 text-text-secondary">{index + 1}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {worker.foto ? (
                        <img src={worker.foto} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-border-color" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-xs font-bold text-text-primary">
                          {worker.nama.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                      )}
                      <span className="font-medium text-text-primary">{worker.nama}</span>
                    </div>
                  </td>
                  <td className="p-4 font-mono">
                    <button 
                      onClick={() => setSelectedWorkerId(worker.id)}
                      className="text-blue-400 hover:text-blue-300 hover:underline transition-colors focus:outline-none"
                    >
                      {worker.nik}
                    </button>
                  </td>
                  <td className="p-4 text-text-secondary">{worker.email}</td>
                  
                  {/* Password Column */}
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-text-secondary">
                        {showPasswords[worker.id] ? worker.password : '••••••••'}
                      </span>
                      {isAdmin && (
                        <button 
                          onClick={() => togglePassword(worker.id)}
                          className="text-text-secondary hover:text-text-primary transition-colors p-1"
                        >
                          {showPasswords[worker.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      )}
                    </div>
                  </td>
                  
                  <td className="p-4 text-text-secondary">{worker.perusahaan}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${
                      worker.profilAkun === 'Administrator' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      worker.profilAkun === 'Supervisor' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                      worker.profilAkun === 'Teknisi' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                      'bg-gray-500/10 text-text-secondary border-gray-500/20'
                    }`}>
                      {worker.profilAkun}
                    </span>
                  </td>
                  <td className="p-4 text-text-secondary">{worker.posisi}</td>
                  <td className="p-4">
                    <button 
                      onClick={() => isAdmin ? toggleWorkerStatus(worker.id) : null}
                      disabled={!isAdmin}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                        worker.status === 'On Site' 
                          ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20' 
                          : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                      } ${!isAdmin && 'cursor-default opacity-80'}`}
                      title={isAdmin ? "Klik untuk mengubah status (On Site / Off Site)" : "Status Pekerja"}
                    >
                      {worker.status === 'On Site' ? 'On Site' : 'Off Site'}
                    </button>
                  </td>
                </tr>
              ))}
              {workers.length === 0 && (
                <tr>
                  <td colSpan={isEditMode ? 10 : 9} className="p-8 text-center text-text-secondary">
                    Tidak ada data pekerja.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedWorkerId && (
        <WorkerProfileModal 
          workerId={selectedWorkerId} 
          workers={workers} 
          saveWorkers={saveWorkers} 
          onClose={() => setSelectedWorkerId(null)} 
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}

function WorkerProfileModal({ workerId, workers, saveWorkers, onClose, isAdmin }) {
  const originalWorker = workers.find(w => w.id === workerId);
  const [formData, setFormData] = useState({ ...originalWorker });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (originalWorker) setFormData({ ...originalWorker });
  }, [workerId, workers]);

  if (!originalWorker) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024 * 2) {
        alert("Ukuran foto maksimal 2MB!");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        handleInputChange('foto', reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const updatedWorkers = workers.map(w => w.id === workerId ? formData : w);
    saveWorkers(updatedWorkers);
    onClose();
  };

  const getCountryName = (code) => {
    return COUNTRIES.find(c => c.code === code)?.name || code;
  };
  const getCountryFlag = (code) => {
    return COUNTRIES.find(c => c.code === code)?.flag || '';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-bg-surface border border-border-color rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border-color bg-black/20">
          <div className="flex items-center gap-3">
            <UserCircle size={24} className="text-accent" />
            <h2 className="text-xl font-bold text-text-primary">Detail Profil Pekerja</h2>
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 flex flex-col md:flex-row gap-10 max-h-[80vh] overflow-y-auto">
          
          {/* Left Panel: Photo */}
          <div className="flex flex-col items-center gap-4 w-full md:w-1/3 shrink-0">
            <div className="relative group rounded-full">
              {formData.foto ? (
                <img src={formData.foto} alt="Profile" className="w-48 h-48 rounded-full object-cover border-4 border-[#12161A] shadow-xl" />
              ) : (
                <div className="w-48 h-48 rounded-full bg-gradient-to-br from-gray-700 to-[#12161A] border-4 border-[#12161A] shadow-xl flex items-center justify-center text-5xl font-bold text-text-secondary">
                  {formData.nama.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
              )}
              
              {isAdmin && (
                <>
                  <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <Camera size={28} className="text-text-primary mb-2" />
                    <span className="text-sm text-text-primary font-medium">Ubah Foto</span>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </>
              )}
            </div>
            
            <div className="text-center mt-2">
              <h3 className="text-lg font-bold text-text-primary mb-1">{formData.nama}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border inline-block ${
                formData.profilAkun === 'Administrator' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                formData.profilAkun === 'Supervisor' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                formData.profilAkun === 'Teknisi' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                'bg-gray-500/10 text-text-secondary border-gray-500/20'
              }`}>
                {formData.profilAkun}
              </span>
            </div>
          </div>

          {/* Right Panel: Details Form */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Nama */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                  <UserCircle size={14} /> Nama Lengkap
                </label>
                {isAdmin ? (
                  <input type="text" value={formData.nama} onChange={(e) => handleInputChange('nama', e.target.value)} className="w-full bg-bg-dark border border-border-color text-text-primary rounded-lg p-2.5 focus:outline-none focus:border-[#FF7043]" />
                ) : (
                  <div className="p-2.5 bg-bg-dark/50 border border-border-color rounded-lg text-text-primary font-medium">{formData.nama}</div>
                )}
              </div>

              {/* NIK */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                  <Briefcase size={14} /> NIK
                </label>
                {isAdmin ? (
                  <input type="text" value={formData.nik} onChange={(e) => handleInputChange('nik', e.target.value)} className="w-full bg-bg-dark border border-border-color text-text-primary rounded-lg p-2.5 focus:outline-none focus:border-[#FF7043] font-mono" />
                ) : (
                  <div className="p-2.5 bg-bg-dark/50 border border-border-color rounded-lg text-text-primary font-mono">{formData.nik}</div>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                  <Mail size={14} /> Email
                </label>
                {isAdmin ? (
                  <input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} className="w-full bg-bg-dark border border-border-color text-text-primary rounded-lg p-2.5 focus:outline-none focus:border-[#FF7043]" />
                ) : (
                  <div className="p-2.5 bg-bg-dark/50 border border-border-color rounded-lg text-text-primary">{formData.email}</div>
                )}
              </div>

              {/* Handphone */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                  <Phone size={14} /> No. Handphone
                </label>
                {isAdmin ? (
                  <input type="text" value={formData.noHandphone} onChange={(e) => handleInputChange('noHandphone', e.target.value)} className="w-full bg-bg-dark border border-border-color text-text-primary rounded-lg p-2.5 focus:outline-none focus:border-[#FF7043] font-mono" />
                ) : (
                  <div className="p-2.5 bg-bg-dark/50 border border-border-color rounded-lg text-text-primary font-mono">{formData.noHandphone}</div>
                )}
              </div>

              {/* Negara */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                  <MapPin size={14} /> Negara
                </label>
                {isAdmin ? (
                  <select value={formData.negara} onChange={(e) => handleInputChange('negara', e.target.value)} className="w-full bg-bg-dark border border-border-color text-text-primary rounded-lg p-2.5 focus:outline-none focus:border-[#FF7043] appearance-none">
                    {COUNTRIES.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-2.5 bg-bg-dark/50 border border-border-color rounded-lg text-text-primary flex items-center gap-2">
                    <span className="text-lg">{getCountryFlag(formData.negara)}</span>
                    {getCountryName(formData.negara)}
                  </div>
                )}
              </div>

              {/* Perusahaan */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                  <Building size={14} /> Perusahaan
                </label>
                {isAdmin ? (
                  <input type="text" value={formData.perusahaan} onChange={(e) => handleInputChange('perusahaan', e.target.value)} className="w-full bg-bg-dark border border-border-color text-text-primary rounded-lg p-2.5 focus:outline-none focus:border-[#FF7043]" />
                ) : (
                  <div className="p-2.5 bg-bg-dark/50 border border-border-color rounded-lg text-text-primary">{formData.perusahaan}</div>
                )}
              </div>

              {/* Posisi */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                  <Briefcase size={14} /> Posisi / Jabatan
                </label>
                {isAdmin ? (
                  <input type="text" value={formData.posisi} onChange={(e) => handleInputChange('posisi', e.target.value)} className="w-full bg-bg-dark border border-border-color text-text-primary rounded-lg p-2.5 focus:outline-none focus:border-[#FF7043]" />
                ) : (
                  <div className="p-2.5 bg-bg-dark/50 border border-border-color rounded-lg text-text-primary">{formData.posisi}</div>
                )}
              </div>

              {/* Profil Akun */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-text-secondary flex items-center gap-2">
                  <Shield size={14} /> Profil Akun
                </label>
                {isAdmin ? (
                  <select value={formData.profilAkun} onChange={(e) => handleInputChange('profilAkun', e.target.value)} className="w-full bg-bg-dark border border-border-color text-text-primary rounded-lg p-2.5 focus:outline-none focus:border-[#FF7043] appearance-none">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                ) : (
                  <div className="p-2.5 bg-bg-dark/50 border border-border-color rounded-lg text-text-primary">{formData.profilAkun}</div>
                )}
              </div>

            </div>
            
            {isAdmin && (
              <div className="mt-10 flex justify-end gap-3 pt-6 border-t border-border-color">
                <button type="button" onClick={onClose} className="px-5 py-2.5 text-text-secondary hover:text-text-primary font-medium transition-colors">
                  Batal
                </button>
                <button type="button" onClick={handleSave} className="bg-gradient-to-r from-accent to-accent-secondary text-text-primary px-6 py-2.5 rounded-lg font-medium shadow-lg hover:opacity-90 flex items-center gap-2">
                  <Check size={18} /> Simpan Perubahan
                </button>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<PekerjaApp />);
