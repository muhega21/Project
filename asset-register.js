// asset-register.js - Logic for Plant Grid UI

const defaultPlants = [
  {
    code: 'PLT-102',
    name: 'Karawang Assembly Plant',
    company: 'PT. MaintainX Manufacturing',
    location: 'Kawasan Industri KIIC, Jawa Barat',
    bgImage: 'https://images.unsplash.com/photo-1565515261739-16628fb68770?q=80&w=600&auto=format&fit=crop'
  },
  {
    code: 'PLT-088',
    name: 'Cikarang Distribution Hub',
    company: 'PT. MaintainX Logistics',
    location: 'Cikarang Dry Port, Bekasi',
    bgImage: null
  },
  {
    code: 'PLT-215',
    name: 'Surabaya Heavy Machining',
    company: 'PT. MaintainX Heavy Ind.',
    location: 'Kawasan SIER, Jawa Timur',
    bgImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600&auto=format&fit=crop'
  },
  {
    code: 'PLT-042',
    name: 'Batam Electronics Facility',
    company: 'PT. MaintainX Electronics',
    location: 'Batamindo Industrial Park, Kepri',
    bgImage: null
  },
  {
    code: 'PLT-110',
    name: 'Tangerang Packaging Unit',
    company: 'PT. MaintainX Packaging',
    location: 'Kawasan Industri Jatake, Banten',
    bgImage: null
  }
];

let mockPlants = [];

document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('maintainx_plants');
  if (saved) {
    mockPlants = JSON.parse(saved);
  } else {
    mockPlants = defaultPlants;
    localStorage.setItem('maintainx_plants', JSON.stringify(mockPlants));
  }
  
  renderPlantGrid();

  // Handle clicks inside the grid using event delegation
  document.getElementById('plant-grid-container')?.addEventListener('click', (e) => {
    // 1. Kebab Toggle Click
    const kebabToggle = e.target.closest('.kebab-toggle');
    if (kebabToggle) {
      e.stopPropagation();
      const code = kebabToggle.getAttribute('data-code');
      const dropdown = document.getElementById(`dropdown-${code}`);
      const isShowing = dropdown.classList.contains('show');
      
      document.querySelectorAll('.kebab-dropdown.show').forEach(el => el.classList.remove('show'));
      
      if (!isShowing) {
        dropdown.classList.add('show');
      }
      return;
    }
    
    // 2. Upload Action Click
    const uploadAction = e.target.closest('.action-upload');
    if (uploadAction) {
      const code = uploadAction.getAttribute('data-code');
      openUploadModal(code);
      return;
    }
    
    // 3. Delete Action Click
    const deleteAction = e.target.closest('.action-delete');
    if (deleteAction) {
      const code = deleteAction.getAttribute('data-code');
      openDeleteModal(code);
      return;
    }
    
    // 4. Card Click (Navigate to Layout Area)
    const card = e.target.closest('.plant-card');
    if (card && !e.target.closest('.kebab-toggle') && !e.target.closest('.kebab-dropdown')) {
      const code = card.getAttribute('data-code');
      if (code) {
        window.location.href = `/layout-area.html?code=${code}`;
      }
    }
  });

  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.kebab-toggle') && !e.target.closest('.kebab-dropdown')) {
      document.querySelectorAll('.kebab-dropdown.show').forEach(el => el.classList.remove('show'));
    }
  });
  
  setupUploadLogic();
});

let currentTargetCode = null;

function savePlants() {
  localStorage.setItem('maintainx_plants', JSON.stringify(mockPlants));
}

function renderPlantGrid() {
  const container = document.getElementById('plant-grid-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  mockPlants.forEach(plant => {
    const card = document.createElement('div');
    card.className = 'plant-card relative';
    card.setAttribute('data-code', plant.code);
    card.style.cursor = 'pointer';
    
    // Apply background image if present
    if (plant.bgImage) {
      card.classList.add('with-bg');
      card.style.backgroundImage = `linear-gradient(rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.95)), url('${plant.bgImage}')`;
      card.style.backgroundSize = 'cover';
      card.style.backgroundPosition = 'center';
    }
    
    card.innerHTML = `
      <div class="card-kebab kebab-toggle" data-code="${plant.code}">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
      </div>
      <div class="kebab-dropdown" id="dropdown-${plant.code}">
        <a class="dropdown-item" href="/register-plant.html?edit=${plant.code}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          Edit
        </a>
        <a class="dropdown-item action-upload" data-code="${plant.code}" href="javascript:void(0)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
          Tambah Gambar
        </a>
        <a class="dropdown-item text-red action-delete" data-code="${plant.code}" href="javascript:void(0)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          Hapus Area/Lokasi
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

// --- Delete Modal Logic ---
function openDeleteModal(code) {
  currentTargetCode = code;
  document.querySelectorAll('.kebab-dropdown.show').forEach(el => el.classList.remove('show'));
  document.getElementById('delete-modal').classList.add('show');
}

function closeDeleteModal() {
  currentTargetCode = null;
  document.getElementById('delete-modal').classList.remove('show');
}

document.getElementById('btn-cancel-delete')?.addEventListener('click', closeDeleteModal);

document.getElementById('confirm-delete-btn')?.addEventListener('click', () => {
  if (currentTargetCode) {
    mockPlants = mockPlants.filter(p => p.code !== currentTargetCode);
    savePlants();
    renderPlantGrid();
    closeDeleteModal();
  }
});

// --- Upload Image Modal Logic ---
let tempImageBase64 = null;

function openUploadModal(code) {
  currentTargetCode = code;
  tempImageBase64 = null;
  
  document.querySelectorAll('.kebab-dropdown.show').forEach(el => el.classList.remove('show'));
  
  const imgElement = document.getElementById('upload-preview-img');
  const placeholder = document.getElementById('upload-icon-placeholder');
  const input = document.getElementById('image-upload-input');
  
  input.value = '';
  imgElement.style.display = 'none';
  imgElement.src = '';
  placeholder.style.display = 'flex';
  
  document.getElementById('upload-modal').classList.add('show');
}

function closeUploadModal() {
  currentTargetCode = null;
  tempImageBase64 = null;
  document.getElementById('upload-modal').classList.remove('show');
}

function setupUploadLogic() {
  const input = document.getElementById('image-upload-input');
  if (!input) return;
  
  document.getElementById('btn-cancel-upload')?.addEventListener('click', closeUploadModal);
  
  const triggerBtns = [
    document.getElementById('btn-trigger-upload'),
    document.getElementById('upload-preview-box')
  ];
  
  triggerBtns.forEach(btn => {
    btn?.addEventListener('click', () => {
      input.click();
    });
  });
  
  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        tempImageBase64 = event.target.result;
        const imgElement = document.getElementById('upload-preview-img');
        const placeholder = document.getElementById('upload-icon-placeholder');
        
        imgElement.src = tempImageBase64;
        imgElement.style.display = 'block';
        placeholder.style.display = 'none';
      };
      reader.readAsDataURL(file);
    }
  });
  
  document.getElementById('save-image-btn')?.addEventListener('click', () => {
    if (currentTargetCode && tempImageBase64) {
      const index = mockPlants.findIndex(p => p.code === currentTargetCode);
      if (index !== -1) {
        mockPlants[index].bgImage = tempImageBase64;
        savePlants();
        renderPlantGrid();
      }
    }
    closeUploadModal();
  });
}
