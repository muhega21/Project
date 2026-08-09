const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:3000/asset-register.html', { waitUntil: 'networkidle0' });
  
  // Click + PLANT
  await page.evaluate(() => {
    window.openPlantModal();
  });
  
  await new Promise(r => setTimeout(r, 500));
  
  // Fill form
  await page.type('#plant-name', 'Test Plant');
  await page.select('#plant-company', 'PT. MaintainX Logistics');
  await page.type('#plant-address', 'Test Address');
  await page.type('#plant-owner', 'Test Owner');
  
  console.log('Form filled. Submitting...');
  
  // Submit via clicking the submit button, NOT form.submit() which bypasses listeners
  await page.evaluate(() => {
    document.getElementById('plant-submit-btn').click();
  });
  
  await new Promise(r => setTimeout(r, 1000));
  console.log('Done submitting. Checking grid...');
  
  const plants = await page.evaluate(() => {
    return JSON.parse(localStorage.getItem('maintainx_plants'));
  });
  
  console.log('Plants in localStorage:', plants ? plants.map(p => p.name) : 'none');
  
  await browser.close();
})();
