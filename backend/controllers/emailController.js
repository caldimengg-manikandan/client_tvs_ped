const nodemailer = require('nodemailer');
const asyncHandler = require('express-async-handler');
const AssetRequest = require('../models/AssetRequest');

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
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
    const request = await AssetRequest.findOne({ assetRequestId: requestId });
    if (!request) {
        res.status(404);
        throw new Error('Asset Request not found');
    }

    // Construct Image URL (Assuming backend serves static 'uploads' folder)
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
    const imageUrl = request.assetImage ? `${baseUrl}${request.assetImage}` : '';

    // HTML Template
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9; }
            .header { background-color: #0056b3; color: white; padding: 15px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; background-color: white; border-radius: 0 0 8px 8px; }
            .details-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .details-table th, .details-table td { padding: 12px; border-bottom: 1px solid #ddd; text-align: left; }
            .details-table th { background-color: #f2f2f2; color: #555; width: 40%; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #777; }
            .image-container { text-align: center; margin: 20px 0; }
            .image-container img { max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; padding: 4px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Request Tracker Notification</h2>
            </div>
            <div class="content">
                <p>Hello,</p>
                <p>You have been assigned to review the following Asset Request:</p>
                
                <table class="details-table">
                    <tr>
                        <th>Request ID</th>
                        <td><strong>${request.assetRequestId}</strong></td>
                    </tr>
                    <tr>
                        <th>Department</th>
                        <td>${request.departmentName}</td>
                    </tr>
                    <tr>
                        <th>Request Type</th>
                        <td>${request.requestType}</td>
                    </tr>
                     <tr>
                        <th>Category</th>
                        <td>${request.category}</td>
                    </tr>
                    <tr>
                        <th>Part Name</th>
                        <td>${request.handlingPartName}</td>
                    </tr>
                    <tr>
                        <th>User Name</th>
                        <td>${request.userName}</td>
                    </tr>
                     <tr>
                        <th>Asset Location</th>
                        <td>${request.assetNeededLocation}</td>
                    </tr>
                    <tr>
                        <th>Status</th>
                        <td><span style="color: #28a745; font-weight: bold;">${request.status}</span></td>
                    </tr>
                </table>

                ${imageUrl ? `
                <div class="image-container">
                    <p><strong>Asset Image:</strong></p>
                    <img src="${imageUrl}" alt="Asset Image" />
                </div>` : ''}

                <p>Please log in to the portal for more details.</p>
            </div>
            <div class="footer">
                <p>This is an automated message from the Request Tracker System.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    // Send Mail
    const info = await transporter.sendMail({
        from: `"Request Tracker" <${process.env.SMTP_USER}>`, // sender address must match auth user
        to: recipients, // list of receivers
        subject: `Request Tracker Notification - ${requestId}`, // Subject line
        html: htmlContent, // html body
    });

    console.log("Message sent: %s", info.messageId);

    res.status(200).json({ message: 'Email sent successfully', messageId: info.messageId });
});

module.exports = {
    sendRequestEmail
};
