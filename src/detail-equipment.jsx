import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ArrowLeft, Search, Filter, AlertCircle, 
  CheckCircle2, Clock, Settings, FileText, ChevronRight, Plus, X, Upload, Image as ImageIcon
} from 'lucide-react';

const MOCK_EQUIPMENTS = [
  { id: 'e1', zoneId: 'z1', name: '101677 | BOILER TUBE A', status: 'Down', type: 'Boiler Component', lastMaintenance: '15 Okt 2023' },
  { id: 'e2', zoneId: 'z1', name: '101678 | BOILER VALVE B', status: 'Maintenance', type: 'Valve', lastMaintenance: '01 Nov 2023' },
  { id: 'e3', zoneId: 'z2', name: '202110 | WATER PUMP 1', status: 'Running', type: 'Pump', lastMaintenance: '20 Sep 2023' },
  { id: 'e4', zoneId: 'z2', name: '202111 | WATER FILTER', status: 'Warning', type: 'Filter', lastMaintenance: '10 Ags 2023' },
  { id: 'e5', zoneId: 'z3', name: '305542 | RO MEMBRANE A', status: 'Running', type: 'Membrane', lastMaintenance: '05 Des 2023' },
  { id: 'e6', zoneId: 'z3', name: '305543 | RO COMPRESSOR', status: 'Down', type: 'Compressor', lastMaintenance: '30 Okt 2023' },
  { id: 'e7', zoneId: 'z1', name: '101679 | BOILER SENSOR 1', status: 'Running', type: 'Sensor', lastMaintenance: '10 Jan 2024' },
  { id: 'e8', zoneId: 'z1', name: '101680 | BOILER SENSOR 2', status: 'Running', type: 'Sensor', lastMaintenance: '10 Jan 2024' },
  { id: 'e9', zoneId: 'z1', name: '101681 | EXHAUST FAN', status: 'Running', type: 'Fan', lastMaintenance: '15 Des 2023' },
  { id: 'e10', zoneId: 'z1', name: '101682 | COOLING PIPE', status: 'Warning', type: 'Pipe', lastMaintenance: '22 Jul 2023' }
];

