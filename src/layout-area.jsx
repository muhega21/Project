import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ZoomIn, ZoomOut, RotateCw, Layers, Map, 
  Plus, List, Edit2, Trash2, Image as ImageIcon,
  ChevronRight
} from 'lucide-react';

// Mock Data
const MOCK_ZONES = [
  { id: 'z1', name: 'Boiler Area', rect: { top: 20, left: 10, width: 25, height: 30 }, color: 'rgba(239, 68, 68, 0.5)' }, // Red
  { id: 'z2', name: 'Water Treatment', rect: { top: 55, left: 40, width: 30, height: 25 }, color: 'rgba(234, 179, 8, 0.5)' }, // Yellow
  { id: 'z3', name: 'Reverse Osmosis', rect: { top: 15, left: 60, width: 20, height: 35 }, color: 'rgba(59, 130, 246, 0.5)' }, // Blue
];

const MOCK_EQUIPMENTS = [
  { id: 'e1', zoneId: 'z1', name: '101677 | BOILER TUBE A', status: 'Down' },
  { id: 'e2', zoneId: 'z1', name: '101678 | BOILER VALVE B', status: 'Maintenance' },
  { id: 'e3', zoneId: 'z2', name: '202110 | WATER PUMP 1', status: 'Running' },
  { id: 'e4', zoneId: 'z2', name: '202111 | WATER FILTER', status: 'Warning' },
  { id: 'e5', zoneId: 'z3', name: '305542 | RO MEMBRANE A', status: 'Running' },
  { id: 'e6', zoneId: 'z3', name: '305543 | RO COMPRESSOR', status: 'Down' },
];

