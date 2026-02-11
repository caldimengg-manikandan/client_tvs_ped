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

    // ===== VALIDATION: Only allow notification for Rejected status =====
    if (request.status === 'Active') {
        res.status(400);
        throw new Error('Cannot send notification. Request status is Active. Notifications can only be sent for Rejected requests.');
    }

    if (request.status === 'Accepted') {
        res.status(400);
        throw new Error('Cannot send notification. Request status is Accepted. Notifications are only sent for Rejected requests.');
    }

    // At this point, status must be 'Rejected'
    if (request.status !== 'Rejected') {
        res.status(400);
        throw new Error('Cannot send notification. Notifications can only be sent for Rejected requests.');
    }
    // ===== END VALIDATION =====

    // Determine if this is a rejection notification
    const isRejection = request.status === 'Rejected';
    const notificationTitle = isRejection ? 'MH Request Rejected' : 'MH Request Notification';
    const headerColor = isRejection ? '#dc2626' : '#1a2b5e';
    const statusColor = isRejection ? '#dc2626' : '#1a2b5e';

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
            .alert-box { background-color: ${isRejection ? '#fee2e2' : '#dbeafe'}; border-left: 4px solid ${headerColor}; padding: 12px; margin: 15px 0; border-radius: 4px; }
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
                ` : `
                <p>You have been assigned to review the following MH Request:</p>
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

module.exports = {
    sendRequestEmail
};
