const fs = require('fs');
const path = require('path');

const directory = __dirname;
const htmlFiles = fs.readdirSync(directory).filter(file => file.endsWith('.html') && file !== 'login.html');

htmlFiles.forEach(file => {
  const filePath = path.join(directory, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Regex to remove .topbar { ... } and .sidebar { ... } from inline styles
  // This removes everything from .topbar { until the closing }
  const topbarRegex = /\.topbar\s*\{[^}]+\}/g;
  const sidebarRegex = /\.sidebar\s*\{[^}]+\}/g;

  content = content.replace(topbarRegex, '');
  content = content.replace(sidebarRegex, '');

  fs.writeFileSync(filePath, content);
  console.log(`Cleaned up inline styles in ${file}`);
});
