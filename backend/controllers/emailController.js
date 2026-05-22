const nodemailer = require('nodemailer');
const asyncHandler = require('express-async-handler');
const MHRequest = require('../models/MHRequest');

// Create transporter (shared)
const getTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: { rejectUnauthorized: false }
    });
};

// @desc    Send email notification
// @route   POST /api/email/send
// @access  Private
//
// Supports two modes:
//   1. Generic (MailComposer): { to, cc, subject, body, requestId? }
//      Sends a fully custom email and optionally logs it to MHRequest.emailLog.
//   2. Legacy (status notifications): { requestId, recipients }
//      Fetches the MHRequest and builds an auto-formatted HTML body.
const sendRequestEmail = asyncHandler(async (req, res) => {
    const { requestId, recipients, to, cc, subject, body } = req.body;

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        console.error('CRITICAL: SMTP configurations are missing in .env file!');
        return res.status(500).json({
            message: 'Email service not configured. Please contact administrator.',
            error: 'Missing SMTP credentials'
        });
    }

    const transporter = getTransporter();

    // ─── MODE 1: Generic email from MailComposer ───────────────────────────
    if (to && subject && body) {
        const mailOptions = {
            from: process.env.SMTP_USER,
            to,
            subject,
            html: body,
            text: body.replace(/<[^>]+>/g, '') // strip HTML for plain-text fallback
        };
        if (cc) mailOptions.cc = cc;

        let sendStatus = 'Delivered';
        let messageId = null;

        try {
            const info = await transporter.sendMail(mailOptions);
            messageId = info.messageId;
            console.log('[Email] Generic email sent:', messageId);
        } catch (sendErr) {
            console.error('[Email] Send failed:', sendErr.message);
            sendStatus = 'Failed';
        }

        // If a requestId is provided, append to the request's emailLog
        if (requestId) {
            try {
                const mhRequest = await MHRequest.findOne({
                    $or: [
                        { mhRequestId: requestId },
                        { _id: requestId.length === 24 ? requestId : undefined }
                    ]
                });

                if (mhRequest) {
                    mhRequest.emailLog.push({ sentAt: new Date(), to, cc: cc || '', subject, body, status: sendStatus });
                    if (sendStatus === 'Delivered' && mhRequest.workflowStatus === 'Pending') {
                        mhRequest.workflowStatus = 'Notified';
                    }
                    await mhRequest.save();
                }
            } catch (logErr) {
                console.error('[Email] Could not log email to MHRequest:', logErr.message);
            }
        }

        if (sendStatus === 'Failed') {
            return res.status(500).json({ message: 'Email sending failed', status: 'Failed' });
        }

        return res.status(200).json({
            message: 'Email sent successfully',
            messageId,
            status: sendStatus
        });
    }

    // ─── MODE 2: Legacy status-notification email ──────────────────────────
    if (!requestId || !recipients || recipients.length === 0) {
        res.status(400);
        throw new Error('Request ID and recipients are required');
    }

    const request = await MHRequest.findOne({ mhRequestId: requestId });
    if (!request) {
        res.status(404);
        throw new Error('MH Request not found');
    }

    const isRejection = request.status === 'Rejected';
    const isAccepted = request.status === 'Accepted';

    let notificationTitle = 'MH Request Notification';
    let headerColor = '#1a2b5e';
    if (isRejection) { notificationTitle = 'MH Request Rejected'; headerColor = '#dc2626'; }
    else if (isAccepted) { notificationTitle = 'MH Request Accepted'; headerColor = '#059669'; }

    const statusColor = headerColor;

    const htmlContent = `
    <!DOCTYPE html><html><head><style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9; }
        .header { background-color: ${headerColor}; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; background-color: white; border-radius: 0 0 8px 8px; }
        .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .details-table th, .details-table td { padding: 12px; border-bottom: 1px solid #ddd; text-align: left; }
        .details-table th { background-color: #f2f2f2; color: #555; width: 40%; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
        .alert-box { background-color: ${isRejection ? '#fee2e2' : isAccepted ? '#ecfdf5' : '#dbeafe'}; border-left: 4px solid ${headerColor}; padding: 12px; margin: 15px 0; border-radius: 4px; }
    </style></head><body>
        <div class="container">
            <div class="header"><h2>${notificationTitle}</h2></div>
            <div class="content">
                <p>Hello <strong>${request.userName}</strong>,</p>
                ${isRejection ? `<div class="alert-box"><p style="margin:0;color:#991b1b;font-weight:bold;">⚠️ Your MH Request has been REJECTED</p></div>`
                    : isAccepted ? `<div class="alert-box"><p style="margin:0;color:#065f46;font-weight:bold;">✅ Your MH Request has been ACCEPTED</p></div>`
                    : `<p>Status Update for your MH Request:</p>`}
                <table class="details-table">
                    <tr><th>MH Request ID</th><td><strong>${request.mhRequestId}</strong></td></tr>
                    <tr><th>Department</th><td>${request.departmentName}</td></tr>
                    <tr><th>Plant Location</th><td>${request.plantLocation}</td></tr>
                    <tr><th>Request Type</th><td>${request.requestType}</td></tr>
                    <tr><th>Product Model</th><td>${request.productModel}</td></tr>
                    <tr><th>Part Name</th><td>${request.handlingPartName}</td></tr>
                    <tr><th>Handling Location</th><td>${request.materialHandlingLocation}</td></tr>
                    <tr><th>Volume Per Day</th><td>${request.volumePerDay}</td></tr>
                    <tr><th>User Name</th><td>${request.userName}</td></tr>
                    <tr><th>Status</th><td><span style="color:${statusColor};font-weight:bold;">${request.status}</span></td></tr>
                    ${request.remark ? `<tr><th>Remarks</th><td style="color:#555;">${request.remark}</td></tr>` : ''}
                </table>
                <p>Please log in to the portal for more details.</p>
            </div>
            <div class="footer"><p>This is an automated message from the TVS MH Request Tracker System.</p></div>
        </div>
    </body></html>`;

    const info = await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: recipients,
        subject: `MH Request Notification - ${requestId}`,
        html: htmlContent,
    });

    console.log('[Email] Legacy notification sent:', info.messageId);
    res.status(200).json({ message: 'Email sent successfully', messageId: info.messageId });
});

