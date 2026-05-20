import puppeteer from 'puppeteer';

(async () => {
    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        page.on('pageerror', error => {
            console.error('PAGE_ERROR:', error.message);
            console.error(error.stack);
        });

        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.error('CONSOLE_ERROR:', msg.text());
                msg.args().forEach(async (arg, i) => {
                    try {
                        const val = await arg.jsonValue();
                        console.error(`Arg ${i}:`, val);
                    } catch (e) {
                        // ignore
                    }
                });
            }
        });

        console.log('Navigating to https://client-tvs-ped.vercel.app/ ...');
        await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
        
        console.log('Waiting for a few seconds to let errors propagate...');
        await new Promise(r => setTimeout(r, 5000));
        
        await browser.close();
    } catch (e) {
        console.error('SCRIPT_ERROR:', e);
    }
})();
