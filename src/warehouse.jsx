import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Package, Search, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, X, RefreshCw, Image as ImageIcon, Database, ArrowLeftRight, HelpCircle, List, Printer, Bell, Eye, User, Trash2, CheckCircle, XCircle, Plus
} from 'lucide-react';

const INITIAL_INVENTORY = [
  { id: 'SKU-001', name: 'Filter Oli Mesin', qty: 9, min: 10, unit: 'pcs', type: 'Consumable', image: 'https://images.unsplash.com/photo-1635339243765-b1a065bba438?auto=format&fit=crop&w=300&q=80', gudang: 'Gudang Utama' },
  { id: 'SKU-002', name: 'Pelumas Hidrolik 50L', qty: 3, min: 5, unit: 'drum', type: 'Liquid/Chemical', image: 'https://images.unsplash.com/photo-1598207951491-255eaf139751?auto=format&fit=crop&w=300&q=80', gudang: 'Gudang Sparepart' },
  { id: 'SKU-003', name: 'Bantalan Rol (Bearing) 20mm', qty: 15, min: 20, unit: 'pcs', type: 'Mechanical', image: 'https://images.unsplash.com/photo-1590217983057-0a3eb2d8ce2f?auto=format&fit=crop&w=300&q=80', gudang: 'Gudang Utama' },
  { id: 'SKU-004', name: 'Kabel Tembaga 2.5mm', qty: 100, min: 50, unit: 'meter', type: 'Electrical', image: 'https://images.unsplash.com/photo-1558231908-04fc5ebccffc?auto=format&fit=crop&w=300&q=80', gudang: 'Gudang Utama' },
  { id: 'SKU-005', name: 'Sensor Suhu PT100', qty: 1, min: 2, unit: 'pcs', type: 'Instrument', image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=300&q=80', gudang: 'Gudang Sparepart' },
  { id: 'SKU-006', name: 'Gasket Pipa 4 inch', qty: 4, min: 10, unit: 'pcs', type: 'Mechanical', image: 'https://images.unsplash.com/photo-1597843796515-d72b535d8e7d?auto=format&fit=crop&w=300&q=80', gudang: 'Gudang Utama' }
];

function Warehouse() {
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock transaction stats
  const [stats] = useState({ masuk: 124, keluar: 89 });
  const [viewMode, setViewMode] = useState('table');
  const [modalItem, setModalItem] = useState(null);
  
  // Logistic requests state
  const [logisticRequests, setLogisticRequests] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedRequestDetail, setSelectedRequestDetail] = useState(null);

  // Auto-select first critical item on load if details is empty
  useEffect(() => {
    const criticalItems = inventory.filter(i => i.qty < i.min);
    if (criticalItems.length > 0 && !selectedItemDetail) {
      setSelectedItemDetail(criticalItems[0]);
    }
  }, [inventory, selectedItemDetail]);

  useEffect(() => {
    const savedReqs = localStorage.getItem('maintainx_logistic_requests');
    if (savedReqs) {
      setLogisticRequests(JSON.parse(savedReqs));
    }
    const handleStorage = (e) => {
      if (e.key === 'maintainx_logistic_requests') {
        setLogisticRequests(JSON.parse(e.newValue || '[]'));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const pendingSparepartRequests = logisticRequests.filter(r => r.type === 'Barang / Sparepart' && r.status === 'Pending Approval');

  const approveRequest = (id) => {
    const updatedReqs = logisticRequests.map(r => {
      if (r.id === id) return { ...r, status: 'Approved (Ready to Pick Up)' };
      return r;
    });
    setLogisticRequests(updatedReqs);
    localStorage.setItem('maintainx_logistic_requests', JSON.stringify(updatedReqs));
    alert('Permintaan berhasil disetujui (Tiket pengeluaran dibuat)');
  };

  // Refresh function
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      // Reload logic here if connected to real API
      
      // Reload logistic requests
      const stored = localStorage.getItem('maintainx_logistic_requests');
      if (stored) {
        setLogisticRequests(JSON.parse(stored));
      }
    }, 800);
  };

  const handleRejectRequest = (reqId) => {
    if (confirm(`Tolak permintaan ${reqId}?`)) {
      const updated = logisticRequests.filter(req => req.id !== reqId);
      localStorage.setItem('maintainx_logistic_requests', JSON.stringify(updated));
      setLogisticRequests(updated);
      setSelectedRequestDetail(null);
      alert(`Permintaan ${reqId} telah ditolak dan dikembalikan ke pemohon.`);
    }
  };

  const handleAcceptRequest = (reqId) => {
    window.location.href = `/transaksi-gudang.html?type=out&reqId=${reqId}`;
  };

  // Only show items below minimum stock for the table, then filter by search
  const criticalInventory = inventory.filter(i => {
    const isCritical = i.qty < i.min;
    const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.id.toLowerCase().includes(searchQuery.toLowerCase());
    return isCritical && matchesSearch;
  });

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Laporan Barang Kritis</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 20px; color: #333; }
            h2 { text-align: center; margin-bottom: 20px; color: #000; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 12px 8px; text-align: left; font-size: 14px; }
            th { background-color: #f8f9fa; color: #333; font-weight: bold; }
            .critical { color: #dc3545; font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>Daftar Barang Dibawah Stok Minimum</h2>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Kode Barang</th>
                <th>Nama Barang</th>
                <th>Satuan</th>
                <th>Jenis Barang</th>
                <th>Lokasi Gudang</th>
                <th>Stok Min</th>
                <th>Stok Saat Ini</th>
              </tr>
            </thead>
            <tbody>
              ${criticalInventory.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.id}</td>
                  <td>${item.name}</td>
                  <td>${item.unit}</td>
                  <td>${item.type}</td>
                  <td>${item.gudang}</td>
                  <td>${item.min}</td>
                  <td class="critical">${item.qty}</td>
                </tr>
              `).join('')}
              ${criticalInventory.length === 0 ? '<tr><td colspan="8" style="text-align:center; padding: 20px;">Tidak ada stok yang berada di bawah batas minimum.</td></tr>' : ''}
            </tbody>
          </table>
          <div style="margin-top: 30px; font-size: 12px; color: #666; text-align: right;">
            Dicetak pada: ${new Date().toLocaleString('id-ID')}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <div className="flex flex-col h-full gap-4 text-text-primary font-sans">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        
        {/* Total Barang Masuk */}
        <button onClick={() => window.location.href = 'transaksi-gudang.html?filterTipe=in'} className="bg-bg-surface pt-4 px-4 pb-2 rounded-xl border border-border-color shadow flex flex-col hover:bg-btn-secondary transition-colors text-left cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center shrink-0">
              <ArrowDownToLine size={20} />
            </div>
            <div>
              <div className="text-text-secondary text-xs font-medium group-hover:text-text-primary transition-colors">Total Barang Masuk</div>
              <div className="text-xl font-bold text-text-primary leading-tight flex items-center gap-2">{stats.masuk} <span className="text-[10px] font-normal text-green-500 bg-green-500/20 px-1.5 py-0.5 rounded-full border border-green-500/30">+12%</span></div>
            </div>
          </div>
          <div className="w-full h-10 mt-3 opacity-70 group-hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <path d="M0,25 L15,22 L30,28 L45,15 L60,18 L75,10 L90,12 L100,5" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M0,25 L15,22 L30,28 L45,15 L60,18 L75,10 L90,12 L100,5 L100,30 L0,30 Z" fill="url(#grad-green)" opacity="0.2"/>
              <defs>
                <linearGradient id="grad-green" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="1" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </button>

        {/* Total Barang Keluar */}
        <button onClick={() => window.location.href = 'transaksi-gudang.html?filterTipe=out'} className="bg-bg-surface pt-4 px-4 pb-2 rounded-xl border border-border-color shadow flex flex-col hover:bg-btn-secondary transition-colors text-left cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center shrink-0">
              <ArrowUpFromLine size={20} />
            </div>
            <div>
              <div className="text-text-secondary text-xs font-medium group-hover:text-text-primary transition-colors">Total Barang Keluar</div>
              <div className="text-xl font-bold text-text-primary leading-tight flex items-center gap-2">{stats.keluar} <span className="text-[10px] font-normal text-red-500 bg-red-500/20 px-1.5 py-0.5 rounded-full border border-red-500/30">-5.2%</span></div>
            </div>
          </div>
          <div className="w-full h-10 mt-3 opacity-70 group-hover:opacity-100 transition-opacity">
            <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <path d="M0,5 L15,12 L30,8 L45,18 L60,15 L75,22 L90,18 L100,25" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M0,5 L15,12 L30,8 L45,18 L60,15 L75,22 L90,18 L100,25 L100,30 L0,30 Z" fill="url(#grad-orange)" opacity="0.2"/>
              <defs>
                <linearGradient id="grad-orange" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="1" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </button>

        {/* Total Semua Barang */}
        <button onClick={() => window.location.href = 'data-barang.html'} className="bg-bg-surface p-4 rounded-xl border border-border-color shadow flex items-center gap-3 hover:bg-btn-secondary transition-colors text-left cursor-pointer group">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center shrink-0 group-hover:bg-blue-500/40 transition-colors">
            <Package size={20} />
          </div>
          <div>
            <div className="text-text-secondary text-xs font-medium group-hover:text-text-primary transition-colors">Total Semua Barang</div>
            <div className="text-xl font-bold text-text-primary leading-tight">{inventory.reduce((acc, curr) => acc + curr.qty, 0)}</div>
          </div>
        </button>

        {/* View Toggle */}
        <button onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')} className="bg-bg-surface p-4 rounded-xl border border-border-color shadow flex items-center justify-center gap-2 hover:bg-btn-secondary transition-colors group cursor-pointer">
          <div className="w-8 h-8 rounded bg-gray-700/50 text-text-secondary group-hover:text-text-primary group-hover:bg-[#FF7043] flex items-center justify-center transition-colors">
            {viewMode === 'table' ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg> : <List size={18}/>}
          </div>
          <span className="font-semibold text-text-secondary group-hover:text-text-primary transition-colors">{viewMode === 'table' ? 'Menu Grid' : 'Menu Table'}</span>
        </button>

      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center bg-bg-surface p-3 rounded-xl border border-border-color shadow">
        <div className="flex gap-4 items-center">
          <button 
            onClick={handleRefresh}
            className="p-2.5 bg-bg-dark border border-border-color hover:bg-btn-secondary text-text-secondary rounded-lg transition-colors focus:outline-none"
            title="Refresh Tabel"
          >
            <RefreshCw size={20} className={`${isRefreshing ? 'animate-spin text-accent' : ''}`} />
          </button>
          
          <div className="relative w-full max-w-sm hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari SKU atau nama barang di daftar kritis..." 
              className="w-full bg-bg-dark border border-border-color rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[#FF7043] transition-colors"
            />
          </div>
        </div>
        
        <div className="flex gap-3">
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="bg-bg-dark border border-border-color hover:bg-btn-secondary text-text-secondary px-3 py-2 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-colors relative"
            >
              <Bell size={20} />
              {pendingSparepartRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse shadow-md">
                  {pendingSparepartRequests.length}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-bg-surface border border-border-color rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-3 border-b border-border-color flex justify-between items-center bg-bg-dark">
                  <h3 className="font-semibold text-sm flex items-center gap-2 text-text-primary">
                    <Bell size={16} className="text-blue-500" /> Notifikasi Permintaan
                  </h3>
                  <button onClick={() => setShowNotifications(false)} className="text-text-secondary hover:text-text-primary">
                    <X size={16} />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar">
                  {pendingSparepartRequests.length === 0 ? (
                    <div className="text-center py-6 text-text-secondary text-sm">
                      Tidak ada permintaan barang.
                    </div>
                  ) : (
                    pendingSparepartRequests.map(req => (
                      <div key={req.id} className="bg-bg-dark p-2.5 rounded-lg border border-border-color flex justify-between items-center hover:border-blue-500/50 transition-colors">
                        <div>
                          <div className="font-medium text-sm text-text-primary truncate max-w-[150px]">{req.nik}</div>
                          <div className="text-xs text-text-secondary mt-0.5">{req.id}</div>
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedRequestDetail(req);
                            setShowNotifications(false);
                          }}
                          className="p-2 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded-md transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          <a 
            href="/data-gudang.html"
            className="bg-indigo-600 hover:bg-indigo-500 text-text-primary px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg> Data Gudang
          </a>
          <a 
            href="/data-barang.html"
            className="bg-blue-600 hover:bg-blue-500 text-text-primary px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg transition-colors"
          >
            <Database size={18} /> Data Barang
          </a>
          <a 
            href="/transaksi-gudang.html"
            className="bg-green-600 hover:bg-green-500 text-text-primary px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg transition-colors"
          >
            <ArrowLeftRight size={18} /> Transaksi Barang
          </a>
          <button 
            onClick={handlePrint}
            className="bg-gray-700 hover:bg-gray-600 text-text-primary px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg transition-colors ml-2 border border-gray-600"
            title="Cetak Data Kritis"
          >
            <Printer size={18} className="text-text-secondary" /> Cetak
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      {viewMode === 'table' ? (
      <div className="flex flex-col lg:flex-row gap-4 flex-1 overflow-hidden">
        
        {/* Left: Inventory Table */}
        <div className="bg-bg-surface rounded-xl border border-border-color shadow overflow-hidden flex flex-col lg:w-3/4">
          <div className="p-3 border-b border-border-color bg-bg-surface">
            <h2 className="text-text-primary font-semibold flex items-center gap-2 text-sm">
              <AlertTriangle className="text-red-500" size={16} /> Daftar Barang Dibawah Stok Minimum
            </h2>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-bg-dark text-text-secondary border-b border-border-color">
                <tr>
                  <th className="px-4 py-3 font-medium">No</th>
                  <th className="px-4 py-3 font-medium">Kode Barang</th>
                  <th className="px-4 py-3 font-medium">Nama Barang</th>
                  <th className="px-4 py-3 font-medium">Satuan</th>
                  <th className="px-4 py-3 font-medium">Jenis Barang</th>
                  <th className="px-4 py-3 font-medium">Lokasi Gudang</th>
                  <th className="px-4 py-3 font-medium text-center">Stok Min</th>
                  <th className="px-4 py-3 font-medium text-center">Stok</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {criticalInventory.map((item, index) => {
                  const isSelected = selectedItemDetail?.id === item.id;
                  return (
                    <tr 
                      key={item.id} 
                      onClick={() => setSelectedItemDetail(item)}
                      className={`cursor-pointer transition-colors ${isSelected ? 'bg-btn-secondary/80 border-l-2 border-l-[#FF7043]' : 'hover:bg-btn-secondary/40 border-l-2 border-l-transparent'}`}
                    >
                      <td className="px-4 py-3 font-mono font-medium text-text-secondary">{index + 1}</td>
                      <td className="px-4 py-3 font-mono text-blue-400 font-medium">{item.id}</td>
                      <td className="px-4 py-3 text-text-primary font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-text-secondary">{item.unit}</td>
                      <td className="px-4 py-3 text-text-secondary">
                        <span className="px-2 py-0.5 bg-bg-dark border border-border-color rounded text-xs">
                          {item.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary text-xs font-medium flex items-center gap-1 mt-1">
                        <Database size={12}/> {item.gudang}
                      </td>
                      <td className="px-4 py-3 text-center text-text-secondary">{item.min}</td>
                      <td className="px-4 py-3 text-center font-bold text-red-500">
                        {item.qty}
                      </td>
                    </tr>
                  );
                })}
                {criticalInventory.length === 0 && (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-text-secondary">
                      <div className="flex flex-col items-center justify-center">
                        <Package size={32} className="mb-2 opacity-50" />
                        <p>Tidak ada stok yang berada di bawah batas minimum.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Image & Detail Panel */}
        <div className="bg-bg-surface rounded-xl border border-border-color shadow flex flex-col lg:w-1/4 overflow-hidden">
          <div className="p-3 border-b border-border-color bg-bg-surface">
            <h2 className="text-text-primary font-semibold flex items-center gap-2 text-sm">
              <ImageIcon className="text-accent" size={16} /> Detail & Gambar Barang
            </h2>
          </div>
          
          <div className="flex-1 p-4 flex flex-col overflow-y-auto custom-scrollbar">
            {selectedItemDetail ? (
              <div className="animate-in fade-in zoom-in-95 duration-200 flex flex-col h-full">
                <div className="w-full h-48 bg-bg-dark rounded-lg border border-border-color overflow-hidden mb-4 relative group flex items-center justify-center shrink-0">
                  {selectedItemDetail.image ? (
                    <img src={selectedItemDetail.image} alt={selectedItemDetail.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="flex flex-col items-center text-text-secondary">
                      <ImageIcon size={48} className="mb-2 opacity-50" />
                      <span>Tidak ada gambar</span>
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-black/70 backdrop-blur text-text-primary text-xs px-2 py-1 rounded border border-border-color">
                    {selectedItemDetail.type}
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-text-primary mb-1">{selectedItemDetail.name}</h3>
                <div className="font-mono text-accent text-sm mb-4">{selectedItemDetail.id}</div>
                
                <div className="bg-bg-dark rounded-lg border border-border-color p-3 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-text-secondary text-xs">Status Stok</span>
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-500 rounded text-xs border border-red-500/50 flex items-center gap-1 font-semibold">
                      <AlertTriangle size={10}/> Kritis
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-text-secondary text-xs">Stok Tersisa</span>
                    <span className="font-bold text-red-500">{selectedItemDetail.qty} <span className="text-[10px] font-normal text-text-secondary">{selectedItemDetail.unit}</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary text-xs">Stok Minimum</span>
                    <span className="font-bold text-text-secondary">{selectedItemDetail.min} <span className="text-[10px] font-normal text-text-secondary">{selectedItemDetail.unit}</span></span>
                  </div>
                </div>
                
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-text-secondary opacity-70">
                <Package size={48} className="mb-3" />
                <p className="text-base font-medium text-text-secondary mb-1">Tidak ada item terpilih</p>
                <p className="text-xs text-center max-w-[200px]">Klik pada baris tabel di sebelah kiri untuk melihat gambar</p>
              </div>
            )}
          </div>
        </div>

      </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
            {inventory.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()) || i.id.toLowerCase().includes(searchQuery.toLowerCase())).map(item => (
              <div key={item.id} className="bg-bg-surface border border-border-color rounded-xl p-3 flex gap-3 relative hover:bg-btn-secondary/50 transition-colors shadow-sm">
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded object-cover shrink-0 border border-border-color" />
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="text-text-primary font-medium text-sm truncate w-full" title={item.name}>
                      {item.name}
                    </div>
                    <button onClick={() => setModalItem(item)} className="shrink-0 text-text-secondary hover:text-accent transition-colors" title="Detail Barang">
                      <HelpCircle size={14} />
                    </button>
                  </div>
                  <div className="text-text-secondary font-mono text-[10px] truncate">{item.id}</div>
                  <div className="flex justify-between items-end mt-1">
                    <div className="text-xs text-text-secondary">Min: {item.min}</div>
                    <div className={`font-bold ${item.qty < item.min ? 'text-red-500' : 'text-green-500'}`}>{item.qty}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Detail Barang */}
      {modalItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-bg-surface border border-border-color rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-border-color bg-black/20">
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <Package className="text-accent" size={20}/> Detail Barang (Read-Only)
              </h2>
              <button onClick={() => setModalItem(null)} className="text-text-secondary hover:text-text-primary transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 overflow-y-auto max-h-[80vh] custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Kode Barang</label>
                  <div className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm text-text-secondary font-mono">{modalItem.id}</div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Nama Barang</label>
                  <div className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm text-text-primary font-medium">{modalItem.name}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Satuan</label>
                    <div className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm text-text-secondary">{modalItem.unit}</div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Jenis Barang</label>
                    <div className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm text-text-secondary">{modalItem.type}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Stok Min</label>
                    <div className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm text-text-secondary">{modalItem.min}</div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Stok Saat Ini</label>
                    <div className={`w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm font-bold ${modalItem.qty < modalItem.min ? 'text-red-500' : 'text-green-500'}`}>{modalItem.qty}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Lokasi Gudang</label>
                  <div className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm text-text-secondary flex items-center gap-2"><Database size={14} className="text-accent"/> {modalItem.gudang}</div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Karakteristik & Kegunaan</label>
                  <div className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm text-text-secondary">{modalItem.characteristic || '-'} | {modalItem.usage || '-'}</div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-text-secondary">Spesifikasi Tambahan</label>
                  <div className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm text-text-secondary min-h-[60px]">{modalItem.spec || '-'}</div>
                </div>
                <div className="w-full h-32 rounded-lg border border-border-color overflow-hidden relative bg-bg-dark">
                  <img src={modalItem.image} alt={modalItem.name} className="w-full h-full object-cover" />
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Rincian Permintaan Barang Modal */}
      {selectedRequestDetail && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-bg-surface border border-border-color rounded-xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-border-color bg-bg-dark shrink-0">
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <Package className="text-blue-500" size={20}/> Rincian Permintaan Barang <span className="text-sm font-normal text-text-secondary ml-2">({selectedRequestDetail.id})</span>
              </h2>
              <button onClick={() => setSelectedRequestDetail(null)} className="text-text-secondary hover:text-text-primary p-1 rounded hover:bg-btn-secondary transition-colors">
                <X size={20}/>
              </button>
            </div>
            
            {/* Body */}
            <div className="flex flex-col md:flex-row p-5 gap-6 flex-1 overflow-hidden">
              
              {/* Kiri: Info Peminta */}
              <div className="w-full md:w-1/3 bg-black/20 border border-border-color rounded-xl p-4 flex flex-col items-center shrink-0 h-max">
                <div className="w-24 h-24 rounded-full bg-bg-dark border-4 border-bg-surface shadow-lg flex items-center justify-center text-text-secondary mb-4 overflow-hidden">
                  <User size={40} />
                </div>
                <h3 className="text-lg font-bold text-text-primary text-center mb-1">{selectedRequestDetail.nik}</h3>
                <p className="text-sm text-text-secondary text-center mb-4 border-b border-border-color pb-4 w-full">Operator Produksi</p>
                
                <div className="w-full space-y-3">
                  <div>
                    <div className="text-xs text-text-secondary mb-1">NIK</div>
                    <div className="text-sm font-medium">EMP-2023-114</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-secondary mb-1">Tujuan Permintaan</div>
                    <div className="text-sm font-medium">{selectedRequestDetail.purpose}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-secondary mb-1">Tanggal Request</div>
                    <div className="text-sm font-medium">{selectedRequestDetail.date}</div>
                  </div>
                  <div>
                    <div className="text-xs text-text-secondary mb-1">Status</div>
                    <span className="inline-block bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded text-xs">Menunggu Persetujuan</span>
                  </div>
                </div>
              </div>

              {/* Kanan: Tabel Barang */}
              <div className="w-full md:w-2/3 flex flex-col border border-border-color rounded-xl overflow-hidden bg-bg-dark">
                <div className="bg-black/20 p-3 border-b border-border-color">
                  <h3 className="font-semibold text-sm">Daftar Barang Diminta</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-bg-surface text-text-secondary sticky top-0 border-b border-border-color">
                      <tr>
                        <th className="px-4 py-3 font-medium">No</th>
                        <th className="px-4 py-3 font-medium">Kode / Barang</th>
                        <th className="px-4 py-3 font-medium text-center">Jml</th>
                        <th className="px-4 py-3 font-medium text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {/* Normally this would map over an array of items, but right now logistic request only sends one item */}
                      <tr className="hover:bg-btn-secondary/40 transition-colors">
                        <td className="px-4 py-3 text-text-secondary">1</td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{selectedRequestDetail.item}</div>
                          <div className="text-xs text-text-secondary">Barang Umum</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold bg-btn-secondary px-2 py-1 rounded">{selectedRequestDetail.quantity}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button className="text-red-500 hover:text-red-400 p-1.5 rounded bg-red-500/10 hover:bg-red-500/20 transition-colors" title="Hapus Barang">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Footer Action Buttons */}
            <div className="p-4 border-t border-border-color bg-bg-dark flex justify-between items-center shrink-0">
              <button 
                onClick={() => handleRejectRequest(selectedRequestDetail.id)}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors"
              >
                <XCircle size={18} /> Tolak Permintaan
              </button>
              
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-btn-secondary hover:bg-gray-600 text-text-primary font-medium rounded-lg transition-colors border border-border-color">
                  <Plus size={18} /> Tambah Barang
                </button>
                <button 
                  onClick={() => handleAcceptRequest(selectedRequestDetail.id)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-green-600/20"
                >
                  <CheckCircle size={18} /> Terima & Proses
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<Warehouse />);
