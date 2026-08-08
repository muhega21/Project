import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ArrowDownToLine, ArrowUpFromLine, Search, Filter, 
  X, Check, AlertCircle, Package, ArrowLeftRight, Image as ImageIcon, Calendar, RotateCw, Download, Plus, Trash2
} from 'lucide-react';

// Mock inventory data for dropdowns
const INITIAL_INVENTORY = [
  { id: 'RAW-001', name: 'Plat Besi 5mm', unit: 'Sheet', qty: 50, image: 'https://images.unsplash.com/photo-1635339243765-b1a065bba438?auto=format&fit=crop&w=300&q=80', gudang: 'Gudang Utama' },
  { id: 'CSM-002', name: 'Pelumas Hidrolik 50L', unit: 'Bottle', qty: 25, image: 'https://images.unsplash.com/photo-1598207951491-255eaf139751?auto=format&fit=crop&w=300&q=80', gudang: 'Gudang B3' },
  { id: 'PRT-003', name: 'Bantalan Rol (Bearing) 20mm', unit: 'Pcs', qty: 100, image: 'https://images.unsplash.com/photo-1590217983057-0a3eb2d8ce2f?auto=format&fit=crop&w=300&q=80', gudang: 'Gudang Utama' },
  { id: 'RAW-004', name: 'Kabel Tembaga 2.5mm', unit: 'Roll', qty: 10, image: 'https://images.unsplash.com/photo-1558231908-04fc5ebccffc?auto=format&fit=crop&w=300&q=80', gudang: 'Gudang Transit' },
  { id: 'SKU-005', name: 'Sensor Suhu PT100', unit: 'Pcs', qty: 5, image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=300&q=80', gudang: 'Gudang Utama' }
];

const GUDANG_LIST = ['Gudang Utama', 'Gudang B3', 'Gudang Transit'];

// Mock transactions data
const MOCK_TRANSACTIONS = [
  { id: 'BM-1001', date: '2023-11-20 09:30', type: 'in', itemId: 'RAW-001', itemName: 'Plat Besi 5mm', qty: 50, worker: 'Budi Santoso', notes: 'Penerimaan PO-202311' },
  { id: 'BK-1002', date: '2023-11-21 14:15', type: 'out', itemId: 'CSM-002', itemName: 'Pelumas Hidrolik 50L', qty: 2, worker: 'Andi M', notes: 'Maintenance Pompa Hidrolik' },
  { id: 'BM-1003', date: '2023-11-22 10:00', type: 'in', itemId: 'PRT-003', itemName: 'Bantalan Rol (Bearing) 20mm', qty: 20, worker: 'Budi Santoso', notes: 'Restock' },
  { id: 'BK-1004', date: '2023-11-23 08:45', type: 'out', itemId: 'RAW-001', itemName: 'Plat Besi 5mm', qty: 5, worker: 'Joko', notes: 'Fabrikasi Struktur A' },
];

function TransaksiGudang() {
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  
  const [formData, setFormData] = useState({
    id: '',
    date: new Date().toISOString().slice(0, 16),
    type: 'in',
    worker: 'Admin User',
    notes: ''
  });

  const [cart, setCart] = useState([]);
  const [tempQty, setTempQty] = useState('');
  const [tempGudang, setTempGudang] = useState(GUDANG_LIST[0]);

  // Handle automatic gudang filling for out
  useEffect(() => {
    if (selectedItem && formData.type === 'out') {
      setTempGudang(selectedItem.gudang || GUDANG_LIST[0]);
    }
  }, [selectedItem, formData.type]);

  // Handle URL parameters to open modal automatically or filter list
  useEffect(() => {
    const saved = localStorage.getItem('mx_warehouse_items');
    if (saved) {
      setInventory(JSON.parse(saved));
    }

    const params = new URLSearchParams(window.location.search);
    let shouldCleanUrl = false;
    
    const type = params.get('type');
    const reqId = params.get('reqId');
    
    if (type === 'in' || type === 'out') {
      let newData = { type };
      
      // Auto-generate ID if opening from external link
      const prefix = type === 'in' ? 'BM' : 'BK';
      newData.id = `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

      if (reqId) {
        const savedReqs = localStorage.getItem('maintainx_logistic_requests');
        if (savedReqs) {
          const reqs = JSON.parse(savedReqs);
          const targetReq = reqs.find(r => r.id === reqId);
          if (targetReq) {
            const matchedItem = INITIAL_INVENTORY.find(item => item.name.toLowerCase() === targetReq.item.toLowerCase()) || {
              id: 'REQ-ITEM',
              name: targetReq.item,
              unit: 'Pcs',
              qty: 0,
              gudang: 'Gudang Utama'
            };
            
            setCart([{ item: matchedItem, qty: parseInt(targetReq.quantity) || 1, gudang: matchedItem.gudang || 'Gudang Utama' }]);
            newData.worker = targetReq.nik;
            newData.notes = `Memenuhi permintaan: ${targetReq.purpose} (${reqId})`;
            
            // Mark the request as Approved
            const updatedReqs = reqs.map(r => r.id === reqId ? { ...r, status: 'Approved' } : r);
            localStorage.setItem('maintainx_logistic_requests', JSON.stringify(updatedReqs));
            window.dispatchEvent(new Event('storage'));
          }
        }
      }

      setFormData(prev => ({...prev, ...newData}));
      setIsModalOpen(true);
      shouldCleanUrl = true;
    }
    
    const filterTipe = params.get('filterTipe');
    if (filterTipe === 'in' || filterTipe === 'out') {
      setFilterType(filterTipe);
      shouldCleanUrl = true;
    }
    
    if (shouldCleanUrl) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const generateId = () => {
    const prefix = formData.type === 'in' ? 'BM' : 'BK';
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setFormData(prev => ({ ...prev, id: `${prefix}-${randomNum}` }));
  };

  const handleTransaction = (e) => {
    e.preventDefault();
    if (cart.length === 0 || !formData.id) {
      alert("Mohon lengkapi ID Transaksi dan tambahkan minimal 1 barang.");
      return;
    }

    const newTrxArray = cart.map(cartItem => ({
      id: formData.id,
      date: formData.date.replace('T', ' '),
      type: formData.type,
      itemId: cartItem.item.id,
      itemName: cartItem.item.name,
      qty: cartItem.qty,
      worker: formData.worker,
      notes: formData.notes || '-'
    }));

    setTransactions([...newTrxArray, ...transactions]);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ id: '', date: new Date().toISOString().slice(0, 16), type: 'in', worker: 'Admin User', notes: '' });
    setSelectedItem(null);
    setTempQty('');
    setTempGudang(GUDANG_LIST[0]);
    setCart([]);
    setModalSearchTerm('');
  };

  const handleAddToCart = () => {
    if (!selectedItem || !tempQty || parseInt(tempQty) <= 0 || !tempGudang) {
      alert("Pilih barang, gudang, dan isi jumlah dengan benar.");
      return;
    }
    setCart([...cart, { item: selectedItem, qty: parseInt(tempQty), gudang: tempGudang }]);
    setSelectedItem(null);
    setTempQty('');
  };

  const handleRemoveFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const filteredData = transactions.filter(trx => {
    const matchSearch = (trx.itemId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         trx.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trx.id.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchFilter = filterType === 'all' ? true : trx.type === filterType;
    
    let matchDate = true;
    if (startDate && endDate) {
      const trxDate = trx.date.split(' ')[0];
      matchDate = trxDate >= startDate && trxDate <= endDate;
    } else if (startDate) {
      const trxDate = trx.date.split(' ')[0];
      matchDate = trxDate >= startDate;
    } else if (endDate) {
      const trxDate = trx.date.split(' ')[0];
      matchDate = trxDate <= endDate;
    }

    return matchSearch && matchFilter && matchDate;
  });

  const handleDownload = () => {
    const headers = ['Tanggal', 'ID Transaksi', 'Tipe', 'Kode Barang', 'Nama Barang', 'Jumlah', 'Pekerja/PIC', 'Keterangan'];
    const csvRows = [];
    csvRows.push(headers.join(','));

    filteredData.forEach(trx => {
      const type = trx.type === 'in' ? 'Masuk' : 'Keluar';
      const row = [
        trx.date,
        trx.id,
        type,
        trx.itemId,
        `"${trx.itemName}"`,
        trx.qty,
        `"${trx.worker}"`,
        `"${trx.notes.replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Riwayat_Transaksi_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const modalFilteredItems = inventory.filter(item => 
    item.id.toLowerCase().includes(modalSearchTerm.toLowerCase()) || 
    item.name.toLowerCase().includes(modalSearchTerm.toLowerCase())
  );

  const calculateTotal = () => {
    if (!selectedItem) return '-';
    const currentStock = selectedItem.qty;
    const inputQty = parseInt(tempQty) || 0;
    return formData.type === 'in' ? currentStock + inputQty : currentStock - inputQty;
  };

  const totalBarangMasuk = transactions.filter(t => t.type === 'in').reduce((sum, t) => sum + t.qty, 0);
  const totalBarangKeluar = transactions.filter(t => t.type === 'out').reduce((sum, t) => sum + t.qty, 0);

  return (
    <div className="flex flex-col h-full gap-4 relative">
      
      {/* KPI Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <div className="bg-bg-surface p-4 rounded-xl border border-border-color shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-500/20 text-blue-400 rounded-lg">
            <ArrowLeftRight size={24} />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Total Transaksi</p>
            <h3 className="text-2xl font-bold text-text-primary">{transactions.length}</h3>
          </div>
        </div>
        <div className="bg-bg-surface p-4 rounded-xl border border-border-color shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-500/20 text-green-400 rounded-lg">
            <ArrowDownToLine size={24} />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Total Barang Masuk</p>
            <h3 className="text-2xl font-bold text-text-primary">{totalBarangMasuk} <span className="text-sm font-normal text-text-secondary">Item</span></h3>
          </div>
        </div>
        <div className="bg-bg-surface p-4 rounded-xl border border-border-color shadow-sm flex items-center gap-4">
          <div className="p-3 bg-orange-500/20 text-orange-400 rounded-lg">
            <ArrowUpFromLine size={24} />
          </div>
          <div>
            <p className="text-sm text-text-secondary">Total Barang Keluar</p>
            <h3 className="text-2xl font-bold text-text-primary">{totalBarangKeluar} <span className="text-sm font-normal text-text-secondary">Item</span></h3>
          </div>
        </div>
      </div>

      {/* Top Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-bg-surface p-4 rounded-xl border border-border-color shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
            <input 
              type="text" 
              placeholder="Cari ID, Kode, Nama Barang..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-bg-dark text-text-primary border border-border-color rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-[#FF7043] transition-colors text-sm"
            />
          </div>
          
          <div className="flex w-full md:w-auto gap-2">
            <select 
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="bg-bg-dark text-text-primary border border-border-color rounded-lg px-3 py-2 focus:outline-none focus:border-[#FF7043] transition-colors text-sm appearance-none"
            >
              <option value="all">Semua Tipe</option>
              <option value="in">Barang Masuk</option>
              <option value="out">Barang Keluar</option>
            </select>

            <div className="flex items-center gap-2">
              <input 
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-bg-dark text-text-secondary border border-border-color rounded-lg px-2 py-2 focus:outline-none focus:border-[#FF7043] transition-colors text-sm"
              />
              <span className="text-text-secondary">-</span>
              <input 
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-bg-dark text-text-secondary border border-border-color rounded-lg px-2 py-2 focus:outline-none focus:border-[#FF7043] transition-colors text-sm"
              />
              <button className="bg-bg-dark hover:bg-btn-secondary border border-border-color text-text-secondary px-3 py-2 rounded-lg transition-colors flex items-center justify-center" title="Filter Tanggal">
                <Search size={16} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={handleDownload}
            className="flex-1 md:flex-none bg-gray-700 hover:bg-gray-600 text-text-primary px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 shadow-lg transition-colors border border-gray-600"
          >
            <Download size={18} /> Download
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-500 text-text-primary px-4 py-2 rounded-lg font-medium flex items-center justify-center gap-2 shadow-lg transition-colors"
          >
            <ArrowLeftRight size={18} /> Transaksi Baru
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-bg-surface rounded-xl border border-border-color shadow overflow-hidden flex-1 flex flex-col">
        <div className="p-4 border-b border-border-color bg-bg-surface flex justify-between items-center">
          <h2 className="text-text-primary font-semibold flex items-center gap-2">
            <ArrowLeftRight className="text-accent" size={18} /> Riwayat Transaksi
          </h2>
          <span className="bg-btn-secondary text-text-secondary text-xs px-2 py-1 rounded border border-border-color">
            Total: {filteredData.length} Data
          </span>
        </div>
        <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-bg-dark text-text-secondary border-b border-border-color sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-medium">Tanggal</th>
                <th className="px-4 py-3 font-medium">ID Transaksi</th>
                <th className="px-4 py-3 font-medium">Tipe</th>
                <th className="px-4 py-3 font-medium">Kode Barang</th>
                <th className="px-4 py-3 font-medium">Nama Barang</th>
                <th className="px-4 py-3 font-medium text-center">Jumlah</th>
                <th className="px-4 py-3 font-medium">Pekerja / PIC</th>
                <th className="px-4 py-3 font-medium">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredData.map((trx) => (
                <tr key={trx.id} className="hover:bg-btn-secondary/40 transition-colors">
                  <td className="px-4 py-3 text-text-secondary">{trx.date}</td>
                  <td className="px-4 py-3 font-mono text-text-secondary">{trx.id}</td>
                  <td className="px-4 py-3">
                    {trx.type === 'in' ? (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs flex items-center w-max gap-1">
                        <ArrowDownToLine size={12}/> Masuk
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded text-xs flex items-center w-max gap-1">
                        <ArrowUpFromLine size={12}/> Keluar
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-blue-400 font-medium">{trx.itemId}</td>
                  <td className="px-4 py-3 text-text-primary">{trx.itemName}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${trx.type === 'in' ? 'text-green-500' : 'text-orange-500'}`}>
                      {trx.type === 'in' ? '+' : '-'}{trx.qty}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{trx.worker}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs max-w-[200px] truncate" title={trx.notes}>{trx.notes}</td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-text-secondary">
                    <div className="flex flex-col items-center justify-center">
                      <Package size={32} className="mb-2 opacity-50" />
                      <p>Tidak ada transaksi ditemukan.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Modal (Redesigned 2 Columns) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-bg-surface border border-border-color rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-border-color bg-black/20 shrink-0">
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <ArrowLeftRight className="text-blue-500" size={20}/> Transaksi Barang
              </h2>
              <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="text-text-secondary hover:text-text-primary transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleTransaction} className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-5">
                
                {/* SISI KIRI: Input Form */}
                <div className="space-y-4">
                  {/* Tipe Transaksi */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Tipe Transaksi</label>
                    <div className="flex gap-2">
                      <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${formData.type === 'in' ? 'bg-green-600/20 border-green-500 text-green-400' : 'bg-bg-dark border-border-color text-text-secondary hover:border-gray-500'}`}>
                        <input type="radio" name="type" value="in" className="hidden" checked={formData.type === 'in'} onChange={() => { setFormData({...formData, type: 'in', id: ''}); }} />
                        <ArrowDownToLine size={16} /> Barang Masuk
                      </label>
                      <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${formData.type === 'out' ? 'bg-orange-600/20 border-orange-500 text-orange-400' : 'bg-bg-dark border-border-color text-text-secondary hover:border-gray-500'}`}>
                        <input type="radio" name="type" value="out" className="hidden" checked={formData.type === 'out'} onChange={() => { setFormData({...formData, type: 'out', id: ''}); }} />
                        <ArrowUpFromLine size={16} /> Barang Keluar
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* ID Transaksi */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-secondary">ID Transaksi</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" required readOnly
                          value={formData.id} 
                          className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none text-text-secondary" 
                          placeholder="Otomatis..."
                        />
                        <button type="button" onClick={generateId} className="bg-[#2A313C] hover:bg-[#323A46] text-text-primary p-2.5 rounded-lg border border-border-color transition-colors" title="Generate ID">
                          <RotateCw size={16} />
                        </button>
                      </div>
                    </div>
                    {/* Tanggal Transaksi */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-secondary">Tanggal Transaksi</label>
                      <input 
                        type="datetime-local" required
                        value={formData.date} 
                        onChange={e => setFormData({...formData, date: e.target.value})}
                        className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043] text-text-primary" 
                      />
                    </div>
                  </div>

                  {/* Kode & Nama Barang */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Barang Terpilih (Pilih dari tabel Kanan)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" readOnly
                        value={selectedItem ? selectedItem.id : ''} 
                        className="w-1/3 bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none text-blue-400 font-mono" 
                        placeholder="Kode"
                      />
                      <input 
                        type="text" readOnly
                        value={selectedItem ? selectedItem.name : ''} 
                        className="w-2/3 bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none text-text-primary" 
                        placeholder="Nama Barang"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Satuan */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-secondary">Satuan</label>
                      <input 
                        type="text" readOnly
                        value={selectedItem ? selectedItem.unit : ''} 
                        className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none text-text-secondary" 
                        placeholder="-"
                      />
                    </div>
                    {/* Jml */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-secondary">Jumlah</label>
                      <input 
                        type="number" min="1"
                        value={tempQty} 
                        onChange={e => setTempQty(e.target.value)}
                        className="w-full bg-bg-dark border border-gray-600 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043] text-text-primary" 
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Stok */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-secondary">Stok</label>
                      <input 
                        type="text" readOnly disabled
                        value={selectedItem ? selectedItem.qty : ''} 
                        className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none text-text-secondary cursor-not-allowed" 
                        placeholder="-"
                      />
                    </div>
                    {/* Stok Min */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-text-secondary">Stok Min</label>
                      <input 
                        type="text" readOnly disabled
                        value={selectedItem ? (selectedItem.minQty || 10) : ''} 
                        className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none text-text-secondary cursor-not-allowed" 
                        placeholder="-"
                      />
                    </div>
                  </div>

                  {/* Gudang */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Gudang Penyimpanan</label>
                    {formData.type === 'in' ? (
                      <select 
                        required
                        value={tempGudang} 
                        onChange={e => setTempGudang(e.target.value)}
                        className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043] appearance-none text-text-primary"
                      >
                        {GUDANG_LIST.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    ) : (
                      <input 
                        type="text" readOnly
                        value={tempGudang} 
                        className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none text-text-secondary" 
                        placeholder="Otomatis terisi..."
                      />
                    )}
                  </div>

                  <button 
                    type="button" 
                    onClick={handleAddToCart}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors mt-2"
                  >
                    <Plus size={16} /> Tambahkan ke Daftar
                  </button>

                  {/* Daftar Item (Cart) */}
                  <div className="mt-4 border border-border-color rounded-lg overflow-hidden flex flex-col h-40">
                    <div className="bg-bg-dark px-3 py-2 text-xs font-medium text-text-secondary border-b border-border-color flex justify-between">
                      <span>Daftar Barang Transaksi ({cart.length})</span>
                    </div>
                    <div className="flex-1 overflow-y-auto bg-black/10 custom-scrollbar p-2 space-y-2">
                      {cart.length === 0 ? (
                        <div className="text-center text-xs text-text-secondary mt-10">Belum ada barang ditambahkan</div>
                      ) : (
                        cart.map((c, i) => (
                          <div key={i} className="flex justify-between items-center bg-bg-surface border border-border-color p-2 rounded-md">
                            <div>
                              <div className="font-mono text-xs text-blue-400">{c.item.id}</div>
                              <div className="text-sm">{c.item.name}</div>
                              <div className="text-xs text-text-secondary">{c.gudang}</div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold bg-btn-secondary px-2 py-1 rounded text-sm">{c.qty} {c.item.unit}</span>
                              <button type="button" onClick={() => handleRemoveFromCart(i)} className="text-red-500 hover:text-red-400">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Keterangan */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-text-secondary">Keterangan Tambahan</label>
                    <textarea 
                      rows="2"
                      value={formData.notes} 
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                      className="w-full bg-bg-dark border border-border-color rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#FF7043] resize-none text-text-primary" 
                      placeholder="Contoh: No PO, Tujuan Penggunaan, dll."
                    ></textarea>
                  </div>
                </div>

                {/* SISI KANAN: Pemilihan Barang */}
                <div className="flex flex-col gap-4 bg-black/20 p-4 rounded-xl border border-border-color/50">
                  
                  {/* Image Panel */}
                  <div className="w-full h-40 bg-bg-dark border border-border-color rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                    {selectedItem && selectedItem.image ? (
                      <img src={selectedItem.image} alt={selectedItem.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-text-secondary flex flex-col items-center gap-2">
                        <ImageIcon size={32} className="opacity-50" />
                        <span className="text-xs">Pilih barang untuk melihat gambar</span>
                      </div>
                    )}
                  </div>

                  {/* Table Selection */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="relative mb-3 shrink-0">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                      <input 
                        type="text" 
                        placeholder="Cari Barang..." 
                        value={modalSearchTerm}
                        onChange={(e) => setModalSearchTerm(e.target.value)}
                        className="w-full bg-bg-dark text-text-primary border border-border-color rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-[#FF7043] text-sm"
                      />
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar border border-border-color rounded-lg bg-bg-surface">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-bg-dark text-text-secondary sticky top-0">
                          <tr>
                            <th className="px-3 py-2 font-medium">Kode Barang</th>
                            <th className="px-3 py-2 font-medium">Nama Barang</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700/50">
                          {modalFilteredItems.map(item => (
                            <tr 
                              key={item.id} 
                              onClick={() => setSelectedItem(item)}
                              className={`cursor-pointer transition-colors ${selectedItem?.id === item.id ? 'bg-[#FF7043]/20' : 'hover:bg-btn-secondary'}`}
                            >
                              <td className="px-3 py-2 font-mono text-blue-400">{item.id}</td>
                              <td className="px-3 py-2 text-text-primary truncate max-w-[150px]" title={item.name}>{item.name}</td>
                            </tr>
                          ))}
                          {modalFilteredItems.length === 0 && (
                            <tr>
                              <td colSpan="2" className="px-3 py-4 text-center text-text-secondary text-xs">Barang tidak ditemukan</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex justify-end gap-3 p-4 border-t border-border-color bg-bg-surface shrink-0">
                <button type="button" onClick={() => { setIsModalOpen(false); resetForm(); }} className="px-5 py-2 text-sm text-text-secondary hover:text-text-primary font-medium">
                  Batal
                </button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-text-primary px-6 py-2 rounded-lg text-sm font-medium shadow-lg transition-colors flex items-center gap-2">
                  <Check size={16} /> Proses Transaksi
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
root.render(<TransaksiGudang />);
