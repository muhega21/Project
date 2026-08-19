/**
 * Global UI Script for MaintainX
 * Handles Profile Dropdown, Theme (Light/Dark) and Language (EN, ID, CN) switching.
 */
(function() {
  const earlyTheme = localStorage.getItem('maintainx_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', earlyTheme);
})();

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize State from localStorage
  let currentTheme = localStorage.getItem('maintainx_theme') || 'dark';
  let currentLang = localStorage.getItem('maintainx_lang') || 'ID';
  
  // Apply theme immediately
  document.documentElement.setAttribute('data-theme', currentTheme);

  // 2. Locate Topbar User Profile container
  const userProfile = document.querySelector('.topbar .user-profile');
  
  if (userProfile) {
    // 3. Hide original logout button to replace with dropdown menu
    const originalLogout = userProfile.querySelector('.btn-logout');
    if (originalLogout) originalLogout.style.display = 'none';

    // 4. Setup User Profile as Dropdown Trigger
    userProfile.style.cursor = 'pointer';
    userProfile.style.position = 'relative';
    
    // 5. Create Dropdown Menu
    const dropdown = document.createElement('div');
    dropdown.style.position = 'absolute';
    dropdown.style.top = 'calc(100% + 10px)';
    dropdown.style.right = '0';
    dropdown.style.background = 'var(--bg-surface)';
    dropdown.style.border = '1px solid var(--border-color)';
    dropdown.style.borderRadius = '12px';
    dropdown.style.boxShadow = '0 15px 35px rgba(0,0,0,0.2)';
    dropdown.style.width = '240px';
    dropdown.style.display = 'none';
    dropdown.style.flexDirection = 'column';
    dropdown.style.zIndex = '1000';
    dropdown.style.overflow = 'hidden';

    // Helper to create menu items
    const createMenuItem = (iconHtml, text, rightElementHtml = '', onClick) => {
      const item = document.createElement('div');
      item.style.padding = '12px 16px';
      item.style.display = 'flex';
      item.style.alignItems = 'center';
      item.style.gap = '12px';
      item.style.cursor = 'pointer';
      item.style.transition = 'background 0.2s';
      item.style.borderBottom = '1px solid var(--border-color)';
      
      item.innerHTML = `
        <div style="color: var(--text-secondary); display: flex;">${iconHtml}</div>
        <div style="flex: 1; font-weight: 500; font-size: 0.95rem; color: var(--text-primary);">${text}</div>
        <div class="right-element">${rightElementHtml}</div>
      `;

      item.addEventListener('mouseenter', () => item.style.backgroundColor = 'rgba(150,150,150,0.1)');
      item.addEventListener('mouseleave', () => item.style.backgroundColor = 'transparent');
      
      if (onClick) {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          onClick(item);
        });
      }

      return item;
    };

    // --- Theme Toggle Item ---
    const getThemeIcon = (theme) => {
      return theme === 'dark' 
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
    };

    const themeItem = createMenuItem(
      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`, // Paint icon
      'Tema Tampilan',
      `<div class="theme-indicator" style="color: var(--accent-primary); display: flex;">${getThemeIcon(currentTheme)}</div>`,
      (el) => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('maintainx_theme', currentTheme);
        el.querySelector('.theme-indicator').innerHTML = getThemeIcon(currentTheme);
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: currentTheme }));
      }
    );

    // --- Language Toggle Item ---
    const flags = { 'ID': '🇮🇩', 'US': '🇺🇸', 'CN': '🇨🇳' };
    const gtCodes = { 'ID': 'id', 'US': 'en', 'CN': 'zh-CN' };
    
    let currentLang = localStorage.getItem('maintainx_lang') || 'ID';
    if (currentLang === 'EN') currentLang = 'US'; // Migration from old code

    const langItem = createMenuItem(
      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
      'Ganti Bahasa',
      `<div class="lang-indicator" style="font-size: 1.1rem;">${flags[currentLang]}</div>`,
      (el) => {
        // Cycle through languages
        const langCodes = Object.keys(flags);
        let currentIndex = langCodes.indexOf(currentLang);
        const nextLang = langCodes[(currentIndex + 1) % langCodes.length];
        
        localStorage.setItem('maintainx_lang', nextLang);
        
        // Update Google Translate Cookie
        const targetLang = gtCodes[nextLang];
        if (nextLang === 'ID') {
           document.cookie = "googtrans=/id/id; path=/";
           document.cookie = "googtrans=/id/id; domain=" + window.location.hostname + "; path=/";
        } else {
           document.cookie = "googtrans=/id/" + targetLang + "; path=/";
           document.cookie = "googtrans=/id/" + targetLang + "; domain=" + window.location.hostname + "; path=/";
        }
        
        el.querySelector('.lang-indicator').innerHTML = flags[nextLang];
        window.location.reload();
      }
    );

    // --- Role Toggle Item (For Simulation) ---
    const roles = ['Administrator', 'Supervisor', 'Admin', 'Visitor', 'Foreman', 'Warehouse', 'Teknisi'];
    let currentRole = localStorage.getItem('userRole') || 'Administrator';
    
    const roleItem = createMenuItem(
      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
      'Simulasi Role',
      `<div class="role-indicator" style="font-size: 0.75rem; font-weight:bold; color:var(--accent-primary); padding: 2px 6px; border-radius: 4px; background: rgba(255,112,67,0.1);">${currentRole}</div>`,
      (el) => {
        let currentIndex = roles.indexOf(currentRole);
        if(currentIndex === -1) currentIndex = 0;
        const nextRole = roles[(currentIndex + 1) % roles.length];
        
        localStorage.setItem('userRole', nextRole);
        localStorage.setItem('userName', nextRole + ' User');
        
        el.querySelector('.role-indicator').innerHTML = nextRole;
        window.location.reload();
      }
    );

    // --- Logout Item ---
    const logoutItem = createMenuItem(
      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`,
      'Keluar Akun',
      '',
      () => {
        window.location.href = 'login.html';
      }
    );
    logoutItem.style.borderBottom = 'none';
    logoutItem.style.color = '#ef4444';
    logoutItem.querySelector('div').style.color = '#ef4444'; // icon red

    // Append items
    dropdown.appendChild(themeItem);
    dropdown.appendChild(langItem);
    dropdown.appendChild(roleItem);
    dropdown.appendChild(logoutItem);
    userProfile.appendChild(dropdown);

    // Toggle dropdown on user profile click
    userProfile.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.style.display = dropdown.style.display === 'none' ? 'flex' : 'none';
    });

    // Close dropdown on outside click
    document.addEventListener('click', () => {
      dropdown.style.display = 'none';
    });
  }

  // Handle standalone standalone .theme-btn buttons on landing page / login
  const themeToggleBtns = document.querySelectorAll('.theme-btn');
  const updateStandaloneButtons = () => {
    themeToggleBtns.forEach(btn => {
      btn.textContent = currentTheme === 'dark' ? '☀️' : '🌙';
    });
  };
  updateStandaloneButtons();
  
  themeToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', currentTheme);
      localStorage.setItem('maintainx_theme', currentTheme);
      updateStandaloneButtons();
      window.dispatchEvent(new CustomEvent('themeChanged', { detail: currentTheme }));
    });
  });

  // 6. Global Sidebar Search Logic
  const sidebarSearchInput = document.getElementById('global-sidebar-search');
  if (sidebarSearchInput) {
    sidebarSearchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
      
      navItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(term)) {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      });
    });
  }

  // 7. Inject Google Translate for Dynamic Translations
  const injectGoogleTranslate = () => {
    // Sync cookie on load to ensure it matches localStorage state
    const gtCodesInit = { 'ID': 'id', 'US': 'en', 'CN': 'zh-CN' };
    let cLang = localStorage.getItem('maintainx_lang') || 'ID';
    if (cLang === 'EN') cLang = 'US';
    const targetLang = gtCodesInit[cLang];
    
    if (cLang === 'ID') {
       document.cookie = "googtrans=/id/id; path=/";
       document.cookie = "googtrans=/id/id; domain=" + window.location.hostname + "; path=/";
    } else {
       document.cookie = "googtrans=/id/" + targetLang + "; path=/";
       document.cookie = "googtrans=/id/" + targetLang + "; domain=" + window.location.hostname + "; path=/";
    }

    const gtDiv = document.createElement('div');
    gtDiv.id = 'google_translate_element';
    gtDiv.style.display = 'none';
    document.body.appendChild(gtDiv);

    window.googleTranslateElementInit = function() {
      new window.google.translate.TranslateElement({
        pageLanguage: 'id',
        includedLanguages: 'id,en,zh-CN',
        autoDisplay: false
      }, 'google_translate_element');
    };

    const gtScript = document.createElement('script');
    gtScript.type = 'text/javascript';
    gtScript.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.head.appendChild(gtScript);

    const style = document.createElement('style');
    style.innerHTML = `
      body { top: 0 !important; }
      .skiptranslate, #goog-gt-tt { display: none !important; }
      .goog-te-banner-frame { display: none !important; }
      /* Prevent React errors by hiding GT elements rather than them altering DOM structure too much */
    `;
    document.head.appendChild(style);
  };

  injectGoogleTranslate();

  // 8. Mobile Sidebar Drawer Logic
  const topbar = document.querySelector('.topbar');
  const sidebar = document.querySelector('.sidebar');
  if (topbar && sidebar) {
    // Inject Hamburger Button at the start of Topbar
    const hamburger = document.createElement('button');
    hamburger.className = 'hamburger-btn';
    hamburger.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>';
    topbar.insertBefore(hamburger, topbar.firstChild);

    // Inject Overlay
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    // Toggle logic
    const toggleSidebar = () => {
      document.body.classList.toggle('sidebar-open');
    };

    hamburger.addEventListener('click', toggleSidebar);
    overlay.addEventListener('click', () => {
      document.body.classList.remove('sidebar-open');
    });

    // Close sidebar on link click (for mobile)
    const navLinks = sidebar.querySelectorAll('.nav-item');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          document.body.classList.remove('sidebar-open');
        }
      });
    });
  }
});