// ─── Vendor allocation email (unchanged internal function) ──────────────────
const sendVendorAllocationEmail = asyncHandler(async (vendorEmail, projectDetails) => {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return;
    const { projectId, department, plant } = projectDetails;
    const transporter = getTransporter();
    const htmlContent = `<!DOCTYPE html><html><body>
        <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
            <div style="background:#CC1F1F;color:#fff;padding:25px;border-radius:12px 12px 0 0;text-align:center;">
                <h1 style="margin:0;">New Project Allocated</h1>
            </div>
            <div style="padding:30px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
                <p>Dear Vendor,</p>
                <p>A new MH project has been allocated to you.</p>
                <p><strong>Project ID:</strong> ${projectId}<br>
                <strong>Department:</strong> ${department}<br>
                <strong>Plant:</strong> ${plant}</p>
                <p>Please log in to the portal to review the full requirements.</p>
            </div>
        </div>
    </body></html>`;
    try {
        await transporter.sendMail({
            from: process.env.SMTP_USER,
            to: vendorEmail,
            subject: `New Project Allocated - ${projectId}`,
            html: htmlContent
        });
    } catch (error) {
        console.error('[Email] Error sending allocation email:', error);
    }
});

const testSMTPConnection = asyncHandler(async (req, res) => {
    try {
        const transporter = getTransporter();
        await transporter.verify();
        res.status(200).json({ success: true, message: 'SMTP connection verified successfully!' });
    } catch (error) {
        console.error('[Email] SMTP Verification Error:', error);
        res.status(500).json({ success: false, message: 'Failed to connect to email server', error: error.message });
    }
});

module.exports = {
    sendRequestEmail,
    testSMTPConnection,
    sendVendorAllocationEmail
};
