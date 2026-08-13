import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Search, Plus, Trash2, Box, Wrench } from 'lucide-react';

const LogisticRequestApp = () => {
  const [activeTab, setActiveTab] = useState('barang'); // 'barang' | 'alat'
  
  // Data stores
  const [inventory, setInventory] = useState([]);
  const [tools, setTools] = useState([]);
  const [requests, setRequests] = useState([]);

  // Initialization
  useEffect(() => {
    const savedInventory = localStorage.getItem('maintainx_inventory');
    if (savedInventory) setInventory(JSON.parse(savedInventory));

    const savedTools = localStorage.getItem('maintainx_tools');
    if (savedTools) setTools(JSON.parse(savedTools));

    const savedReqs = localStorage.getItem('maintainx_logistic_requests');
    if (savedReqs) setRequests(JSON.parse(savedReqs));

    const handleStorage = (e) => {
      if (e.key === 'maintainx_logistic_requests') setRequests(JSON.parse(e.newValue || '[]'));
      if (e.key === 'maintainx_inventory') setInventory(JSON.parse(e.newValue || '[]'));
      if (e.key === 'maintainx_tools') setTools(JSON.parse(e.newValue || '[]'));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // BARANG STATE
  const [barangSearch, setBarangSearch] = useState('');
  const [selectedBarang, setSelectedBarang] = useState(null);
  const [barangQty, setBarangQty] = useState(1);
  const [barangCart, setBarangCart] = useState([]);
  const [barangPurpose, setBarangPurpose] = useState('');
  const [showBarangDropdown, setShowBarangDropdown] = useState(false);

  const filteredBarang = barangSearch 
    ? inventory.filter(b => b.name.toLowerCase().includes(barangSearch.toLowerCase()) || b.id.toLowerCase().includes(barangSearch.toLowerCase()))
    : inventory;

  const handleSelectBarang = (b) => {
    setSelectedBarang(b);
    setBarangSearch(b.name);
    setShowBarangDropdown(false);
    setBarangQty(1);
  };

  const handleAddBarangToCart = () => {
    if (!selectedBarang) return alert("Pilih barang terlebih dahulu!");
    if (barangQty < 1) return alert("Jumlah minimal 1");
    if (barangQty > selectedBarang.qty) return alert("Stok tidak mencukupi!");
    
    const existing = barangCart.find(item => item.id === selectedBarang.id);
    if (existing) {
      if (existing.qty + barangQty > selectedBarang.qty) return alert("Total di keranjang melebihi stok!");
      setBarangCart(barangCart.map(item => item.id === selectedBarang.id ? { ...item, qty: item.qty + barangQty } : item));
    } else {
      setBarangCart([...barangCart, { ...selectedBarang, qty: barangQty }]);
    }
    
    setSelectedBarang(null);
    setBarangSearch('');
    setBarangQty(1);
  };

  const submitBarangRequest = (e) => {
    e.preventDefault();
    if (barangCart.length === 0) return alert("Keranjang barang kosong!");
    if (!barangPurpose) return alert("Keperluan harus diisi!");

    const itemName = barangCart[0].name + (barangCart.length > 1 ? ` (+${barangCart.length - 1} lainnya)` : '');
    const totalQty = barangCart.reduce((acc, curr) => acc + curr.qty, 0);

    const newRequest = {
      id: 'REQ-BRG-' + Date.now().toString().slice(-5),
      type: 'Barang / Sparepart',
      items: barangCart, // cart items for new UI
      item: itemName, // backwards compatibility
      quantity: totalQty, // backwards compatibility
      purpose: barangPurpose,
      date: new Date().toLocaleString(),
      status: 'Waiting for Approval',
      nik: 'User'
    };
    
    const updatedRequests = [newRequest, ...requests];
    setRequests(updatedRequests);
    localStorage.setItem('maintainx_logistic_requests', JSON.stringify(updatedRequests));
    
    setBarangCart([]);
    setBarangPurpose('');
    alert('Permintaan Barang berhasil diajukan!');
  };

  // ALAT STATE
  const [alatSearch, setAlatSearch] = useState('');
  const [selectedAlat, setSelectedAlat] = useState(null);
  const [alatQty, setAlatQty] = useState(1);
  const [alatCart, setAlatCart] = useState([]);
  const [alatPurpose, setAlatPurpose] = useState('');
  const [showAlatDropdown, setShowAlatDropdown] = useState(false);

  const filteredAlat = alatSearch 
    ? tools.filter(t => t.name.toLowerCase().includes(alatSearch.toLowerCase()) || t.id.toLowerCase().includes(alatSearch.toLowerCase()))
    : tools;

  const handleSelectAlat = (t) => {
    setSelectedAlat(t);
    setAlatSearch(t.name);
    setShowAlatDropdown(false);
    setAlatQty(1);
  };

  const handleAddAlatToCart = () => {
    if (!selectedAlat) return alert("Pilih alat terlebih dahulu!");
    if (alatQty < 1) return alert("Jumlah minimal 1");
    
    const existing = alatCart.find(item => item.id === selectedAlat.id);
    if (existing) {
      setAlatCart(alatCart.map(item => item.id === selectedAlat.id ? { ...item, qty: item.qty + alatQty } : item));
    } else {
      setAlatCart([...alatCart, { ...selectedAlat, qty: alatQty }]);
    }
    
    setSelectedAlat(null);
    setAlatSearch('');
    setAlatQty(1);
  };

  const submitAlatRequest = (e) => {
    e.preventDefault();
    if (alatCart.length === 0) return alert("Keranjang alat kosong!");
    if (!alatPurpose) return alert("Keperluan harus diisi!");

    const itemName = alatCart[0].name + (alatCart.length > 1 ? ` (+${alatCart.length - 1} lainnya)` : '');
    const totalQty = alatCart.reduce((acc, curr) => acc + curr.qty, 0);

    const newRequest = {
      id: 'REQ-ALT-' + Date.now().toString().slice(-5),
      type: 'Alat / Perkakas',
      items: alatCart,
      item: itemName,
      quantity: totalQty,
      purpose: alatPurpose,
      date: new Date().toLocaleString(),
      status: 'Waiting for Approval', 
      nik: 'User'
    };
    
    const updatedRequests = [newRequest, ...requests];
    setRequests(updatedRequests);
    localStorage.setItem('maintainx_logistic_requests', JSON.stringify(updatedRequests));
    
    setAlatCart([]);
    setAlatPurpose('');
    alert('Permintaan Alat berhasil diajukan!');
  };

  const barangRequests = requests.filter(r => r.type === 'Barang / Sparepart');
  const alatRequests = requests.filter(r => r.type === 'Alat / Perkakas');

  return (
    <div className="flex flex-col gap-6 font-sans text-text-primary h-full">
      
      {/* HEADER & TABS */}
      <div className="flex justify-between items-center bg-bg-surface p-4 rounded-xl border border-border-color shadow">
        <h1 className="text-xl font-bold">Permintaan Logistik</h1>
        <div className="flex gap-2 bg-bg-dark p-1 rounded-lg border border-border-color">
          <button 
            onClick={() => setActiveTab('barang')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'barang' ? 'bg-[#FF7043] text-white shadow' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <Box size={18} /> Permintaan Barang
          </button>
          <button 
            onClick={() => setActiveTab('alat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${activeTab === 'alat' ? 'bg-blue-600 text-white shadow' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <Wrench size={18} /> Permintaan Alat
          </button>
        </div>
      </div>

      {/* FORM SECTION */}
      <div className="bg-bg-surface p-6 rounded-xl border border-border-color shadow">
        
        {/* BARANG TAB */}
        {activeTab === 'barang' && (
          <div className="flex flex-col gap-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-border-color pb-3">
              <Box size={20} className="text-[#FF7043]" /> Form Permintaan Barang
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Search & Select */}
              <div className="flex flex-col gap-4">
                
                {/* Kolom Gambar Atas */}
                <div className="w-full h-48 bg-bg-dark border border-border-color rounded-lg flex items-center justify-center overflow-hidden">
                  {selectedBarang ? (
                    selectedBarang.image ? (
                      <img src={selectedBarang.image} alt={selectedBarang.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-text-secondary">
                        <Box size={40} className="mb-2 opacity-50" />
                        <span className="text-sm">Tidak ada gambar</span>
                      </div>
                    )
                  ) : (
                    <div className="flex flex-col items-center text-text-secondary">
                      <Box size={40} className="mb-2 opacity-50" />
                      <span className="text-sm">Pilih barang untuk melihat gambar</span>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-sm text-text-secondary mb-1">Cari Barang</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                    <input 
                      type="text" 
                      value={barangSearch}
                      onChange={(e) => {
                        setBarangSearch(e.target.value);
                        setShowBarangDropdown(true);
                      }}
                      onFocus={() => setShowBarangDropdown(true)}
                      placeholder="Ketik nama atau kode barang..."
                      className="w-full bg-bg-dark border border-border-color rounded-lg py-2 pl-9 pr-4 text-sm focus:border-[#FF7043] focus:outline-none"
                    />
                  </div>
                  
                  {/* Dropdown Suggestions */}
                  {showBarangDropdown && barangSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-bg-surface border border-border-color rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredBarang.length > 0 ? filteredBarang.map(b => (
                        <div 
                          key={b.id} 
                          onClick={() => handleSelectBarang(b)}
                          className="px-4 py-2 hover:bg-btn-secondary cursor-pointer border-b border-border-color last:border-0 flex justify-between items-center"
                        >
                          <div>
                            <div className="font-medium text-sm">{b.name}</div>
                            <div className="text-xs text-text-secondary">{b.id}</div>
                          </div>
                          <div className="text-xs font-semibold px-2 py-1 bg-bg-dark rounded text-green-500">
                            Stok: {b.qty}
                          </div>
                        </div>
                      )) : (
                        <div className="px-4 py-3 text-sm text-text-secondary text-center">Barang tidak ditemukan</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Item Details */}
                {selectedBarang && (
                  <div className="p-4 border border-border-color rounded-lg bg-bg-dark">
                    <div className="font-semibold text-lg">{selectedBarang.name}</div>
                    <div className="text-xs text-text-secondary mb-2">{selectedBarang.id} • {selectedBarang.type} • {selectedBarang.gudang}</div>
                    <div className="text-sm flex items-center justify-between border-t border-border-color pt-2">
                      <span>Stok Tersedia:</span> 
                      <span className="font-bold text-green-500">{selectedBarang.qty} {selectedBarang.unit}</span>
                    </div>
                  </div>
                )}

                {/* Quantity & Add Button */}
                <div className="flex gap-4 items-end">
                  <div className="w-32">
                    <label className="block text-sm text-text-secondary mb-1">Jumlah Diminta</label>
                    <input 
                      type="number" 
                      min="1"
                      max={selectedBarang ? selectedBarang.qty : 100}
                      value={barangQty}
                      onChange={(e) => setBarangQty(parseInt(e.target.value) || 1)}
                      disabled={!selectedBarang}
                      className="w-full bg-bg-dark border border-border-color rounded-lg py-2 px-3 text-sm focus:border-[#FF7043] focus:outline-none disabled:opacity-50"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={handleAddBarangToCart}
                    disabled={!selectedBarang}
                    className="flex-1 bg-bg-dark border border-[#FF7043] text-[#FF7043] hover:bg-[#FF7043] hover:text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> Tambah Barang
                  </button>
                </div>
              </div>

              {/* Right Column: Cart & Submit */}
              <div className="flex flex-col gap-4 border-l border-border-color pl-6">
                <div className="flex-1 border border-border-color rounded-lg overflow-hidden flex flex-col bg-bg-dark">
                  <div className="bg-bg-surface px-4 py-2 border-b border-border-color font-medium text-sm">
                    Daftar Barang ({barangCart.length})
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-48 p-2">
                    {barangCart.length === 0 ? (
                      <div className="text-center text-text-secondary text-sm py-8">Keranjang masih kosong.</div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {barangCart.map(item => (
                          <div key={item.id} className="flex justify-between items-center bg-bg-surface p-2 rounded border border-border-color">
                            <div>
                              <div className="text-sm font-medium">{item.name}</div>
                              <div className="text-xs text-text-secondary">{item.id}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-semibold">{item.qty} {item.unit}</div>
                              <button 
                                onClick={() => setBarangCart(barangCart.filter(i => i.id !== item.id))}
                                className="text-red-500 hover:text-red-400 p-1"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-1">Keperluan / Deskripsi</label>
                  <textarea 
                    rows="2"
                    value={barangPurpose}
                    onChange={(e) => setBarangPurpose(e.target.value)}
                    placeholder="Contoh: Perbaikan mesin conveyor area A..."
                    className="w-full bg-bg-dark border border-border-color rounded-lg py-2 px-3 text-sm focus:border-[#FF7043] focus:outline-none resize-none"
                  ></textarea>
                </div>

                <button 
                  onClick={submitBarangRequest}
                  className="w-full bg-[#FF7043] hover:bg-[#F4511E] text-white py-3 rounded-lg font-bold shadow-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Box size={20} /> Ajukan Barang
                </button>
              </div>
            
            </div>
          </div>
        )}

        {/* ALAT TAB */}
        {activeTab === 'alat' && (
          <div className="flex flex-col gap-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-border-color pb-3">
              <Wrench size={20} className="text-blue-500" /> Form Permintaan Alat
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Left Column: Search & Select */}
              <div className="flex flex-col gap-4">
                
                {/* Kolom Gambar Atas */}
                <div className="w-full h-48 bg-bg-dark border border-border-color rounded-lg flex items-center justify-center overflow-hidden text-5xl">
                  {selectedAlat ? (
                    selectedAlat.img && selectedAlat.img.length > 10 ? (
                      <img src={selectedAlat.img} alt={selectedAlat.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{selectedAlat.img || '🔧'}</span>
                    )
                  ) : (
                    <div className="flex flex-col items-center text-text-secondary text-base">
                      <Wrench size={40} className="mb-2 opacity-50" />
                      <span className="text-sm">Pilih alat untuk melihat gambar</span>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-sm text-text-secondary mb-1">Cari Alat / Perkakas</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                    <input 
                      type="text" 
                      value={alatSearch}
                      onChange={(e) => {
                        setAlatSearch(e.target.value);
                        setShowAlatDropdown(true);
                      }}
                      onFocus={() => setShowAlatDropdown(true)}
                      placeholder="Ketik nama atau kode alat..."
                      className="w-full bg-bg-dark border border-border-color rounded-lg py-2 pl-9 pr-4 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  
                  {/* Dropdown Suggestions */}
                  {showAlatDropdown && alatSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-bg-surface border border-border-color rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredAlat.length > 0 ? filteredAlat.map(t => (
                        <div 
                          key={t.id} 
                          onClick={() => handleSelectAlat(t)}
                          className="px-4 py-2 hover:bg-btn-secondary cursor-pointer border-b border-border-color last:border-0 flex justify-between items-center"
                        >
                          <div>
                            <div className="font-medium text-sm">{t.name}</div>
                            <div className="text-xs text-text-secondary">{t.id} • {t.category}</div>
                          </div>
                          <div className={`text-xs font-semibold px-2 py-1 bg-bg-dark rounded ${t.status === 'Available' ? 'text-green-500' : 'text-orange-500'}`}>
                            {t.status}
                          </div>
                        </div>
                      )) : (
                        <div className="px-4 py-3 text-sm text-text-secondary text-center">Alat tidak ditemukan</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Item Details */}
                {selectedAlat && (
                  <div className="p-4 border border-border-color rounded-lg bg-bg-dark">
                    <div className="font-semibold text-lg">{selectedAlat.name}</div>
                    <div className="text-xs text-text-secondary mb-2">{selectedAlat.id} • {selectedAlat.category}</div>
                    <div className="text-sm flex items-center justify-between border-t border-border-color pt-2">
                      <span>Status:</span> 
                      <span className={`font-bold ${selectedAlat.status === 'Available' ? 'text-green-500' : 'text-orange-500'}`}>{selectedAlat.status}</span>
                    </div>
                  </div>
                )}

                {/* Quantity & Add Button */}
                <div className="flex gap-4 items-end">
                  <div className="w-32">
                    <label className="block text-sm text-text-secondary mb-1">Jumlah</label>
                    <div className="flex items-center bg-bg-dark border border-border-color rounded-lg overflow-hidden">
                      <button 
                        type="button"
                        onClick={() => setAlatQty(Math.max(1, alatQty - 1))}
                        className="px-3 py-2 hover:bg-btn-secondary text-text-secondary transition-colors"
                      >-</button>
                      <input 
                        type="number" 
                        min="1"
                        value={alatQty}
                        onChange={(e) => setAlatQty(parseInt(e.target.value) || 1)}
                        className="w-full text-center bg-transparent py-2 px-1 text-sm focus:outline-none"
                      />
                      <button 
                        type="button"
                        onClick={() => setAlatQty(alatQty + 1)}
                        className="px-3 py-2 hover:bg-btn-secondary text-text-secondary transition-colors"
                      >+</button>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={handleAddAlatToCart}
                    disabled={!selectedAlat}
                    className="flex-1 bg-bg-dark border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Plus size={18} /> Tambah Alat
                  </button>
                </div>
              </div>

              {/* Right Column: Cart & Submit */}
              <div className="flex flex-col gap-4 border-l border-border-color pl-6">
                <div className="flex-1 border border-border-color rounded-lg overflow-hidden flex flex-col bg-bg-dark">
                  <div className="bg-bg-surface px-4 py-2 border-b border-border-color font-medium text-sm">
                    Daftar Alat ({alatCart.length})
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-48 p-2">
                    {alatCart.length === 0 ? (
                      <div className="text-center text-text-secondary text-sm py-8">Keranjang masih kosong.</div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {alatCart.map(item => (
                          <div key={item.id} className="flex justify-between items-center bg-bg-surface p-2 rounded border border-border-color">
                            <div>
                              <div className="text-sm font-medium">{item.name}</div>
                              <div className="text-xs text-text-secondary">{item.id} • {item.category}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-sm font-semibold">{item.qty} {item.unit || 'Pcs'}</div>
                              <button 
                                onClick={() => setAlatCart(alatCart.filter(i => i.id !== item.id))}
                                className="text-red-500 hover:text-red-400 p-1"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-1">Keperluan / Deskripsi</label>
                  <textarea 
                    rows="2"
                    value={alatPurpose}
                    onChange={(e) => setAlatPurpose(e.target.value)}
                    placeholder="Contoh: Pinjam untuk perbaikan conveyor..."
                    className="w-full bg-bg-dark border border-border-color rounded-lg py-2 px-3 text-sm focus:border-blue-500 focus:outline-none resize-none"
                  ></textarea>
                </div>

                <button 
                  onClick={submitAlatRequest}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-bold shadow-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Wrench size={20} /> Ajukan Alat
                </button>
              </div>
            
            </div>
          </div>
        )}
      </div>

      {/* TABLES SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
        
        {/* Pinjaman Alat Table */}
        <div className="bg-bg-surface p-4 rounded-xl border border-border-color shadow flex flex-col gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Wrench size={20} className="text-blue-500" /> Pinjaman Alat
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-border-color text-text-secondary text-sm">
                  <th className="py-2 px-2">No. Req</th>
                  <th className="py-2 px-2">Alat</th>
                  <th className="py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {alatRequests.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center py-4 text-text-secondary">Tidak ada riwayat pinjaman.</td>
                  </tr>
                ) : (
                  alatRequests.map(req => (
                    <tr key={req.id} className="border-b border-border-color last:border-0 hover:bg-btn-secondary transition-colors">
                      <td className="py-3 px-2 font-medium text-blue-400">{req.id}</td>
                      <td className="py-3 px-2">
                        <div className="font-medium">{req.item}</div>
                        <div className="text-xs text-text-secondary">{req.date}</div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          req.status.includes('In Use') ? 'bg-blue-500/20 text-blue-500' : 
                          req.status.includes('Check Out') || req.status.includes('Returned') ? 'bg-green-500/20 text-green-500' : 
                          'bg-orange-500/20 text-orange-500'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Pengajuan Barang Table */}
        <div className="bg-bg-surface p-4 rounded-xl border border-border-color shadow flex flex-col gap-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Box size={20} className="text-[#FF7043]" /> Status Pengajuan Barang
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-border-color text-text-secondary text-sm">
                  <th className="py-2 px-2">No. Req</th>
                  <th className="py-2 px-2">Barang</th>
                  <th className="py-2 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {barangRequests.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center py-4 text-text-secondary">Tidak ada riwayat pengajuan.</td>
                  </tr>
                ) : (
                  barangRequests.map(req => (
                    <tr key={req.id} className="border-b border-border-color last:border-0 hover:bg-btn-secondary transition-colors">
                      <td className="py-3 px-2 font-medium text-[#FF7043]">{req.id}</td>
                      <td className="py-3 px-2">
                        <div className="font-medium">{req.item}</div>
                        <div className="text-xs text-text-secondary">{req.date}</div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          req.status.includes('Pending') || req.status.includes('Waiting') ? 'bg-orange-500/20 text-orange-500' : 
                          req.status.includes('Approved') ? 'bg-green-500/20 text-green-500' : 
                          'bg-red-500/20 text-red-500'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<LogisticRequestApp />);
