// src/auth-guard.js

// Definisi Hak Akses Menu (Sama seperti di Pengaturan)
// [Dashboard, Asset Reg, Warehouse, Maintenance Planning, Report, Pekerja, Pengaturan]
const ROLE_ACCESS = {
  'Administrator': [1,1,1,1,1,1,1],
  'Supervisor':    [1,1,1,1,1,1,0],
  'Admin':         [1,1,1,1,1,0,0],
  'Visitor':       [1,0,0,0,1,0,0],
  'Foreman':       [1,0,1,1,1,1,0],
  'Warehouse':     [1,0,1,0,0,0,0],
  'Teknisi':       [1,1,0,1,0,0,0]
};

const MENU_LINKS = [
  '/dashboard.html',
  '/asset-register.html',
  '/warehouse.html', // Master link for group
  '/maintenance-planning.html', // Master link for group
  '/report.html',
  '/pekerja.html',
  '/settings.html'
];

document.addEventListener('DOMContentLoaded', () => {
  // 1. Ambil Role dari Local Storage
  const userRole = localStorage.getItem('userRole') || 'Administrator';
  const userName = localStorage.getItem('userName') || 'Admin User';
  
  // 2. Saring Menu Navigasi
  const accessArray = ROLE_ACCESS[userRole] || ROLE_ACCESS['Administrator'];
  const navMenu = document.querySelector('.nav-menu');
  
  if (navMenu) {
    // Ambil top-level items: a.nav-item yang langsung di dalam .nav-menu DAN .nav-item-group
    const topLevelItems = Array.from(navMenu.children).filter(el => 
      (el.tagName === 'A' && el.classList.contains('nav-item')) || 
      el.classList.contains('nav-item-group')
    );
    
    topLevelItems.forEach((item, index) => {
      // Jika index valid dan bernilai 0, sembunyikan menu
      if (index < accessArray.length && accessArray[index] === 0) {
        item.style.display = 'none';
      }
    });
  }

  // 3. Update Profil Pengguna di Header
  const userProfile = document.querySelector('.user-profile');
  if (userProfile) {
    const nameDiv = userProfile.querySelector('div[style*="font-weight: 600"]');
    const roleDiv = userProfile.querySelector('div[style*="font-size: 0.85rem"]');
    const avatar = userProfile.querySelector('.avatar');
    
    if (nameDiv) nameDiv.textContent = userName;
    if (roleDiv) roleDiv.textContent = userRole;
    if (avatar) avatar.textContent = userName.charAt(0).toUpperCase();
  }

  // 4. Kustomisasi Landing Page (Dashboard Khusus)
  if (window.location.pathname.endsWith('dashboard.html') || window.location.pathname === '/') {
    const headerTitle = document.querySelector('.topbar h1');
    const headerDesc = document.querySelector('.topbar p');
    
    if (headerTitle) {
      if (userRole === 'Teknisi') {
        headerTitle.textContent = `Selamat Bekerja, ${userName}!`;
        if (headerDesc) headerDesc.textContent = "Berikut adalah tugas teknis Anda hari ini.";
      } else if (userRole === 'Warehouse') {
        headerTitle.textContent = "Dashboard Pergudangan";
        if (headerDesc) headerDesc.textContent = "Ringkasan stok barang dan suku cadang.";
      } else if (userRole === 'Supervisor') {
        headerTitle.textContent = "Dashboard Supervisi";
        if (headerDesc) headerDesc.textContent = "Pantau pergerakan pekerja dan laporan operasional.";
      } else {
        headerTitle.textContent = "Ringkasan Operasional";
        if (headerDesc) headerDesc.textContent = `Pusat Kendali - Mode ${userRole}`;
      }
    }
    
    // Sembunyikan elemen dashboard yang tidak relevan dengan Role (Mockup Logic)
    if (userRole === 'Teknisi' || userRole === 'Warehouse' || userRole === 'Visitor') {
      const metricCards = document.getElementById('quick-stats');
      if (metricCards && userRole !== 'Warehouse') {
        // Teknisi tidak perlu melihat Total Aset dsb
        metricCards.style.display = 'none';
      }
    }
  }

  // 5. Validasi Akses Halaman (Redirect jika mencoba akses URL terlarang)
  const currentPath = window.location.pathname;
  const menuIndex = MENU_LINKS.findIndex(link => currentPath.endsWith(link));
  
  if (menuIndex !== -1 && accessArray[menuIndex] === 0) {
    // Pengguna tidak memiliki akses ke halaman ini
    alert(`Akses Ditolak! Role '${userRole}' tidak memiliki izin ke halaman ini.`);
    window.location.href = 'dashboard.html';
  }
});