function DetailEquipment() {
  const [equipments, setEquipments] = useState(MOCK_EQUIPMENTS);
  const [zoneId, setZoneId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleAddEquipment = (e) => {
    e.preventDefault();
    alert('Equipment berhasil ditambahkan!');
    setIsAddModalOpen(false);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id'); // this could refer to the equipment ID directly, or we can use ?zoneId=...
    // Let's check both for flexibility
    const zid = params.get('zoneId');
    const eid = params.get('id');

    if (zid) {
      setZoneId(zid);
      setEquipments(MOCK_EQUIPMENTS.filter(eq => eq.zoneId === zid));
    } else if (eid) {
      // If we clicked on a specific equipment, maybe we want to show its zone's equipments
      const eq = MOCK_EQUIPMENTS.find(e => e.id === eid);
      if (eq) {
        setZoneId(eq.zoneId);
        setEquipments(MOCK_EQUIPMENTS.filter(e => e.zoneId === eq.zoneId));
      }
    }
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Down': return <AlertCircle size={16} className="text-red-500" />;
      case 'Warning': return <AlertCircle size={16} className="text-yellow-500" />;
      case 'Running': return <CheckCircle2 size={16} className="text-green-500" />;
      case 'Maintenance': return <Settings size={16} className="text-blue-500" />;
      default: return <Clock size={16} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Down': return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'Warning': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      case 'Running': return 'bg-green-500/10 text-green-500 border-green-500/30';
      case 'Maintenance': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      default: return 'bg-gray-500/10 text-text-secondary border-gray-500/30';
    }
  };

  const filteredData = equipments.filter(eq => 
    eq.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    eq.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            Detail Equipment {zoneId ? `(Area ${zoneId.toUpperCase()})` : ''}
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
          <button className="flex items-center gap-2 px-4 py-2.5 bg-input-bg hover:bg-gray-700 text-text-secondary rounded-lg border border-border-color transition-colors font-medium text-sm">
            <Filter size={16} />
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm shadow-lg shadow-blue-900/20">
            <FileText size={16} />
            Export Data
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
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
                <th className="px-6 py-4 font-semibold">ID / Nama Asset</th>
                <th className="px-6 py-4 font-semibold">Tipe</th>
                <th className="px-6 py-4 font-semibold">Maintenance Terakhir</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color">
              {filteredData.length > 0 ? (
                filteredData.map((eq) => (
                  <tr key={eq.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{eq.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5 font-mono">#{eq.id}</div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{eq.type}</td>
                    <td className="px-6 py-4 text-text-secondary">
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-500" />
                        {eq.lastMaintenance}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusColor(eq.status)}`}>
                          {getStatusIcon(eq.status)}
                          {eq.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors">Lihat Log</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-text-secondary">
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
              <h3 className="text-xl font-bold text-white">Tambah Equipment</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Modal Body */}
            <form onSubmit={handleAddEquipment} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6">
              <div className="flex flex-col lg:flex-row gap-8">
                
                {/* Left Column - Image Upload */}
                <div className="w-full lg:w-1/3 flex flex-col gap-4">
                  <div className="w-full aspect-square bg-[#12161A] border-2 border-dashed border-border-color rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors cursor-pointer group">
                    <ImageIcon size={48} className="mb-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                    <span className="font-medium">Upload Gambar</span>
                    <span className="text-xs mt-2 opacity-50">JPG, PNG max 5MB</span>
                  </div>
                  <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-btn-secondary hover:bg-gray-700 text-white rounded-lg border border-border-color transition-colors font-medium text-sm">
                    <Upload size={16} />
                    Update / Upload Gambar
                  </button>
                </div>
                
                {/* Right Column - Form Fields */}
                <div className="w-full lg:w-2/3 flex flex-col gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* ID Equipment */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-400">ID Equipment</label>
                      <input 
                        type="text" 
                        readOnly 
                        value="EQU-00042" 
                        className="bg-black/50 border border-border-color text-gray-400 px-4 py-2.5 rounded-lg cursor-not-allowed outline-none"
                      />
                    </div>
                    
                    {/* Nama Equipment */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-400">Nama Equipment</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Contoh: BOILER TUBE A"
                        className="bg-input-bg border border-border-color text-white px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    
                    {/* Klasifikasi Equipment */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-400">Klasifikasi Equipment</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Contoh: Heavy Machinery"
                        className="bg-input-bg border border-border-color text-white px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    
                    {/* Tipe Equipment */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-400">Tipe Equipment</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Contoh: Boiler Component"
                        className="bg-input-bg border border-border-color text-white px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    
                    {/* Lokasi/Ruangan */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-400">Lokasi / Ruangan</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Contoh: Boiler Room Lt. 1"
                        className="bg-input-bg border border-border-color text-white px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    
                    {/* Maintenance */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-400">Status Maintenance</label>
                      <input 
                        type="text" 
                        required
                        placeholder="Keterangan perbaikan (Opsional)"
                        className="bg-input-bg border border-border-color text-white px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    
                  </div>
                  
                  {/* Status */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-400">Status Operasional</label>
                    <select required className="bg-input-bg border border-border-color text-white px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer">
                      <option value="Running">Running (Beroperasi Normal)</option>
                      <option value="Active">Active (Aktif)</option>
                      <option value="Stand By">Stand By (Siaga)</option>
                      <option value="Maintenance">Maintenance (Pemeliharaan)</option>
                      <option value="Breakdown">Breakdown (Rusak)</option>
                    </select>
                  </div>
                  
                  {/* Spesifikasi */}
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-sm font-medium text-gray-400">Informasi / Spesifikasi</label>
                    <textarea 
                      required
                      rows="4"
                      placeholder="Masukkan spesifikasi lengkap, kapasitas, merek, atau informasi lainnya..."
                      className="bg-input-bg border border-border-color text-white px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 transition-colors resize-none flex-1"
                    ></textarea>
                  </div>
                  
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-color bg-[#12161A]">
              <button type="button" className="px-5 py-2.5 bg-btn-secondary hover:bg-gray-700 text-white rounded-lg border border-border-color transition-colors font-medium">
                Upload
              </button>
              <button type="button" className="px-5 py-2.5 bg-btn-secondary hover:bg-gray-700 text-white rounded-lg border border-border-color transition-colors font-medium">
                Edit
              </button>
              <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg shadow-blue-900/20">
                Tambah Equipment
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
root.render(<DetailEquipment />);
