// Simple test to trigger Firebase data creation via headless browser
const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('🚀 Starting browser automation to create Firebase data...');
    
    const browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Enable console logging from the page
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    // Navigate to the Firebase data creator page
    await page.goto('http://localhost:3001/firebase-data-creator.html');
    
    // Wait for the page to load
    await page.waitForSelector('button');
    
    // Click the create data button
    await page.click('button');
    
    // Wait for the operation to complete (give it time to create all the data)
    await page.waitForTimeout(30000);
    
    console.log('✅ Firebase data creation completed!');
    
    await browser.close();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();