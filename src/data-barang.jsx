import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Search, Edit, Trash2, Printer, Plus, AlertCircle, Check, X, Upload
} from 'lucide-react';

const PREFIX_MAP = {
  'Material': 'RAW',
  'Equipments': 'EQP',
  'Consumable': 'CSM',
  'APD': 'APD',
  'Sparepart': 'PRT',
  'Tool': 'TLS'
};

const SATUAN_OPTIONS = ['Pcs', 'Kg', 'Roll', 'Bottle', 'Sheet'];
const JENIS_OPTIONS = Object.keys(PREFIX_MAP);
const KARAKTERISTIK_OPTIONS = ['Barang Kering', 'Barang Cair', 'Barang Berbahaya'];
const KEGUNAAN_OPTIONS = ['Electrical', 'Plumbing', 'Civil', 'APD', 'Other'];

const INITIAL_INVENTORY = [
  { id: 'RAW-001', name: 'Plat Besi 5mm', qty: 9, min: 10, unit: 'Sheet', type: 'Material', spec: 'Plat baja tebal 5mm', equipment: '', characteristic: 'Barang Kering', usage: 'Civil', gudang: 'Gudang Utama' },
  { id: 'CSM-002', name: 'Pelumas Hidrolik 50L', qty: 3, min: 5, unit: 'Bottle', type: 'Consumable', spec: 'Oli Hidrolik SAE 40', equipment: 'Hydraulic Press HP-01', characteristic: 'Barang Cair', usage: 'Other', gudang: 'Gudang Sparepart' },
  { id: 'PRT-003', name: 'Bantalan Rol (Bearing) 20mm', qty: 15, min: 20, unit: 'Pcs', type: 'Sparepart', spec: 'SKF 6204', equipment: 'Conveyor Utama', characteristic: 'Barang Kering', usage: 'Mechanical', gudang: 'Gudang Utama' },
  { id: 'RAW-004', name: 'Kabel Tembaga 2.5mm', qty: 100, min: 50, unit: 'Roll', type: 'Material', spec: 'NYAF 2.5mm Merah', equipment: '', characteristic: 'Barang Kering', usage: 'Electrical', gudang: 'Gudang Utama' },
];

