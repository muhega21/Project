import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Search, Edit, Trash2, Printer, Plus, AlertCircle, Check, X,
  MoreVertical, Image as ImageIcon, MapPin, User, Package, Layers, TriangleAlert, Upload
} from 'lucide-react';

const DUMMY_PEKERJA = [
  "Admin User",
  "Budi Santoso",
  "Andi Supriyadi",
  "Citra Dewi",
  "Doni Pratama",
  "Rahmat Hidayat",
  "Yanto Setiawan"
];

const INITIAL_WAREHOUSES = [
  { 
    id: 'GDG-01', name: 'Gudang Utama', location: 'Area Pabrik Timur', 
    description: 'Gudang penyimpanan material utama.',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8ed74509b2?auto=format&fit=crop&w=600&q=80',
    kategori: 'Barang Kering', totalBarang: 450, kepalaGudang: 'Budi Santoso'
  },
  { 
    id: 'GDG-02', name: 'Gudang Sparepart', location: 'Area Workshop', 
    description: 'Gudang khusus penyimpanan suku cadang alat berat.',
    image: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=600&q=80',
    kategori: 'Barang Cair', totalBarang: 1200, kepalaGudang: 'Andi Supriyadi'
  },
  { 
    id: 'GDG-03', name: 'Gudang Chemical', location: 'Area Produksi Belakang', 
    description: 'Gudang bahan kimia & pelumas dengan sirkulasi khusus.',
    image: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=600&q=80',
    kategori: 'Barang Berbahaya', totalBarang: 150, kepalaGudang: 'Citra Dewi'
  },
  { 
    id: 'GDG-04', name: 'Gudang APD', location: 'Gedung K3', 
    description: 'Gudang untuk Alat Pelindung Diri.',
    image: 'https://images.unsplash.com/photo-1588612543949-b570e67b2d58?auto=format&fit=crop&w=600&q=80',
    kategori: 'Barang Kering', totalBarang: 320, kepalaGudang: 'Doni Pratama'
  },
  { 
    id: 'GDG-05', name: 'Gudang Limbah B3', location: 'Area Pembuangan', 
    description: 'Penyimpanan sementara limbah berbahaya.',
    image: 'https://images.unsplash.com/photo-1517592317189-60d922570bde?auto=format&fit=crop&w=600&q=80',
    kategori: 'Barang Berbahaya', totalBarang: 45, kepalaGudang: 'Rahmat Hidayat'
  }
];

