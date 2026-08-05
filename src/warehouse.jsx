import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Package, Search, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, X
} from 'lucide-react';

const INITIAL_INVENTORY = [
  { id: 'SKU-001', name: 'Filter Oli Mesin', qty: 24, min: 10, unit: 'pcs' },
  { id: 'SKU-002', name: 'Pelumas Hidrolik 50L', qty: 3, min: 5, unit: 'drum' },
  { id: 'SKU-003', name: 'Bantalan Rol (Bearing) 20mm', qty: 15, min: 20, unit: 'pcs' },
  { id: 'SKU-004', name: 'Kabel Tembaga 2.5mm', qty: 100, min: 50, unit: 'meter' },
  { id: 'SKU-005', name: 'Sensor Suhu PT100', qty: 2, min: 2, unit: 'pcs' },
];

function Warehouse() {
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [modalType, setModalType] = useState(null); // 'in' or 'out'
  const [selectedItem, setSelectedItem] = useState('');
  const [qtyChange, setQtyChange] = useState('');

  const handleTransaction = (e) => {
    e.preventDefault();
    const qty = parseInt(qtyChange);
    if (!selectedItem || isNaN(qty) || qty <= 0) return;

    setInventory(prev => prev.map(item => {
      if (item.id === selectedItem) {
        const newQty = modalType === 'in' ? item.qty + qty : Math.max(0, item.qty - qty);
        return { ...item, qty: newQty };
      }
      return item;
    }));
    
    setModalType(null);
    setSelectedItem('');
    setQtyChange('');
  };

  return (
    <div className="flex flex-col h-full gap-6 text-gray-200 font-sans">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-bg-surface p-6 rounded-xl border border-gray-700 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center">
            <Package size={24} />
          </div>
          <div>
            <div className="text-gray-400 text-sm">Total SKU Item</div>
            <div className="text-2xl font-bold text-white">{inventory.length}</div>
          </div>
        </div>
        <div className="bg-bg-surface p-6 rounded-xl border border-gray-700 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="text-gray-400 text-sm">Stok Kritis (Kurang)</div>
            <div className="text-2xl font-bold text-white">
              {inventory.filter(i => i.qty < i.min).length}
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center bg-bg-surface p-4 rounded-xl border border-gray-700 shadow-lg">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari SKU atau nama barang..." 
            className="w-full bg-[#12161A] border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-[#FF7043] transition-colors"
          />
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setModalType('in')}
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg transition-colors"
          >
            <ArrowDownToLine size={18} /> Barang Masuk
          </button>
          <button 
            onClick={() => setModalType('out')}
            className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg transition-colors"
          >
            <ArrowUpFromLine size={18} /> Barang Keluar
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-bg-surface rounded-xl border border-gray-700 shadow-lg overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#12161A] text-gray-400 border-b border-gray-700">
              <tr>
                <th className="px-6 py-4 font-medium">SKU ID</th>
                <th className="px-6 py-4 font-medium">Nama Barang</th>
                <th className="px-6 py-4 font-medium text-center">Kuantitas</th>
                <th className="px-6 py-4 font-medium text-center">Batas Minimum</th>
                <th className="px-6 py-4 font-medium">Satuan</th>
                <th className="px-6 py-4 font-medium">Status Stok</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {inventory.map(item => {
                const isLow = item.qty < item.min;
                const isWarning = item.qty === item.min;
                return (
                  <tr key={item.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-gray-300">{item.id}</td>
                    <td className="px-6 py-4 text-white font-medium">{item.name}</td>
                    <td className={`px-6 py-4 text-center font-bold text-lg ${isLow ? 'text-red-500' : isWarning ? 'text-yellow-500' : 'text-gray-200'}`}>
                      {item.qty}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-400">{item.min}</td>
                    <td className="px-6 py-4 text-gray-400">{item.unit}</td>
                    <td className="px-6 py-4">
                      {isLow ? (
                        <span className="px-2 py-1 bg-red-500/20 text-red-500 rounded text-xs border border-red-500/50 flex items-center gap-1 w-fit"><AlertTriangle size={12}/> Kritis</span>
                      ) : isWarning ? (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded text-xs border border-yellow-500/50 flex items-center gap-1 w-fit">Warning</span>
                      ) : (
                        <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded text-xs border border-green-500/50 flex items-center gap-1 w-fit">Aman</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Modal */}
      {modalType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1E242B] border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-700 bg-black/20">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {modalType === 'in' ? <><ArrowDownToLine className="text-green-500"/> Barang Masuk</> : <><ArrowUpFromLine className="text-orange-500"/> Barang Keluar</>}
              </h2>
              <button onClick={() => setModalType(null)} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleTransaction} className="p-6 flex flex-col gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Pilih Barang</label>
                <select 
                  required
                  value={selectedItem} onChange={e => setSelectedItem(e.target.value)}
                  className="w-full bg-[#12161A] border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-[#FF7043] appearance-none text-white"
                >
                  <option value="" disabled>-- Pilih SKU Barang --</option>
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>{item.id} - {item.name} ({item.qty} {item.unit})</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Jumlah {modalType === 'in' ? 'Masuk' : 'Keluar'}</label>
                <input 
                  type="number" min="1" required
                  value={qtyChange} onChange={e => setQtyChange(e.target.value)}
                  className="w-full bg-[#12161A] border border-gray-700 rounded-lg p-3 focus:outline-none focus:border-[#FF7043]" 
                  placeholder="Masukkan jumlah..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-700">
                <button type="button" onClick={() => setModalType(null)} className="px-5 py-2.5 text-gray-300 hover:text-white font-medium">
                  Batal
                </button>
                <button type="submit" className={`${modalType === 'in' ? 'bg-green-600 hover:bg-green-500' : 'bg-orange-600 hover:bg-orange-500'} text-white px-6 py-2.5 rounded-lg font-medium shadow-lg transition-colors`}>
                  Simpan Transaksi
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
root.render(<Warehouse />);
