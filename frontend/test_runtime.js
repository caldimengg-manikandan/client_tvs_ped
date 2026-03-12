import { chromium } from 'playwright';

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log(`PAGE ERROR: ${msg.text()}`);
        }
    });

    page.on('pageerror', error => {
        console.log(`PAGE EXCEPTION: ${error.message}`);
    });

    try {
        await page.goto('http://localhost:5173/vendor-master', { waitUntil: 'networkidle' });
        console.log('Page loaded');
    } catch (e) {
        console.log('Navigation failed:', e.message);
    }

    await browser.close();
})();