function DataGudang() {
  const [warehouses, setWarehouses] = useState(() => {
    const saved = localStorage.getItem('maintainx_warehouses');
    return saved ? JSON.parse(saved) : INITIAL_WAREHOUSES;
  });
  
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('maintainx_inventory');
    return saved ? JSON.parse(saved) : [];
  });

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return; // Skip saving on initial mount
    }

    try {
      localStorage.setItem('maintainx_warehouses', JSON.stringify(warehouses));
    } catch (error) {
      console.error("Failed to save warehouses:", error);
      let cleaned = false;
      const cleanedWarehouses = warehouses.map(item => {
        if (item.image && item.image.length > 100000) {
          cleaned = true;
          return { ...item, image: null };
        }
        return item;
      });
      if (cleaned) {
        try {
          localStorage.setItem('maintainx_warehouses', JSON.stringify(cleanedWarehouses));
          setWarehouses(cleanedWarehouses);
          alert("Beberapa gambar lama dihapus karena penyimpanan lokal penuh, namun perubahan baru berhasil disimpan.");
        } catch(e) {
          console.error("Local storage is completely full.");
          alert("Gagal menyimpan: Penyimpanan lokal perangkat Anda benar-benar penuh.");
        }
      } else {
        console.error("Local storage is full.");
        alert("Gagal menyimpan gambar: Penyimpanan lokal penuh. Harap hapus beberapa gambar lama.");
      }
    }
  }, [warehouses]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [menuOpenId, setMenuOpenId] = useState(null);
  

  
  // Form State
  const [formData, setFormData] = useState({ 
    id: '', name: '', location: '', description: '',
    image: '', kategori: 'Barang Kering', kepalaGudang: DUMMY_PEKERJA[0]
  });

  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = () => setMenuOpenId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredWarehouses = warehouses.filter(item => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;
    return item.id.toLowerCase().includes(query) || 
           item.name.toLowerCase().includes(query) || 
           item.location.toLowerCase().includes(query) ||
           item.kepalaGudang.toLowerCase().includes(query);
  });

  const handleDelete = (id) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus gudang ${id}?`)) {
      setWarehouses(prev => prev.filter(item => item.id !== id));
    }
  };

  const handlePrint = () => window.print();

  const openAddModal = () => {
    setModalMode('add');
    let nextNum = warehouses.length + 1;
    warehouses.forEach(w => {
      const num = parseInt(w.id.replace('GDG-', ''));
      if (num >= nextNum) nextNum = num + 1;
    });
    const newId = `GDG-${nextNum.toString().padStart(2, '0')}`;
    
    setFormData({ 
      id: newId, name: '', location: '', description: '',
      image: '', kategori: 'Barang Kering', kepalaGudang: DUMMY_PEKERJA[0]
    });
    setIsModalOpen(true);
  };

  const openEditModal = (id) => {
    const itemToEdit = warehouses.find(i => i.id === id);
    if (itemToEdit) {
      setModalMode('edit');
      setFormData({ ...itemToEdit });
      setIsModalOpen(true);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const MAX_DIMENSION = 200;
          if (width > height && width > MAX_DIMENSION) {
            height *= MAX_DIMENSION / width;
            width = MAX_DIMENSION;
          } else if (height > MAX_DIMENSION) {
            width *= MAX_DIMENSION / height;
            height = MAX_DIMENSION;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
          setFormData(prev => ({ ...prev, image: compressedBase64 }));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const payload = { ...formData, totalBarang: formData.totalBarang || 0 };
    if (modalMode === 'add') {
      if (warehouses.some(i => i.id === payload.id)) {
        alert("Kode Gudang sudah digunakan!");
        return;
      }
      setWarehouses(prev => [...prev, payload]);
    } else {
      setWarehouses(prev => prev.map(item => item.id === payload.id ? payload : item));
    }
    setIsModalOpen(false);
  };

  const handleCardClick = (name) => {
    window.location.href = `data-barang.html?filterGudang=${encodeURIComponent(name)}`;
  };



  return (
    <div className="flex flex-col h-full gap-4 text-text-primary font-sans print:bg-white print:text-black">
      
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-bg-surface p-4 rounded-xl border border-border-color shadow gap-4 print:hidden">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari gudang atau Kepala Gudang..." 
            className="w-full bg-bg-dark border border-border-color rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-[#FF7043] transition-colors"
          />
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
            onClick={openAddModal}
            className="bg-green-600 hover:bg-green-500 text-text-primary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-lg transition-colors"
          >
            <Plus size={16} /> Tambah Gudang
          </button>
          <button 
            onClick={handlePrint}
            className="bg-bg-dark border border-border-color hover:bg-btn-secondary text-text-secondary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 shadow transition-colors"
          >
            <Printer size={16} /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* Grid Cards Container - Changed to 4 columns on xl */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10 print:overflow-visible">
        {filteredWarehouses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
            <AlertCircle size={48} className="mb-4 opacity-50" />
            <p className="text-lg">Tidak ada data gudang yang ditemukan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredWarehouses.map((item, index) => (
              <div 
                key={item.id} 
                onClick={() => handleCardClick(item.name)}
                className="bg-bg-surface rounded-xl border border-border-color hover:border-[#FF7043]/50 overflow-hidden flex flex-col relative group shadow-lg cursor-pointer transition-all duration-200"
              >
                {/* Header Actions (Dropdown) */}
                <div className="absolute top-3 right-3 z-10 print:hidden">
                  <div className="relative">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === item.id ? null : item.id); }} 
                      className="bg-black/50 hover:bg-black/80 text-text-primary p-1.5 rounded-md backdrop-blur transition-colors"
                    >
                      <MoreVertical size={16} />
                    </button>
                    
                    {menuOpenId === item.id && (
                      <div className="absolute right-0 mt-1 w-44 bg-bg-dark border border-border-color rounded-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                        <button onClick={(e) => { e.stopPropagation(); openEditModal(item.id); setMenuOpenId(null); }} className="w-full text-left px-3 py-2.5 text-sm text-text-secondary hover:bg-btn-secondary flex items-center gap-2">
                          <Edit size={14}/> Edit Data
                        </button>
                        <div className="border-t border-border-color/50 my-1"></div>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); setMenuOpenId(null); }} className="w-full text-left px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                          <Trash2 size={14}/> Hapus Gudang
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Visual / Gambar Tema */}
                <div 
                  className="h-44 w-full bg-bg-dark relative border-b border-border-color"
                >
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 pointer-events-none">
                      <ImageIcon size={40} className="opacity-30"/>
                    </div>
                  )}
                </div>

                {/* Card Info Content */}
                <div 
                  className="p-5 flex-1 flex flex-col"
                >
                  <div className="mb-4 pointer-events-none">
                    <div className="text-blue-400 font-mono text-xs font-semibold mb-1">{item.id}</div>
                    <h3 className="text-text-primary font-bold text-lg leading-tight">{item.name}</h3>
                    <div className="text-text-secondary text-xs mt-2 flex items-center gap-1.5">
                      <MapPin size={12}/> {item.location}
                    </div>
                  </div>
                  
                  {/* Operational Stats list */}
                  <div className="space-y-3 mt-auto pointer-events-none">
                    <div className="flex justify-between items-center bg-bg-dark/60 p-3 rounded-lg border border-border-color/60">
                      <div className="flex items-center gap-2 text-text-secondary text-xs font-medium">
                        <Package size={15} className="text-accent"/> Kategori Barang
                      </div>
                      <div className="text-text-primary text-xs font-medium flex items-center gap-1.5">
                        {item.kategori}
                        {item.kategori === 'Barang Berbahaya' && <TriangleAlert size={15} className="text-red-500" title="Barang Berbahaya" />}
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-bg-dark/60 p-3 rounded-lg border border-border-color/60">
                      <div className="flex items-center gap-2 text-text-secondary text-xs font-medium">
                        <Layers size={15} className="text-blue-400"/> Total Barang
                      </div>
                      <div className="text-text-primary text-xs font-medium">
                        {inventory.filter(i => i.gudang === item.name).length} Item
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-bg-dark/60 p-3 rounded-lg border border-border-color/60">
                      <div className="flex items-center gap-2 text-text-secondary text-xs font-medium">
                        <User size={15} className="text-green-400"/> Kepala Gudang
                      </div>
                      <div className="text-text-primary text-xs font-medium">{item.kepalaGudang || '-'}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:hidden overflow-y-auto">
          <div className="bg-bg-surface border border-border-color rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-border-color bg-black/20 shrink-0">
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                {modalMode === 'add' ? <><Plus className="text-green-500" size={18}/> Tambah Data Gudang</> : <><Edit className="text-blue-500" size={18}/> Update Data Gudang</>}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-text-secondary hover:text-text-primary transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-end">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary flex justify-between">
                    Kode Gudang (ID)
                    <span className="text-text-secondary italic font-normal">(Otomatis)</span>
                  </label>
                  <input 
                    type="text" required
                    disabled
                    value={formData.id} 
                    className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043] opacity-60 font-mono text-text-secondary cursor-not-allowed" 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Nama Gudang</label>
                  <input 
                    type="text" required
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043] text-text-primary" 
                    placeholder="Nama gudang..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Lokasi / Area</label>
                  <input 
                    type="text" required
                    value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}
                    className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043] text-text-primary" 
                    placeholder="Contoh: Area Timur Pabrik"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Kepala Gudang</label>
                  <select 
                    required
                    value={formData.kepalaGudang} onChange={e => setFormData({...formData, kepalaGudang: e.target.value})}
                    className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043] text-text-primary appearance-none cursor-pointer custom-scrollbar"
                    style={{ maxHeight: '150px' }}
                  >
                    {DUMMY_PEKERJA.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 bg-bg-dark/50 border border-border-color rounded-xl space-y-4">
                <h3 className="text-sm font-semibold text-text-secondary border-b border-border-color pb-2">Informasi Visual</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Kategori Barang</label>
                    <select 
                      value={formData.kategori} onChange={e => setFormData({...formData, kategori: e.target.value})}
                      className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043] text-text-primary appearance-none cursor-pointer"
                    >
                      <option value="Barang Kering">Barang Kering</option>
                      <option value="Barang Cair">Barang Cair</option>
                      <option value="Barang Berbahaya">Barang Berbahaya</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Upload Gambar Tema</label>
                    <div 
                      className="border-2 border-dashed border-gray-600 rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer hover:border-[#FF7043] transition-colors bg-bg-dark h-20"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {formData.image ? (
                        <div className="relative w-full h-full overflow-hidden rounded">
                          <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-text-primary text-xs font-medium">Ganti</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-text-secondary">
                          <Upload size={18} />
                          <span className="text-xs">Pilih Gambar...</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-secondary">Keterangan Tambahan</label>
                <textarea 
                  rows="2"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043] resize-none text-text-primary" 
                  placeholder="Tambahkan fungsi gudang atau catatan khusus..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-border-color shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-sm text-text-secondary hover:text-text-primary font-medium">
                  Batal
                </button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-text-primary px-6 py-2 rounded-lg text-sm font-medium shadow-lg transition-colors flex items-center gap-2">
                  <Check size={16}/> {modalMode === 'add' ? 'Simpan Data Gudang' : 'Update Data Gudang'}
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
root.render(<DataGudang />);