function LayoutArea() {
  const [plant, setPlant] = useState({ name: 'Unknown Area', code: '' });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showZones, setShowZones] = useState(true);
  
  const [selectedZone, setSelectedZone] = useState(null);
  
  // Background map
  const [bgImage, setBgImage] = useState('https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=1200&auto=format&fit=crop'); // Default blueprint-like image
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      const saved = localStorage.getItem('maintainx_plants');
      if (saved) {
        const plants = JSON.parse(saved);
        const found = plants.find(p => p.code === code);
        if (found) setPlant(found);
      } else {
        setPlant({ name: 'Area', code });
      }
    }
  }, []);

  // Pan & Zoom Handlers
  const handleWheel = (e) => {
    e.preventDefault();
    const scaleAmount = -e.deltaY * 0.001;
    setZoom(z => Math.min(Math.max(0.5, z + scaleAmount), 3));
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('.zone-overlay') || e.target.closest('.toolbar') || e.target.closest('.status-panel')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoneClick = (zone, e) => {
    e.stopPropagation();
    setSelectedZone(zone.id === selectedZone ? null : zone.id);
  };
  
  const handleUploadBg = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => setBgImage(event.target.result);
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // Filter equipments
  const displayEquipments = selectedZone 
    ? MOCK_EQUIPMENTS.filter(eq => eq.zoneId === selectedZone)
    : MOCK_EQUIPMENTS;

  const getStatusColor = (status) => {
    switch (status) {
      case 'Down': return 'bg-red-500/20 text-red-500 border-red-500/50';
      case 'Warning': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      case 'Running': return 'bg-green-500/20 text-green-500 border-green-500/50';
      case 'Maintenance': return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
      default: return 'bg-gray-500/20 text-text-secondary border-gray-500/50';
    }
  };

  return (
    <div className="h-full w-full bg-bg-dark text-text-primary flex flex-col font-sans relative overflow-hidden">
      
      {/* Header */}
      <header className="flex-none bg-bg-surface border-b border-border-color px-6 py-4 flex items-center justify-between z-50 shadow-md">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-text-primary m-0 leading-tight flex items-center gap-2">
            <Map size={20} className="text-blue-500" />
            {plant.name}
          </h2>
          <span className="text-sm text-text-secondary font-medium font-mono mt-1 pl-7">Code: {plant.code}</span>
        </div>
        <a href="/asset-register.html" className="text-sm px-4 py-2 bg-btn-secondary hover:bg-gray-700 text-text-secondary rounded-lg border border-border-color transition-colors flex items-center gap-2">
          Kembali
        </a>
      </header>

      {/* Main Canvas Area */}
      <div 
        className="flex-1 relative overflow-hidden"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Map Container */}
        <div 
          className="absolute inset-0 origin-center transition-transform duration-75 ease-out will-change-transform"
          style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        >
          {/* Blueprint Image */}
          <div className="relative w-[1200px] h-[800px] max-w-none max-h-none shadow-2xl mx-auto my-12 bg-bg-surface border border-border-color rounded-lg overflow-hidden">
            <img 
              src={bgImage} 
              alt="Blueprint" 
              className="w-full h-full object-cover opacity-60 pointer-events-none select-none"
              draggable="false"
            />
            
            {/* Zones Overlay */}
            {showZones && MOCK_ZONES.map(zone => (
              <div 
                key={zone.id}
                className={`zone-overlay absolute border-2 transition-all duration-200 cursor-pointer flex items-center justify-center font-bold text-text-primary shadow-lg backdrop-blur-[2px]
                  ${selectedZone === zone.id ? 'ring-4 ring-white/50 border-white z-20 scale-[1.02]' : 'border-white/30 hover:border-white/70 z-10'}`}
                style={{
                  top: `${zone.rect.top}%`,
                  left: `${zone.rect.left}%`,
                  width: `${zone.rect.width}%`,
                  height: `${zone.rect.height}%`,
                  backgroundColor: zone.color,
                }}
                onClick={(e) => handleZoneClick(zone, e)}
              >
                <div className="bg-black/60 px-3 py-1 rounded text-sm tracking-wider">
                  {zone.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Toolbar (Left) */}
        <div className="toolbar absolute top-6 left-6 bg-bg-surface/90 backdrop-blur-md border border-border-color rounded-xl p-2 shadow-2xl flex flex-col gap-2 z-40">
          <div className="text-[10px] uppercase tracking-widest text-text-secondary font-bold px-2 py-1 mb-1 border-b border-border-color/50">Controls</div>
          
          <button className="p-2 hover:bg-gray-700 rounded-lg text-text-secondary transition-colors tooltip-trigger" onClick={() => setZoom(z => Math.min(3, z + 0.2))} title="Zoom In">
            <ZoomIn size={20} />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded-lg text-text-secondary transition-colors" onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} title="Zoom Out">
            <ZoomOut size={20} />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded-lg text-text-secondary transition-colors" onClick={() => { setRotation(0); setPan({x:0,y:0}); setZoom(1); }} title="Reset View">
            <RotateCw size={20} />
          </button>
          
          <div className="w-full h-px bg-gray-700 my-1"></div>
          
          <button className={`p-2 rounded-lg transition-colors ${showZones ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-gray-700 text-text-secondary'}`} onClick={() => setShowZones(!showZones)} title="Toggle Zones">
            <Layers size={20} />
          </button>
          
          <select className="bg-btn-secondary border border-gray-600 text-xs rounded px-1 py-1.5 text-text-secondary outline-none w-10 overflow-hidden appearance-none text-center hover:bg-gray-700 cursor-pointer" title="Shape Mode">
            <option>⬜</option>
            <option>⬟</option>
          </select>
          
          <div className="w-full h-px bg-gray-700 my-1"></div>
          
          <button className="p-2 hover:bg-gray-700 rounded-lg text-green-400 transition-colors" title="Add Zone">
            <Plus size={20} />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded-lg text-text-secondary transition-colors" title="Edit Zones">
            <Edit2 size={20} />
          </button>
          <button className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors" title="Delete Selected">
            <Trash2 size={20} />
          </button>
          <button className="p-2 hover:bg-gray-700 rounded-lg text-text-secondary transition-colors" onClick={handleUploadBg} title="Upload Background">
            <ImageIcon size={20} />
          </button>
        </div>

        {/* Floating Equipment Status Panel (Right) */}
        <div className="status-panel absolute top-6 right-6 w-80 bg-bg-surface/95 backdrop-blur-xl border border-border-color rounded-xl shadow-2xl overflow-hidden z-40 flex flex-col max-h-[calc(100vh-120px)] transition-all duration-300">
          <div className="p-4 border-b border-border-color bg-black/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <List size={18} className="text-blue-400" />
              <h3 className="font-semibold text-text-primary tracking-wide">Equipment Status</h3>
            </div>
            {selectedZone && (
              <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                Filtered
              </span>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-text-secondary uppercase bg-black/10 sticky top-0">
                <tr>
                  <th className="px-3 py-2 font-medium">Nama Asset</th>
                  <th className="px-3 py-2 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {displayEquipments.map(eq => (
                  <tr key={eq.id} className="border-b border-border-color hover:bg-gray-700/30 transition-colors">
                    <td className="px-3 py-3 font-medium text-text-secondary truncate max-w-[150px]" title={eq.name}>
                      {eq.name}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border uppercase tracking-wider ${getStatusColor(eq.status)}`}>
                        {eq.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {displayEquipments.length === 0 && (
                  <tr>
                    <td colSpan="2" className="text-center py-8 text-text-secondary text-xs">
                      Tidak ada data peralatan di zona ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<LayoutArea />);
