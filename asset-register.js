// asset-register.js - Logic for Plant Grid UI

const defaultPlants = [
  {
    code: 'PLT-102',
    name: 'Karawang Assembly Plant',
    company: 'PT. MaintainX Manufacturing',
    location: 'Kawasan Industri KIIC, Jawa Barat',
    owner: 'Budi Santoso',
    bgImage: 'https://images.unsplash.com/photo-1565515261739-16628fb68770?q=80&w=600&auto=format&fit=crop'
  },
  {
    code: 'PLT-088',
    name: 'Cikarang Distribution Hub',
    company: 'PT. MaintainX Logistics',
    location: 'Cikarang Dry Port, Bekasi',
    owner: 'Siti Rahma',
    bgImage: null
  },
  {
    code: 'PLT-215',
    name: 'Surabaya Heavy Machining',
    company: 'PT. MaintainX Heavy Ind.',
    location: 'Kawasan SIER, Jawa Timur',
    owner: 'Ahmad Fauzi',
    bgImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600&auto=format&fit=crop'
  },
  {
    code: 'PLT-042',
    name: 'Batam Electronics Facility',
    company: 'PT. MaintainX Electronics',
    location: 'Batamindo Industrial Park, Kepri',
    owner: 'Dewi Kusuma',
    bgImage: null
  },
  {
    code: 'PLT-110',
    name: 'Tangerang Packaging Unit',
    company: 'PT. MaintainX Packaging',
    location: 'Kawasan Industri Jatake, Banten',
    owner: 'Rudi Hermawan',
    bgImage: null
  }
];

let mockPlants = [];
let currentTargetCode = null;
let tempImageBase64 = null;

// ==========================================
// KNOWN COMPANIES (for dropdown matching)
// ==========================================
const KNOWN_COMPANIES = [
  'PT. MaintainX Manufacturing',
  'PT. MaintainX Logistics',
  'PT. MaintainX Heavy Ind.',
  'PT. MaintainX Electronics',
  'PT. MaintainX Packaging'
];

// ==========================================
// INITIALIZE ON DOM READY
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // Load plants from localStorage
  const saved = localStorage.getItem('maintainx_plants');
  if (saved) {
    try {
      mockPlants = JSON.parse(saved);
    } catch(e) {
      mockPlants = [...defaultPlants];
    }
  } else {
    mockPlants = [...defaultPlants];
    localStorage.setItem('maintainx_plants', JSON.stringify(mockPlants));
  }

  renderPlantGrid();
  setupGridClicks();
  setupDeleteModal();
  setupPlantModal();
});

// ==========================================
// GRID CLICK DELEGATION
// ==========================================
function setupGridClicks() {
  const container = document.getElementById('plant-grid-container');
  if (!container) return;

  container.addEventListener('click', (e) => {
    // Kebab toggle
    const kebabToggle = e.target.closest('.kebab-toggle');
    if (kebabToggle) {
      e.stopPropagation();
      const code = kebabToggle.getAttribute('data-code');
      const dropdown = document.getElementById(`dropdown-${code}`);
      const isShowing = dropdown.classList.contains('show');
      document.querySelectorAll('.kebab-dropdown.show').forEach(el => el.classList.remove('show'));
      if (!isShowing) dropdown.classList.add('show');
      return;
    }

    // Edit action
    const editAction = e.target.closest('.action-edit');
    if (editAction) {
      e.stopPropagation();
      document.querySelectorAll('.kebab-dropdown.show').forEach(el => el.classList.remove('show'));
      openPlantModal(editAction.getAttribute('data-code'));
      return;
    }



    // Delete action
    const deleteAction = e.target.closest('.action-delete');
    if (deleteAction) {
      e.stopPropagation();
      document.querySelectorAll('.kebab-dropdown.show').forEach(el => el.classList.remove('show'));
      openDeleteModal(deleteAction.getAttribute('data-code'));
      return;
    }

    // Card click → navigate
    const card = e.target.closest('.plant-card');
    if (card && !e.target.closest('.kebab-toggle') && !e.target.closest('.kebab-dropdown')) {
      const code = card.getAttribute('data-code');
      if (code) window.location.href = `/layout-area.html?code=${code}`;
    }
  });

  // Close dropdowns when clicking outside grid
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.kebab-toggle') && !e.target.closest('.kebab-dropdown')) {
      document.querySelectorAll('.kebab-dropdown.show').forEach(el => el.classList.remove('show'));
    }
  });
}

