const fs = require('fs');
const path = require('path');

const d = 'd:/Project';
const files = fs.readdirSync(d).filter(f => f.endsWith('.html'));

for (const f of files) {
  let p = path.join(d, f);
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace('<script src=" /src/global-ui.js></script>', '<script src="/src/global-ui.js"></script>');
  fs.writeFileSync(p, c);
}
console.log('Fixed syntax error in HTML files');
