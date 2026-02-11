const MHRequest = require('../models/MHRequest');

/**
 * Report Generator Service
 * Generates reports based on report type and filters
 */

const reportQueries = {
    'Progress Report of MH Requests': {
        filter: {},
        description: 'All material handling requests with their current progress status'
    },
    'Progress Report of Approved Requests': {
        filter: { status: 'Accepted' },
        description: 'All approved MH requests'
    },
    'Progress Report of Implemented': {
        filter: { progressStatus: 'Implementation', implementation: true },
        description: 'All implemented MH requests'
    },
    'Progress Report of Rejected': {
        filter: { status: 'Rejected' },
        description: 'All rejected MH requests'
    }
};

/**
 * Generate report data based on report type
 * @param {string} reportType - Type of report to generate
 * @returns {Object} Report data with metadata
 */
const generateReport = async (reportType) => {
    try {
        const queryConfig = reportQueries[reportType] || { filter: {}, description: 'General Report' };

        // Query MH requests based on report type
        const requests = await MHRequest.find(queryConfig.filter)
            .sort({ createdAt: -1 })
            .lean();

        const summary = {
            totalRequests: requests.length,
            byStatus: {},
            byProgressStatus: {},
            byModel: {}
        };

        requests.forEach(req => {
            summary.byStatus[req.status] = (summary.byStatus[req.status] || 0) + 1;
            summary.byProgressStatus[req.progressStatus] = (summary.byProgressStatus[req.progressStatus] || 0) + 1;
            summary.byModel[req.productModel] = (summary.byModel[req.productModel] || 0) + 1;
        });

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
                .header { background-color: #1a2b5e; color: white; padding: 20px; text-align: center; }
                .summary { background-color: #f4f4f4; padding: 15px; margin: 20px 0; border-radius: 5px; }
                .summary-item { display: inline-block; margin: 10px 20px; }
                .summary-label { font-weight: bold; color: #1a2b5e; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th { background-color: #1a2b5e; color: white; padding: 12px; text-align: left; }
                td { padding: 10px; border-bottom: 1px solid #ddd; }
                tr:hover { background-color: #f5f5f5; }
                .status-active { color: #1a2b5e; font-weight: bold; }
                .status-accepted { color: #10b981; font-weight: bold; }
                .status-rejected { color: #ef4444; font-weight: bold; }
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
            </div>
            
            <h2>Detailed Report</h2>
            <table>
                <thead>
                    <tr>
                        <th>MH ID</th>
                        <th>User</th>
                        <th>Dept</th>
                        <th>Part</th>
                        <th>Status</th>
                        <th>Progress</th>
                        <th>Created</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(req => `
                        <tr>
                            <td>${req.mhRequestId}</td>
                            <td>${req.userName}</td>
                            <td>${req.departmentName}</td>
                            <td>${req.handlingPartName || 'N/A'}</td>
                            <td class="status-${req.status.toLowerCase()}">${req.status}</td>
                            <td>${req.progressStatus}</td>
                            <td>${new Date(req.createdAt).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="footer">
                <p>This is an automated report from TVS MH Request Management System</p>
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
