import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

function RegisterPlant() {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    code: '',
    address: '',
    barcode: ''
  });
  
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [isEditMode, setIsEditMode] = useState(false);
  
  const quillRef   = useRef(null);
  const editorRef  = useRef(null);
  const barcodeRef = useRef(null);

  // Render JsBarcode into the SVG element
  const renderBarcode = useCallback((value) => {
    if (!barcodeRef.current || !value || !window.JsBarcode) return;
    try {
      window.JsBarcode(barcodeRef.current, value, {
        format: 'CODE128',
        width: 2,
        height: 60,
        displayValue: true,
        fontSize: 13,
        margin: 10,
        background: '#ffffff',
        lineColor: '#1e293b'
      });
    } catch (e) { console.error('JsBarcode error:', e); }
  }, []);

  useEffect(() => {
    if (formData.barcode) {
      setTimeout(() => renderBarcode(formData.barcode), 50);
    }
  }, [formData.barcode, renderBarcode]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const editCode = params.get('edit');
    let existingPlant = null;
    
    if (editCode) {
      setIsEditMode(true);
      const saved = localStorage.getItem('maintainx_plants');
      if (saved) {
        const plants = JSON.parse(saved);
        existingPlant = plants.find(p => p.code === editCode);
        if (existingPlant) {
          setFormData({
            name: existingPlant.name,
            company: existingPlant.company,
            code: existingPlant.code,
            address: existingPlant.location,
            barcode: existingPlant.barcode || existingPlant.code
          });
        }
      }
    }

    if (editorRef.current && !quillRef.current && window.Quill) {
      quillRef.current = new window.Quill(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            [{ 'color': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['clean']
          ]
        }
      });
      
      if (existingPlant && existingPlant.location) {
        quillRef.current.root.innerHTML = existingPlant.location;
      }
      
      quillRef.current.on('text-change', () => {
        setFormData(prev => ({ ...prev, address: quillRef.current.root.innerHTML }));
      });
    }
  }, []);

  const handleGenerateCode = () => {
    const prefix = formData.name ? formData.name.substring(0, 3).toUpperCase() : 'PLT';
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const newCode = `${prefix}-${randomNum}`;
    setFormData(prev => ({ ...prev, code: newCode, barcode: newCode }));
  };

  const handleDownloadBarcode = () => {
    const svg = barcodeRef.current;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    img.onload = () => {
      canvas.width = img.width; canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const a = document.createElement('a');
      a.download = `barcode-${formData.barcode}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = url;
  };

  const handlePrintBarcode = () => {
    const svg = barcodeRef.current;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const win = window.open('', '_blank');
    win.document.write(`<!DOCTYPE html><html><head>
      <title>Barcode Plant - ${formData.barcode}</title>
      <style>
        body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fff;}
        .card{border:2px solid #1e293b;border-radius:12px;padding:24px 32px;text-align:center;}
        h3{font-size:14px;font-weight:700;color:#1e293b;margin:0 0 4px;}
        p{font-size:11px;color:#64748b;margin:0 0 12px;}
        @media print{button{display:none;}}
      </style>
    </head><body>
      <div class="card">
        <h3>${formData.name || 'Area/Lokasi'}</h3>
        <p>${formData.company || ''}</p>
        ${svgData}
        <p style="margin-top:6px;">${formData.barcode}</p>
      </div>
      <button onclick="window.print()" style="margin-top:20px;padding:10px 28px;background:#2563eb;color:white;border:none;border-radius:8px;font-size:14px;cursor:pointer;">🖨️ Cetak</button>
    </body></html>`);
    win.document.close();
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    if (type === 'success') {
      setTimeout(() => { window.location.href = '/asset-register.html'; }, 2000);
    } else {
      setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const strippedAddress = formData.address.replace(/<[^>]+>/g, '').trim();
    if (!formData.name || !formData.company || strippedAddress === '') {
      showNotification('error', 'Semua field wajib harus diisi!');
      return;
    }
    if (!formData.code) {
      showNotification('error', 'Kode Area/Lokasi tidak boleh kosong! Silakan klik tombol GENERATE.');
      return;
    }
    try {
      const saved = localStorage.getItem('maintainx_plants');
      let plants = saved ? JSON.parse(saved) : [];
      if (isEditMode) {
        const index = plants.findIndex(p => p.code === formData.code);
        if (index !== -1) {
          plants[index] = { ...plants[index], name: formData.name, company: formData.company, location: strippedAddress, barcode: formData.barcode || formData.code };
        }
        localStorage.setItem('maintainx_plants', JSON.stringify(plants));
        showNotification('success', 'Update Area/Lokasi berhasil!');
      } else {
        plants.push({ code: formData.code, name: formData.name, company: formData.company, location: strippedAddress, barcode: formData.barcode || formData.code, bgImage: null });
        localStorage.setItem('maintainx_plants', JSON.stringify(plants));
        showNotification('success', 'Registrasi Area/Lokasi baru berhasil!');
      }
    } catch (err) {
      showNotification('error', 'Gagal menyimpan Area/Lokasi.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        
        <div className="mb-8">
          <a href="/asset-register.html" className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium mb-6 transition-colors">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            KEMBALI
          </a>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
            {isEditMode ? 'EDIT AREA/LOKASI' : 'REGISTRASI AREA/LOKASI'}
          </h1>
          <p className="text-gray-500">
            {isEditMode 
              ? 'Halaman ini dimaksudkan untuk mengubah data AREA/LOKASI yang sudah terdaftar.' 
              : 'Halaman ini dimaksudkan untuk mendaftarkan AREA/LOKASI baru ke Maintain X. Silakan lengkapi formulir berikut :'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Nama Area/Lokasi <span className="text-red-500">*</span>
            </label>
            <input type="text" required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800"
              placeholder="Masukkan nama area/lokasi"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Baru / Perusahaan Saat Ini <span className="text-red-500">*</span>
            </label>
            <select required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 bg-white"
              value={formData.company}
              onChange={(e) => setFormData({...formData, company: e.target.value})}
            >
              <option value="" disabled>-- Pilih Perusahaan --</option>
              <option value="PT. MaintainX Manufacturing">PT. MaintainX Manufacturing</option>
              <option value="PT. MaintainX Logistics">PT. MaintainX Logistics</option>
              <option value="PT. MaintainX Heavy Ind.">PT. MaintainX Heavy Ind.</option>
              <option value="Baru (Perusahaan Lain)">Baru (Perusahaan Lain)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Kode Area/Lokasi</label>
            <div className="flex gap-3">
              <input type="text"
                className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-800 ${isEditMode ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300'}`}
                placeholder="PLT-XXX"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                disabled={isEditMode}
              />
              {!isEditMode && (
                <button type="button" onClick={handleGenerateCode}
                  className="px-6 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors">
                  GENERATE
                </button>
              )}
            </div>
          </div>

          {/* ── Barcode Plant ── */}
          <div className="border border-blue-100 bg-blue-50 rounded-xl p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              🔖 Barcode Plant
            </label>
            {formData.barcode ? (
              <div className="flex flex-col items-center gap-4">
                <div className="bg-white rounded-xl border border-gray-200 px-8 py-5 shadow-sm text-center w-full max-w-xs">
                  <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-widest">{formData.name || 'Area/Lokasi'}</p>
                  <svg ref={barcodeRef} className="mx-auto"></svg>
                  <p className="text-xs text-gray-400 mt-1 font-mono">{formData.barcode}</p>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={handleDownloadBarcode}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors shadow-sm">
                    ⬇️ Download PNG
                  </button>
                  <button type="button" onClick={handlePrintBarcode}
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm">
                    🖨️ Cetak Barcode
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <div className="text-4xl mb-2 opacity-30">▌▌▌▌▌▌▌▌▌▌</div>
                <p className="text-sm">Klik tombol <strong className="text-gray-600">GENERATE</strong> di atas untuk membuat Kode Area dan Barcode secara otomatis.</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Alamat <span className="text-red-500">*</span>
            </label>
            <div className="bg-white rounded-lg overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
              <div ref={editorRef} style={{ height: '160px' }}></div>
            </div>
          </div>

          <div className="pt-6 flex justify-center border-t border-gray-100">
            <button type="submit"
              className="px-12 py-3 bg-blue-600 text-white text-lg font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transform transition-transform hover:-translate-y-1 active:translate-y-0">
              {isEditMode ? 'SIMPAN' : 'REGISTER'}
            </button>
          </div>

        </form>
      </div>

      {notification.show && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 flex items-center p-4 bg-white rounded-lg shadow-xl border border-gray-100">
          {notification.type === 'success' ? (
            <div className="inline-flex items-center justify-center flex-shrink-0 w-10 h-10 text-green-500 bg-green-100 rounded-full">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
            </div>
          ) : (
            <div className="inline-flex items-center justify-center flex-shrink-0 w-10 h-10 text-red-500 bg-red-100 rounded-full">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </div>
          )}
          <div className="ml-4 text-base font-medium">{notification.message}</div>
        </div>
      )}
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<RegisterPlant />);
