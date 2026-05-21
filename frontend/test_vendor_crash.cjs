const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Capture React errors
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('BROWSER ERROR:', msg.text());
        }
    });
    
    page.on('pageerror', err => {
        console.log('PAGE ERROR:', err.toString());
    });
    
    try {
        console.log('Navigating to login...');
        await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });
        
        console.log('Logging in...');
        await page.type('input[type="email"]', 'admin@tvs.com');
        await page.type('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        
        console.log('Navigating to vendor-master...');
        await page.goto('http://localhost:5173/vendor-master', { waitUntil: 'networkidle0' });
        
        console.log('Wait 3 seconds to catch errors...');
        await new Promise(r => setTimeout(r, 3000));
        
    } catch (e) {
        console.log('Test script error:', e);
    }
    
    await browser.close();
})();
