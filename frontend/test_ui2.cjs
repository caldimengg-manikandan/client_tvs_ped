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
        console.log('Navigating to login');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
        
        // Check if there is an email input
        const emailInput = await page.$('input[type="email"]');
        if (emailInput) {
            console.log('Logging in...');
            await page.type('input[type="email"]', 'admin@tvs.com');
            await page.type('input[type="password"]', 'admin123');
            await page.click('button[type="submit"]');
            console.log('Wait for navigation...');
            await page.waitForNavigation({ waitUntil: 'networkidle0' });
        }
        
        console.log('Navigating to request-tracker');
        await page.goto('http://localhost:5173/request-tracker', { waitUntil: 'networkidle0' });
        console.log('Wait 2 seconds...');
        await new Promise(r => setTimeout(r, 2000));
        
        console.log('Navigating to mh-development-tracker');
        await page.goto('http://localhost:5173/mh-development-tracker', { waitUntil: 'networkidle0' });
        console.log('Wait 2 seconds...');
        await new Promise(r => setTimeout(r, 2000));
        
    } catch (e) {
        console.log('Test script error:', e);
    }
    
    await browser.close();
})();
