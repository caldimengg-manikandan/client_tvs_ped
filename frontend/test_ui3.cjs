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
        console.log('Navigating to login to set fake token');
        await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
        
        await page.evaluate(() => {
            localStorage.setItem('token', 'fake_token_for_debug');
            localStorage.setItem('user', JSON.stringify({ role: 'admin' }));
        });
        
        console.log('Navigating to vendor-master');
        await page.goto('http://localhost:5173/vendor-master', { waitUntil: 'networkidle0' });
        console.log('Wait 3 seconds...');
        await new Promise(r => setTimeout(r, 3000));
        
    } catch (e) {
        console.log('Test script error:', e);
    }
    
    await browser.close();
})();
