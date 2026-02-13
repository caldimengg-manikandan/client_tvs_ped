const nodemailer = require('nodemailer');
const asyncHandler = require('express-async-handler');
const MHRequest = require('../models/MHRequest');

// Create transporter
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

// @desc    Send email notification
// @route   POST /api/email/send
// @access  Private
const sendRequestEmail = asyncHandler(async (req, res) => {
    const { requestId, recipients } = req.body;

    console.log(`Starting email notification for request: ${requestId} to recipients: ${recipients}`);

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        console.error('CRITICAL: SMTP configurations are missing in .env file!');
        return res.status(500).json({
            message: 'Email service not configured. Please contact administrator.',
            error: 'Missing SMTP credentials'
        });
    }

    if (!requestId || !recipients || recipients.length === 0) {
        res.status(400);
        throw new Error('Request ID and recipients are required');
    }

    // Fetch Request Details
    const request = await MHRequest.findOne({ mhRequestId: requestId });
    if (!request) {
        res.status(404);
        throw new Error('MH Request not found');
    }

    // Determine if this is a specialized notification
    const isRejection = request.status === 'Rejected';
    const isAccepted = request.status === 'Accepted';

    let notificationTitle = 'MH Request Notification';
    let headerColor = '#1a2b5e';

    if (isRejection) {
        notificationTitle = 'MH Request Rejected';
        headerColor = '#dc2626';
    } else if (isAccepted) {
        notificationTitle = 'MH Request Accepted';
        headerColor = '#059669';
    }

    const statusColor = headerColor;

    // HTML Template
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9; }
            .header { background-color: ${headerColor}; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; background-color: white; border-radius: 0 0 8px 8px; }
            .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .details-table th, .details-table td { padding: 12px; border-bottom: 1px solid #ddd; text-align: left; }
            .details-table th { background-color: #f2f2f2; color: #555; width: 40%; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
            .alert-box { background-color: ${isRejection ? '#fee2e2' : isAccepted ? '#ecfdf5' : '#dbeafe'}; border-left: 4px solid ${headerColor}; padding: 12px; margin: 15px 0; border-radius: 4px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>${notificationTitle}</h2>
            </div>
            <div class="content">
                <p>Hello <strong>${request.userName}</strong>,</p>
                ${isRejection ? `
                <div class="alert-box">
                    <p style="margin: 0; color: #991b1b; font-weight: bold;">⚠️ Your MH Request has been REJECTED</p>
                    <p style="margin: 5px 0 0 0; color: #7f1d1d; font-size: 14px;">Please review the details below and contact your supervisor for more information.</p>
                </div>
                ` : isAccepted ? `
                <div class="alert-box">
                    <p style="margin: 0; color: #065f46; font-weight: bold;">✅ Your MH Request has been ACCEPTED</p>
                    <p style="margin: 5px 0 0 0; color: #064e3b; font-size: 14px;">The request has been approved and moved to the next processing stage.</p>
                </div>
                ` : `
                <p>Status Update for your MH Request:</p>
                `}
                
                <table class="details-table">
                    <tr>
                        <th>MH Request ID</th>
                        <td><strong>${request.mhRequestId}</strong></td>
                    </tr>
                    <tr>
                        <th>Department</th>
                        <td>${request.departmentName}</td>
                    </tr>
                    <tr>
                        <th>Plant Location</th>
                        <td>${request.plantLocation}</td>
                    </tr>
                    <tr>
                        <th>Request Type</th>
                        <td>${request.requestType}</td>
                    </tr>
                     <tr>
                        <th>Product Model</th>
                        <td>${request.productModel}</td>
                    </tr>
                    <tr>
                        <th>Part Name</th>
                        <td>${request.handlingPartName}</td>
                    </tr>
                    <tr>
                        <th>Handling Location</th>
                        <td>${request.materialHandlingLocation}</td>
                    </tr>
                    <tr>
                        <th>Volume Per Day</th>
                        <td>${request.volumePerDay}</td>
                    </tr>
                    <tr>
                        <th>User Name</th>
                        <td>${request.userName}</td>
                    </tr>
                    <tr>
                        <th>Status</th>
                        <td><span style="color: ${statusColor}; font-weight: bold;">${request.status}</span></td>
                    </tr>
                    ${request.remark ? `
                    <tr>
                        <th>Remarks</th>
                        <td style="color: #555;">${request.remark}</td>
                    </tr>
                    ` : ''}
                </table>

                <p>Please log in to the portal for more details.</p>
            </div>
            <div class="footer">
                <p>This is an automated message from the TVS MH Request Tracker System.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    // Send Mail
    const info = await transporter.sendMail({
        from: `"MH Request Tracker" <${process.env.SMTP_USER}>`,
        to: recipients,
        subject: `MH Request Notification - ${requestId}`,
        html: htmlContent,
    });

    console.log("Message sent: %s", info.messageId);

    res.status(200).json({ message: 'Email sent successfully', messageId: info.messageId });
});

const sendVendorAllocationEmail = asyncHandler(async (vendorEmail, projectDetails) => {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
        console.error('SMTP configuration missing');
        return;
    }

    const { projectId, department, plant } = projectDetails;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; }
            .header { background-color: #253C80; color: white; padding: 25px; text-align: center; border-radius: 12px 12px 0 0; }
            .content { padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; }
            .detail-row { display: flex; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
            .label { font-weight: bold; width: 140px; color: #64748b; }
            .value { font-weight: 600; color: #1e293b; }
            .footer { text-align: center; margin-top: 25px; font-size: 12px; color: #94a3b8; }
            .btn { display: inline-block; padding: 12px 24px; background-color: #253C80; color: white !important; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin:0; font-size: 24px;">New Project Allocated</h1>
            </div>
            <div class="content">
                <p>Dear Vendor,</p>
                <p>A new Material Handling (MH) project has been successfully allocated to you. Please find the preliminary details below:</p>
                
                <div style="margin: 25px 0; background: #f8fafc; padding: 20px; border-radius: 12px;">
                    <div class="detail-row">
                        <span class="label">Project ID:</span>
                        <span class="value">${projectId}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Department:</span>
                        <span class="value">${department}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Plant:</span>
                        <span class="value">${plant}</span>
                    </div>
                </div>

                <p>Please log in to the system to review the full requirements and proceed with the <strong>Design Stage</strong>.</p>
                
                <div style="text-align: center;">
                    <a href="http://localhost:5173/login" class="btn">Log In to Portal</a>
                </div>

                <p style="margin-top: 30px;">Regards,<br><strong>TVS MH System Team</strong></p>
            </div>
            <div class="footer">
                <p>This is an automated notification. Please do not reply directly to this email.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    try {
        await transporter.sendMail({
            from: `"TVS MH Selection" <${process.env.SMTP_USER}>`,
            to: vendorEmail,
            subject: `New Project Allocated - ${projectId}`,
            html: htmlContent
        });
        console.log(`Allocation email sent to vendor: ${vendorEmail}`);
    } catch (error) {
        console.error('Error sending allocation email:', error);
    }
});

const testSMTPConnection = asyncHandler(async (req, res) => {
    try {
        await transporter.verify();
        res.status(200).json({ success: true, message: 'SMTP connection verified successfully!' });
    } catch (error) {
        console.error('SMTP Verification Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to connect to email server',
            error: error.message
        });
    }
});

module.exports = {
    sendRequestEmail,
    testSMTPConnection,
    sendVendorAllocationEmail
};
