import './style.css';

document.addEventListener('DOMContentLoaded', () => {
  // Sticky Navbar Logic
  const navbar = document.getElementById('navbar');
  
  const handleScroll = () => {
    if (!navbar) return;
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };

  // Initial check
  handleScroll();
  
  // Listen for scroll events
  window.addEventListener('scroll', handleScroll, { passive: true });

  // Scroll Reveal Animation with Intersection Observer
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
      }
    });
  }, observerOptions);

  // Apply reveal class and observe features and hero elements
  const revealElements = document.querySelectorAll('.feature-card, .section-header, .cta-banner');
  
  revealElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    observer.observe(el);
  });

  // Adding dynamic styling for revealed class
  const style = document.createElement('style');
  style.textContent = `
    .revealed {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }
  `;
  document.head.appendChild(style);
  // Theme Toggle Logic
  const themeToggleBtns = document.querySelectorAll('.theme-btn');
  const currentTheme = localStorage.getItem('theme') || 'dark'; // Default to dark if not set
  
  // Apply initial theme
  if (currentTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }

  const updateButtonText = (theme) => {
    themeToggleBtns.forEach(btn => {
      btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    });
  };
  updateButtonText(currentTheme);

  themeToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      let theme = document.documentElement.getAttribute('data-theme');
      if (theme === 'dark') {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
        updateButtonText('light');
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        updateButtonText('dark');
      }
    });
  });
});
