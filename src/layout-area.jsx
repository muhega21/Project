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

// ── IndexedDB Helper for Large Images ───────────────────────────────────────
const DB_NAME = 'MaintainXDB';
const STORE_NAME = 'LayoutImages';

function saveLayoutImageToDB(code, dataUrl) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(dataUrl, code);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  });
}

function getLayoutImageFromDB(code) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(code);
      getReq.onsuccess = () => resolve(getReq.result);
      getReq.onerror = () => reject(getReq.error);
    };
    request.onerror = () => reject(request.error);
  });
}

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

// ── Add New Asset Modal (create asset directly) ──────────────────────────────
function AddNewAssetModal({ plantCode, zoneId, zoneName, onClose, onSaved }) {
  const [newAssetId, setNewAssetId] = useState('EQU-' + Math.floor(Math.random() * 100000).toString().padStart(5, '0'));
  const [kondisiEquipment, setKondisiEquipment] = useState('Baik');
  const [uploadedImage, setUploadedImage] = useState(null);

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
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setUploadedImage(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
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
      zoneId: zoneId || '',
      plantCode: plantCode || ''
    };
    
    if (!assetData.id.trim() || !assetData.name.trim()) {
      alert('ID dan Nama Equipment wajib diisi.');
      return;
    }

    const stored = JSON.parse(localStorage.getItem('maintainx_assets')) || [];
    if (stored.find(a => a.id === assetData.id)) {
      alert('ID Equipment sudah digunakan.');
      return;
    }

    stored.push(assetData);
    
    try {
      localStorage.setItem('maintainx_assets', JSON.stringify(stored));
      alert('Equipment berhasil ditambahkan!');
      onSaved(assetData);
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan. Kapasitas penyimpanan lokal browser penuh. Coba gunakan gambar yang lebih kecil.');
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="bg-[#1A2028] border border-gray-700/50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50 bg-[#12161A]">
          <div>
            <h3 className="text-xl font-bold text-white">Tambah Equipment</h3>
            <div className="text-xs text-gray-400 mt-1">Area/Zone: <span className="text-blue-400">{zoneName}</span></div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden text-left">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col lg:flex-row gap-8">
              
              {/* Left Column - Image */}
              <div className="w-full lg:w-1/3 flex flex-col gap-4">
                <label htmlFor="upload-eq-image" className="w-full aspect-square bg-[#12161A] border-2 border-dashed border-gray-700/50 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors cursor-pointer group overflow-hidden relative">
                  {uploadedImage ? (
                    <img src={uploadedImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <ImageIcon size={48} className="mb-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                      <span className="font-medium">Upload Gambar</span>
                      <span className="text-xs mt-2 opacity-50">JPG, PNG max 5MB</span>
                    </>
                  )}
                  <input type="file" id="upload-eq-image" accept="image/jpeg, image/png" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              
              {/* Right Column - Form */}
              <div className="w-full lg:w-2/3 flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-400">ID Equipment</label>
                    <input type="text" id="form-eq-id" readOnly value={newAssetId} className="bg-black/50 border border-gray-700/50 text-gray-400 px-4 py-2.5 rounded-lg cursor-not-allowed outline-none w-full" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-400">Nama Equipment</label>
                    <input type="text" id="form-eq-name" required placeholder="Contoh: BOILER TUBE A" className="bg-[#12161A] border border-gray-700/50 text-white px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 w-full" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-400">Klasifikasi Equipment</label>
                    <input type="text" id="form-eq-category" required placeholder="Contoh: Heavy Machinery" className="bg-[#12161A] border border-gray-700/50 text-white px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 w-full" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-400">Tipe Equipment</label>
                    <input type="text" id="form-eq-type" required placeholder="Contoh: Boiler Component" className="bg-[#12161A] border border-gray-700/50 text-white px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 w-full" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-400">Lokasi / Ruangan</label>
                    <input type="text" id="form-eq-location" placeholder="Contoh: Boiler Room Lt. 1" className="bg-[#12161A] border border-gray-700/50 text-white px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 w-full" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-400">Kondisi Equipment</label>
                    <select id="form-eq-kondisi" required value={kondisiEquipment} onChange={(e) => setKondisiEquipment(e.target.value)} className="bg-[#12161A] border border-gray-700/50 text-white px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 appearance-none cursor-pointer w-full">
                      <option value="Baik">Baik</option>
                      <option value="Rusak">Rusak</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-400">Status Operasional</label>
                  <select id="form-eq-status" required className="bg-[#12161A] border border-gray-700/50 text-white px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 appearance-none cursor-pointer w-full">
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
                <div className="flex flex-col gap-1.5 flex-1 mt-2">
                  <label className="text-sm font-medium text-gray-400">Informasi / Spesifikasi</label>
                  <textarea id="form-eq-spec" placeholder="Tuliskan spesifikasi detail atau catatan equipment di sini..." className="bg-[#12161A] border border-gray-700/50 text-white px-4 py-2.5 rounded-lg outline-none focus:border-blue-500 resize-none h-full min-h-[100px] w-full"></textarea>
                </div>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-700/50 bg-[#12161A] flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-[#1A2028] hover:bg-gray-700 text-white rounded-lg border border-gray-700/50 transition-colors font-medium">Batal</button>
            <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">Simpan Equipment</button>
          </div>
        </form>
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
  const [editOverlayMode, setEditOverlayMode] = useState(false);
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
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [assetRefresh, setAssetRefresh] = useState(0); // trigger re-read
  const [panelPos, setPanelPos] = useState({ x: null, y: null }); // null = use default

  const dragRef      = useRef({ active:false, startX:0, startY:0, panX:0, panY:0, moved:false });
  const editDragRef  = useRef({ active:false, zoneId:null, handleType:null, startMouse:{x:0,y:0}, initialZone:null });
  const panelDragRef = useRef({ active:false, moved:false, startX:0, startY:0, startPX:0, startPY:0 });
  const containerRef = useRef(null);
  const wrapperRef   = useRef(null);
  const panelRef     = useRef(null);

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
        if (found) { 
          setPlant(found); 
          // Load image from IndexedDB and restore its original canvas size
          getLayoutImageFromDB(code).then(imgData => {
            if (imgData) {
              // Restore canvasSize from localStorage first
              const savedSize = localStorage.getItem('maintainx_canvas_size_' + code);
              if (savedSize) {
                try {
                  const parsed = JSON.parse(savedSize);
                  setCanvasSize({ w: parsed.w, h: parsed.h });
                } catch {}
              } else {
                // Fallback: read dimensions directly from image data
                const tempImg = new Image();
                tempImg.onload = () => setCanvasSize({ w: tempImg.naturalWidth, h: tempImg.naturalHeight });
                tempImg.src = imgData;
              }
              setBgImage(imgData);
            }
          }).catch(err => console.error('Failed to load image from DB', err));
        }
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

  // Panel drag listeners (attached to document to handle fast mouse moves)
  useEffect(() => {
    const onMove = (e) => {
      const d = panelDragRef.current;
      if (!d.active) return;
      d.moved = true;
      const nx = d.startPX + (e.clientX - d.startX);
      const ny = d.startPY + (e.clientY - d.startY);
      // Clamp to viewport
      const pw = panelRef.current?.offsetWidth || 320;
      const ph = panelRef.current?.offsetHeight || 400;
      setPanelPos({
        x: Math.max(8, Math.min(window.innerWidth - pw - 8, nx)),
        y: Math.max(8, Math.min(window.innerHeight - ph - 8, ny)),
      });
    };
    const onUp = () => { 
      panelDragRef.current.active = false;
      // Reset moved flag after a short delay so handleCanvasClick can read it
      setTimeout(() => { panelDragRef.current.moved = false; }, 50);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, []);

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
    
    // Handle overlay editing (resizing/moving)
    if (editOverlayMode && selectedZone && containerRef.current) {
      const handleElement = e.target.closest('.edit-handle');
      const zoneElement = e.target.closest('.zone-overlay');
      
      if (handleElement || zoneElement) {
        const rect = containerRef.current.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 100;
        const mouseY = ((e.clientY - rect.top) / rect.height) * 100;
        
        const z = zones.find(z => z.id === selectedZone);
        if (z) {
          e.stopPropagation();
          const handleType = handleElement ? handleElement.dataset.type : 'move';
          editDragRef.current = {
            active: true,
            zoneId: selectedZone,
            handleType,
            startMouse: { x: mouseX, y: mouseY },
            initialZone: JSON.parse(JSON.stringify(z))
          };
          return;
        }
      }
    }

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
    
    // Panning (only if not editing/drawing or if didn't click on anything)
    if (!drawingMode && !editDragRef.current.active) { 
      dragRef.current = { active:true, startX:e.clientX, startY:e.clientY, panX:pan.x, panY:pan.y, moved:false }; 
    }
  };

  const handleMouseMove = (e) => {
    const ed = editDragRef.current;
    if (ed.active && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 100;
      const my = ((e.clientY - rect.top) / rect.height) * 100;
      const dx = mx - ed.startMouse.x;
      const dy = my - ed.startMouse.y;
      
      setZones(prev => prev.map(z => {
        if (z.id !== ed.zoneId) return z;
        const nz = JSON.parse(JSON.stringify(ed.initialZone));
        
        if (ed.handleType === 'move') {
          if (nz.type === 'rectangle' || !nz.type) { nz.rect.left += dx; nz.rect.top += dy; }
          else if (nz.type === 'circle') { nz.circle.cx += dx; nz.circle.cy += dy; }
          else if (nz.type === 'polygon') { nz.points = nz.points.map(p => ({ x: p.x + dx, y: p.y + dy })); }
        } else if (ed.handleType.startsWith('rect-')) {
          const corner = ed.handleType.split('-')[1]; // tl, tr, bl, br
          if (corner.includes('l')) { nz.rect.width -= dx; nz.rect.left += dx; }
          if (corner.includes('r')) { nz.rect.width += dx; }
          if (corner.includes('t')) { nz.rect.height -= dy; nz.rect.top += dy; }
          if (corner.includes('b')) { nz.rect.height += dy; }
          // Prevent negative sizes
          if (nz.rect.width < 1) nz.rect.width = 1;
          if (nz.rect.height < 1) nz.rect.height = 1;
        } else if (ed.handleType === 'circ-edge') {
          nz.circle.r = Math.max(1, nz.circle.r + dx);
        } else if (ed.handleType.startsWith('poly-')) {
          const idx = parseInt(ed.handleType.split('-')[1]);
          nz.points[idx].x += dx;
          nz.points[idx].y += dy;
        }
        return nz;
      }));
      return;
    }

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

  const handleMouseUp = () => { 
    if (editDragRef.current.active) {
      editDragRef.current.active = false;
      saveZones([...zones]); // Persist changes
    }
    dragRef.current.active = false; 
  };
  const handleCanvasClick = (e) => {
    // Ignore click if we just finished dragging the panel
    if (panelDragRef.current.moved) return;
    if (dragRef.current.moved) return;
    if (e.target.closest('.status-panel')) return;
    if (e.target.closest('.modal-container')) return; // <-- FIX: ignore clicks inside modal
    if (!e.target.closest('.zone-overlay') && !drawingMode) setSelectedZone(null);
  };

  const handleZoneClick = (zone, e) => { 
    if (drawingMode) return; 
    setSelectedZone(prev => prev === zone.id ? null : zone.id);
  };

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
          const w = img.naturalWidth;
          const h = img.naturalHeight;
          setCanvasSize({ w, h });
          setBgImage(dataUrl);
          // Save canvas size to localStorage so it can be restored on refresh
          if (plant.code) {
            localStorage.setItem('maintainx_canvas_size_' + plant.code, JSON.stringify({ w, h }));
          }
          // Persist bgImage to IndexedDB to avoid localStorage quota issues
          saveLayoutImageToDB(plant.code, dataUrl)
            .catch(err => {
              console.error(err);
              setModal({ type:'alert', title:'Gagal Menyimpan', message:'Gagal menyimpan gambar ke database.', onConfirm:()=>setModal(null) });
            });
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

  const selectedZoneRef = React.useRef(null);
  const handleEditZoneSubmit = (e) => { 
    e.preventDefault();
    e.stopPropagation();
    const zoneId = selectedZoneRef.current;
    if (!zoneId) return;
    const newName = editZoneData.name.trim();
    if (!newName) return;
    const updated = zones.map(z => z.id === zoneId ? { ...z, name: newName } : z);
    saveZones(updated);
    setShowEditForm(false);
  };
  const openEditModal = () => { 
    if (!selectedZone) return; 
    selectedZoneRef.current = selectedZone;
    const z = zones.find(z => z.id === selectedZone); 
    setEditZoneData({name: z.name}); 
    setShowEditForm(true); 
  };

  const renderZone = (zone) => {
    const isSel = selectedZone === zone.id;
    const isEditing = isSel && editOverlayMode;
    const zoneAssetCount = getZoneAssets(zone.id).length;
    
    // Normal style
    const base = { backgroundColor:zone.color, borderColor: isSel ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.25)', borderWidth: isSel ? 3 : 1.5, borderStyle:'solid', zIndex: isSel ? 20 : 10, cursor: isEditing ? 'move' : (drawingMode ? 'crosshair' : 'pointer'), transform: (isSel && !isEditing) ? 'scale(1.015)' : 'scale(1)', transition:'transform 0.2s ease, background 0.2s', position:'absolute', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(1px)', overflow: isEditing?'visible':'hidden', boxShadow: (isSel && !isEditing) ? '0 0 0 3px rgba(255,255,255,0.15)' : 'none' };
    
    const label = !isEditing && (
      <div style={{ background:'rgba(0,0,0,0.65)', padding:'3px 8px', borderRadius:4, maxWidth:'90%', overflow:'hidden', display:'flex', alignItems:'center', gap:5, pointerEvents:'none' }}>
        <span style={{ whiteSpace:'nowrap', textOverflow:'ellipsis', overflow:'hidden', fontSize:'clamp(9px,1.8cqw,13px)', fontWeight:700, color:'#fff', letterSpacing:'0.04em' }}>{zone.name}</span>
        {zoneAssetCount > 0 && (
          <span style={{ background:'rgba(59,130,246,0.5)', border:'1px solid rgba(59,130,246,0.6)', color:'#93c5fd', borderRadius:3, padding:'0 5px', fontSize:'clamp(7px,1.2cqw,10px)', fontWeight:700, flexShrink:0 }}>{zoneAssetCount}</span>
        )}
      </div>
    );
    
    const renderHandle = (x, y, cursor, type) => (
      <div className="edit-handle" data-type={type} style={{ position:'absolute', left:`${x}%`, top:`${y}%`, width:12, height:12, background:'#3b82f6', border:'2px solid white', borderRadius:'50%', transform:'translate(-50%, -50%)', cursor, zIndex:30, pointerEvents:'all' }} />
    );

    if (zone.type === 'rectangle' || !zone.type) {
      return (
        <div key={zone.id} className="zone-overlay" style={{...base, top:`${zone.rect.top}%`, left:`${zone.rect.left}%`, width:`${zone.rect.width}%`, height:`${zone.rect.height}%`}} onMouseDown={(e)=>handleZoneClick(zone,e)}>
          {label}
          {isEditing && <>
            {renderHandle(0, 0, 'nwse-resize', 'rect-tl')}
            {renderHandle(100, 0, 'nesw-resize', 'rect-tr')}
            {renderHandle(0, 100, 'nesw-resize', 'rect-bl')}
            {renderHandle(100, 100, 'nwse-resize', 'rect-br')}
          </>}
        </div>
      );
    }
    if (zone.type === 'circle') {
      return (
        <div key={zone.id} className="zone-overlay" style={{...base, borderRadius:'50%', top:`${zone.circle.cy-zone.circle.r}%`, left:`${zone.circle.cx-zone.circle.r}%`, width:`${zone.circle.r*2}%`, height:`${zone.circle.r*2}%`}} onMouseDown={(e)=>handleZoneClick(zone,e)}>
          {label}
          {isEditing && renderHandle(100, 50, 'ew-resize', 'circ-edge')}
        </div>
      );
    }
    if (zone.type === 'polygon') {
      const minX=Math.min(...zone.points.map(p=>p.x)), minY=Math.min(...zone.points.map(p=>p.y));
      return (
        <div key={zone.id} className="zone-overlay" style={{ position:'absolute', inset:0, zIndex: isSel?20:10, pointerEvents:'none' }}>
          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position:'absolute', inset:0 }}>
            <polygon
              points={zone.points.map(p=>`${p.x},${p.y}`).join(' ')}
              fill={zone.color}
              stroke={isSel?'rgba(255,255,255,0.95)':'rgba(255,255,255,0.4)'}
              strokeWidth={isSel?0.4:0.3}
              vectorEffect="non-scaling-stroke"
              style={{ cursor: isEditing ? 'move' : (drawingMode?'crosshair':'pointer'), pointerEvents:'all', filter: isSel?'drop-shadow(0 0 8px rgba(255,255,255,0.3))':'none' }}
              onMouseDown={(e)=>handleZoneClick(zone,e)}
            />
          </svg>
          {label && <div style={{ position:'absolute', left:`${minX}%`, top:`${minY}%`, transform:'translate(4px,-26px)', pointerEvents:'none' }}>{label}</div>}
          {isEditing && zone.points.map((p, i) => (
            <div key={i} className="edit-handle" data-type={`poly-${i}`} style={{ position:'absolute', left:`${p.x}%`, top:`${p.y}%`, width:12, height:12, background:'#3b82f6', border:'2px solid white', borderRadius:'50%', transform:'translate(-50%, -50%)', cursor:'crosshair', zIndex:30, pointerEvents:'all' }} />
          ))}
        </div>
      );
    }
  };

  const renderLivePreview = () => {
    if (!livePreview || drawingPoints.length === 0) return null;
    const p0 = drawingPoints[0];
    const previewStyle = { position:'absolute', border:'2px dashed rgba(99,179,237,0.9)', background:'rgba(99,179,237,0.12)', pointerEvents:'none', zIndex:60 };
    if (drawingShape === 'rectangle' && drawingPoints.length === 1) { const x=Math.min(p0.x,livePreview.x),y=Math.min(p0.y,livePreview.y); return <div style={{...previewStyle, top:`${y}%`, left:`${x}%`, width:`${Math.abs(p0.x-livePreview.x)}%`, height:`${Math.abs(p0.y-livePreview.y)}%`, borderRadius:3}} />; }
    if (drawingShape === 'circle' && drawingPoints.length === 1) { const r=Math.sqrt((p0.x-livePreview.x)**2+(p0.y-livePreview.y)**2); return <div style={{...previewStyle, top:`${p0.y-r}%`, left:`${p0.x-r}%`, width:`${r*2}%`, height:`${r*2}%`, borderRadius:'50%'}} />; }
    if (drawingShape === 'polygon') { return <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:60}}><polygon points={[...drawingPoints,livePreview].map(p=>`${p.x},${p.y}`).join(' ')} fill="rgba(99,179,237,0.18)" stroke="rgba(99,179,237,0.95)" strokeWidth="0.4" strokeDasharray="2,1" vectorEffect="non-scaling-stroke"/></svg>; }
    return null;
  };

  const panelEquipments = selectedZone ? getZoneAssets(selectedZone) : [];
  const selectedZoneObj = selectedZone ? zones.find(z => z.id === selectedZone) : null;
  const btnBase = { padding:'8px 10px', borderRadius:8, background:'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', transition:'all 0.15s' };

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
            {drawingMode && isDrawing && drawingPoints.length > 0 && <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:61}}>{drawingPoints.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="1" fill="white" stroke="rgba(99,179,237,0.9)" strokeWidth="0.3" vectorEffect="non-scaling-stroke"/>)}{drawingPoints.length > 1 && <polyline points={drawingPoints.map(p=>`${p.x},${p.y}`).join(' ')} fill="none" stroke="rgba(99,179,237,0.5)" strokeWidth="0.3" strokeDasharray="2,1" vectorEffect="non-scaling-stroke"/>}</svg>}
            {drawingMode && isDrawing && drawingShape === 'polygon' && drawingPoints.length > 2 && <div style={{position:'absolute',top:14,left:'50%',transform:'translateX(-50%)',background:'rgba(37,99,235,0.85)',color:'white',padding:'6px 16px',borderRadius:8,fontSize:'0.8rem',fontWeight:600,zIndex:70,pointerEvents:'none'}}>Klik titik awal untuk menutup polygon</div>}
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="toolbar" style={{ position:'absolute', top:14, left:'50%', transform:'translateX(-50%)', background:'rgba(15,23,42,0.95)', backdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:14, padding:'8px 16px', boxShadow:'0 8px 32px rgba(0,0,0,0.5)', display:'flex', alignItems:'center', gap:6, zIndex:40, whiteSpace:'nowrap' }}>
          <span style={{ fontSize:10, color:'#475569', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginRight:6 }}>Controls</span>
          {[{icon:<ZoomIn size={16}/>,act:()=>setZoom(z=>Math.min(5,z+0.2)),tip:'Zoom In'},{icon:<ZoomOut size={16}/>,act:()=>setZoom(z=>Math.max(0.1,z-0.2)),tip:'Zoom Out'},{icon:<RotateCw size={16}/>,act:()=>{setZoom(1);if(wrapperRef.current){const vw=wrapperRef.current.offsetWidth,vh=wrapperRef.current.offsetHeight;setPan({x:(vw-canvasSize.w)/2,y:Math.max(20,(vh-canvasSize.h)/2)});}},tip:'Reset View'}].map((b,i)=>(
            <button key={i} onClick={b.act} title={b.tip} style={{...btnBase, color:'#94a3b8'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>{b.icon}</button>
          ))}
          <div style={{ width:1, height:22, background:'rgba(255,255,255,0.12)', margin:'0 4px' }} />
          <ToggleSwitch checked={showZones} onChange={setShowZones} label="Zones" />
          <div style={{ width:1, height:22, background:'rgba(255,255,255,0.12)', margin:'0 4px' }} />
          
          {/* Edit Area Toggle */}
          <div style={{ background: editOverlayMode ? 'rgba(59,130,246,0.15)' : 'transparent', borderRadius:8, padding:'2px', transition:'background 0.2s' }}>
            <ToggleSwitch checked={editOverlayMode} onChange={(v)=>{setEditOverlayMode(v);setDrawingMode(false);}} label="Edit Area" />
          </div>
          
          <div style={{ width:1, height:22, background:'rgba(255,255,255,0.12)', margin:'0 4px' }} />
          <ToggleSwitch checked={drawingMode} onChange={(v)=>{setDrawingMode(v);setEditOverlayMode(false);setIsDrawing(false);setDrawingPoints([]);setLivePreview(null);}} label="Draw" />
          <select disabled={!drawingMode} value={drawingShape} onChange={e=>{setDrawingShape(e.target.value);setIsDrawing(false);setDrawingPoints([]);setLivePreview(null);}} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', color: drawingMode?'#cbd5e1':'#475569', borderRadius:7, padding:'5px 8px', fontSize:12, cursor: drawingMode?'pointer':'not-allowed', outline:'none' }}>
            <option value="rectangle">Kotak</option>
            <option value="circle">Lingkaran</option>
            <option value="polygon">Polygon</option>
          </select>
          <button disabled={!drawingMode} onClick={startDrawing} style={{ padding:'6px 12px', borderRadius:8, background: drawingMode?'rgba(59,130,246,0.3)':'transparent', border: drawingMode?'1px solid rgba(59,130,246,0.5)':'1px solid transparent', color: drawingMode?'#93c5fd':'#475569', cursor: drawingMode?'pointer':'not-allowed', display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600 }}>
            <Plus size={14}/>Tambah Area
          </button>
          <div style={{ width:1, height:22, background:'rgba(255,255,255,0.12)', margin:'0 4px' }} />
          <button disabled={!selectedZone||drawingMode} onClick={openEditModal} title="Edit nama section" style={{...btnBase, color: selectedZone&&!drawingMode?'#60a5fa':'#374151', cursor: selectedZone&&!drawingMode?'pointer':'not-allowed'}}><Edit2 size={16}/></button>
          <button disabled={!selectedZone||drawingMode} onClick={handleDeleteZone} title="Hapus section" style={{...btnBase, color: selectedZone&&!drawingMode?'#f87171':'#374151', cursor: selectedZone&&!drawingMode?'pointer':'not-allowed'}}><Trash2 size={16}/></button>
          <button onClick={handleUploadBg} title="Upload gambar layout" style={{...btnBase, color:'#94a3b8'}} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}><ImageIcon size={16}/></button>
          <div style={{ fontSize:11, color:'#475569', fontFamily:'monospace', marginLeft:4, minWidth:40 }}>{Math.round(zoom*100)}%</div>
        </div>

        {/* EQUIPMENT / ASSET PANEL - draggable */}
        {selectedZone && selectedZoneObj && !editOverlayMode && (() => {
          // Default position: right side, below toolbar (~80px from top)
          const defaultX = (wrapperRef.current?.offsetWidth || 800) - 334;
          const defaultY = 80;
          const px = panelPos.x !== null ? panelPos.x : defaultX;
          const py = panelPos.y !== null ? panelPos.y : defaultY;
          return (
          <div
            ref={panelRef}
            className="status-panel"
            style={{ position:'absolute', left:px, top:py, width:320, background:'rgba(15,23,42,0.96)', backdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, boxShadow:'0 12px 40px rgba(0,0,0,0.5)', zIndex:40, display:'flex', flexDirection:'column', maxHeight:'calc(100% - 100px)', overflow:'hidden', userSelect: panelDragRef.current?.active ? 'none' : 'auto' }}
          >
            {/* Panel Header - drag handle */}
            <div
              style={{ padding:'10px 14px', borderBottom:'1px solid rgba(255,255,255,0.07)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, cursor:'grab', userSelect:'none' }}
              onMouseDown={(e) => {
                e.stopPropagation();
                const px2 = panelPos.x !== null ? panelPos.x : (wrapperRef.current?.offsetWidth || 800) - 334;
                const py2 = panelPos.y !== null ? panelPos.y : 80;
                panelDragRef.current = { active:true, moved:false, startX:e.clientX, startY:e.clientY, startPX:px2, startPY:py2 };
              }}
            >
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
                onClick={() => setShowAddAssetModal(true)}
                style={{ flex:1, padding:'8px 10px', borderRadius:7, background:'rgba(59,130,246,0.2)', border:'1px solid rgba(59,130,246,0.4)', color:'#60a5fa', cursor:'pointer', fontSize:'0.78rem', fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}
              >
                <Plus size={13}/> Tambah Asset Baru
              </button>
              {panelEquipments.length > 0 && (
                <a href={`/detail-equipment.html?zoneId=${selectedZone}&plantCode=${plant.code}`}
                  style={{ padding:'8px 10px', borderRadius:7, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#94a3b8', fontSize:'0.72rem', textDecoration:'none', display:'flex', alignItems:'center', whiteSpace:'nowrap' }}>
                  Detail →
                </a>
              )}
            </div>
          </div>
          );
        })()}
      </div>

      {/* FORM MODALS */}
      {(showSectionForm || showEditForm) && (
        <div
          className="modal-container"
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:9999, backdropFilter:'blur(4px)' }}
          onMouseDown={e => e.stopPropagation()}
          onMouseUp={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
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
              <h3 style={{ margin:'0 0 20px', fontSize:'1rem', fontWeight:700 }}>Edit Nama Section</h3>
              <label style={{ display:'block', fontSize:'0.82rem', color:'#94a3b8', marginBottom:6 }}>Nama Section / Area</label>
              <input
                type="text"
                value={editZoneData.name}
                onChange={e => setEditZoneData({ name: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') handleEditZoneSubmit(e); }}
                autoFocus
                style={{ width:'100%', background:'#0f172a', border:'1px solid rgba(255,255,255,0.12)', borderRadius:8, padding:'9px 12px', color:'white', fontSize:'0.9rem', outline:'none', boxSizing:'border-box' }}
              />
              <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:24 }}>
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  style={{ padding:'8px 18px', borderRadius:8, background:'transparent', border:'1px solid rgba(255,255,255,0.12)', color:'#94a3b8', cursor:'pointer' }}
                >Batal</button>
                <button
                  type="button"
                  onClick={handleEditZoneSubmit}
                  style={{ padding:'8px 18px', borderRadius:8, background:'#2563eb', border:'none', color:'white', fontWeight:600, cursor:'pointer' }}
                >Simpan Perubahan</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADD NEW ASSET MODAL */}
      {showAddAssetModal && selectedZoneObj && (
        <AddNewAssetModal
          plantCode={plant.code}
          zoneId={selectedZone}
          zoneName={selectedZoneObj.name}
          onClose={() => setShowAddAssetModal(false)}
          onSaved={() => {
            setAssetRefresh(r => r + 1);
            setShowAddAssetModal(false);
          }}
        />
      )}

      {modal && <CustomModal type={modal.type} title={modal.title} message={modal.message} onConfirm={modal.onConfirm} onCancel={()=>setModal(null)} confirmLabel={modal.type==='confirm'?'Ya, Hapus':'OK'} />}
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<LayoutArea />);
