import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Settings, Database, ClipboardList, Package, Calendar, BarChart3,
  User, Shield, Bell, Palette, Save, ChevronRight
} from 'lucide-react';

const CATEGORIES = [
  { id: 'umum', label: 'Umum', icon: Settings, desc: 'Profil aplikasi, bahasa, dan tema tampilan' },
  { id: 'asset', label: 'Asset Register', icon: Database, desc: 'Kode area, format penamaan, dan default lokasi' },
  { id: 'task', label: 'Task List', icon: ClipboardList, desc: 'Interval, status progress, dan prioritas default' },
  { id: 'warehouse', label: 'Warehouse & Sparepart', icon: Package, desc: 'Batas stok minimum, satuan, dan peringatan' },
  { id: 'schedule', label: 'Schedule & Planning', icon: Calendar, desc: 'Kalender default, notifikasi jadwal, dan zona waktu' },
  { id: 'report', label: 'Report', icon: BarChart3, desc: 'Format ekspor, rentang tanggal, dan metrik tampilan' },
  { id: 'user', label: 'Pengguna & Akses', icon: User, desc: 'Manajemen pengguna, peran, dan hak akses' },
  { id: 'notif', label: 'Notifikasi', icon: Bell, desc: 'Pengaturan email, push notification, dan reminder' },
];

