const loginStr = JSON.stringify({ email: 'admin@tvs.com', password: 'admin123' });

async function run() {
    try {
        console.log('Attempting to login to localhost:5000...');
        // 1. Login
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: loginStr
        });

        if (!loginRes.ok) {
            console.log('Login failed: ' + loginRes.status + ' ' + loginRes.statusText);
            const errText = await loginRes.text();
            console.log(errText);
            return;
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('Logged in successfully. Token acquired.');

        // Wait for server to potentially restart if nodemon is used, 
        // but here we assume the route addition *might* need a moment if nodemon just triggered.
        // We will just try.

        console.log('Calling fix-data-dates endpoint...');
        // 2. Fix Data
        const fixRes = await fetch('http://localhost:5000/api/dashboard/fix-data-dates', {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!fixRes.ok) {
            console.log('Fix request failed: ' + fixRes.status + ' ' + fixRes.statusText);
            if (fixRes.status === 404) {
                console.log('!!! 404 Not Found !!!');
                console.log('This means the server has NOT reloaded the new code yet.');
                console.log('Please restart your backend server manually.');
            }
            return;
        }

        const fixData = await fixRes.json();
        console.log('Fix Data Result:', JSON.stringify(fixData, null, 2));

    } catch (e) {
        console.error('Script Error:', e.message);
        if (e.cause) console.error(e.cause);
    }
}

// Give nodemon a moment to restart the server before running logic
console.log('Waiting 3 seconds for server restart...');
setTimeout(run, 3000);
