const fs = require('fs');
const path = require('path');

const directory = __dirname;
const htmlFiles = fs.readdirSync(directory).filter(file => file.endsWith('.html') && file !== 'login.html');

const standardSidebar = `
        <a href="/dashboard.html" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
          Dashboard
        </a>
        <a href="/asset-register.html" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          Asset Register
        </a>
        <div class="nav-item-group" id="warehouse-nav-group">
          <div class="nav-item-header" onclick="this.parentElement.classList.toggle('expanded')">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"></line><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            Warehouse &amp; Sparepart
            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
          <div class="nav-submenu">
            <a href="/warehouse.html" class="nav-item" style="height:36px;font-size:0.85rem">Dashboard Warehouse</a>
            <a href="/data-barang.html" class="nav-item" style="height:36px;font-size:0.85rem">Data Barang</a>
            <a href="/data-gudang.html" class="nav-item" style="height:36px;font-size:0.85rem">Data Gudang</a>
            <a href="/transaksi-gudang.html" class="nav-item" style="height:36px;font-size:0.85rem">Transaksi Gudang</a>
            <a href="/perkakas.html" class="nav-item" style="height:36px;font-size:0.85rem">Gudang Perkakas</a>
            <a href="/data-alat.html" class="nav-item" style="height:36px;font-size:0.85rem">Data Alat (Perkakas)</a>
            <a href="/logistic-request.html" class="nav-item" style="height:36px;font-size:0.85rem">Permintaan Logistik</a>
          </div>
        </div>
        <div class="nav-item-group" id="maintenance-nav-group">
          <div class="nav-item-header" onclick="this.parentElement.classList.toggle('expanded')">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            Maintenance Planning
            <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </div>
          <div class="nav-submenu">
            <a href="/maintenance-planning.html" class="nav-item" style="height:36px;font-size:0.85rem">Perencanaan Maintenance</a>
            <a href="/maintenance-schedule.html" class="nav-item" style="height:36px;font-size:0.85rem">Jadwal Maintenance</a>
            <a href="/list-task.html" class="nav-item" style="height:36px;font-size:0.85rem">Task List</a>
            <a href="/report-task-list.html" class="nav-item" style="height:36px;font-size:0.85rem">Report Task List</a>
            <a href="/work-order.html" class="nav-item" style="height:36px;font-size:0.85rem">Work Order</a>
          </div>
        </div>
        <a href="/report.html" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          Report
        </a>
        <a href="/pekerja.html" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          Pekerja
        </a>
        <a href="/settings.html" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          Pengaturan
        </a>
`;

const warehousePages = ['warehouse.html', 'data-barang.html', 'data-gudang.html', 'transaksi-gudang.html', 'perkakas.html', 'data-alat.html', 'logistic-request.html'];
const maintenancePages = ['maintenance-planning.html', 'maintenance-schedule.html', 'list-task.html', 'report-task-list.html', 'work-order.html'];

htmlFiles.forEach(file => {
  const filePath = path.join(directory, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  const regex = /(<nav class="nav-menu">)([\s\S]*?)(<\/nav>)/;

  if (regex.test(content)) {
    let newMenuContent = standardSidebar;

    const targetFile = `/${file}`;

    // Mark active item
    const lines = newMenuContent.split('\n');
    let warehouseGroupActive = false;
    let maintenanceGroupActive = false;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(`href="${targetFile}"`) || lines[i].includes(`href="${file}"`)) {
        lines[i] = lines[i]
          .replace('class="nav-item"', 'class="nav-item active"')
          .replace('class="nav-item" style=', 'class="nav-item active" style=');

        if (warehousePages.includes(file)) warehouseGroupActive = true;
        if (maintenancePages.includes(file)) maintenanceGroupActive = true;
      }
    }

    newMenuContent = lines.join('\n');

    if (warehouseGroupActive) {
      newMenuContent = newMenuContent.replace(
        'class="nav-item-group" id="warehouse-nav-group"',
        'class="nav-item-group expanded" id="warehouse-nav-group"'
      );
    }

    if (maintenanceGroupActive) {
      newMenuContent = newMenuContent.replace(
        'class="nav-item-group" id="maintenance-nav-group"',
        'class="nav-item-group expanded" id="maintenance-nav-group"'
      );
    }

    content = content.replace(regex, `$1${newMenuContent}$3`);
    fs.writeFileSync(filePath, content);
    console.log(`Updated sidebar in ${file}`);
  } else {
    console.log(`Skipped (no nav-menu found): ${file}`);
  }
});
