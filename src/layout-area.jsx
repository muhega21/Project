import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { ZoomIn, ZoomOut, RotateCw, Map, Plus, List, Edit2, Trash2, Image as ImageIcon, X, AlertTriangle, Link, Unlink, Search } from 'lucide-react';

const STATUS_CONFIG = {
  Running:     { bg: 'rgba(34,197,94,0.15)',  text: '#22c55e', border: 'rgba(34,197,94,0.4)'  },
  Active:      { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6', border: 'rgba(59,130,246,0.4)' },
  Breakdown:   { bg: 'rgba(239,68,68,0.15)',  text: '#ef4444', border: 'rgba(239,68,68,0.4)'  },
  Maintenance: { bg: 'rgba(234,179,8,0.15)',  text: '#eab308', border: 'rgba(234,179,8,0.4)'  },
  Down:        { bg: 'rgba(239,68,68,0.15)',  text: '#ef4444', border: 'rgba(239,68,68,0.4)'  },
  Warning:     { bg: 'rgba(234,179,8,0.15)',  text: '#eab308', border: 'rgba(234,179,8,0.4)'  },
  Good:        { bg: 'rgba(34,197,94,0.15)',  text: '#22c55e', border: 'rgba(34,197,94,0.4)'  },
  Available:   { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6', border: 'rgba(59,130,246,0.4)' },
};
const getStatusStyle = (s) => STATUS_CONFIG[s] || { bg:'rgba(100,116,139,0.15)', text:'#64748b', border:'rgba(100,116,139,0.3)' };

// ── Load all real assets from localStorage ──────────────────────────────────
function loadAssets() {
  try {
    const raw = localStorage.getItem('maintainx_assets');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveAssets(assets) {
  try { localStorage.setItem('maintainx_assets', JSON.stringify(assets)); } catch {}
}

// ── Modal helpers ─────────────────────────────────────────────────────────
function CustomModal({ type, title, message, onConfirm, onCancel, confirmLabel = 'OK' }) {
  if (!type) return null;
  const isConfirm = type === 'confirm';
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, backdropFilter:'blur(4px)' }}>
      <div style={{ background:'#1A2028', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:'28px 32px', width:380, boxShadow:'0 25px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          <AlertTriangle size={22} style={{ color: isConfirm ? '#ef4444' : '#eab308', flexShrink:0 }} />
          <h3 style={{ margin:0, fontSize:'1rem', fontWeight:700, color:'#f1f5f9' }}>{title}</h3>
        </div>
        <p style={{ margin:'0 0 24px 34px', fontSize:'0.875rem', color:'#94a3b8', lineHeight:1.6 }}>{message}</p>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
          {isConfirm && <button onClick={onCancel} style={{ padding:'8px 18px', borderRadius:8, background:'transparent', border:'1px solid rgba(255,255,255,0.15)', color:'#94a3b8', cursor:'pointer', fontSize:'0.875rem' }}>Batal</button>}
          <button onClick={onConfirm} style={{ padding:'8px 18px', borderRadius:8, background: isConfirm ? '#ef4444' : '#3b82f6', border:'none', color:'white', cursor:'pointer', fontSize:'0.875rem', fontWeight:600 }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

// ── Assign Asset Modal ────────────────────────────────────────────────────
function AssignAssetModal({ plantCode, zoneId, zoneName, onClose, onAssigned, existingAssetIds }) {
  const [allAssets, setAllAssets] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const assets = loadAssets();
    // Show assets from this plant (plantCode match) OR unassigned assets
    const relevant = assets.filter(a =>
      (!a.plantCode || a.plantCode === plantCode) && !existingAssetIds.includes(a.id)
    );
    setAllAssets(relevant);
  }, [plantCode, existingAssetIds]);

  const filtered = allAssets.filter(a =>
    !search ||
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.id?.toLowerCase().includes(search.toLowerCase()) ||
    a.category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = (asset) => {
    const all = loadAssets();
    const updated = all.map(a =>
      a.id === asset.id
        ? { ...a, plantCode: plantCode, zoneId: zoneId }
        : a
    );
    saveAssets(updated);
    onAssigned(asset);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9998, backdropFilter:'blur(4px)' }}>
      <div style={{ background:'#1A2028', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, width:500, maxHeight:'80vh', display:'flex', flexDirection:'column', boxShadow:'0 25px 60px rgba(0,0,0,0.6)' }}>
        {/* Header */}
        <div style={{ padding:'18px 22px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ fontWeight:700, fontSize:'0.95rem', color:'#f1f5f9' }}>Tambah Asset ke Zone</div>
            <div style={{ fontSize:'0.75rem', color:'#64748b', marginTop:2 }}>Zone: <span style={{ color:'#60a5fa' }}>{zoneName}</span></div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer' }}><X size={18} /></button>
        </div>

        {/* Search */}
        <div style={{ padding:'12px 22px', borderBottom:'1px solid rgba(255,255,255,0.05)', flexShrink:0 }}>
          <div style={{ position:'relative' }}>
            <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#475569', pointerEvents:'none' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari asset (nama, ID, kategori)..."
              autoFocus
              style={{ width:'100%', background:'rgba(0,0,0,0.3)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'7px 10px 7px 30px', color:'white', fontSize:'0.82rem', outline:'none', boxSizing:'border-box' }}
            />
          </div>
        </div>

        {/* List */}
        <div style={{ flex:1, overflowY:'auto', padding:'8px 0' }}>
          {filtered.length === 0 ? (
            <div style={{ padding:'32px 22px', textAlign:'center', color:'#475569', fontSize:'0.82rem' }}>
              {allAssets.length === 0
                ? 'Tidak ada asset yang terdaftar. Tambah asset terlebih dahulu di menu Data Asset.'
                : 'Tidak ada asset yang cocok dengan pencarian.'}
            </div>
          ) : filtered.map(asset => {
            const st = getStatusStyle(asset.status || asset.kondisi);
            return (
              <div key={asset.id}
                style={{ padding:'10px 22px', borderBottom:'1px solid rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', transition:'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:'0.7rem', color:'#60a5fa', fontFamily:'monospace', flexShrink:0 }}>{asset.id}</span>
                    <span style={{ fontSize:'0.82rem', fontWeight:600, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{asset.name || asset.namaAsset}</span>
                  </div>
                  <div style={{ fontSize:'0.7rem', color:'#475569', marginTop:2 }}>
                    {asset.category || asset.kategori || 'Tidak berkategori'}
                    {asset.plantCode && <span style={{ marginLeft:8, color:'#334155' }}>• {asset.plantCode}</span>}
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                  <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:4, fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', background:st.bg, color:st.text, border:`1px solid ${st.border}` }}>
                    {asset.status || asset.kondisi || 'N/A'}
                  </span>
                  <button
                    onClick={() => handleAssign(asset)}
                    style={{ padding:'5px 12px', borderRadius:7, background:'rgba(59,130,246,0.2)', border:'1px solid rgba(59,130,246,0.4)', color:'#60a5fa', cursor:'pointer', fontSize:'0.75rem', fontWeight:600, whiteSpace:'nowrap' }}
                  >
                    + Tambahkan
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding:'12px 22px', borderTop:'1px solid rgba(255,255,255,0.08)', flexShrink:0, textAlign:'right' }}>
          <button onClick={onClose} style={{ padding:'7px 18px', borderRadius:8, background:'transparent', border:'1px solid rgba(255,255,255,0.15)', color:'#94a3b8', cursor:'pointer', fontSize:'0.875rem' }}>Tutup</button>
        </div>
      </div>
    </div>
  );
}

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <button onClick={() => onChange(!checked)} title={label} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', padding:'4px 6px', borderRadius:6 }}>
      {label && <span style={{ fontSize:10, color: checked ? '#4ade80' : '#64748b', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</span>}
      <div style={{ width:34, height:18, borderRadius:9, background: checked ? 'rgba(74,222,128,0.3)' : 'rgba(100,116,139,0.3)', border: checked ? '1px solid rgba(74,222,128,0.6)' : '1px solid rgba(100,116,139,0.4)', position:'relative', transition:'all 0.25s ease', flexShrink:0 }}>
        <div style={{ width:12, height:12, borderRadius:'50%', background: checked ? '#4ade80' : '#64748b', position:'absolute', top:2, left: checked ? 18 : 2, transition:'left 0.25s ease, background 0.25s ease', boxShadow: checked ? '0 0 6px rgba(74,222,128,0.8)' : 'none' }} />
      </div>
    </button>
  );
}

function LayoutArea() {
  const [plant, setPlant]       = useState({ name: 'Unknown Area', code: '' });
  const [zoom, setZoom]         = useState(1);
  const [rotation]              = useState(0);
  const [pan, setPan]           = useState({ x: 0, y: 0 });
  const [showZones, setShowZones] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);
  const [zones, setZones]       = useState([]);
  const [bgImage, setBgImage]   = useState(null);
  const [drawingMode, setDrawingMode]   = useState(false);
  const [drawingShape, setDrawingShape] = useState('rectangle');
  const [isDrawing, setIsDrawing]       = useState(false);
  const [drawingPoints, setDrawingPoints] = useState([]);
  const [livePreview, setLivePreview]   = useState(null);
  const [showSectionForm, setShowSectionForm] = useState(false);
  const [showEditForm, setShowEditForm]       = useState(false);
  const [editZoneData, setEditZoneData] = useState({ name: '' });
  const [modal, setModal] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ w: 1600, h: 900 });

  // ── Real asset integration ────────────────────────────────────────────
  const [assets, setAssets] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assetRefresh, setAssetRefresh] = useState(0); // trigger re-read

  const dragRef      = useRef({ active:false, startX:0, startY:0, panX:0, panY:0, moved:false });
  const containerRef = useRef(null);
  const wrapperRef   = useRef(null);

  // Load plant info + zones
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (!code) return;
    const saved = localStorage.getItem('maintainx_plants');
    if (saved) {
      try {
        const plants = JSON.parse(saved);
        const found = plants.find(p => p.code === code);
        if (found) { setPlant(found); if (found.bgImage) setBgImage(found.bgImage); }
      } catch {}
    }
    const savedZones = localStorage.getItem('maintainx_zones_' + code);
    if (savedZones) { try { setZones(JSON.parse(savedZones)); } catch {} }
  }, []);

  // Load assets whenever plant code or assetRefresh changes
  useEffect(() => {
    if (!plant.code) return;
    setAssets(loadAssets());
  }, [plant.code, assetRefresh]);

  useEffect(() => {
    if (!wrapperRef.current) return;
    const w = wrapperRef.current.offsetWidth;
    const h = wrapperRef.current.offsetHeight;
    setPan({ x: (w - canvasSize.w) / 2, y: Math.max(20, (h - canvasSize.h) / 2) });
  }, [canvasSize]);

  const saveZones = useCallback((newZones) => {
    setZones(newZones);
    if (plant.code) localStorage.setItem('maintainx_zones_' + plant.code, JSON.stringify(newZones));
  }, [plant.code]);

  // ── Get assets in a specific zone ──────────────────────────────────────
  const getZoneAssets = (zoneId) =>
    assets.filter(a => a.zoneId === zoneId && a.plantCode === plant.code);

  // ── Unlink asset from zone ────────────────────────────────────────────
  const handleUnlinkAsset = (assetId) => {
    const all = loadAssets();
    const updated = all.map(a => a.id === assetId ? { ...a, zoneId: null } : a);
    saveAssets(updated);
    setAssetRefresh(r => r + 1);
  };

  const handleWheel = (e) => { e.preventDefault(); if (drawingMode) return; setZoom(z => Math.min(Math.max(0.3, z + -e.deltaY * 0.001))); };

  const handleMouseDown = (e) => {
    if (e.target.closest('.toolbar') || e.target.closest('.status-panel') || e.target.closest('.modal-container')) return;
    if (drawingMode && isDrawing && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      if (drawingShape === 'rectangle' || drawingShape === 'circle') {
        if (drawingPoints.length === 0) { setDrawingPoints([{ x, y }]); }
        else if (drawingPoints.length === 1) { setDrawingPoints(prev => [...prev, { x, y }]); setShowSectionForm(true); setLivePreview(null); }
      } else if (drawingShape === 'polygon') {
        if (drawingPoints.length > 2) {
          const first = drawingPoints[0];
          if (Math.sqrt((x-first.x)**2+(y-first.y)**2) < 3) { setShowSectionForm(true); setLivePreview(null); return; }
        }
        setDrawingPoints(prev => [...prev, { x, y }]);
      }
      return;
    }
    if (!drawingMode) { dragRef.current = { active:true, startX:e.clientX, startY:e.clientY, panX:pan.x, panY:pan.y, moved:false }; }
  };

  const handleMouseMove = (e) => {
    const d = dragRef.current;
    if (d.active) {
      const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
      if (!d.moved && Math.sqrt(dx**2+dy**2) > 4) d.moved = true;
      if (d.moved) setPan({ x: d.panX + dx, y: d.panY + dy });
    }
    if (drawingMode && isDrawing && drawingPoints.length > 0 && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setLivePreview({ x: ((e.clientX-rect.left)/rect.width)*100, y: ((e.clientY-rect.top)/rect.height)*100 });
    }
  };

  const handleMouseUp = () => { dragRef.current.active = false; };
  const handleCanvasClick = (e) => {
    if (dragRef.current.moved) return;
    if (!e.target.closest('.zone-overlay') && !drawingMode) setSelectedZone(null);
  };

  const handleZoneClick = (zone, e) => { e.stopPropagation(); if (drawingMode) return; setSelectedZone(prev => prev === zone.id ? null : zone.id); };

  const handleUploadBg = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0]; if (!file) return;
      if (file.size > 30*1024*1024) { setModal({ type:'alert', title:'File Terlalu Besar', message:'Ukuran gambar melebihi 30 MB. Harap pilih gambar yang lebih kecil.', onConfirm:()=>setModal(null) }); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        const img = new Image();
        img.onload = () => {
          setCanvasSize({ w: img.naturalWidth, h: img.naturalHeight });
          setBgImage(dataUrl);
          // Persist bgImage to plant in localStorage
          try {
            const raw = localStorage.getItem('maintainx_plants');
            if (raw) {
              const plants = JSON.parse(raw);
              const idx = plants.findIndex(p => p.code === plant.code);
              if (idx !== -1) { plants[idx].bgImage = dataUrl; localStorage.setItem('maintainx_plants', JSON.stringify(plants)); }
            }
          } catch {}
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleDeleteZone = () => {
    if (!selectedZone) return;
    const zone = zones.find(z => z.id === selectedZone);
    setModal({ type:'confirm', title:'Hapus Area?',
      message: `Apakah Anda yakin ingin menghapus area "${zone?.name || ''}"? Asset yang terhubung ke area ini akan dilepas.`,
      onConfirm: () => {
        // Unlink all assets in this zone
        const all = loadAssets();
        const updated = all.map(a => a.zoneId === selectedZone ? { ...a, zoneId: null } : a);
        saveAssets(updated);
        setAssetRefresh(r => r + 1);
        saveZones(zones.filter(z => z.id !== selectedZone));
        setSelectedZone(null);
        setModal(null);
      }
    });
  };

  const startDrawing = () => { if (drawingMode) { setIsDrawing(true); setDrawingPoints([]); setLivePreview(null); } };

  const handleSaveSection = (e) => {
    e.preventDefault();
    const name = new FormData(e.target).get('sectionName');
    let newZone = { id:'z_'+Date.now(), name, type:drawingShape, color:'hsla('+Math.floor(Math.random()*360)+',70%,55%,0.45)' };
    if (drawingShape === 'rectangle') { const x1=Math.min(drawingPoints[0].x,drawingPoints[1].x),y1=Math.min(drawingPoints[0].y,drawingPoints[1].y); newZone.rect={top:y1,left:x1,width:Math.abs(drawingPoints[0].x-drawingPoints[1].x),height:Math.abs(drawingPoints[0].y-drawingPoints[1].y)}; }
    else if (drawingShape === 'circle') { const c=drawingPoints[0],edge=drawingPoints[1]; newZone.circle={cx:c.x,cy:c.y,r:Math.sqrt((c.x-edge.x)**2+(c.y-edge.y)**2)}; }
    else if (drawingShape === 'polygon') { newZone.points=[...drawingPoints]; }
    saveZones([...zones, newZone]);
    setShowSectionForm(false); setDrawingPoints([]); setIsDrawing(false); setLivePreview(null);
  };

  const handleEditZoneSubmit = (e) => { e.preventDefault(); saveZones(zones.map(z => z.id===selectedZone ? {...z, name:editZoneData.name} : z)); setShowEditForm(false); };
  const openEditModal = () => { if (!selectedZone) return; const z=zones.find(z=>z.id===selectedZone); setEditZoneData({name:z.name}); setShowEditForm(true); };

  const renderZone = (zone) => {
    const isSel = selectedZone === zone.id;
    const zoneAssetCount = getZoneAssets(zone.id).length;
    const base = { backgroundColor:zone.color, borderColor: isSel ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)', borderWidth: isSel ? 3 : 1.5, borderStyle:'solid', zIndex: isSel ? 20 : 10, cursor: drawingMode ? 'crosshair' : 'pointer', transform: isSel ? 'scale(1.015)' : 'scale(1)', transition:'all 0.2s ease', position:'absolute', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(1px)', overflow:'hidden', boxShadow: isSel ? '0 0 0 3px rgba(255,255,255,0.15)' : 'none' };
    const label = (
      <div style={{ background:'rgba(0,0,0,0.65)', padding:'3px 8px', borderRadius:4, maxWidth:'90%', overflow:'hidden', display:'flex', alignItems:'center', gap:5, pointerEvents:'none' }}>
        <span style={{ whiteSpace:'nowrap', textOverflow:'ellipsis', overflow:'hidden', fontSize:'clamp(9px,1.8cqw,13px)', fontWeight:700, color:'#fff', letterSpacing:'0.04em' }}>{zone.name}</span>
        {zoneAssetCount > 0 && (
          <span style={{ background:'rgba(59,130,246,0.5)', border:'1px solid rgba(59,130,246,0.6)', color:'#93c5fd', borderRadius:3, padding:'0 5px', fontSize:'clamp(7px,1.2cqw,10px)', fontWeight:700, flexShrink:0 }}>{zoneAssetCount}</span>
        )}
      </div>
    );
    if (zone.type === 'rectangle' || !zone.type) return <div key={zone.id} className="zone-overlay" style={{...base, top:`${zone.rect.top}%`, left:`${zone.rect.left}%`, width:`${zone.rect.width}%`, height:`${zone.rect.height}%`}} onClick={(e)=>handleZoneClick(zone,e)}>{label}</div>;
    if (zone.type === 'circle') return <div key={zone.id} className="zone-overlay" style={{...base, borderRadius:'50%', top:`${zone.circle.cy-zone.circle.r}%`, left:`${zone.circle.cx-zone.circle.r}%`, width:`${zone.circle.r*2}%`, height:`${zone.circle.r*2}%`}} onClick={(e)=>handleZoneClick(zone,e)}>{label}</div>;
    if (zone.type === 'polygon') { const minX=Math.min(...zone.points.map(p=>p.x)),minY=Math.min(...zone.points.map(p=>p.y)); return <div key={zone.id} className="zone-overlay" style={{position:'absolute',inset:0,zIndex: isSel?20:10}} onClick={(e)=>handleZoneClick(zone,e)}><svg width="100%" height="100%" style={{position:'absolute',inset:0,pointerEvents:'none'}}><polygon points={zone.points.map(p=>`${p.x},${p.y}`).join(' ')} fill={zone.color} stroke={isSel?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.25)'} strokeWidth={isSel?3:1.5}/></svg><div style={{position:'absolute',left:`${minX}%`,top:`${minY}%`,transform:'translate(0,-22px)',pointerEvents:'none'}}>{label}</div></div>; }
  };

  const renderLivePreview = () => {
    if (!livePreview || drawingPoints.length === 0) return null;
    const p0 = drawingPoints[0];
    const previewStyle = { position:'absolute', border:'2px dashed rgba(99,179,237,0.9)', background:'rgba(99,179,237,0.12)', pointerEvents:'none', zIndex:60 };
    if (drawingShape === 'rectangle' && drawingPoints.length === 1) { const x=Math.min(p0.x,livePreview.x),y=Math.min(p0.y,livePreview.y); return <div style={{...previewStyle, top:`${y}%`, left:`${x}%`, width:`${Math.abs(p0.x-livePreview.x)}%`, height:`${Math.abs(p0.y-livePreview.y)}%`, borderRadius:3}} />; }
    if (drawingShape === 'circle' && drawingPoints.length === 1) { const r=Math.sqrt((p0.x-livePreview.x)**2+(p0.y-livePreview.y)**2); return <div style={{...previewStyle, top:`${p0.y-r}%`, left:`${p0.x-r}%`, width:`${r*2}%`, height:`${r*2}%`, borderRadius:'50%'}} />; }
    if (drawingShape === 'polygon') { return <svg width="100%" height="100%" style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:60}}><polygon points={[...drawingPoints,livePreview].map(p=>`${p.x},${p.y}`).join(' ')} fill="rgba(99,179,237,0.12)" stroke="rgba(99,179,237,0.9)" strokeWidth="2" strokeDasharray="5,3"/></svg>; }
    return null;
  };

  const panelEquipments = selectedZone ? getZoneAssets(selectedZone) : [];
  const selectedZoneObj = selectedZone ? zones.find(z => z.id === selectedZone) : null;
  const btnBase = { padding:'5px 6px', borderRadius:7, background:'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', transition:'all 0.15s' };

  return (
    <div style={{ height:'100%', width:'100%', background:'var(--bg-color)', color:'var(--text-primary)', display:'flex', flexDirection:'column', position:'relative', overflow:'hidden', fontFamily:"'Outfit',sans-serif" }}>
      <header style={{ flexShrink:0, background:'var(--bg-surface)', borderBottom:'1px solid var(--border-color)', padding:'10px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', zIndex:50, boxShadow:'0 1px 4px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Map size={17} style={{ color:'#3b82f6' }} />
          <div>
            <div style={{ fontWeight:700, fontSize:'0.95rem' }}>{plant.name}</div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)', fontFamily:'monospace' }}>Code: {plant.code}</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {/* Asset count badge for this plant */}
          {plant.code && (() => {
            const cnt = assets.filter(a => a.plantCode === plant.code).length;
            return cnt > 0 ? (
              <span style={{ fontSize:'0.75rem', padding:'3px 10px', background:'rgba(59,130,246,0.12)', border:'1px solid rgba(59,130,246,0.25)', borderRadius:6, color:'#60a5fa' }}>
                {cnt} Asset{cnt !== 1 ? 's' : ''}
              </span>
            ) : null;
          })()}
          <a href="/asset-register.html" style={{ fontSize:'0.8rem', padding:'6px 14px', background:'rgba(255,255,255,0.06)', border:'1px solid var(--border-color)', borderRadius:8, color:'var(--text-secondary)', textDecoration:'none' }}>← Kembali</a>
        </div>
      </header>

      <div ref={wrapperRef} style={{ flex:1, position:'relative', overflow:'hidden', cursor: drawingMode ? 'crosshair' : 'grab' }}
        onWheel={handleWheel} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onClick={handleCanvasClick}>
        <div style={{ position:'absolute', inset:0, willChange:'transform', transform:`translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`, transformOrigin:'0 0', transition:'none' }}>
          <div ref={containerRef} style={{ position:'relative', width:canvasSize.w, height:canvasSize.h, borderRadius:12, overflow:'hidden', border:'1px solid var(--border-color)', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}>
            {bgImage
              ? <img src={bgImage} alt="Layout" style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.7, pointerEvents:'none', userSelect:'none', display:'block' }} draggable={false} />
              : <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)', gap:16 }}>
                  <ImageIcon size={48} style={{ color:'rgba(255,255,255,0.15)' }} />
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontSize:'1rem', fontWeight:600, color:'rgba(255,255,255,0.4)' }}>Belum ada gambar layout</div>
                    <div style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.2)', marginTop:6 }}>Klik ikon gambar di toolbar untuk mengunggah gambar denah area</div>
                  </div>
                </div>}
            {showZones && zones.map(renderZone)}
            {drawingMode && isDrawing && renderLivePreview()}
            {drawingMode && isDrawing && drawingPoints.length > 0 && <svg width="100%" height="100%" style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:61}}>{drawingPoints.map((p,i)=><circle key={i} cx={`${p.x}%`} cy={`${p.y}%`} r="5" fill="white" stroke="rgba(99,179,237,0.8)" strokeWidth="2"/>)}</svg>}
            {drawingMode && isDrawing && drawingShape === 'polygon' && drawingPoints.length > 2 && <div style={{position:'absolute',top:14,left:'50%',transform:'translateX(-50%)',background:'rgba(37,99,235,0.85)',color:'white',padding:'6px 16px',borderRadius:8,fontSize:'0.8rem',fontWeight:600,zIndex:70,pointerEvents:'none'}}>Klik titik awal untuk menutup polygon</div>}
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="toolbar" style={{ position:'absolute', top:14, left:'50%', transform:'translateX(-50%)', background:'rgba(15,23,42,0.92)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'6px 12px', boxShadow:'0 8px 32px rgba(0,0,0,0.4)', display:'flex', alignItems:'center', gap:4, zIndex:40, whiteSpace:'nowrap' }}>
          <span style={{ fontSize:9, color:'#475569', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginRight:4 }}>Controls</span>
          {[{icon:<ZoomIn size={13}/>,act:()=>setZoom(z=>Math.min(5,z+0.2)),tip:'Zoom In'},{icon:<ZoomOut size={13}/>,act:()=>setZoom(z=>Math.max(0.1,z-0.2)),tip:'Zoom Out'},{icon:<RotateCw size={13}/>,act:()=>{setZoom(1);if(wrapperRef.current){const vw=wrapperRef.current.offsetWidth,vh=wrapperRef.current.offsetHeight;setPan({x:(vw-canvasSize.w)/2,y:Math.max(20,(vh-canvasSize.h)/2)});}},tip:'Reset'}].map((b,i)=>(
            <button key={i} onClick={b.act} title={b.tip} style={{...btnBase, color:'#64748b'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.08)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>{b.icon}</button>
          ))}
          <div style={{ width:1, height:18, background:'rgba(255,255,255,0.1)', margin:'0 4px' }} />
          <ToggleSwitch checked={showZones} onChange={setShowZones} label="Zones" />
          <div style={{ width:1, height:18, background:'rgba(255,255,255,0.1)', margin:'0 4px' }} />
          <ToggleSwitch checked={drawingMode} onChange={(v)=>{setDrawingMode(v);setIsDrawing(false);setDrawingPoints([]);setLivePreview(null);}} label="Draw" />
          <select disabled={!drawingMode} value={drawingShape} onChange={e=>{setDrawingShape(e.target.value);setIsDrawing(false);setDrawingPoints([]);setLivePreview(null);}} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color: drawingMode?'#94a3b8':'#374151', borderRadius:6, padding:'3px 6px', fontSize:11, cursor: drawingMode?'pointer':'not-allowed', outline:'none' }}>
            <option value="rectangle">Kotak</option>
            <option value="circle">Lingkaran</option>
            <option value="polygon">Polygon</option>
          </select>
          <button disabled={!drawingMode} onClick={startDrawing} style={{ padding:'4px 8px', borderRadius:7, background: drawingMode?'rgba(59,130,246,0.25)':'transparent', border: drawingMode?'1px solid rgba(59,130,246,0.5)':'1px solid transparent', color: drawingMode?'#60a5fa':'#374151', cursor: drawingMode?'pointer':'not-allowed', display:'flex', alignItems:'center', gap:4, fontSize:11 }}>
            <Plus size={12}/>Tambah
          </button>
          <div style={{ width:1, height:18, background:'rgba(255,255,255,0.1)', margin:'0 4px' }} />
          <button disabled={!selectedZone||drawingMode} onClick={openEditModal} style={{...btnBase, color: selectedZone?'#60a5fa':'#374151', cursor: selectedZone?'pointer':'not-allowed'}}><Edit2 size={13}/></button>
          <button disabled={!selectedZone||drawingMode} onClick={handleDeleteZone} style={{...btnBase, color: selectedZone?'#f87171':'#374151', cursor: selectedZone?'pointer':'not-allowed'}}><Trash2 size={13}/></button>
          <button onClick={handleUploadBg} style={{...btnBase, color:'#64748b'}} onMouseEnter={e=>e.currentTarget.style.color='#94a3b8'} onMouseLeave={e=>e.currentTarget.style.color='#64748b'}><ImageIcon size={13}/></button>
          <div style={{ fontSize:10, color:'#475569', fontFamily:'monospace', marginLeft:4, minWidth:36 }}>{Math.round(zoom*100)}%</div>
        </div>

        {/* EQUIPMENT / ASSET PANEL */}
        {selectedZone && selectedZoneObj && (
          <div className="status-panel" style={{ position:'absolute', top:14, right:14, width:320, background:'rgba(15,23,42,0.96)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, boxShadow:'0 12px 40px rgba(0,0,0,0.5)', zIndex:40, display:'flex', flexDirection:'column', maxHeight:'calc(100% - 40px)', overflow:'hidden' }}>
            {/* Panel Header */}
            <div style={{ padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <List size={13} style={{ color:'#3b82f6' }} />
                <span style={{ fontSize:'0.8rem', fontWeight:600, color:'#f1f5f9' }}>{selectedZoneObj.name}</span>
                <span style={{ fontSize:10, padding:'2px 7px', background:'rgba(59,130,246,0.15)', color:'#60a5fa', border:'1px solid rgba(59,130,246,0.3)', borderRadius:4 }}>{panelEquipments.length}</span>
              </div>
              <button onClick={()=>setSelectedZone(null)} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', display:'flex', padding:2 }}><X size={13}/></button>
            </div>

            {/* Asset List */}
            <div style={{ flex:1, overflowY:'auto' }}>
              {panelEquipments.length === 0 ? (
                <div style={{ padding:'20px 16px', textAlign:'center' }}>
                  <div style={{ color:'#475569', fontSize:'0.78rem', marginBottom:8 }}>Belum ada asset di area ini.</div>
                  <div style={{ fontSize:'0.7rem', color:'#334155' }}>Klik "+ Tambah Asset" untuk mengaitkan asset ke area ini.</div>
                </div>
              ) : (
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.75rem' }}>
                  <thead>
                    <tr style={{ background:'rgba(0,0,0,0.3)' }}>
                      {['ID','Nama Asset','Status'].map(h=><th key={h} style={{ padding:'7px 10px', fontSize:'0.65rem', color:'#475569', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>)}
                      <th style={{ padding:'7px 6px', width:32 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {panelEquipments.map(eq => {
                      const statusVal = eq.status || eq.kondisi || 'N/A';
                      const st = getStatusStyle(statusVal);
                      return (
                        <tr key={eq.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.05)' }}
                          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.04)'}
                          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                          <td style={{ padding:'7px 10px', color:'#60a5fa', fontFamily:'monospace', fontSize:'0.68rem', whiteSpace:'nowrap' }}>{eq.id}</td>
                          <td style={{ padding:'7px 10px', color:'#cbd5e1', maxWidth:90, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={eq.name || eq.namaAsset}>{eq.name || eq.namaAsset}</td>
                          <td style={{ padding:'7px 10px' }}>
                            <span style={{ display:'inline-block', padding:'2px 6px', borderRadius:4, fontSize:'0.62rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', background:st.bg, color:st.text, border:`1px solid ${st.border}` }}>{statusVal}</span>
                          </td>
                          <td style={{ padding:'7px 6px', textAlign:'center' }}>
                            <button
                              onClick={() => setModal({ type:'confirm', title:'Lepas Asset dari Zone?', message:`Asset "${eq.name || eq.namaAsset}" akan dilepas dari area ini.`, onConfirm:()=>{ handleUnlinkAsset(eq.id); setModal(null); } })}
                              title="Lepas dari Zone"
                              style={{ background:'none', border:'none', color:'#475569', cursor:'pointer', padding:2, display:'flex', alignItems:'center' }}
                              onMouseEnter={e=>e.currentTarget.style.color='#f87171'}
                              onMouseLeave={e=>e.currentTarget.style.color='#475569'}
                            >
                              <Unlink size={11}/>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Panel Footer */}
            <div style={{ padding:'8px 14px', borderTop:'1px solid rgba(255,255,255,0.07)', display:'flex', gap:8, flexShrink:0 }}>
              <button
                onClick={() => setShowAssignModal(true)}
                style={{ flex:1, padding:'6px 10px', borderRadius:7, background:'rgba(59,130,246,0.2)', border:'1px solid rgba(59,130,246,0.4)', color:'#60a5fa', cursor:'pointer', fontSize:'0.75rem', fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}
              >
                <Link size={12}/> Tambah Asset
              </button>
              {panelEquipments.length > 0 && (
                <a href={`/detail-equipment.html?zoneId=${selectedZone}&plantCode=${plant.code}`}
                  style={{ padding:'6px 10px', borderRadius:7, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', fontSize:'0.72rem', textDecoration:'none', display:'flex', alignItems:'center', whiteSpace:'nowrap' }}>
                  Detail →
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* FORM MODALS */}
      {(showSectionForm || showEditForm) && (
        <div className="modal-container" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, backdropFilter:'blur(4px)' }}>
          {showSectionForm && (
            <div style={{ background:'#1A2028', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:'28px 32px', width:420, boxShadow:'0 25px 60px rgba(0,0,0,0.6)' }}>
              <h3 style={{ margin:'0 0 20px', fontSize:'1rem', fontWeight:700 }}>Tambah Section / Area</h3>
              <form onSubmit={handleSaveSection}>
                <label style={{ display:'block', fontSize:'0.82rem', color:'#94a3b8', marginBottom:6 }}>Nama Section / Area <span style={{ color:'#ef4444' }}>*</span></label>
                <input type="text" name="sectionName" required autoFocus style={{ width:'100%', background:'#0f172a', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, padding:'9px 12px', color:'white', fontSize:'0.9rem', outline:'none', boxSizing:'border-box' }} placeholder="Contoh: Boiler Area" />
                <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:24 }}>
                  <button type="button" onClick={()=>{setShowSectionForm(false);setDrawingPoints([]);setIsDrawing(false);setLivePreview(null);}} style={{ padding:'8px 18px', borderRadius:8, background:'transparent', border:'1px solid rgba(255,255,255,0.12)', color:'#94a3b8', cursor:'pointer' }}>Batal</button>
                  <button type="submit" style={{ padding:'8px 18px', borderRadius:8, background:'#2563eb', border:'none', color:'white', fontWeight:600, cursor:'pointer' }}>Simpan Section</button>
                </div>
              </form>
            </div>
          )}
          {showEditForm && (
            <div style={{ background:'#1A2028', border:'1px solid rgba(255,255,255,0.1)', borderRadius:16, padding:'28px 32px', width:420, boxShadow:'0 25px 60px rgba(0,0,0,0.6)' }}>
              <h3 style={{ margin:'0 0 20px', fontSize:'1rem', fontWeight:700 }}>Edit Section</h3>
              <form onSubmit={handleEditZoneSubmit}>
                <label style={{ display:'block', fontSize:'0.82rem', color:'#94a3b8', marginBottom:6 }}>Nama Section / Area</label>
                <input type="text" value={editZoneData.name} onChange={e=>setEditZoneData({name:e.target.value})} required style={{ width:'100%', background:'#0f172a', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, padding:'9px 12px', color:'white', fontSize:'0.9rem', outline:'none', boxSizing:'border-box' }} />
                <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:24 }}>
                  <button type="button" onClick={()=>setShowEditForm(false)} style={{ padding:'8px 18px', borderRadius:8, background:'transparent', border:'1px solid rgba(255,255,255,0.12)', color:'#94a3b8', cursor:'pointer' }}>Batal</button>
                  <button type="submit" style={{ padding:'8px 18px', borderRadius:8, background:'#2563eb', border:'none', color:'white', fontWeight:600, cursor:'pointer' }}>Simpan Perubahan</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ASSIGN ASSET MODAL */}
      {showAssignModal && selectedZoneObj && (
        <AssignAssetModal
          plantCode={plant.code}
          zoneId={selectedZone}
          zoneName={selectedZoneObj.name}
          existingAssetIds={panelEquipments.map(a => a.id)}
          onClose={() => setShowAssignModal(false)}
          onAssigned={(asset) => {
            setAssetRefresh(r => r + 1);
            // Keep modal open so user can add more assets
          }}
        />
      )}

      {modal && <CustomModal type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} onCancel={()=>setModal(null)} confirmLabel={modal.type==='confirm'?'Ya, Hapus':'OK'} />}
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<LayoutArea />);