function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState('umum');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && CATEGORIES.some(c => c.id === tab)) {
      setActiveCategory(tab);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const renderContent = () => {
    switch (activeCategory) {

      case 'umum':
        return (
          <div className="flex flex-col gap-6">
            <SettingSection title="Profil Aplikasi">
              <SettingRow label="Nama Aplikasi" desc="Nama yang ditampilkan di header dan sidebar">
                <input type="text" defaultValue="MaintainX" className="settings-input" />
              </SettingRow>
              <SettingRow label="Bahasa" desc="Bahasa antarmuka pengguna">
                <select className="settings-input" defaultValue="id">
                  <option value="id">Bahasa Indonesia</option>
                  <option value="en">English</option>
                </select>
              </SettingRow>
            </SettingSection>
            <SettingSection title="Tampilan">
              <SettingRow label="Tema" desc="Mode tampilan gelap atau terang">
                <select className="settings-input" defaultValue="dark">
                  <option value="dark">Dark Mode</option>
                  <option value="light">Light Mode</option>
                </select>
              </SettingRow>
              <SettingRow label="Warna Aksen" desc="Warna utama tombol dan penanda aktif">
                <div className="flex gap-3">
                  {['#FF7043','#3B82F6','#10B981','#A855F7','#F59E0B'].map(c => (
                    <button key={c} className="w-8 h-8 rounded-full border-2 border-gray-600 hover:scale-110 transition-transform" style={{backgroundColor: c}} />
                  ))}
                </div>
              </SettingRow>
            </SettingSection>
          </div>
        );

      case 'asset':
        return (
          <div className="flex flex-col gap-6">
            <SettingSection title="Format Kode Area">
              <SettingRow label="Prefiks Kode Area" desc="Awalan otomatis untuk ID Area/Lokasi baru">
                <input type="text" defaultValue="AREA-" className="settings-input" />
              </SettingRow>
              <SettingRow label="Panjang Angka Kode" desc="Jumlah digit angka setelah prefiks">
                <select className="settings-input" defaultValue="2">
                  <option value="2">2 digit (01, 02…)</option>
                  <option value="3">3 digit (001, 002…)</option>
                  <option value="4">4 digit (0001, 0002…)</option>
                </select>
              </SettingRow>
            </SettingSection>
            <SettingSection title="Gambar Kartu">
              <SettingRow label="Kualitas Gambar" desc="Resolusi maksimal gambar latar kartu area">
                <select className="settings-input" defaultValue="medium">
                  <option value="low">Rendah (480p)</option>
                  <option value="medium">Sedang (720p)</option>
                  <option value="high">Tinggi (1080p)</option>
                </select>
              </SettingRow>
              <SettingRow label="Format Gambar" desc="Format file gambar yang diterima">
                <input type="text" defaultValue="JPG, PNG, WebP" className="settings-input" readOnly />
              </SettingRow>
            </SettingSection>
          </div>
        );

      case 'task':
        return (
          <div className="flex flex-col gap-6">
            <SettingSection title="Interval Default">
              <SettingRow label="Opsi Interval" desc="Daftar interval yang tersedia di form Task List">
                <div className="flex flex-wrap gap-2">
                  {['Daily','Weekly','Monthly','Quarterly','Semesteran','Annual','Trienial','Quinquenial'].map(i => (
                    <span key={i} className="px-3 py-1 bg-bg-dark border border-border-color rounded-lg text-xs text-text-secondary">{i}</span>
                  ))}
                </div>
              </SettingRow>
            </SettingSection>
            <SettingSection title="Status Progress">
              <SettingRow label="Opsi Progress" desc="Status yang dapat dipilih untuk setiap task">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-gray-500/20 text-text-secondary rounded-lg text-xs border border-gray-600">Open</span>
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs border border-blue-500/50">In Progress</span>
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-lg text-xs border border-yellow-500/50">Waiting on Part</span>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs border border-green-500/50">Done</span>
                </div>
              </SettingRow>
            </SettingSection>
            <SettingSection title="Otomatisasi">
              <SettingRow label="Auto-Generate Task" desc="Otomatis membuat task baru berdasarkan jadwal interval">
                <ToggleSwitch defaultChecked={true} />
              </SettingRow>
            </SettingSection>
          </div>
        );

      case 'warehouse':
        return (
          <div className="flex flex-col gap-6">
            <SettingSection title="Peringatan Stok">
              <SettingRow label="Ambang Batas Kritis" desc="Persentase di bawah stok minimum yang dianggap kritis">
                <div className="flex items-center gap-2">
                  <input type="number" defaultValue="100" className="settings-input w-24" />
                  <span className="text-text-secondary text-sm">% dari Min. Stok</span>
                </div>
              </SettingRow>
              <SettingRow label="Notifikasi Stok Rendah" desc="Kirim notifikasi saat stok mendekati batas minimum">
                <ToggleSwitch defaultChecked={true} />
              </SettingRow>
            </SettingSection>
            <SettingSection title="Kategori Satuan (UOM)">
              <SettingRow label="Opsi Satuan Default" desc="Daftar satuan ukur yang tersedia untuk item gudang">
                <div className="flex flex-wrap gap-2">
                  {['Pcs', 'Kg', 'Roll', 'Bottle', 'Sheet', 'Drum', 'Meter'].map(u => (
                    <span key={u} className="px-3 py-1 bg-bg-dark border border-border-color rounded-lg text-xs text-text-secondary">{u}</span>
                  ))}
                  <button className="px-3 py-1 bg-btn-secondary border border-dashed border-gray-600 text-text-secondary hover:text-text-primary rounded-lg text-xs">+ Tambah</button>
                </div>
              </SettingRow>
            </SettingSection>
            
            <SettingSection title="Kategori Jenis Barang">
              <SettingRow label="Jenis Barang & Prefix Kode" desc="Kategori barang beserta format awalan (prefix) SKU otomatis">
                <div className="flex flex-col gap-2">
                  {[
                    {name: 'Material', prefix: 'RAW'},
                    {name: 'Equipments', prefix: 'EQP'},
                    {name: 'Consumable', prefix: 'CSM'},
                    {name: 'Sparepart', prefix: 'PRT'},
                    {name: 'Liquid/Chemical', prefix: 'LQC'},
                    {name: 'Mechanical', prefix: 'MEC'},
                    {name: 'Instrument', prefix: 'INS'},
                    {name: 'Electrical', prefix: 'ELC'}
                  ].map(j => (
                    <div key={j.name} className="flex justify-between items-center bg-bg-dark p-2 rounded-lg border border-border-color">
                      <span className="text-sm text-text-secondary">{j.name}</span>
                      <span className="text-xs font-mono bg-btn-secondary px-2 py-1 rounded text-accent">{j.prefix}-</span>
                    </div>
                  ))}
                  <button className="mt-1 px-3 py-2 bg-btn-secondary border border-dashed border-gray-600 text-text-secondary hover:text-text-primary rounded-lg text-xs text-left w-full">+ Tambah Jenis Barang Baru</button>
                </div>
              </SettingRow>
            </SettingSection>
            
            <SettingSection title="Kategori Karakteristik & Kegunaan">
              <SettingRow label="Opsi Karakteristik" desc="Daftar klasifikasi sifat fisik dan bahaya barang">
                <div className="flex flex-wrap gap-2">
                  {['Barang Kering', 'Barang Cair', 'Barang Berbahaya'].map(u => (
                    <span key={u} className="px-3 py-1 bg-bg-dark border border-border-color rounded-lg text-xs text-text-secondary">{u}</span>
                  ))}
                  <button className="px-3 py-1 bg-btn-secondary border border-dashed border-gray-600 text-text-secondary hover:text-text-primary rounded-lg text-xs">+ Tambah</button>
                </div>
              </SettingRow>
              <SettingRow label="Opsi Kegunaan" desc="Daftar klasifikasi fungsi utama barang">
                <div className="flex flex-wrap gap-2">
                  {['Electrical', 'Plumbing', 'Civil', 'Mechanical', 'APD', 'Other'].map(u => (
                    <span key={u} className="px-3 py-1 bg-bg-dark border border-border-color rounded-lg text-xs text-text-secondary">{u}</span>
                  ))}
                  <button className="px-3 py-1 bg-btn-secondary border border-dashed border-gray-600 text-text-secondary hover:text-text-primary rounded-lg text-xs">+ Tambah</button>
                </div>
              </SettingRow>
            </SettingSection>
          </div>
        );

      case 'schedule':
        return (
          <div className="flex flex-col gap-6">
            <SettingSection title="Kalender">
              <SettingRow label="Hari Pertama Minggu" desc="Hari yang ditampilkan sebagai awal minggu di kalender">
                <select className="settings-input" defaultValue="monday">
                  <option value="monday">Senin</option>
                  <option value="sunday">Minggu</option>
                </select>
              </SettingRow>
              <SettingRow label="Zona Waktu" desc="Zona waktu untuk penjadwalan">
                <select className="settings-input" defaultValue="wib">
                  <option value="wib">WIB (UTC+7)</option>
                  <option value="wita">WITA (UTC+8)</option>
                  <option value="wit">WIT (UTC+9)</option>
                </select>
              </SettingRow>
            </SettingSection>
            <SettingSection title="Pengingat">
              <SettingRow label="Pengingat Sebelum Jadwal" desc="Kirim notifikasi sebelum jadwal dimulai">
                <select className="settings-input" defaultValue="1h">
                  <option value="30m">30 Menit</option>
                  <option value="1h">1 Jam</option>
                  <option value="1d">1 Hari</option>
                  <option value="3d">3 Hari</option>
                </select>
              </SettingRow>
              <SettingRow label="Notifikasi Overdue" desc="Peringatan otomatis untuk jadwal yang terlewat">
                <ToggleSwitch defaultChecked={true} />
              </SettingRow>
            </SettingSection>
          </div>
        );

      case 'report':
        return (
          <div className="flex flex-col gap-6">
            <SettingSection title="Ekspor">
              <SettingRow label="Format Ekspor Default" desc="Format file saat mengunduh laporan">
                <select className="settings-input" defaultValue="pdf">
                  <option value="pdf">PDF</option>
                  <option value="xlsx">Excel (.xlsx)</option>
                  <option value="csv">CSV</option>
                </select>
              </SettingRow>
            </SettingSection>
            <SettingSection title="Tampilan Grafik">
              <SettingRow label="Rentang Waktu Default" desc="Periode data yang ditampilkan saat membuka halaman Report">
                <select className="settings-input" defaultValue="month">
                  <option value="week">Minggu Ini</option>
                  <option value="month">Bulan Ini</option>
                  <option value="quarter">Kuartal Ini</option>
                  <option value="year">Tahun Ini</option>
                </select>
              </SettingRow>
              <SettingRow label="Tampilkan Label Nilai" desc="Tampilkan angka di atas setiap titik data di grafik">
                <ToggleSwitch defaultChecked={false} />
              </SettingRow>
            </SettingSection>
          </div>
        );

      case 'user':
        return (
          <div className="flex flex-col gap-6">
            <SettingSection title="Manajemen Pengguna">
              <SettingRow label="Registrasi Mandiri" desc="Izinkan pengguna baru mendaftar tanpa undangan admin">
                <ToggleSwitch defaultChecked={false} />
              </SettingRow>
              <SettingRow label="Peran Default" desc="Peran yang diberikan secara otomatis pada pengguna baru">
                <select className="settings-input" defaultValue="teknisi">
                  <option value="admin">Administrator</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="teknisi">Teknisi</option>
                  <option value="viewer">Viewer (Hanya Baca)</option>
                </select>
              </SettingRow>
            </SettingSection>
            <SettingSection title="Keamanan">
              <SettingRow label="Durasi Sesi" desc="Waktu sebelum pengguna otomatis logout">
                <select className="settings-input" defaultValue="8h">
                  <option value="1h">1 Jam</option>
                  <option value="4h">4 Jam</option>
                  <option value="8h">8 Jam (1 Shift)</option>
                  <option value="24h">24 Jam</option>
                </select>
              </SettingRow>
              <SettingRow label="Autentikasi 2 Faktor" desc="Wajibkan verifikasi tambahan saat login">
                <ToggleSwitch defaultChecked={false} />
              </SettingRow>
            </SettingSection>
            
            <SettingSection title="Kategori Pengguna & Hak Akses Menu">
              <div className="p-6">
                <div className="mb-4 text-sm text-accent bg-[#FF7043]/10 border border-[#FF7043]/20 p-3 rounded-lg flex items-center gap-2">
                  <Shield size={16} />
                  <p>Akun Anda saat ini (<strong>Admin</strong> dengan password <em>12345</em>) adalah <strong>Administrator</strong> yang memiliki <em>Full Akses</em>.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="text-text-secondary border-b border-border-color">
                      <tr>
                        <th className="pb-3 font-medium">Menu / Fitur</th>
                        <th className="pb-3 text-center font-medium">Administrator</th>
                        <th className="pb-3 text-center font-medium">Supervisor</th>
                        <th className="pb-3 text-center font-medium">Admin</th>
                        <th className="pb-3 text-center font-medium">Visitor</th>
                        <th className="pb-3 text-center font-medium">Foreman</th>
                        <th className="pb-3 text-center font-medium">Warehouse</th>
                        <th className="pb-3 text-center font-medium">Teknisi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {[
                        { menu: 'Dashboard', accesses: [1, 1, 1, 1, 1, 1, 1], isSub: false },
                        { menu: 'Asset Register', accesses: [1, 1, 1, 0, 0, 0, 1], isSub: false },
                        { menu: 'Layout Area/Lokasi', accesses: [1, 1, 1, 0, 0, 0, 1], isSub: true },
                        { menu: 'Detail Equipment', accesses: [1, 1, 1, 0, 0, 0, 1], isSub: true },
                        { menu: 'Warehouse & Sparepart', accesses: [1, 1, 1, 0, 1, 1, 0], isSub: false },
                        { menu: 'Dashboard Warehouse', accesses: [1, 1, 1, 0, 1, 1, 0], isSub: true },
                        { menu: 'Data Barang', accesses: [1, 1, 1, 0, 1, 1, 0], isSub: true },
                        { menu: 'Data Gudang', accesses: [1, 1, 1, 0, 1, 1, 0], isSub: true },
                        { menu: 'Transaksi Gudang', accesses: [1, 1, 1, 0, 0, 1, 0], isSub: true },
                        { menu: 'Gudang Perkakas', accesses: [1, 1, 1, 0, 1, 1, 0], isSub: true },
                        { menu: 'Data Alat (Perkakas)', accesses: [1, 1, 1, 0, 1, 1, 0], isSub: true },
                        { menu: 'Permintaan Logistik', accesses: [1, 1, 1, 0, 1, 1, 0], isSub: true },
                        { menu: 'Maintenance Planning', accesses: [1, 1, 1, 1, 1, 0, 1], isSub: false },
                        { menu: 'Perencanaan Maintenance', accesses: [1, 1, 1, 1, 1, 0, 0], isSub: true },
                        { menu: 'Jadwal Maintenance', accesses: [1, 1, 1, 1, 1, 0, 1], isSub: true },
                        { menu: 'Task List', accesses: [1, 1, 1, 1, 1, 0, 1], isSub: true },
                        { menu: 'Report Task List', accesses: [1, 1, 1, 1, 1, 0, 0], isSub: true },
                        { menu: 'Work Order', accesses: [1, 1, 1, 0, 1, 0, 1], isSub: true },
                        { menu: 'Report', accesses: [1, 1, 0, 0, 1, 0, 0], isSub: false },
                        { menu: 'Pekerja', accesses: [1, 1, 0, 0, 1, 0, 0], isSub: false },
                        { menu: 'Pengaturan', accesses: [1, 0, 0, 0, 0, 0, 0], isSub: false },
                      ].map(row => (
                        <tr key={row.menu} className={`hover:bg-btn-secondary/50 ${row.isSub ? 'text-text-secondary' : 'text-text-primary'}`}>
                          <td className={`py-3 font-medium ${row.isSub ? 'pl-6 text-xs' : ''}`}>{row.menu}</td>
                          {row.accesses.map((val, idx) => (
                            <td key={idx} className="py-3 text-center">
                              <div className="flex justify-center">
                                <ToggleSwitch defaultChecked={val === 1} disabled={idx === 0} size="sm" />
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </SettingSection>
          </div>
        );

      case 'notif':
        return (
          <div className="flex flex-col gap-6">
            <SettingSection title="Saluran Notifikasi">
              <SettingRow label="Notifikasi Email" desc="Kirim pemberitahuan penting melalui email">
                <ToggleSwitch defaultChecked={true} />
              </SettingRow>
              <SettingRow label="Push Notification" desc="Tampilkan notifikasi pop-up di browser">
                <ToggleSwitch defaultChecked={true} />
              </SettingRow>
            </SettingSection>
            <SettingSection title="Jenis Notifikasi">
              <SettingRow label="Task Baru Ditugaskan" desc="Pemberitahuan saat ada task baru yang ditugaskan ke Anda">
                <ToggleSwitch defaultChecked={true} />
              </SettingRow>
              <SettingRow label="Stok Kritis" desc="Peringatan saat stok gudang mencapai batas kritis">
                <ToggleSwitch defaultChecked={true} />
              </SettingRow>
              <SettingRow label="Jadwal Mendekati" desc="Pengingat sebelum jadwal maintenance dimulai">
                <ToggleSwitch defaultChecked={true} />
              </SettingRow>
              <SettingRow label="Laporan Mingguan" desc="Ringkasan kinerja dikirim setiap akhir minggu">
                <ToggleSwitch defaultChecked={false} />
              </SettingRow>
            </SettingSection>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex gap-6 h-full text-text-primary font-sans">
      
      {/* Left: Category Sidebar */}
      <div className="w-72 flex-shrink-0 bg-bg-surface rounded-xl border border-border-color shadow-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border-color bg-black/20">
          <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">Kategori Pengaturan</h3>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                  isActive 
                    ? 'bg-[#FF7043]/10 border-l-3 border-[#FF7043] text-text-primary' 
                    : 'hover:bg-btn-secondary/50 text-text-secondary hover:text-text-primary border-l-3 border-transparent'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-accent' : ''} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{cat.label}</div>
                </div>
                <ChevronRight size={14} className={`${isActive ? 'text-accent' : 'text-gray-600'}`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Settings Content */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto">
        {/* Content Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-text-primary">
              {CATEGORIES.find(c => c.id === activeCategory)?.label}
            </h2>
            <p className="text-sm text-text-secondary mt-1">
              {CATEGORIES.find(c => c.id === activeCategory)?.desc}
            </p>
          </div>
          <button 
            onClick={showSaved}
            className="bg-gradient-to-r from-accent to-accent-secondary hover:from-[#FF8A65] hover:to-[#FF5722] text-text-primary px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <Save size={18} />
            Simpan Pengaturan
          </button>
        </div>

        {/* Render active settings */}
        {renderContent()}

        {/* Saved Toast */}
        {saved && (
          <div className="fixed bottom-8 right-8 bg-green-600 text-text-primary px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-bounce">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            Pengaturan berhasil disimpan!
          </div>
        )}
      </div>
    </div>
  );
}

/* Reusable sub-components */
function SettingSection({ title, children }) {
  return (
    <div className="bg-bg-surface rounded-xl border border-border-color shadow-lg overflow-hidden">
      <div className="px-6 py-4 bg-black/20 border-b border-border-color">
        <h3 className="font-semibold text-text-primary text-sm uppercase tracking-wider">{title}</h3>
      </div>
      <div className="divide-y divide-gray-800">
        {children}
      </div>
    </div>
  );
}

function SettingRow({ label, desc, children }) {
  return (
    <div className="px-6 py-4 flex items-center justify-between gap-8">
      <div className="min-w-0">
        <div className="text-sm font-medium text-text-primary">{label}</div>
        <div className="text-xs text-text-secondary mt-0.5">{desc}</div>
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  );
}

function ToggleSwitch({ defaultChecked = false, disabled = false, size = 'md' }) {
  const [on, setOn] = useState(defaultChecked);
  
  const isSm = size === 'sm';
  const width = isSm ? 'w-8' : 'w-12';
  const height = isSm ? 'h-4' : 'h-6';
  const knob = isSm ? 'w-3 h-3' : 'w-5 h-5';
  
  return (
    <button 
      onClick={() => { if (!disabled) setOn(!on); }}
      disabled={disabled}
      className={`relative ${width} ${height} rounded-full transition-colors flex items-center px-0.5 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${on ? 'bg-[#FF7043]' : 'bg-gray-600'}`}
    >
      <div className={`bg-white rounded-full shadow transition-transform ${knob}`} style={{ transform: on ? `translateX(${isSm ? '16px' : '24px'})` : 'translateX(0)' }} />
    </button>
  );
}

/* Global style for settings inputs */
const styleTag = document.createElement('style');
styleTag.textContent = `
  .settings-input {
    background: #12161A;
    border: 1px solid #374151;
    border-radius: 8px;
    padding: 8px 12px;
    color: #E5E7EB;
    font-size: 0.875rem;
    font-family: 'Outfit', sans-serif;
    min-width: 200px;
    outline: none;
    transition: border-color 0.2s;
  }
  .settings-input:focus {
    border-color: #FF7043;
  }
  .border-l-3 {
    border-left-width: 3px;
  }
`;
document.head.appendChild(styleTag);

const root = createRoot(document.getElementById('root'));
root.render(<SettingsPage />);