// ==========================================
// RENDER GRID
// ==========================================
function renderPlantGrid() {
  const container = document.getElementById('plant-grid-container');
  if (!container) return;

  container.innerHTML = '';

  mockPlants.forEach(plant => {
    const card = document.createElement('div');
    card.className = 'plant-card relative';
    card.setAttribute('data-code', plant.code);
    card.style.cursor = 'pointer';

    let imgHtml = '';
    if (plant.bgImage) {
      card.classList.add('with-bg');
      imgHtml = `<img src="${plant.bgImage}" alt="${plant.name}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0;" />
                 <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.95)); z-index: 1;"></div>`;
    }

    card.innerHTML = `
      ${imgHtml}
      <div class="card-kebab kebab-toggle" data-code="${plant.code}" style="z-index: 3;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="12" r="2"></circle><circle cx="12" cy="12" r="2"></circle><circle cx="19" cy="12" r="2"></circle></svg>
      </div>
      <div class="kebab-dropdown" id="dropdown-${plant.code}">
        <a class="dropdown-item action-edit" data-code="${plant.code}" href="javascript:void(0)" title="Edit">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        </a>
        <a class="dropdown-item text-red action-delete" data-code="${plant.code}" href="javascript:void(0)" title="Hapus">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
        </a>
      </div>
      <p class="plant-code">${plant.code}</p>
      <div class="plant-details">
        <p class="plant-name">${plant.name}</p>
        <p class="plant-company">${plant.company}</p>
        <p class="plant-location">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-top:-2px"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          ${plant.location}
        </p>
      </div>
    `;

    container.appendChild(card);
  });
}

// ==========================================
// SAVE TO LOCALSTORAGE
// ==========================================
function savePlants() {
  localStorage.setItem('maintainx_plants', JSON.stringify(mockPlants));
}

// ==========================================
// DELETE MODAL
// ==========================================
function openDeleteModal(code) {
  currentTargetCode = code;
  document.getElementById('delete-modal').classList.add('show');
}

function closeDeleteModal() {
  currentTargetCode = null;
  document.getElementById('delete-modal').classList.remove('show');
}

function setupDeleteModal() {
  document.getElementById('btn-cancel-delete')?.addEventListener('click', closeDeleteModal);
  document.getElementById('confirm-delete-btn')?.addEventListener('click', () => {
    if (currentTargetCode) {
      mockPlants = mockPlants.filter(p => p.code !== currentTargetCode);
      savePlants();
      renderPlantGrid();
      closeDeleteModal();
    }
  });
}



// ==========================================
// PLANT MODAL (ADD / EDIT)
// ==========================================
function setupPlantModal() {
  // Close button
  document.getElementById('btn-close-plant-modal')?.addEventListener('click', () => {
    document.getElementById('plant-modal').classList.remove('show');
  });

  // Company dropdown "other" toggle
  document.getElementById('plant-company')?.addEventListener('change', (e) => {
    const otherInput = document.getElementById('plant-company-other');
    if (e.target.value === 'other') {
      otherInput.style.display = 'block';
    } else {
      otherInput.style.display = 'none';
      otherInput.value = '';
    }
  });

  // Submit button click
  document.getElementById('plant-submit-btn')?.addEventListener('click', () => {
    handlePlantFormSubmit();
  });
}

