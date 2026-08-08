const fs = require('fs');
const path = require('path');

const directory = __dirname;
const htmlFiles = fs.readdirSync(directory).filter(file => file.endsWith('.html'));

const metaTag = '<meta name="view-transition" content="same-origin">';

htmlFiles.forEach(file => {
  const filePath = path.join(directory, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Check if meta tag already exists
  if (!content.includes('name="view-transition"')) {
    // Inject the meta tag inside <head>
    content = content.replace('</head>', `    ${metaTag}\n  </head>`);
    fs.writeFileSync(filePath, content);
    console.log(`Injected view-transition meta tag into ${file}`);
  } else {
    console.log(`Meta tag already exists in ${file}`);
  }
});
