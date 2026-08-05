// dashboard.js - Script for rendering dashboard charts, calendar, and modal

document.addEventListener('DOMContentLoaded', () => {
  
  // === MOCK DATASETS ===
  const chartData = {
    mom: {
      assets: [210, 215, 230, 235, 240, 248],
      woDone: [80, 95, 90, 110, 115, 124],
      woDonePerc: '▲ 15%',
      overdue: [15, 12, 10, 14, 11, 8],
      woActive: [20, 25, 22, 28, 30, 32],
      woActivePerc: '24%'
    },
    yoy: {
      assets: [150, 180, 195, 210, 230, 248],
      woDone: [800, 950, 1100, 1250, 1300, 1420],
      woDonePerc: '▲ 22%',
      overdue: [40, 35, 28, 20, 15, 8],
      woActive: [10, 15, 18, 22, 28, 32],
      woActivePerc: '12%'
    }
  };

  const assetImg = 'https://via.placeholder.com/40/3b82f6/ffffff?text=AST';
  
  const mockAssets = [
    { id: 'M-CNC-01', eq: 'Mesin CNC Alpha', loc: 'Gedung Produksi A', next: '2026-08-15', status: 'Aktif', m: 8, y: 2026 },
    { id: 'G-001', eq: 'Genset Utama', loc: 'Ruang Mesin', next: '2026-08-20', status: 'Aktif', m: 8, y: 2026 },
    { id: 'AC-3', eq: 'HVAC Unit 3', loc: 'Lantai 4', next: '2026-09-05', status: 'Tidak Aktif', m: 9, y: 2026 },
    { id: 'POM-02', eq: 'Pompa Air Limbah', loc: 'Basement 2', next: '2026-08-25', status: 'Tidak Aktif', m: 8, y: 2026 }
  ];

  const mockWODone = [
    { id: 'M-CNC-01', eq: 'Mesin CNC Alpha', loc: 'Gedung Produksi A', desc: 'Penggantian Mata Bor', done: '2026-08-01', m: 8, y: 2026 },
    { id: 'G-001', eq: 'Genset Utama', loc: 'Ruang Mesin', desc: 'Inspeksi Filter Oli', done: '2026-08-02', m: 8, y: 2026 },
    { id: 'EL-02', eq: 'Elevator Penumpang 2', loc: 'Lobi Utama', desc: 'Kalibrasi Sensor Pintu', done: '2026-07-25', m: 7, y: 2026 }
  ];

  const mockOverdue = [
    { id: 'POM-01', eq: 'Pompa Air Bersih', loc: 'Basement', desc: 'Ganti Seal Karet', deadline: '2026-08-01', late: '3 Hari', status: 'Waiting on Parts', m: 8, y: 2026 },
    { id: 'TR-05', eq: 'Trafo Distribusi', loc: 'Substation B', desc: 'Pengecekan Suhu Rutin', deadline: '2026-07-28', late: '7 Hari', status: 'Open', m: 7, y: 2026 }
  ];

  const mockWOActive = [
    { id: 'M-CNC-02', eq: 'Mesin CNC Beta', loc: 'Gedung Produksi A', desc: 'Kalibrasi Sumbu Z', status: 'In Progress', m: 8, y: 2026 },
    { id: 'AC-1', eq: 'HVAC Unit 1', loc: 'Lantai 1', desc: 'Isi Ulang Freon', status: 'Waiting on Parts', m: 8, y: 2026 }
  ];

  const mockRecentWO = [
    { id: 'M-CNC-01', eq: 'Mesin CNC Alpha', loc: 'Gedung Produksi A', desc: 'Penggantian Mata Bor', tech: 'Budi Santoso', start: '2026-08-01', done: '2026-08-01' },
    { id: 'G-001', eq: 'Genset Utama', loc: 'Ruang Mesin', desc: 'Inspeksi Filter Oli', tech: 'Tim Mekanik A', start: '2026-08-02', done: '2026-08-02' },
    { id: 'AC-Sentral-3', eq: 'HVAC Unit 3', loc: 'Lantai 4', desc: 'Pembersihan Ducting', tech: 'Ahmad Ridwan', start: '2026-08-03', done: '2026-08-04' },
    { id: 'POM-01', eq: 'Pompa Air Bersih', loc: 'Basement', desc: 'Ganti Seal Karet', tech: 'Budi Santoso', start: '2026-08-10', done: '2026-08-12' },
    { id: 'TR-05', eq: 'Trafo Distribusi', loc: 'Substation B', desc: 'Pengecekan Suhu Rutin', tech: 'Tim Kelistrikan', start: '2026-08-15', done: '2026-08-15' },
    { id: 'M-CNC-03', eq: 'Mesin CNC Gamma', loc: 'Gedung Produksi B', desc: 'Reset Parameter Program', tech: 'Budi Santoso', start: '2026-08-16', done: '2026-08-16' },
    { id: 'EL-01', eq: 'Elevator Barang', loc: 'Lobi Belakang', desc: 'Pelumasan Rel Panduan', tech: 'Ahmad Ridwan', start: '2026-08-17', done: '2026-08-18' },
    { id: 'AC-2', eq: 'HVAC Unit 2', loc: 'Lantai 2', desc: 'Penggantian Kompresor', tech: 'Tim HVAC', start: '2026-08-18', done: '2026-08-20' },
    { id: 'GEN-02', eq: 'Genset Cadangan', loc: 'Ruang Mesin', desc: 'Ganti Aki Starter', tech: 'Tim Mekanik A', start: '2026-08-21', done: '2026-08-21' },
    { id: 'PNL-01', eq: 'Panel Listrik Utama', loc: 'Substation A', desc: 'Pembersihan Debu Panel', tech: 'Tim Kelistrikan', start: '2026-08-22', done: '2026-08-22' },
    { id: 'CVP-01', eq: 'Conveyor Utama', loc: 'Gedung Produksi A', desc: 'Ganti Sabuk Belt', tech: 'Budi Santoso', start: '2026-08-23', done: '2026-08-24' },
    { id: 'CVP-02', eq: 'Conveyor Sekunder', loc: 'Gedung Produksi B', desc: 'Kencangkan Rantai', tech: 'Tim Mekanik A', start: '2026-08-25', done: '2026-08-25' }
  ];

  // === CHART.JS SETUP ===
  Chart.defaults.color = '#94a3b8';
  Chart.defaults.font.family = 'Outfit';

  const commonOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false, min: 0 } },
    layout: { padding: 0 },
    elements: { line: { tension: 0.4, borderWidth: 2 }, point: { radius: 0 } }
  };

  const chartInstances = {};

  chartInstances.assets = new Chart(document.getElementById('chartAssets'), {
    type: 'line', data: { labels: [1,2,3,4,5,6], datasets: [{ data: chartData.mom.assets, borderColor: '#FFB302', backgroundColor: 'rgba(255, 179, 2, 0.1)', fill: true }] }, options: commonOptions
  });

  chartInstances.woDone = new Chart(document.getElementById('chartWODone'), {
    type: 'line', data: { labels: [1,2,3,4,5,6], datasets: [{ data: chartData.mom.woDone, borderColor: '#00ACC1', backgroundColor: 'rgba(0, 172, 193, 0.1)', fill: true }] }, options: commonOptions
  });

  chartInstances.overdue = new Chart(document.getElementById('chartOverdue'), {
    type: 'line', data: { labels: [1,2,3,4,5,6], datasets: [{ data: chartData.mom.overdue, borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)', fill: true }] }, options: commonOptions
  });

  chartInstances.woActive = new Chart(document.getElementById('chartWOActive'), {
    type: 'line', data: { labels: [1,2,3,4,5,6], datasets: [{ data: chartData.mom.woActive, borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', fill: true }] }, options: commonOptions
  });

  chartInstances.donut = new Chart(document.getElementById('donutChart'), {
    type: 'doughnut',
    data: {
      labels: ['Open', 'In Progress', 'Done', 'Waiting on Parts'],
      datasets: [{ data: [12, 32, 124, 8], backgroundColor: ['#64748b', '#3b82f6', '#10b981', '#f59e0b'], borderWidth: 0, hoverOffset: 4 }]
    },
    options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'right', labels: { padding: 20, color: '#000000' } } } }
  });

  window.updateDonutChart = function() {
    const month = parseInt(document.getElementById('donut-month').value);
    const year = parseInt(document.getElementById('donut-year').value);
    
    // Mock randomization based on month
    const baseData = [12, 32, 124, 8];
    const newData = baseData.map(v => v + (month === 8 ? Math.floor(Math.random() * 10 - 5) : 0));
    
    chartInstances.donut.data.datasets[0].data = newData;
    chartInstances.donut.update();
  };

  // Global Function for updating charts based on MoM / YoY toggle
  window.updateChartsData = function() {
    const type = document.getElementById('timeRangeToggle').value;
    const data = chartData[type];

    chartInstances.assets.data.datasets[0].data = data.assets;
    chartInstances.assets.update();

    chartInstances.woDone.data.datasets[0].data = data.woDone;
    chartInstances.woDone.update();
    document.getElementById('statWODonePerc').textContent = data.woDonePerc;

    chartInstances.overdue.data.datasets[0].data = data.overdue;
    chartInstances.overdue.update();

    chartInstances.woActive.data.datasets[0].data = data.woActive;
    chartInstances.woActive.update();
    document.getElementById('statWOActivePerc').textContent = data.woActivePerc;
  };

  // === MODAL LOGIC ===
  const modal = document.getElementById('detail-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalFiltersContainer = document.getElementById('modal-filters-container');
  const modalBody = document.getElementById('modal-body-container');

  let currentModalContext = null;
  let currentMonthFilter = 8;
  let currentYearFilter = 2026;
  let currentAssetStatusFilter = 'All'; // 'All', 'Aktif', 'Tidak Aktif'

  window.openModal = function(title, context, data = null) {
    modalTitle.textContent = title;
    currentModalContext = context;
    modalFiltersContainer.innerHTML = '';
    modalBody.innerHTML = '';

    if (context === 'calendar-day') {
      // Data is array of tasks
      let html = `<ul style="list-style: none; padding: 0; color: var(--text-primary);">`;
      if (data.length === 0) {
        html += `<li>Tidak ada jadwal maintenance.</li>`;
      } else {
        data.forEach(t => {
          let statusColor = '#94a3b8';
          if(t.status === 'Done') statusColor = '#FFD600';
          else if(t.status === 'In Progress') statusColor = '#3b82f6';
          else if(t.status === 'Waiting on Parts') statusColor = 'var(--status-warning)';
          
          html += `<li style="margin-bottom: 12px; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); background: rgba(255,255,255,0.02);">
            <div style="font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="display:inline-block; width:12px; height:12px; border-radius:50%;" class="${t.color}"></span>
                ${t.type}
              </div>
              <span style="font-size: 0.8rem; padding: 2px 8px; border-radius: 4px; background: rgba(0,0,0,0.05); color: ${statusColor};">${t.status}</span>
            </div>
            <div style="color: var(--text-secondary); font-size: 0.9rem;">${t.desc}</div>
          </li>`;
        });
      }
      html += `</ul>`;
      modalBody.innerHTML = html;
    } else {
      // It's a Stat Card Modal -> Render Filters and Table
      if (context === 'assets') {
        currentAssetStatusFilter = 'All';
        modalFiltersContainer.innerHTML = ''; // No date filters for Total Assets
      } else {
        modalFiltersContainer.innerHTML = `
          <select id="modal-month" class="modal-filter-select" onchange="applyModalFilter()">
            <option value="7" ${currentMonthFilter == 7 ? 'selected' : ''}>Juli</option>
            <option value="8" ${currentMonthFilter == 8 ? 'selected' : ''}>Agustus</option>
            <option value="9" ${currentMonthFilter == 9 ? 'selected' : ''}>September</option>
          </select>
          <select id="modal-year" class="modal-filter-select" onchange="applyModalFilter()">
            <option value="2025" ${currentYearFilter == 2025 ? 'selected' : ''}>2025</option>
            <option value="2026" ${currentYearFilter == 2026 ? 'selected' : ''}>2026</option>
          </select>
        `;
      }
      renderModalTable();
    }
    
    modal.classList.add('active');
  };

  window.applyModalFilter = function() {
    currentMonthFilter = parseInt(document.getElementById('modal-month').value);
    currentYearFilter = parseInt(document.getElementById('modal-year').value);
    renderModalTable();
  };

  window.setAssetStatusFilter = function(status) {
    currentAssetStatusFilter = status;
    renderModalTable();
  };

  function renderModalTable() {
    let dataset = [];
    let thead = '';
    let tbody = '';
    let contentHtml = '';

    if (currentModalContext === 'assets') {
      // Assets are no longer filtered by month/year here, we show ALL from mockAssets
      let filteredAssets = mockAssets;
      
      let countAktif = filteredAssets.filter(d => d.status === 'Aktif').length;
      let countTidakAktif = filteredAssets.filter(d => d.status === 'Tidak Aktif').length;
      
      if (currentAssetStatusFilter !== 'All') {
        filteredAssets = filteredAssets.filter(d => d.status === currentAssetStatusFilter);
      }
      
      dataset = filteredAssets;
      thead = `<tr><th>No</th><th>Gambar</th><th>ID Asset</th><th>Equipment</th><th>Lokasi</th><th>Status</th><th>Next Maintenance</th></tr>`;
      dataset.forEach((d, i) => {
        const statusColor = d.status === 'Aktif' ? 'var(--status-success)' : 'var(--status-error)';
        tbody += `<tr><td>${i+1}</td><td><img src="${assetImg}" class="asset-thumb"></td><td>${d.id}</td><td>${d.eq}</td><td>${d.loc}</td><td style="color:${statusColor}; font-weight:600;">${d.status}</td><td>${d.next}</td></tr>`;
      });
      
      // Inject Summary Buttons above the table
      const activeBtnStyle = currentAssetStatusFilter === 'Aktif' ? 'border: 2px solid var(--status-success);' : 'border: 1px solid var(--border-color);';
      const inactiveBtnStyle = currentAssetStatusFilter === 'Tidak Aktif' ? 'border: 2px solid var(--status-error);' : 'border: 1px solid var(--border-color);';
      const allBtnStyle = currentAssetStatusFilter === 'All' ? 'border: 2px solid var(--accent-primary);' : 'border: 1px solid var(--border-color);';
      
      contentHtml += `
        <div style="display: flex; gap: 12px; margin-bottom: 20px;">
          <button onclick="setAssetStatusFilter('All')" style="padding: 12px 20px; border-radius: 8px; background: var(--bg-color); color: var(--text-primary); cursor: pointer; ${allBtnStyle}">Semua Asset (${countAktif + countTidakAktif})</button>
          <button onclick="setAssetStatusFilter('Aktif')" style="padding: 12px 20px; border-radius: 8px; background: rgba(16, 185, 129, 0.1); color: var(--status-success); font-weight: 600; cursor: pointer; ${activeBtnStyle}">Asset Aktif (${countAktif})</button>
          <button onclick="setAssetStatusFilter('Tidak Aktif')" style="padding: 12px 20px; border-radius: 8px; background: rgba(239, 68, 68, 0.1); color: var(--status-error); font-weight: 600; cursor: pointer; ${inactiveBtnStyle}">Asset Tidak Aktif (${countTidakAktif})</button>
        </div>
      `;
    } else if (currentModalContext === 'wodone') {
      dataset = mockWODone.filter(d => d.m === currentMonthFilter && d.y === currentYearFilter);
      thead = `<tr><th>No</th><th>Gambar</th><th>ID Asset</th><th>Equipment</th><th>Lokasi</th><th>Description</th><th>Done Date</th></tr>`;
      dataset.forEach((d, i) => {
        tbody += `<tr><td>${i+1}</td><td><img src="${assetImg}" class="asset-thumb"></td><td>${d.id}</td><td>${d.eq}</td><td>${d.loc}</td><td>${d.desc}</td><td>${d.done}</td></tr>`;
      });
    } else if (currentModalContext === 'overdue') {
      dataset = mockOverdue.filter(d => d.m === currentMonthFilter && d.y === currentYearFilter);
      thead = `<tr><th>No</th><th>Gambar</th><th>ID Asset</th><th>Equipment</th><th>Lokasi</th><th>Description</th><th>Deadline</th><th>Terlambat</th><th>Status</th></tr>`;
      dataset.forEach((d, i) => {
        tbody += `<tr><td>${i+1}</td><td><img src="${assetImg}" class="asset-thumb"></td><td>${d.id}</td><td>${d.eq}</td><td>${d.loc}</td><td>${d.desc}</td><td>${d.deadline}</td><td style="color:var(--status-error);font-weight:600;">${d.late}</td><td>${d.status}</td></tr>`;
      });
    } else if (currentModalContext === 'active') {
      dataset = mockWOActive.filter(d => d.m === currentMonthFilter && d.y === currentYearFilter);
      thead = `<tr><th>No</th><th>Gambar</th><th>ID Asset</th><th>Equipment</th><th>Lokasi</th><th>Description</th><th>Status</th></tr>`;
      dataset.forEach((d, i) => {
        tbody += `<tr><td>${i+1}</td><td><img src="${assetImg}" class="asset-thumb"></td><td>${d.id}</td><td>${d.eq}</td><td>${d.loc}</td><td>${d.desc}</td><td>${d.status}</td></tr>`;
      });
    }

    if (dataset.length === 0) {
      contentHtml += `<div style="text-align:center; padding: 40px; color: var(--text-secondary);">Tidak ada data pada periode ini.</div>`;
    } else {
      contentHtml += `
        <div class="table-responsive" style="max-height: 350px; overflow-y: auto;">
          <table class="data-table" style="margin: 0; table-layout: fixed; width: 100%;">
            <thead style="position: sticky; top: 0; background: var(--bg-surface); z-index: 10;">${thead}</thead>
            <tbody>${tbody}</tbody>
          </table>
        </div>
      `;
    }
    
    modalBody.innerHTML = contentHtml;
  }

  window.closeModal = function(e, force = false) {
    if (force || e.target === modal) {
      modal.classList.remove('active');
    }
  };

  // === RECENT WO FILTER & PAGINATION LOGIC ===
  let recentWOCurrentPage = 1;
  const recentWOItemsPerPage = 9;

  window.changeRecentWOPage = function(direction) {
    recentWOCurrentPage += direction;
    filterRecentWO(false);
  };

  window.filterRecentWO = function(resetPage = true) {
    if (resetPage) recentWOCurrentPage = 1;
    
    const startVal = document.getElementById('filter-start').value;
    const endVal = document.getElementById('filter-end').value;
    const tbody = document.getElementById('recent-wo-tbody');
    const pageInfo = document.getElementById('recent-wo-page-info');
    
    if (!tbody) return;

    let filtered = mockRecentWO;

    if (startVal) {
      filtered = filtered.filter(wo => new Date(wo.done) >= new Date(startVal));
    }
    if (endVal) {
      filtered = filtered.filter(wo => new Date(wo.done) <= new Date(endVal));
    }
    
    // Pagination slicing
    const totalPages = Math.max(1, Math.ceil(filtered.length / recentWOItemsPerPage));
    if (recentWOCurrentPage < 1) recentWOCurrentPage = 1;
    if (recentWOCurrentPage > totalPages) recentWOCurrentPage = totalPages;
    
    if (pageInfo) {
      pageInfo.textContent = `Page ${recentWOCurrentPage} of ${totalPages} (${filtered.length} items)`;
    }

    const startIndex = (recentWOCurrentPage - 1) * recentWOItemsPerPage;
    const paginated = filtered.slice(startIndex, startIndex + recentWOItemsPerPage);

    let html = '';
    if (paginated.length === 0) {
      html = `<tr><td colspan="8" style="text-align:center; padding: 20px; color: var(--text-secondary);">Tidak ada Work Order pada rentang tanggal ini.</td></tr>`;
    } else {
      paginated.forEach((d, i) => {
        const globalIndex = startIndex + i + 1;
        html += `<tr>
          <td>${globalIndex}</td>
          <td>${d.id}</td>
          <td>${d.eq}</td>
          <td>${d.loc}</td>
          <td>${d.desc}</td>
          <td>${d.tech}</td>
          <td>${d.start}</td>
          <td>${d.done}</td>
        </tr>`;
      });
      // Pad empty rows to maintain fixed height (5 items per page)
      const emptyRowsCount = recentWOItemsPerPage - paginated.length;
      for (let j = 0; j < emptyRowsCount; j++) {
        html += `<tr><td colspan="8" style="height: 52px; border-bottom: 1px solid transparent;"></td></tr>`;
      }
    }
    tbody.innerHTML = html;
  };
  
  // Initial render of Recent WO table
  if (document.getElementById('recent-wo-tbody')) {
    filterRecentWO();
  }


  // === EMPLOYEES ON-SITE MOCK DATA & RENDER ===
  const mockEmployees = [
    { nik: 'EMP-001', name: 'Budi Santoso', pos: 'Teknisi Mekanik', onSite: true }
  ];

  function renderEmployees() {
    const tbody = document.getElementById('employee-tbody');
    if (!tbody) return;
    
    let html = '';
    mockEmployees.forEach(emp => {
      const dotColor = emp.onSite ? 'var(--status-success)' : 'var(--status-danger)';
      html += `<tr>
        <td style="text-align: center;">
          <span style="display:inline-block; width:10px; height:10px; border-radius:50%; background-color: ${dotColor};"></span>
        </td>
        <td>${emp.nik}</td>
        <td>${emp.name}</td>
        <td>${emp.pos}</td>
      </tr>`;
    });
    tbody.innerHTML = html;
  }

  if (document.getElementById('employee-tbody')) {
    renderEmployees();
  }

  // === CALENDAR GENERATOR ===
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  let currentCalMonth = 7; // Default to Agustus
  let currentCalYear = 2026;

  window.changeCalendarMonth = function(action) {
    if (action === 'prev') {
      currentCalMonth--;
      if (currentCalMonth < 0) { currentCalMonth = 11; currentCalYear--; }
    } else if (action === 'next') {
      currentCalMonth++;
      if (currentCalMonth > 11) { currentCalMonth = 0; currentCalYear++; }
    } else if (action === 'today') {
      const now = new Date();
      currentCalMonth = now.getMonth();
      currentCalYear = now.getFullYear();
    } else if (action === 'filter') {
      currentCalMonth = parseInt(document.getElementById('cal-month').value);
      currentCalYear = parseInt(document.getElementById('cal-year').value);
    }
    
    // Sync dropdowns with current state
    const monthSelect = document.getElementById('cal-month');
    if (monthSelect) monthSelect.value = currentCalMonth;
    
    const yearSelect = document.getElementById('cal-year');
    if (yearSelect) {
      let yearOptionExists = Array.from(yearSelect.options).some(opt => parseInt(opt.value) === currentCalYear);
      if(yearOptionExists) {
        yearSelect.value = currentCalYear;
      }
    }

    renderCalendar();
  };

  const calTasks = {
    3: [
      { type: 'Daily', color: 'bg-daily', desc: 'Pengecekan harian pada panel listrik utama.', status: 'Done' },
      { type: 'Monthly', color: 'bg-monthly', desc: 'Audit bulanan mesin produksi.', status: 'Done' }
    ],
    5: [{ type: 'Weekly', color: 'bg-weekly', desc: 'Pembersihan mingguan filter HVAC.', status: 'Open' }],
    10: [{ type: 'Monthly', color: 'bg-monthly', desc: 'Inspeksi kualitas fluida hidrolik.', status: 'Waiting on Parts' }],
    12: [{ type: 'Daily', color: 'bg-daily', desc: 'Pengecekan harian suhu genset.', status: 'Done' }],
    15: [
      { type: 'Quarterly', color: 'bg-quarterly', desc: 'Servis rutin kuartalan untuk elevator.', status: 'Done' },
      { type: 'Weekly', color: 'bg-weekly', desc: 'Pengecekan pelumas rantai konveyor.', status: 'In Progress' }
    ],
    22: [{ type: 'Semesteran', color: 'bg-semester', desc: 'Inspeksi keselamatan dan kelistrikan gedung semesteran.', status: 'Open' }],
    28: [{ type: 'Annual', color: 'bg-annual', desc: 'Evaluasi performa mesin CNC tahunan.', status: 'Done' }],
    30: [{ type: 'Quinquennial', color: 'bg-quinquennial', desc: 'Overhaul besar-besaran mesin turbin (5 Tahunan).', status: 'In Progress' }]
  };

  function renderCalendar() {
    const calendarGrid = document.querySelector('.calendar-grid');
    if (!calendarGrid) return;

    const titleEl = document.getElementById('calendar-month-year');
    if (titleEl) {
      titleEl.textContent = `- ${monthNames[currentCalMonth]} ${currentCalYear}`;
    }
    
    // Clear existing days but keep the 7 header days
    const headers = Array.from(calendarGrid.querySelectorAll('.calendar-day-name'));
    calendarGrid.innerHTML = '';
    headers.forEach(h => calendarGrid.appendChild(h));

    // Calculate real prefix and total days
    const firstDay = new Date(currentCalYear, currentCalMonth, 1).getDay(); // 0 is Sunday
    const prefixEmptyDays = firstDay === 0 ? 6 : firstDay - 1; // Convert to Monday start
    const totalDays = new Date(currentCalYear, currentCalMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentCalYear, currentCalMonth, 0).getDate();
    const totalCells = 42;
    
    const prevMonthStr = monthNames[currentCalMonth === 0 ? 11 : currentCalMonth - 1].substring(0, 3);
    const currMonthStr = monthNames[currentCalMonth].substring(0, 3);
    const nextMonthStr = monthNames[currentCalMonth === 11 ? 0 : currentCalMonth + 1].substring(0, 3);

    // 1. Previous month's days
    for (let i = 0; i < prefixEmptyDays; i++) {
      const el = document.createElement('div');
      el.className = 'calendar-day';
      el.style.opacity = '0.4'; 
      el.style.color = 'var(--text-muted, #94a3b8)';
      
      const numEl = document.createElement('div');
      numEl.className = 'date-num';
      numEl.textContent = `${prevMonthDays - prefixEmptyDays + 1 + i} ${prevMonthStr}`;
      el.appendChild(numEl);
      
      calendarGrid.appendChild(el);
    }

    const now = new Date();
    const isCurrentMonth = now.getMonth() === currentCalMonth && now.getFullYear() === currentCalYear;

    // 2. Current month's days
    for (let day = 1; day <= totalDays; day++) {
      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-day';
      dayEl.style.cursor = 'pointer';
      
      if (isCurrentMonth && day === now.getDate()) {
        dayEl.classList.add('today'); 
      }

      const numEl = document.createElement('div');
      numEl.className = 'date-num';
      numEl.textContent = day === 1 ? `1 ${currMonthStr}` : day;
      dayEl.appendChild(numEl);

      // Only show mock tasks for August 2026
      let taskList = [];
      if (currentCalMonth === 7 && currentCalYear === 2026) {
        taskList = calTasks[day] || [];
      }

      if (taskList.length > 0) {
        // If all tasks are done, color the cell Industrial Yellow
        const allDone = taskList.every(t => t.status === 'Done');
        if (allDone) {
          dayEl.style.backgroundColor = 'rgba(255, 214, 0, 0.15)';
          dayEl.style.border = '1px solid rgba(255, 214, 0, 0.4)';
        }

        taskList.forEach(t => {
          const taskEl = document.createElement('div');
          taskEl.className = `task-block ${t.color}`;
          taskEl.textContent = t.type;
          dayEl.appendChild(taskEl);
        });
      }

      dayEl.onclick = () => {
        openModal(`Agenda Tanggal ${day} ${monthNames[currentCalMonth]} ${currentCalYear}`, 'calendar-day', taskList);
      };

      calendarGrid.appendChild(dayEl);
    }
    
    // 3. Next month's days to fill up to 42 cells
    const remainingCells = totalCells - prefixEmptyDays - totalDays;
    for (let i = 1; i <= remainingCells; i++) {
      const el = document.createElement('div');
      el.className = 'calendar-day';
      el.style.opacity = '0.4';
      el.style.color = 'var(--text-muted, #94a3b8)';
      
      const numEl = document.createElement('div');
      numEl.className = 'date-num';
      numEl.textContent = `${i} ${nextMonthStr}`;
      el.appendChild(numEl);
      
      calendarGrid.appendChild(el);
    }
  }

  // Initial render
  if (document.querySelector('.calendar-grid')) {
    renderCalendar();
  }

});