function handlePlantFormSubmit() {
  const isEdit = document.getElementById('plant-is-edit').value === 'true';
  const name = document.getElementById('plant-name').value.trim();
  const address = document.getElementById('plant-address').value.trim();
  const owner = document.getElementById('plant-owner').value.trim();
  const code = document.getElementById('plant-code').value.trim();
  const layoutFile = document.getElementById('plant-layout').files[0];

  let company = document.getElementById('plant-company').value;
  if (company === 'other') {
    company = document.getElementById('plant-company-other').value.trim();
  }

  // Validate required fields
  if (!name) { alert('Nama Area/Lokasi wajib diisi!'); return; }
  if (!company || company === '' || company === 'Pilih Perusahaan') { alert('Perusahaan wajib dipilih!'); return; }
  if (!address) { alert('Alamat wajib diisi!'); return; }
  if (!owner) { alert('Pemilik Area wajib diisi!'); return; }

  // Validate file size (5 MB max)
  if (layoutFile && layoutFile.size > 5 * 1024 * 1024) {
    alert('Ukuran gambar melebihi batas 5 MB. Harap pilih gambar yang lebih kecil.');
    return;
  }

  const saveData = (imageStr) => {
    if (isEdit) {
      const idx = mockPlants.findIndex(p => p.code === code);
      if (idx !== -1) {
        mockPlants[idx].name = name;
        mockPlants[idx].company = company;
        mockPlants[idx].location = address;
        mockPlants[idx].owner = owner;
        if (imageStr) mockPlants[idx].bgImage = imageStr;
      }
    } else {
      mockPlants.push({ code, name, company, location: address, owner, bgImage: imageStr || null });
    }
    try {
      savePlants();
    } catch(e) {
      // localStorage quota exceeded — save without image
      if (isEdit) {
        const idx = mockPlants.findIndex(p => p.code === code);
        if (idx !== -1) mockPlants[idx].bgImage = null;
      } else {
        mockPlants[mockPlants.length - 1].bgImage = null;
      }
      savePlants();
      alert('Gambar terlalu besar untuk disimpan, data Area/Lokasi tetap tersimpan tanpa gambar.');
    }
    renderPlantGrid();
    document.getElementById('plant-modal').classList.remove('show');
    if (!isEdit) alert('Area/Lokasi baru berhasil diregistrasi!');
    else alert('Perubahan berhasil disimpan!');
  };

  if (layoutFile) {
    const reader = new FileReader();
    reader.onload = (ev) => saveData(ev.target.result);
    reader.onerror = () => alert('Gagal membaca file gambar! Coba gunakan file lain.');
    reader.readAsDataURL(layoutFile);
  } else {
    saveData(null);
  }
}

// ==========================================
// OPEN PLANT MODAL (exposed globally)
// ==========================================
window.openPlantModal = function(code) {
  if (typeof code !== 'string') code = null;

  // Close any open dropdowns
  document.querySelectorAll('.kebab-dropdown.show').forEach(el => el.classList.remove('show'));

  const title = document.getElementById('plant-modal-title');
  const isEditInput = document.getElementById('plant-is-edit');
  const codeInput = document.getElementById('plant-code');
  const submitBtn = document.getElementById('plant-submit-btn');
  const companySelect = document.getElementById('plant-company');
  const companyOther = document.getElementById('plant-company-other');
  const layoutInput = document.getElementById('plant-layout');

  // Reset form fields manually
  document.getElementById('plant-name').value = '';
  document.getElementById('plant-address').value = '';
  document.getElementById('plant-owner').value = '';
  companySelect.value = '';
  companyOther.value = '';
  companyOther.style.display = 'none';
  layoutInput.value = '';

  if (code) {
    // === EDIT MODE ===
    const plant = mockPlants.find(p => p.code === code);
    if (!plant) return;

    title.textContent = 'Edit Area/Lokasi';
    isEditInput.value = 'true';
    codeInput.value = plant.code;
    document.getElementById('plant-name').value = plant.name;
    document.getElementById('plant-address').value = plant.location;
    document.getElementById('plant-owner').value = plant.owner || '';
    submitBtn.textContent = 'Simpan Perubahan';

    // Set company dropdown
    if (KNOWN_COMPANIES.includes(plant.company)) {
      companySelect.value = plant.company;
      companyOther.style.display = 'none';
    } else {
      companySelect.value = 'other';
      companyOther.value = plant.company;
      companyOther.style.display = 'block';
    }
  } else {
    // === ADD MODE ===
    title.textContent = 'Registrasi Area/Lokasi';
    isEditInput.value = 'false';
    const randomNum = Math.floor(Math.random() * 90000 + 10000).toString();
    codeInput.value = `PLT-${randomNum}`;
    submitBtn.textContent = 'Registrasi Area/Lokasi';
  }

  document.getElementById('plant-modal').classList.add('show');
};
