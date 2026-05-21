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
        console.log('Navigating to http://localhost:5173/request-tracker');
        await page.goto('http://localhost:5173/request-tracker', { waitUntil: 'networkidle0' });
        console.log('Wait 2 seconds...');
        await new Promise(r => setTimeout(r, 2000));
        
        console.log('Navigating to http://localhost:5173/mh-development-tracker');
        await page.goto('http://localhost:5173/mh-development-tracker', { waitUntil: 'networkidle0' });
        console.log('Wait 2 seconds...');
        await new Promise(r => setTimeout(r, 2000));
        
    } catch (e) {
        console.log('Test script error:', e);
    }
    
    await browser.close();
})();
