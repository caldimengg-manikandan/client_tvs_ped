const ReportSettings = require('../models/ReportSettings');
const { generateReport, formatReportAsHTML } = require('../services/reportGenerator');
const { sendReportEmail } = require('../services/emailService');

/**
 * @desc    Get current report settings
 * @route   GET /api/report-settings
 * @access  Private
 */
const getReportSettings = async (req, res) => {
    try {
        // Get the active settings (we only maintain one active setting)
        const settings = await ReportSettings.findOne({ isActive: true });

        if (!settings) {
            // Return default settings if none exist
            return res.json({
                success: true,
                data: {
                    frequency: 'Weekly',
                    reportType: 'Progress Report of Asset Requests',
                    recipients: [],
                    isActive: false
                }
            });
        }

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Error fetching report settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch report settings'
        });
    }
};

/**
 * @desc    Save/Update report settings
 * @route   POST /api/report-settings
 * @access  Private
 */
const saveReportSettings = async (req, res) => {
    try {
        const { frequency, reportType, recipients } = req.body;

        // Validate input
        if (!frequency || !reportType || !recipients || recipients.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide frequency, report type, and at least one recipient'
            });
        }

        // Deactivate any existing settings
        await ReportSettings.updateMany({}, { isActive: false });

        // Create new settings
        const settings = new ReportSettings({
            frequency,
            reportType,
            recipients,
            isActive: true,
            createdBy: req.user?._id
        });

        // Calculate next run date
        settings.nextRunAt = settings.calculateNextRun();

        await settings.save();

        res.status(201).json({
            success: true,
            message: 'Report settings saved successfully',
            data: settings
        });
    } catch (error) {
        console.error('Error saving report settings:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to save report settings'
        });
    }
};

/**
 * @desc    Generate and preview report (manual trigger)
 * @route   POST /api/report-settings/preview
 * @access  Private
 */
const previewReport = async (req, res) => {
    try {
        const { reportType } = req.body;

        if (!reportType) {
            return res.status(400).json({
                success: false,
                message: 'Please provide report type'
            });
        }

        // Generate report
        const reportData = await generateReport(reportType);

        res.json({
            success: true,
            data: reportData
        });
    } catch (error) {
        console.error('Error generating preview report:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate preview report'
        });
    }
};

/**
 * @desc    Send report immediately (manual trigger)
 * @route   POST /api/report-settings/send-now
 * @access  Private
 */
const sendReportNow = async (req, res) => {
    try {
        const { reportType, recipients } = req.body;

        if (!reportType || !recipients || recipients.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide report type and recipients'
            });
        }

        // Generate report
        const reportData = await generateReport(reportType);

        // Format as HTML
        const htmlContent = formatReportAsHTML(reportData);

        // Send email
        const emailResult = await sendReportEmail(recipients, reportData, htmlContent);

        res.json({
            success: true,
            message: 'Report sent successfully',
            data: {
                reportSummary: reportData.summary,
                emailResult
            }
        });
    } catch (error) {
        console.error('Error sending report:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send report'
        });
    }
};

/**
 * @desc    Delete report settings
 * @route   DELETE /api/report-settings
 * @access  Private
 */
const deleteReportSettings = async (req, res) => {
    try {
        await ReportSettings.updateMany({}, { isActive: false });

        res.json({
            success: true,
            message: 'Report settings deactivated successfully'
        });
    } catch (error) {
        console.error('Error deleting report settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete report settings'
        });
    }
};

module.exports = {
    getReportSettings,
    saveReportSettings,
    previewReport,
    sendReportNow,
    deleteReportSettings
};