function DataBarang() {
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCriteria, setSearchCriteria] = useState('Semua'); 
  const [filterGudang, setFilterGudang] = useState('');
  
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  
  // Form State
  const [formData, setFormData] = useState({ 
    id: '', 
    name: '', 
    unit: 'Pcs', 
    type: 'Material', 
    min: 0, 
    qty: 0, 
    spec: '', 
    equipment: '', 
    image: null,
    characteristic: 'Barang Kering',
    usage: 'Other',
    gudang: 'Gudang Utama'
  });
  const [kodeNumber, setKodeNumber] = useState('');

  const fileInputRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gudang = params.get('filterGudang');
    if (gudang) {
      setFilterGudang(gudang);
    }
  }, []);

  // Filter Logic
  const filteredInventory = inventory.filter(item => {
    const matchGudang = filterGudang ? item.gudang === filterGudang : true;
    
    const query = searchQuery.toLowerCase();
    let matchSearch = true;
    if (query) {
      if (searchCriteria === 'Kode Barang') matchSearch = item.id.toLowerCase().includes(query);
      else if (searchCriteria === 'Nama Barang') matchSearch = item.name.toLowerCase().includes(query);
      else if (searchCriteria === 'Jenis Barang') matchSearch = item.type.toLowerCase().includes(query);
      else {
        matchSearch = item.id.toLowerCase().includes(query) || 
               item.name.toLowerCase().includes(query) || 
               item.type.toLowerCase().includes(query);
      }
    }
    
    return matchGudang && matchSearch;
  });

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };
  
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredInventory.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredInventory.map(i => i.id));
    }
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} data barang terpilih?`)) {
      setInventory(prev => prev.filter(item => !selectedIds.includes(item.id)));
      setSelectedIds([]);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ 
      id: '', name: '', unit: 'Pcs', type: 'Material', min: 0, qty: 0, spec: '', equipment: '', image: null, characteristic: 'Barang Kering', usage: 'Other', gudang: filterGudang || 'Gudang Utama'
    });
    setKodeNumber('');
    setIsModalOpen(true);
  };

  const openEditModal = () => {
    if (selectedIds.length !== 1) {
      alert("Pilih tepat 1 barang untuk diupdate.");
      return;
    }
    openEditModalForId(selectedIds[0]);
  };

  const openEditModalForId = (id) => {
    const itemToEdit = inventory.find(i => i.id === id);
    if (itemToEdit) {
      setModalMode('edit');
      setFormData({ ...itemToEdit });
      
      // Extract number from prefix
      const prefix = PREFIX_MAP[itemToEdit.type] || '';
      if (itemToEdit.id.startsWith(prefix + '-')) {
        setKodeNumber(itemToEdit.id.substring(prefix.length + 1));
      } else {
        setKodeNumber(itemToEdit.id); // fallback
      }
      
      setIsModalOpen(true);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    
    const prefix = PREFIX_MAP[formData.type] || 'UNK';
    const finalId = `${prefix}-${kodeNumber}`;
    const payload = { ...formData, id: finalId };

    if (modalMode === 'add') {
      if (inventory.some(i => i.id === finalId)) {
        alert("Kode Barang (SKU) sudah digunakan!");
        return;
      }
      setInventory(prev => [...prev, payload]);
    } else {
      setInventory(prev => prev.map(item => item.id === payload.id ? payload : item));
    }
    setIsModalOpen(false);
  };

  const showEquipmentField = formData.type === 'Sparepart' || formData.type === 'Consumable';

  return (
    <div className="flex flex-col h-full gap-4 text-text-primary font-sans print:bg-white print:text-black">
      
      {/* Action Bar - Hidden during print */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-bg-surface p-4 rounded-xl border border-border-color shadow gap-4 print:hidden">
        
        {/* Search & Criteria */}
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            value={searchCriteria}
            onChange={(e) => setSearchCriteria(e.target.value)}
            className="bg-bg-dark border border-border-color rounded-lg py-2 px-3 text-sm focus:outline-none focus:border-[#FF7043] appearance-none"
          >
            <option value="Semua">Semua Kriteria</option>
            <option value="Kode Barang">Kode Barang</option>
            <option value="Nama Barang">Nama Barang</option>
            <option value="Jenis Barang">Jenis Barang</option>
          </select>
          
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari data barang..." 
              className="w-full bg-bg-dark border border-border-color rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-[#FF7043] transition-colors"
            />
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button 
            onClick={openAddModal}
            className="bg-green-600 hover:bg-green-500 text-text-primary px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 shadow transition-colors"
          >
            <Plus size={16} /> Tambah Data
          </button>
          <button 
            onClick={handleDelete}
            disabled={selectedIds.length === 0}
            className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 shadow transition-colors ${selectedIds.length > 0 ? 'bg-red-600 hover:bg-red-500 text-text-primary' : 'bg-gray-700 text-text-secondary cursor-not-allowed'}`}
          >
            <Trash2 size={16} /> Hapus Data
          </button>
          <button 
            onClick={handlePrint}
            className="bg-bg-dark border border-border-color hover:bg-btn-secondary text-text-secondary px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 shadow transition-colors"
          >
            <Printer size={16} /> Cetak
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-bg-surface rounded-xl border border-border-color shadow overflow-hidden flex-1 flex flex-col print:border-none print:shadow-none print:bg-white">
        <div className="p-3 border-b border-border-color bg-bg-surface print:bg-white print:border-b-2 print:border-black flex justify-between items-center">
          <h2 className="text-text-primary font-semibold flex items-center gap-2 text-sm print:text-black print:text-xl">
            Daftar Master Data Barang {filterGudang && <span className="text-accent ml-2">({filterGudang})</span>}
          </h2>
          <div className="flex items-center gap-3">
            {filterGudang && (
              <button 
                onClick={() => {
                  window.location.href = 'data-gudang.html';
                }} 
                className="text-xs text-text-primary bg-gray-700 hover:bg-gray-600 flex items-center gap-1 rounded px-3 py-1.5 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg> Kembali ke Data Gudang
              </button>
            )}
            <span className="text-xs text-text-secondary print:text-gray-600">Total: {filteredInventory.length} item</span>
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1 custom-scrollbar print:overflow-visible">
          <table className="w-full text-left text-sm whitespace-nowrap print:text-black">
            <thead className="bg-bg-dark text-text-secondary border-b border-border-color sticky top-0 z-10 print:static print:bg-gray-100 print:text-black print:border-black">
              <tr>
                <th className="px-4 py-3 font-medium w-10 print:hidden">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length > 0 && selectedIds.length === filteredInventory.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-600 bg-gray-700 text-accent focus:ring-[#FF7043]"
                  />
                </th>
                <th className="px-4 py-3 font-medium">No</th>
                <th className="px-4 py-3 font-medium">Kode Barang</th>
                <th className="px-4 py-3 font-medium">Nama Barang</th>
                <th className="px-4 py-3 font-medium">Satuan</th>
                <th className="px-4 py-3 font-medium">Jenis Barang</th>
                <th className="px-4 py-3 font-medium text-center">Stok Min</th>
                <th className="px-4 py-3 font-medium text-center">Stok</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 print:divide-gray-300">
              {filteredInventory.map((item, index) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <tr 
                    key={item.id} 
                    onClick={() => toggleSelect(item.id)}
                    className={`transition-colors print:border-b print:border-gray-200 cursor-pointer ${isSelected ? 'bg-btn-secondary/80 border-l-2 border-l-[#FF7043]' : 'hover:bg-btn-secondary/40 border-l-2 border-l-transparent'}`}
                  >
                    <td className="px-4 py-3 print:hidden">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => {}} // Handled by tr onClick
                        onClick={(e) => e.stopPropagation()} // Prevent double trigger
                        className="rounded border-gray-600 bg-gray-700 text-accent focus:ring-[#FF7043] pointer-events-none"
                      />
                    </td>
                    <td className="px-4 py-3 font-mono font-medium text-text-secondary print:text-black">{index + 1}</td>
                    <td className="px-4 py-3 font-mono text-blue-400 font-medium print:text-blue-700">
                      <span 
                        className="cursor-pointer hover:underline hover:text-blue-300"
                        onClick={(e) => {
                          e.stopPropagation(); // prevent row selection toggle
                          openEditModalForId(item.id);
                        }}
                      >
                        {item.id}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-primary font-medium print:text-black">{item.name}</td>
                    <td className="px-4 py-3 text-text-secondary print:text-black">{item.unit}</td>
                    <td className="px-4 py-3 text-text-secondary print:text-black">
                      <span className="px-2 py-0.5 bg-bg-dark border border-border-color rounded text-xs print:bg-transparent print:border-none print:p-0">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-text-secondary print:text-black">{item.min}</td>
                    <td className="px-4 py-3 text-center font-bold text-text-primary print:text-black">
                      {item.qty}
                    </td>
                  </tr>
                );
              })}
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-text-secondary">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle size={32} className="mb-2 opacity-50" />
                      <p>Tidak ada data barang yang sesuai dengan kriteria pencarian.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 print:hidden overflow-y-auto">
          <div className="bg-bg-surface border border-border-color rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            <div className="flex justify-between items-center p-4 border-b border-border-color bg-black/20 sticky top-0 z-10">
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                {modalMode === 'add' ? <><Plus className="text-green-500" size={18}/> Tambah Data Barang</> : <><Edit className="text-blue-500" size={18}/> Update Data Barang</>}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-text-secondary hover:text-text-primary transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Jenis Barang</label>
                    <select 
                      required
                      value={formData.type} 
                      onChange={e => setFormData({...formData, type: e.target.value})}
                      className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043] appearance-none text-text-primary"
                    >
                      {JENIS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Kode Barang (SKU)</label>
                    <div className="flex items-center">
                      <div className="bg-btn-secondary border border-border-color border-r-0 rounded-l-lg p-2.5 text-sm text-text-secondary font-mono w-16 text-center select-none">
                        {PREFIX_MAP[formData.type] || 'UNK'}-
                      </div>
                      <input 
                        type="text" required
                        disabled={modalMode === 'edit'}
                        value={kodeNumber} 
                        onChange={e => setKodeNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full bg-bg-dark border border-border-color rounded-r-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043] disabled:opacity-50 font-mono" 
                        placeholder="Contoh: 001"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Nama Barang</label>
                    <input 
                      type="text" required
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043]" 
                      placeholder="Ketik nama otomatis..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-secondary">Satuan</label>
                      <select 
                        required
                        value={formData.unit} 
                        onChange={e => setFormData({...formData, unit: e.target.value})}
                        className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043] appearance-none text-text-primary"
                      >
                        {SATUAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-secondary">&nbsp;</label>
                      <div className="text-xs text-text-secondary pt-2 italic">Dipilih via dropdown</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-secondary flex justify-between items-center h-4">
                        <span>Stok Min</span>
                      </label>
                      <input 
                        type="number" min="0" required
                        onKeyDown={(e) => {
                          if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        value={formData.min} onChange={e => setFormData({...formData, min: parseInt(e.target.value || 0)})}
                        className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043]" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-secondary flex justify-between items-center h-4">
                        <span>Stok</span>
                        <span className="text-[10px] italic">(Auto)</span>
                      </label>
                      <input 
                        type="number" min="0" required disabled
                        value={formData.qty}
                        className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm text-text-secondary opacity-70 cursor-not-allowed" 
                      />
                    </div>
                  </div>


                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-secondary">Klasifikasi Kegunaan</label>
                      <select 
                        required
                        value={formData.usage} 
                        onChange={e => setFormData({...formData, usage: e.target.value})}
                        className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043] appearance-none text-text-primary"
                      >
                        {KEGUNAAN_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Spesifikasi Barang</label>
                    <textarea 
                      rows="3"
                      value={formData.spec} onChange={e => setFormData({...formData, spec: e.target.value})}
                      className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043] resize-none" 
                      placeholder="Jelaskan spesifikasi..."
                    />
                  </div>

                  {showEquipmentField && (
                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="text-xs font-medium text-accent">Relasi Equipment</label>
                      <input 
                        type="text"
                        value={formData.equipment} onChange={e => setFormData({...formData, equipment: e.target.value})}
                        className="w-full bg-bg-dark border border-[#FF7043]/50 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043]" 
                        placeholder="Cth: Pompa Boiler PB-01"
                      />
                      <p className="text-[10px] text-text-secondary">Terangkan barang ini dipergunakan untuk Equipment apa.</p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Upload Gambar Barang</label>
                    
                    <div 
                      className="border-2 border-dashed border-gray-600 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-[#FF7043] transition-colors bg-bg-dark"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {formData.image ? (
                        <div className="relative w-full h-24 overflow-hidden rounded">
                          <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="text-text-primary text-xs font-medium">Ganti Gambar</span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload size={24} className="text-text-secondary mb-2" />
                          <span className="text-xs text-text-secondary text-center">Klik untuk memilih gambar<br/>(Max 2MB)</span>
                        </>
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

                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-medium text-text-secondary">Klasifikasi Karakteristik</label>
                    <select 
                      required
                      value={formData.characteristic} 
                      onChange={e => setFormData({...formData, characteristic: e.target.value})}
                      className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043] appearance-none text-text-primary"
                    >
                      {KARAKTERISTIK_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    {formData.characteristic === 'Barang Kering' && (
                      <p className="text-[10px] text-text-secondary mt-1">Barang umum yang tidak memerlukan pengaturan suhu</p>
                    )}
                    {formData.characteristic === 'Barang Cair' && (
                      <p className="text-[10px] text-text-secondary mt-1">Barang berbentuk liquid namun tidak berbahaya</p>
                    )}
                    {formData.characteristic === 'Barang Berbahaya' && (
                      <p className="text-[10px] text-red-400 mt-1 flex items-start gap-1"><AlertCircle size={12} className="mt-0.5 flex-shrink-0"/> Bahan kimia, mudah terbakar, atau beracun yang memerlukan lokasi khusus</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border-color sticky bottom-0 bg-bg-surface">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary font-medium">
                  Batal
                </button>
                <button type="submit" className="bg-[#FF7043] hover:bg-[#FF3D00] text-text-primary px-5 py-2 rounded-lg text-sm font-medium shadow-lg transition-colors flex items-center gap-1.5">
                  <Check size={16}/> {modalMode === 'add' ? 'Tambah' : 'Update'}
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
root.render(<DataBarang />);
