const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  if (c.includes('nav-menu') && !c.includes('perkakas.html')) {
    c = c.replace('<a href="/schedule.html" class="nav-item">Schedule & Planning</a>', 
      '<a href="/perkakas.html" class="nav-item">Gudang Perkakas</a>\n        <a href="/logistic-request.html" class="nav-item">Permintaan Logistik</a>\n        <a href="/schedule.html" class="nav-item">Schedule & Planning</a>');
    fs.writeFileSync(f, c);
  }
});
console.log('Sidebar updated in all HTML files.');
