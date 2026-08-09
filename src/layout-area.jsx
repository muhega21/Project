import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ZoomIn, ZoomOut, RotateCw, Layers, Map, 
  Plus, List, Edit2, Trash2, Image as ImageIcon,
  Power
} from 'lucide-react';

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
  const [zones, setZones] = useState([]);

  const [bgImage, setBgImage] = useState('https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?q=80&w=1200&auto=format&fit=crop');

  // Drawing state
  const [drawingMode, setDrawingMode] = useState(false);
  const [drawingShape, setDrawingShape] = useState('rectangle');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState([]);
  
  // Modals state
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editZoneData, setEditZoneData] = useState({ name: '' });
  
  const containerRef = useRef(null);

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
      
      const savedZones = localStorage.getItem(`maintainx_zones_${code}`);
      if (savedZones) {
        setZones(JSON.parse(savedZones));
      } else {
        setZones([
          { id: 'z1', type: 'rectangle', name: 'Boiler Area', rect: { top: 20, left: 10, width: 25, height: 30 }, color: 'rgba(239, 68, 68, 0.5)' },
          { id: 'z2', type: 'rectangle', name: 'Water Treatment', rect: { top: 55, left: 40, width: 30, height: 25 }, color: 'rgba(234, 179, 8, 0.5)' },
          { id: 'z3', type: 'rectangle', name: 'Reverse Osmosis', rect: { top: 15, left: 60, width: 20, height: 35 }, color: 'rgba(59, 130, 246, 0.5)' },
        ]);
      }
    }
  }, []);

  const saveZones = (newZones) => {
    setZones(newZones);
    if (plant.code) {
      localStorage.setItem(`maintainx_zones_${plant.code}`, JSON.stringify(newZones));
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (drawingMode) return;
    const scaleAmount = -e.deltaY * 0.001;
    setZoom(z => Math.min(Math.max(0.5, z + scaleAmount), 3));
  };

  const handleMouseDown = (e) => {
    if (e.target.closest('.toolbar') || e.target.closest('.status-panel') || e.target.closest('.modal-container')) return;
    
    if (drawingMode && isDrawing && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      if (drawingShape === 'rectangle' || drawingShape === 'circle') {
        if (drawingPoints.length === 0) {
          setDrawingPoints([{x, y}]);
        } else if (drawingPoints.length === 1) {
          setDrawingPoints([...drawingPoints, {x, y}]);
          setShowSectionForm(true);
        }
      } else if (drawingShape === 'polygon') {
        if (drawingPoints.length > 2) {
          const firstPoint = drawingPoints[0];
          const dist = Math.sqrt(Math.pow(x - firstPoint.x, 2) + Math.pow(y - firstPoint.y, 2));
          if (dist < 2) { 
            setShowSectionForm(true);
            return;
          }
        }
        setDrawingPoints([...drawingPoints, {x, y}]);
      }
      return;
    }

    if (!drawingMode && !e.target.closest('.zone-overlay')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoneClick = (zone, e) => {
    e.stopPropagation();
    if (drawingMode) return;
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

  const handleDeleteZone = () => {
    if (selectedZone && window.confirm("Apakah Anda yakin ingin menghapus area ini?")) {
      const newZones = zones.filter(z => z.id !== selectedZone);
      saveZones(newZones);
      setSelectedZone(null);
    }
  };

  const startDrawing = () => {
    if (drawingMode) {
      setZoom(1);
      setPan({x:0, y:0});
      setIsDrawing(true);
      setDrawingPoints([]);
    }
  };

  const handleSaveSection = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('sectionName');
    
    let newZone = {
      id: 'z_' + Date.now(),
      name,
      type: drawingShape,
      color: `hsla(${Math.random() * 360}, 70%, 50%, 0.5)`
    };

    if (drawingShape === 'rectangle') {
      const x1 = Math.min(drawingPoints[0].x, drawingPoints[1].x);
      const y1 = Math.min(drawingPoints[0].y, drawingPoints[1].y);
      const w = Math.abs(drawingPoints[0].x - drawingPoints[1].x);
      const h = Math.abs(drawingPoints[0].y - drawingPoints[1].y);
      newZone.rect = { top: y1, left: x1, width: w, height: h };
    } else if (drawingShape === 'circle') {
      const center = drawingPoints[0];
      const edge = drawingPoints[1];
      const radius = Math.sqrt(Math.pow(center.x - edge.x, 2) + Math.pow(center.y - edge.y, 2));
      newZone.circle = { cx: center.x, cy: center.y, r: radius };
    } else if (drawingShape === 'polygon') {
      newZone.points = [...drawingPoints];
    }

    saveZones([...zones, newZone]);
    setShowSectionForm(false);
    setDrawingPoints([]);
    setIsDrawing(false);
  };
  
  const handleEditZoneSubmit = (e) => {
    e.preventDefault();
    const newZones = zones.map(z => z.id === selectedZone ? { ...z, name: editZoneData.name } : z);
    saveZones(newZones);
    setShowEditForm(false);
  };

  const openEditModal = () => {
    if (selectedZone) {
      const z = zones.find(z => z.id === selectedZone);
      setEditZoneData({ name: z.name });
      setShowEditForm(true);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Down': return 'bg-red-500/20 text-red-500 border-red-500/50';
      case 'Warning': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      case 'Running': return 'bg-green-500/20 text-green-500 border-green-500/50';
      case 'Maintenance': return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
      default: return 'bg-gray-500/20 text-text-secondary border-gray-500/50';
    }
  };

  const displayEquipments = selectedZone 
    ? MOCK_EQUIPMENTS.filter(eq => eq.zoneId === selectedZone)
    : MOCK_EQUIPMENTS;

  const renderZone = (zone) => {
    const isSelected = selectedZone === zone.id;
    const baseStyle = {
      backgroundColor: zone.color,
      borderColor: isSelected ? 'white' : 'rgba(255,255,255,0.3)',
      borderWidth: isSelected ? '4px' : '2px',
      borderStyle: 'solid',
      zIndex: isSelected ? 20 : 10,
      cursor: drawingMode ? 'crosshair' : 'pointer',
      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
      transition: 'all 0.2s',
      position: 'absolute',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(2px)',
    };

    if (zone.type === 'rectangle' || !zone.type) {
      return (
        <div 
          key={zone.id}
          className={`zone-overlay shadow-lg ${isSelected ? 'ring-4 ring-white/50' : ''}`}
          style={{
            ...baseStyle,
            top: `${zone.rect.top}%`,
            left: `${zone.rect.left}%`,
            width: `${zone.rect.width}%`,
            height: `${zone.rect.height}%`,
          }}
          onClick={(e) => handleZoneClick(zone, e)}
        >
          <div className="bg-black/60 px-3 py-1 rounded text-sm tracking-wider font-bold text-white pointer-events-none">
            {zone.name}
          </div>
        </div>
      );
    } else if (zone.type === 'circle') {
      return (
        <div 
          key={zone.id}
          className={`zone-overlay shadow-lg ${isSelected ? 'ring-4 ring-white/50' : ''}`}
          style={{
            ...baseStyle,
            borderRadius: '50%',
            top: `${zone.circle.cy - zone.circle.r}%`,
            left: `${zone.circle.cx - zone.circle.r}%`,
            width: `${zone.circle.r * 2}%`,
            height: `${zone.circle.r * 2}%`,
          }}
          onClick={(e) => handleZoneClick(zone, e)}
        >
          <div className="bg-black/60 px-3 py-1 rounded text-sm tracking-wider font-bold text-white pointer-events-none">
            {zone.name}
          </div>
        </div>
      );
    } else if (zone.type === 'polygon') {
      const pointsStr = zone.points.map(p => `${p.x},${p.y}`).join(' ');
      const minX = Math.min(...zone.points.map(p => p.x));
      const minY = Math.min(...zone.points.map(p => p.y));
      return (
        <div key={zone.id} className="zone-overlay absolute inset-0 z-10" onClick={(e) => handleZoneClick(zone, e)}>
          <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none">
            <polygon 
              points={pointsStr} 
              fill={zone.color} 
              stroke={isSelected ? 'white' : 'rgba(255,255,255,0.3)'} 
              strokeWidth={isSelected ? "4" : "2"}
              className={`cursor-pointer pointer-events-auto transition-all ${isSelected ? 'drop-shadow-lg' : ''}`}
            />
          </svg>
          <div className="absolute pointer-events-none flex items-center justify-center" style={{ left: `${minX}%`, top: `${minY}%`, transform: 'translate(0, -20px)' }}>
            <div className="bg-black/60 px-3 py-1 rounded text-sm tracking-wider font-bold text-white whitespace-nowrap">
              {zone.name}
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="h-full w-full bg-bg-dark text-text-primary flex flex-col font-sans relative overflow-hidden">
      
      {/* Header */}
      <header className="flex-none bg-bg-surface border-b border-border-color px-6 py-3 flex items-center justify-between z-50 shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-text-primary m-0 leading-tight flex items-center gap-2">
              <Map size={18} className="text-blue-500" />
              {plant.name}
            </h2>
            <span className="text-xs text-text-secondary font-mono mt-0.5 pl-6">Code: {plant.code}</span>
          </div>
        </div>
        <a href="/asset-register.html" className="text-xs px-3 py-1.5 bg-btn-secondary hover:bg-gray-700 text-text-secondary rounded border border-border-color transition-colors flex items-center gap-2">
          Kembali
        </a>
      </header>

      {/* Main Canvas Area */}
      <div 
        className={`flex-1 relative overflow-hidden ${drawingMode ? 'cursor-crosshair' : ''}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="absolute inset-0 origin-center transition-transform duration-75 ease-out will-change-transform"
          style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            cursor: (!drawingMode && isDragging) ? 'grabbing' : (!drawingMode ? 'grab' : 'crosshair')
          }}
        >
          <div ref={containerRef} className="relative w-[1200px] h-[800px] max-w-none max-h-none shadow-2xl mx-auto my-12 bg-bg-surface border border-border-color rounded-lg overflow-hidden">
            <img 
              src={bgImage} 
              alt="Blueprint" 
              className="w-full h-full object-cover opacity-60 pointer-events-none select-none"
              draggable="false"
            />
            
            {showZones && zones.map(renderZone)}

            {/* Drawing Preview Layer */}
            {drawingMode && isDrawing && drawingPoints.length > 0 && (
              <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none z-50">
                {drawingPoints.map((p, i) => (
                  <circle key={i} cx={`${p.x}%`} cy={`${p.y}%`} r="4" fill="white" className="drop-shadow-lg" />
                ))}
                
                {drawingShape === 'polygon' && drawingPoints.length > 1 && (
                  <polyline 
                    points={drawingPoints.map(p => `${p.x},${p.y}`).join(' ')} 
                    fill="none" 
                    stroke="white" 
                    strokeWidth="2" 
                    strokeDasharray="4"
                  />
                )}
              </svg>
            )}
            
            {drawingMode && isDrawing && drawingShape === 'polygon' && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg z-50 opacity-80 pointer-events-none">
                Klik titik awal untuk menutup polygon
              </div>
            )}
          </div>
        </div>

        {/* Toolbar (Top Center) */}
        <div className="toolbar absolute top-4 left-1/2 -translate-x-1/2 bg-bg-surface/90 backdrop-blur-md border border-border-color rounded-lg px-3 py-1.5 shadow-lg flex flex-row items-center gap-1 z-40">
          <span className="text-[10px] uppercase tracking-widest text-text-secondary font-bold mr-2">Controls</span>
          
          <button className="p-1.5 hover:bg-gray-700 rounded flex items-center justify-center text-text-secondary transition-colors" onClick={() => { if(!drawingMode) setZoom(z => Math.min(3, z + 0.2)) }} title="Zoom In (+)">
            <ZoomIn size={14} />
          </button>
          <button className="p-1.5 hover:bg-gray-700 rounded flex items-center justify-center text-text-secondary transition-colors" onClick={() => { if(!drawingMode) setZoom(z => Math.max(0.5, z - 0.2)) }} title="Zoom Out (-)">
            <ZoomOut size={14} />
          </button>
          <button className="p-1.5 hover:bg-gray-700 rounded flex items-center justify-center text-text-secondary transition-colors" onClick={() => { setRotation(0); setPan({x:0,y:0}); setZoom(1); }} title="Reset View (Panah Melingkar)">
            <RotateCw size={14} />
          </button>
          
          <div className="h-5 w-px bg-gray-700 mx-1"></div>
          
          <button className={`p-1.5 rounded transition-colors flex items-center justify-center ${drawingMode ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'hover:bg-gray-700 text-text-secondary'}`} 
            onClick={() => { setDrawingMode(!drawingMode); setIsDrawing(false); setDrawingPoints([]); }} title="Mode Drawing (On/Off)">
            <Power size={14} />
          </button>
          
          <select 
            className="bg-btn-secondary border border-gray-600 text-[11px] rounded px-1.5 py-1 text-text-secondary outline-none w-auto overflow-hidden text-center hover:bg-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mx-1" 
            title="Bentuk Overlay"
            value={drawingShape}
            onChange={(e) => { setDrawingShape(e.target.value); setIsDrawing(false); setDrawingPoints([]); }}
            disabled={!drawingMode}
          >
            <option value="rectangle">Kotak</option>
            <option value="circle">Lingkaran</option>
            <option value="polygon">Polygon</option>
          </select>
          
          <button className={`p-1.5 rounded transition-colors flex items-center justify-center ${drawingMode ? 'bg-blue-600/30 text-blue-400 hover:bg-blue-500/40 border border-blue-500/50' : 'opacity-50 cursor-not-allowed text-text-secondary'}`} 
            onClick={startDrawing} disabled={!drawingMode} title="Tambah Area/Section Baru (+)">
            <Plus size={14} />
          </button>

          <div className="h-5 w-px bg-gray-700 mx-1"></div>

          <button className={`p-1.5 rounded transition-colors flex items-center justify-center ${selectedZone ? 'hover:bg-gray-700 text-blue-400' : 'opacity-50 cursor-not-allowed text-text-secondary'}`} 
            onClick={openEditModal} disabled={!selectedZone || drawingMode} title="Edit Area Section (Pensil)">
            <Edit2 size={14} />
          </button>
          <button className={`p-1.5 rounded transition-colors flex items-center justify-center ${selectedZone ? 'hover:bg-red-500/20 text-red-400' : 'opacity-50 cursor-not-allowed text-text-secondary'}`} 
            onClick={handleDeleteZone} disabled={!selectedZone || drawingMode} title="Hapus Area Section (Tempat Sampah)">
            <Trash2 size={14} />
          </button>
          <button className="p-1.5 hover:bg-gray-700 rounded flex items-center justify-center text-text-secondary transition-colors" onClick={handleUploadBg} title="Ganti Layout Background">
            <ImageIcon size={14} />
          </button>
        </div>

        {/* Status Panel (Right) */}
        <div className="status-panel absolute top-4 right-4 w-64 bg-bg-surface/95 backdrop-blur-xl border border-border-color rounded-lg shadow-xl overflow-hidden z-40 flex flex-col max-h-[calc(100vh-80px)] transition-all duration-300">
          <div className="p-2.5 border-b border-border-color bg-black/20 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <List size={14} className="text-blue-400" />
              <h3 className="font-medium text-sm text-text-primary tracking-wide">Equipment Status</h3>
            </div>
            {selectedZone && (
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                Filtered
              </span>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-1.5 scrollbar-thin">
            <table className="w-full text-left text-[11px]">
              <thead className="text-[10px] text-text-secondary uppercase bg-black/10 sticky top-0">
                <tr>
                  <th className="px-2 py-1.5 font-medium">Nama Asset</th>
                  <th className="px-2 py-1.5 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {displayEquipments.slice(0, 5).map(eq => (
                  <tr key={eq.id} className="border-b border-border-color hover:bg-gray-700/30 transition-colors">
                    <td className="px-2 py-2 text-text-secondary truncate max-w-[120px]" title={eq.name}>
                      <a href={`/detail-equipment.html?id=${eq.id}`} className="hover:text-blue-400 transition-colors">{eq.name}</a>
                    </td>
                    <td className="px-2 py-2 text-right">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${getStatusColor(eq.status)}`}>
                        {eq.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {displayEquipments.length === 0 && (
                  <tr>
                    <td colSpan="2" className="text-center py-6 text-text-secondary text-[11px]">
                      Tidak ada data peralatan di zona ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {selectedZone && (
            <div className="p-2 border-t border-border-color bg-black/20 text-center">
              <a href={`/detail-equipment.html?zoneId=${selectedZone}`} className="text-[11px] text-blue-400 hover:text-blue-300 font-medium">Lihat Detail Equipment Area Ini &rarr;</a>
            </div>
          )}
        </div>
      </div>

      {/* Modals Container */}
      {(showSectionForm || showEditForm) && (
        <div className="modal-container fixed inset-0 bg-black/70 flex items-center justify-center z-[999] backdrop-blur-sm">
          {showSectionForm && (
            <div className="bg-[#1E242B] border border-gray-700 rounded-xl p-6 w-[400px]">
              <h3 className="text-lg font-bold mb-4">Tambah Section Baru</h3>
              <form onSubmit={handleSaveSection}>
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">Nama Section / Area</label>
                  <input type="text" name="sectionName" required className="w-full bg-[#12161A] border border-gray-600 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" placeholder="Contoh: Boiler Area" autoFocus />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => {setShowSectionForm(false); setDrawingPoints([]); setIsDrawing(false);}} className="px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-800 transition-colors">Batal</button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">Simpan Section</button>
                </div>
              </form>
            </div>
          )}
          
          {showEditForm && (
            <div className="bg-[#1E242B] border border-gray-700 rounded-xl p-6 w-[400px]">
              <h3 className="text-lg font-bold mb-4">Edit Section</h3>
              <form onSubmit={handleEditZoneSubmit}>
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-2">Nama Section / Area</label>
                  <input type="text" value={editZoneData.name} onChange={(e) => setEditZoneData({...editZoneData, name: e.target.value})} required className="w-full bg-[#12161A] border border-gray-600 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setShowEditForm(false)} className="px-4 py-2 rounded-lg text-gray-400 hover:bg-gray-800 transition-colors">Batal</button>
                  <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">Simpan Perubahan</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<LayoutArea />);
