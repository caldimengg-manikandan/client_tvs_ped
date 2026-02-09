const AssetRequest = require('../models/AssetRequest');

/**
 * Report Generator Service
 * Generates reports based on report type and filters
 */

// Define query filters for each report type
const reportQueries = {
    'Progress Report of Asset Requests': {
        filter: {},
        description: 'All asset requests with their current progress status'
    },
    'Progress Report of Approved Requests': {
        filter: { status: 'Accepted' },
        description: 'All approved asset requests'
    },
    'Progress Report of Implemented': {
        filter: { progressStatus: 'Implementation', implementation: true },
        description: 'All implemented asset requests'
    },
    'Progress Report of Rejected': {
        filter: { status: 'Rejected' },
        description: 'All rejected asset requests'
    }
};

/**
 * Generate report data based on report type
 * @param {string} reportType - Type of report to generate
 * @returns {Object} Report data with metadata
 */
const generateReport = async (reportType) => {
    try {
        console.log(`[Report Generator] Starting report generation for: ${reportType}`);

        const queryConfig = reportQueries[reportType];

        if (!queryConfig) {
            throw new Error(`Invalid report type: ${reportType}`);
        }

        console.log(`[Report Generator] Query filter:`, queryConfig.filter);

        // Query asset requests based on report type (without populate for now to avoid errors)
        const requests = await AssetRequest.find(queryConfig.filter)
            .sort({ createdAt: -1 })
            .lean();

        console.log(`[Report Generator] Found ${requests.length} requests`);

        // Calculate summary statistics
        const summary = {
            totalRequests: requests.length,
            byStatus: {},
            byProgressStatus: {},
            byCategory: {}
        };

        requests.forEach(req => {
            // Count by status
            summary.byStatus[req.status] = (summary.byStatus[req.status] || 0) + 1;

            // Count by progress status
            summary.byProgressStatus[req.progressStatus] =
                (summary.byProgressStatus[req.progressStatus] || 0) + 1;

            // Count by category
            summary.byCategory[req.category] =
                (summary.byCategory[req.category] || 0) + 1;
        });

        console.log(`[Report Generator] Summary:`, summary);

        return {
            reportType,
            description: queryConfig.description,
            generatedAt: new Date(),
            summary,
            data: requests,
            metadata: {
                dateRange: {
                    from: requests.length > 0 ? requests[requests.length - 1].createdAt : null,
                    to: requests.length > 0 ? requests[0].createdAt : null
                }
            }
        };
    } catch (error) {
        console.error('[Report Generator] Error generating report:', error);
        console.error('[Report Generator] Error stack:', error.stack);
        throw error;
    }
};

/**
 * Format report data as HTML for email
 * @param {Object} reportData - Report data from generateReport
 * @returns {string} HTML formatted report
 */
const formatReportAsHTML = (reportData) => {
    const { reportType, description, generatedAt, summary, data } = reportData;

    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .header { background-color: #0066cc; color: white; padding: 20px; text-align: center; }
                .summary { background-color: #f4f4f4; padding: 15px; margin: 20px 0; border-radius: 5px; }
                .summary-item { display: inline-block; margin: 10px 20px; }
                .summary-label { font-weight: bold; color: #0066cc; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th { background-color: #0066cc; color: white; padding: 12px; text-align: left; }
                td { padding: 10px; border-bottom: 1px solid #ddd; }
                tr:hover { background-color: #f5f5f5; }
                .status-active { color: #28a745; font-weight: bold; }
                .status-accepted { color: #007bff; font-weight: bold; }
                .status-rejected { color: #dc3545; font-weight: bold; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${reportType}</h1>
                <p>${description}</p>
                <p>Generated on: ${generatedAt.toLocaleString()}</p>
            </div>
            
            <div class="summary">
                <h2>Summary</h2>
                <div class="summary-item">
                    <span class="summary-label">Total Requests:</span> ${summary.totalRequests}
                </div>
                ${Object.entries(summary.byStatus).map(([status, count]) => `
                    <div class="summary-item">
                        <span class="summary-label">${status}:</span> ${count}
                    </div>
                `).join('')}
            </div>
            
            <h2>Detailed Report</h2>
            <table>
                <thead>
                    <tr>
                        <th>Request ID</th>
                        <th>User</th>
                        <th>Department</th>
                        <th>Asset Name</th>
                        <th>Status</th>
                        <th>Progress</th>
                        <th>Created Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(req => `
                        <tr>
                            <td>${req.assetRequestId}</td>
                            <td>${req.userName}</td>
                            <td>${req.departmentName}</td>
                            <td>${req.assetName || 'N/A'}</td>
                            <td class="status-${req.status.toLowerCase()}">${req.status}</td>
                            <td>${req.progressStatus}</td>
                            <td>${new Date(req.createdAt).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="footer">
                <p>This is an automated report from TVS Asset Management System</p>
                <p>Please do not reply to this email</p>
            </div>
        </body>
        </html>
    `;

    return html;
};

module.exports = {
    generateReport,
    formatReportAsHTML
};
