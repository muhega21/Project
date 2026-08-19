import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ArrowLeft, Search, Filter, AlertCircle, 
  CheckCircle2, Clock, Settings, FileText, ChevronRight, Plus, X, Upload, Image as ImageIcon
} from 'lucide-react';

function DetailEquipment() {
  const [equipments, setEquipments] = useState([]);
  const [zoneId, setZoneId] = useState(null);
  const [plantCode, setPlantCode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAssetId, setNewAssetId] = useState('');
  const [kondisiEquipment, setKondisiEquipment] = useState('Baik');
  const [editingAsset, setEditingAsset] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [viewingAsset, setViewingAsset] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterArea, setFilterArea] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');

  const generateAssetId = () => {
    return 'EQU-' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  };

  const loadAssets = () => {
    const params = new URLSearchParams(window.location.search);
    const zid = params.get('zoneId');
    const pc = params.get('plantCode');
    
    setZoneId(zid);
    setPlantCode(pc);
    
    const stored = JSON.parse(localStorage.getItem('maintainx_assets')) || [];
    let filtered = stored;
    
    if (zid) {
      filtered = filtered.filter(a => a.zoneId === zid);
    }
    if (pc) {
      filtered = filtered.filter(a => a.plantCode === pc);
    }
    
    setEquipments(filtered);
  };

  useEffect(() => {
    loadAssets();
  }, []);

  const handleAddEquipment = (e) => {
    e.preventDefault();
    const assetData = {
      id: document.getElementById('form-eq-id').value,
      name: document.getElementById('form-eq-name').value,
      category: document.getElementById('form-eq-category').value,
      type: document.getElementById('form-eq-type').value,
      location: document.getElementById('form-eq-location').value,
      kondisi: document.getElementById('form-eq-kondisi').value,
      status: document.getElementById('form-eq-status').value,
      spec: document.getElementById('form-eq-spec').value,
      image: uploadedImage,
      zoneId: editingAsset ? editingAsset.zoneId : (zoneId || ''),
      plantCode: editingAsset ? editingAsset.plantCode : (plantCode || '')
    };
    
    const stored = JSON.parse(localStorage.getItem('maintainx_assets')) || [];
    if (editingAsset) {
      const idx = stored.findIndex(a => a.id === editingAsset.id);
      if (idx !== -1) {
        stored[idx] = { ...stored[idx], ...assetData };
      }
    } else {
      stored.push(assetData);
    }
    try {
      localStorage.setItem('maintainx_assets', JSON.stringify(stored));
      alert(editingAsset ? 'Equipment berhasil diperbarui!' : 'Equipment berhasil ditambahkan!');
      setIsAddModalOpen(false);
      loadAssets(); // refresh list
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan. Kapasitas penyimpanan lokal browser penuh. Coba gunakan gambar yang lebih kecil.');
    }
  };

  const openAddModal = () => {
    setEditingAsset(null);
    setNewAssetId(generateAssetId());
    setKondisiEquipment('Baik');
    setUploadedImage(null);
    setIsAddModalOpen(true);
  };

  const openEditModal = (asset) => {
    setEditingAsset(asset);
    setNewAssetId(asset.id);
    setKondisiEquipment(asset.kondisi || 'Baik');
    setUploadedImage(asset.image || null);
    setIsAddModalOpen(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran gambar melebihi batas maksimal 5MB!');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;
        
        if (width > height && width > maxDim) {
          height *= maxDim / width;
          width = maxDim;
        } else if (height > maxDim) {
          width *= maxDim / height;
          height = maxDim;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Kompres gambar menjadi JPEG (kualitas 0.7) agar muat di localStorage
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setUploadedImage(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const updateAsset = (id, field, value) => {
    const stored = JSON.parse(localStorage.getItem('maintainx_assets')) || [];
    const index = stored.findIndex(a => a.id === id);
    if (index === -1) return;
    
    stored[index][field] = value;
    
    if (field === 'kondisi') {
      if (value === 'Baik' && !['Running', 'Active', 'Stand By'].includes(stored[index].status)) {
        stored[index].status = 'Running';
      } else if (value === 'Rusak' && !['Maintenance', 'Breakdown'].includes(stored[index].status)) {
        stored[index].status = 'Maintenance';
      }
    }
    
    localStorage.setItem('maintainx_assets', JSON.stringify(stored));
    loadAssets();
  };

  const handleDeleteAsset = (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus equipment ini?')) return;
    
    const stored = JSON.parse(localStorage.getItem('maintainx_assets')) || [];
    const updated = stored.filter(a => a.id !== id);
    localStorage.setItem('maintainx_assets', JSON.stringify(updated));
    loadAssets();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Breakdown': case 'Down': return <AlertCircle size={16} className="text-red-500" />;
      case 'Warning': return <AlertCircle size={16} className="text-yellow-500" />;
      case 'Running': case 'Active': return <CheckCircle2 size={16} className="text-green-500" />;
      case 'Maintenance': return <Settings size={16} className="text-blue-500" />;
      default: return <Clock size={16} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Breakdown': case 'Down': return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'Warning': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      case 'Running': case 'Active': return 'bg-green-500/10 text-green-500 border-green-500/30';
      case 'Maintenance': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      default: return 'bg-gray-500/10 text-text-secondary border-gray-500/30';
    }
  };

  const uniqueAreas = ['Semua', ...new Set(equipments.map(eq => eq.plantCode || eq.zoneId || '-'))];

  const filteredData = equipments.filter(eq => {
    const matchSearch = eq.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        eq.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (eq.location && eq.location.toLowerCase().includes(searchTerm.toLowerCase()));
                        
    const areaVal = eq.plantCode || eq.zoneId || '-';
    const matchArea = filterArea === 'Semua' || areaVal === filterArea;
    
    const matchStatus = filterStatus === 'Semua' || eq.status === filterStatus;
    
    return matchSearch && matchArea && matchStatus;
  });

  return (
    <div className="flex-1 bg-bg-dark text-text-primary p-8 overflow-y-auto">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-text-secondary text-sm mb-2 font-medium">
            <a href="/asset-register.html" className="hover:text-blue-400 transition-colors">Asset Register</a>
            <ChevronRight size={14} />
            <a href="#" onClick={() => window.history.back()} className="hover:text-blue-400 transition-colors">Layout Area</a>
            <ChevronRight size={14} />
            <span className="text-white">Detail Equipment</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white leading-tight">
            Detail Equipment
          </h2>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 bg-btn-secondary hover:bg-gray-700 text-white rounded-lg border border-border-color transition-colors font-medium text-sm"
          >
            <ArrowLeft size={18} />
            Kembali ke Layout
          </button>
        </div>
      </div>

      {/* Toolbar / Search */}
      <div className="bg-bg-surface border border-border-color rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Cari nama equipment atau tipe..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-input-bg border border-border-color rounded-lg pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-4 py-2.5 hover:bg-gray-700 rounded-lg border transition-colors font-medium text-sm ${filterArea !== 'Semua' || filterStatus !== 'Semua' ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-input-bg border-border-color text-text-secondary'}`}
            >
              <Filter size={16} />
              Filter {(filterArea !== 'Semua' || filterStatus !== 'Semua') && <span className="flex h-2 w-2 rounded-full bg-blue-500 ml-1"></span>}
            </button>
            
            {isFilterOpen && (
              <div className="absolute top-full mt-2 right-0 w-64 bg-[#1A2028] border border-border-color rounded-xl shadow-2xl z-40 p-4">
                <h4 className="text-white font-semibold text-sm mb-3">Filter Equipment</h4>
                
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Area / Lokasi</label>
                    <select 
                      value={filterArea}
                      onChange={(e) => setFilterArea(e.target.value)}
                      className="w-full bg-black/40 border border-border-color text-white px-3 py-2 rounded-lg outline-none focus:border-blue-500 text-sm appearance-none cursor-pointer"
                    >
                      {uniqueAreas.map(area => (
                        <option key={area} value={area}>{area === 'Semua' ? 'Semua Area' : area}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Status Operasional</label>
                    <select 
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full bg-black/40 border border-border-color text-white px-3 py-2 rounded-lg outline-none focus:border-blue-500 text-sm appearance-none cursor-pointer"
                    >
                      <option value="Semua">Semua Status</option>
                      <option value="Running">Running</option>
                      <option value="Active">Active</option>
                      <option value="Stand By">Stand By</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Breakdown">Breakdown</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-border-color flex justify-end gap-2">
                  <button 
                    onClick={() => { setFilterArea('Semua'); setFilterStatus('Semua'); }}
                    className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Reset
                  </button>
                  <button 
                    onClick={() => setIsFilterOpen(false)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm shadow-lg shadow-blue-900/20">
            <FileText size={16} />
            Export Data
          </button>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm shadow-lg shadow-green-900/20">
            <Plus size={16} />
            Tambah Equipment
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-bg-surface border border-border-color rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-black/20 text-xs uppercase tracking-wider text-text-secondary">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap font-semibold text-center w-16">No</th>
                <th className="px-4 py-3 whitespace-nowrap font-semibold">Kode Area/Lokasi</th>
                <th className="px-4 py-3 whitespace-nowrap font-semibold">Lokasi/Ruangan</th>
                <th className="px-4 py-3 whitespace-nowrap font-semibold">ID Equipment</th>
                <th className="px-4 py-3 whitespace-nowrap font-semibold">Nama Equipment</th>
                <th className="px-4 py-3 whitespace-nowrap font-semibold">Klasifikasi</th>
                <th className="px-4 py-3 whitespace-nowrap font-semibold text-center">Kondisi Equipment</th>
                <th className="px-4 py-3 whitespace-nowrap font-semibold text-center">Status Operasional</th>
                <th className="px-4 py-3 whitespace-nowrap font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {filteredData.length > 0 ? (
                filteredData.map((eq, index) => (
                  <tr key={eq.id} className="hover:bg-gray-800/30 transition-colors text-sm">
                    <td className="px-4 py-3 whitespace-nowrap text-center text-text-secondary">{index + 1}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-text-secondary">
                      {eq.plantCode || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-text-secondary">{eq.location || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-blue-400">
                      <button 
                        onClick={() => setViewingAsset(eq)}
                        className="hover:underline hover:text-blue-300 focus:outline-none transition-colors"
                      >
                        {eq.id}
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-white">{eq.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-text-secondary">{eq.category || '-'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <select 
                        value={eq.kondisi || 'Baik'}
                        onChange={(e) => updateAsset(eq.id, 'kondisi', e.target.value)}
                        className="bg-black/40 border border-border-color text-white px-2 py-1.5 rounded-lg outline-none focus:border-blue-500 transition-colors text-sm cursor-pointer"
                      >
                        <option value="Baik">Baik</option>
                        <option value="Rusak">Rusak</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex justify-center items-center gap-2">
                        {getStatusIcon(eq.status)}
                        <select 
                          value={eq.status || 'Running'}
                          onChange={(e) => updateAsset(eq.id, 'status', e.target.value)}
                          className={`bg-transparent border border-border-color px-2 py-1 rounded-lg outline-none focus:border-blue-500 transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer ${getStatusColor(eq.status)}`}
                        >
                          {(eq.kondisi === 'Rusak' ? false : true) ? (
                            <>
                              <option value="Running" className="bg-bg-dark text-white">Running</option>
                              <option value="Active" className="bg-bg-dark text-white">Active</option>
                              <option value="Stand By" className="bg-bg-dark text-white">Stand By</option>
                            </>
                          ) : (
                            <>
                              <option value="Maintenance" className="bg-bg-dark text-white">Maintenance</option>
                              <option value="Breakdown" className="bg-bg-dark text-white">Breakdown</option>
                            </>
                          )}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button
                          onClick={() => openEditModal(eq)}
                          className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded transition-colors text-xs font-semibold uppercase tracking-wider"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAsset(eq.id)}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded transition-colors text-xs font-semibold uppercase tracking-wider"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-text-secondary">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle size={32} className="text-gray-600 mb-3" />
                      <p>Tidak ada data equipment yang ditemukan.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Dummy */}
        <div className="px-6 py-4 border-t border-border-color bg-black/10 flex items-center justify-between text-sm text-text-secondary">
          <div>Menampilkan {filteredData.length} data</div>
          <div className="flex gap-1">
            <button className="px-3 py-1 rounded border border-border-color hover:bg-gray-700 disabled:opacity-50">Prev</button>
            <button className="px-3 py-1 rounded bg-blue-600 text-white border border-blue-600">1</button>
            <button className="px-3 py-1 rounded border border-border-color hover:bg-gray-700">Next</button>
          </div>
        </div>
      </div>

      {/* Add Equipment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1A2028] border border-border-color rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-color bg-[#12161A]">
              <h3 className="text-xl font-bold text-white">{editingAsset ? 'Edit Equipment' : 'Tambah Equipment'}</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Modal Body */}
            <form key={editingAsset ? editingAsset.id : 'new'} onSubmit={handleAddEquipment} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col lg:flex-row gap-8">
                
                {/* Left Column - Image Upload */}
                <div className="w-full lg:w-1/3 flex flex-col gap-4">
                  <label htmlFor="upload-eq-image" className="w-full aspect-square bg-[#12161A] border-2 border-dashed border-border-color rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors cursor-pointer group overflow-hidden relative">
                    {uploadedImage ? (
                      <img src={uploadedImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <ImageIcon size={48} className="mb-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                        <span className="font-medium">Upload Gambar</span>
                        <span className="text-xs mt-2 opacity-50">JPG, PNG max 5MB</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      id="upload-eq-image" 
                      accept="image/jpeg, image/png" 
                      onChange={handleImageUpload} 
                      className="hidden" 
                    />
                  </label>
                  <label htmlFor="upload-eq-image" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-btn-secondary hover:bg-gray-700 text-white rounded-lg border border-border-color transition-colors font-medium text-sm cursor-pointer">
                    <Upload size={16} />
                    Update / Upload Gambar
                  </label>
                </div>
                
                {/* Right Column - Form Fields */}
                <div className="w-full lg:w-2/3 flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* ID Equipment */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-400">ID Equipment</label>
                      <input 
                        type="text" 
                        id="form-eq-id"
                        readOnly 
                        value={newAssetId} 
                        className="bg-black/50 border border-border-color text-gray-400 px-4 py-2.5 rounded-lg cursor-not-allowed outline-none"
                      />
                    </div>
                    
                    {/* Nama Equipment */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-400">Nama Equipment</label>
                      <input 
                        type="text" 
                        id="form-eq-name"
                        required
                        defaultValue={editingAsset?.name || ''}
                        placeholder="Contoh: BOILER TUBE A"
                        className="bg-input-bg border border-border-color text-white px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    
                    {/* Klasifikasi Equipment */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-400">Klasifikasi Equipment</label>
                      <input 
                        type="text" 
                        id="form-eq-category"
                        required
                        defaultValue={editingAsset?.category || ''}
                        placeholder="Contoh: Heavy Machinery"
                        className="bg-input-bg border border-border-color text-white px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    
                    {/* Tipe Equipment */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-400">Tipe Equipment</label>
                      <input 
                        type="text" 
                        id="form-eq-type"
                        required
                        defaultValue={editingAsset?.type || ''}
                        placeholder="Contoh: Boiler Component"
                        className="bg-input-bg border border-border-color text-white px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    
                    {/* Lokasi/Ruangan */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-400">Lokasi / Ruangan</label>
                      <input 
                        type="text" 
                        id="form-eq-location"
                        defaultValue={editingAsset?.location || ''}
                        placeholder="Contoh: Boiler Room Lt. 1"
                        className="bg-input-bg border border-border-color text-white px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    
                    {/* Kondisi */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-400">Kondisi Equipment</label>
                      <select 
                        id="form-eq-kondisi" 
                        required 
                        value={kondisiEquipment}
                        onChange={(e) => setKondisiEquipment(e.target.value)}
                        className="bg-input-bg border border-border-color text-white px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                      >
                        <option value="Baik">Baik</option>
                        <option value="Rusak">Rusak</option>
                      </select>
                    </div>
                    
                  </div>
                  
                  {/* Status */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-400">Status Operasional</label>
                    <select id="form-eq-status" required className="bg-input-bg border border-border-color text-white px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer">
                      {kondisiEquipment === 'Baik' ? (
                        <>
                          <option value="Running">Running (Beroperasi Normal)</option>
                          <option value="Active">Active (Aktif)</option>
                          <option value="Stand By">Stand By (Siaga)</option>
                        </>
                      ) : (
                        <>
                          <option value="Maintenance">Maintenance (Pemeliharaan)</option>
                          <option value="Breakdown">Breakdown (Rusak)</option>
                        </>
                      )}
                    </select>
                  </div>
                  
                  {/* Spesifikasi */}
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-sm font-medium text-gray-400">Informasi / Spesifikasi</label>
                    <textarea 
                      id="form-eq-spec"
                      rows="4"
                      defaultValue={editingAsset?.spec || ''}
                      placeholder="Masukkan spesifikasi lengkap, kapasitas, merek, atau informasi lainnya..."
                      className="bg-input-bg border border-border-color text-white px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 transition-colors resize-none flex-1"
                    ></textarea>
                  </div>
                  
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-color bg-[#12161A]">
              <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg shadow-blue-900/20">
                {editingAsset ? 'Simpan Perubahan' : 'Tambah Equipment'}
              </button>
            </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#1A2028] border border-border-color rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-color bg-[#12161A]">
              <h3 className="text-xl font-bold text-white">Detail Equipment</h3>
              <button 
                onClick={() => setViewingAsset(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex flex-col md:flex-row p-6 gap-8 overflow-y-auto max-h-[80vh]">
              {/* Image Section */}
              <div className="w-full md:w-1/3">
                <div className="w-full aspect-square bg-[#12161A] border border-border-color rounded-xl overflow-hidden flex items-center justify-center">
                  {viewingAsset.image ? (
                    <img src={viewingAsset.image} alt={viewingAsset.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <ImageIcon size={48} className="mb-2 opacity-50" />
                      <span className="text-sm">Tidak ada gambar</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Details Section */}
              <div className="w-full md:w-2/3 flex flex-col gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">{viewingAsset.name}</h2>
                  <p className="text-blue-400 font-mono text-sm">{viewingAsset.id}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-x-4 gap-y-4 mt-2">
                  <div>
                    <span className="block text-xs text-gray-400 mb-1">Kode Area/Lokasi</span>
                    <span className="text-sm text-white">{viewingAsset.plantCode ? `${viewingAsset.plantCode} ${viewingAsset.zoneId ? `(${viewingAsset.zoneId})` : ''}` : (viewingAsset.zoneId || '-')}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400 mb-1">Lokasi/Ruangan</span>
                    <span className="text-sm text-white">{viewingAsset.location || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400 mb-1">Klasifikasi</span>
                    <span className="text-sm text-white">{viewingAsset.category || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400 mb-1">Tipe Equipment</span>
                    <span className="text-sm text-white">{viewingAsset.type || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400 mb-1">Kondisi Equipment</span>
                    <span className="text-sm text-white">{viewingAsset.kondisi || 'Baik'}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400 mb-1">Status Operasional</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(viewingAsset.status)}`}>
                        {getStatusIcon(viewingAsset.status)}
                        {viewingAsset.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 border-t border-border-color pt-4">
                  <span className="block text-xs text-gray-400 mb-2">Informasi / Spesifikasi</span>
                  <p className="text-sm text-gray-300 whitespace-pre-line bg-black/20 p-3 rounded-lg border border-border-color/50 min-h-[80px]">
                    {viewingAsset.spec || 'Tidak ada informasi spesifikasi.'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-end px-6 py-4 border-t border-border-color bg-[#12161A]">
              <button 
                onClick={() => setViewingAsset(null)}
                className="px-5 py-2.5 bg-btn-secondary hover:bg-gray-700 text-white rounded-lg border border-border-color transition-colors font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<DetailEquipment />);
