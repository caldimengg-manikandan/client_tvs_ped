require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log('--- TVS MH Request Email Diagnostic ---');

    const config = {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS ? '********' : null
    };

    console.log('Current Configuration:', {
        host: config.host || 'MISSING',
        port: config.port || 'MISSING',
        user: config.user || 'MISSING',
        pass: config.pass || 'MISSING'
    });

    if (!config.host || !config.user || !process.env.SMTP_PASS) {
        console.error('\n❌ ERROR: Configuration is incomplete. Please update your .env file.');
        process.exit(1);
    }

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('\nStep 1: Verifying SMTP Connection...');
        await transporter.verify();
        console.log('✅ SMTP Connection Successful!');

        console.log('\nStep 2: Sending Test Email to', config.user, '...');
        const info = await transporter.sendMail({
            from: `"MH System Test" <${process.env.SMTP_USER}>`,
            to: process.env.SMTP_USER, // Send to self
            subject: "TVS MH Request - System Test Email",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #1a2b5e;">System Diagnostic Successful</h2>
                    <p>This is a test email to verify that your TVS MH Request notification system is correctly configured.</p>
                    <hr>
                    <p style="font-size: 12px; color: #777;">Timestamp: ${new Date().toLocaleString()}</p>
                </div>
            `
        });

        console.log('✅ Test Email Sent! Message ID:', info.messageId);
        console.log('\n--- DIAGNOSTIC COMPLETE ---');
    } catch (error) {
        console.error('\n❌ DIAGNOSTIC FAILED');
        console.error('Error Details:', error.message);
        console.log('\nCommon Fixes:');
        console.log('1. If using Gmail, make sure you created an "App Password" (not your normal password).');
        console.log('2. Check if your corporate firewall allows SMTP traffic on port', process.env.SMTP_PORT || 587);
        console.log('3. Ensure SMTP_HOST is correct (e.g., smtp.gmail.com or outlook.office365.com).');
    }
}

testEmail();
