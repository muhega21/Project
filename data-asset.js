// data-asset.js - Logic for Data Asset Table UI

const dummyAssets = [
  { id: 'AST-001', name: 'Kompresor Udara 500L', category: 'Mesin Industri', location: 'PLT-001 (Utama)', status: 'Active' },
  { id: 'AST-002', name: 'Genset Cummins 200kVA', category: 'Kelistrikan', location: 'PLT-001 (Utama)', status: 'Maintenance' },
  { id: 'AST-003', name: 'Forklift Toyota 3-Ton', category: 'Kendaraan Berat', location: 'PLT-002 (Gudang)', status: 'Active' },
  { id: 'AST-004', name: 'Mesin Bubut CNC', category: 'Mesin Produksi', location: 'PLT-001 (Utama)', status: 'Inactive' },
  { id: 'AST-005', name: 'Pompa Air Sentrifugal', category: 'Sistem Fluida', location: 'PLT-003 (Samping)', status: 'Active' }
];

document.addEventListener('DOMContentLoaded', () => {
  renderAssetTable();
});

function renderAssetTable() {
  const tbody = document.getElementById('asset-table-body');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  dummyAssets.forEach(asset => {
    const tr = document.createElement('tr');
    tr.style.borderBottom = '1px solid var(--border-color)';
    tr.style.transition = 'background-color 0.2s';
    
    // Hover effect using JS or we can add a class
    tr.addEventListener('mouseenter', () => tr.style.backgroundColor = 'rgba(255,255,255,0.02)');
    tr.addEventListener('mouseleave', () => tr.style.backgroundColor = 'transparent');
    
    let statusColor = '#9CA3AF';
    let statusBg = 'rgba(156, 163, 175, 0.1)';
    
    if (asset.status === 'Active') {
      statusColor = '#10B981';
      statusBg = 'rgba(16, 185, 129, 0.1)';
    } else if (asset.status === 'Maintenance') {
      statusColor = '#F59E0B';
      statusBg = 'rgba(245, 158, 11, 0.1)';
    } else if (asset.status === 'Inactive') {
      statusColor = '#EF4444';
      statusBg = 'rgba(239, 68, 68, 0.1)';
    }
    
    tr.innerHTML = `
      <td style="padding: 16px; color: var(--text-primary); font-weight: 500;">${asset.id}</td>
      <td style="padding: 16px;">${asset.name}</td>
      <td style="padding: 16px; color: var(--text-secondary);">${asset.category}</td>
      <td style="padding: 16px; color: var(--text-secondary);">${asset.location}</td>
      <td style="padding: 16px;">
        <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; color: ${statusColor}; background-color: ${statusBg};">
          ${asset.status}
        </span>
      </td>
      <td style="padding: 16px; text-align: center;">
        <button style="background: none; border: none; color: #3B82F6; cursor: pointer; padding: 6px; border-radius: 4px;" title="Edit Asset">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </button>
        <button style="background: none; border: none; color: #EF4444; cursor: pointer; padding: 6px; border-radius: 4px;" title="Hapus Asset">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </td>
    `;
    
    tbody.appendChild(tr);
  });
}

function openAssetModal() {
  alert('Fitur Tambah Asset akan segera hadir!');
}
