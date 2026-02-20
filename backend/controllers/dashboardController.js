const MHRequest = require('../models/MHRequest');
const MHDevelopmentTracker = require('../models/MHDevelopmentTracker');
const Vendor = require('../models/Vendor');
const VendorLoading = require('../models/VendorLoading');
const AssetManagement = require('../models/AssetManagement');// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getStats = async (req, res) => {
    try {
        // Get all active MH requests
        const allRequests = await MHRequest.find({ activeStatus: true });

        // KPI Cards Statistics
        const totalRequests = allRequests.filter(req => req.status === 'Active').length;
        const accepted = allRequests.filter(req => req.status === 'Accepted').length;
        const rejected = allRequests.filter(req => req.status === 'Rejected').length;
        const implemented = allRequests.filter(req => req.progressStatus === 'Implementation').length;

        // Production Workflow Statistics
        const requestStage = allRequests.filter(req =>
            req.status === 'Active' || req.status === 'Accepted'
        ).length;
        const designStage = allRequests.filter(req => req.progressStatus === 'Design').length;
        const designApprovedStage = allRequests.filter(req => req.progressStatus === 'Design Approved').length;
        const implementationStage = allRequests.filter(req => req.progressStatus === 'Implementation').length;
        const productionStage = allRequests.filter(req => req.progressStatus === 'Production').length;

        // Additional statistics for enhanced dashboard
        const totalActiveRequests = allRequests.length;

        // Calculate completion rates
        const completionRate = totalActiveRequests > 0
            ? ((productionStage / totalActiveRequests) * 100).toFixed(1)
            : 0;

        // Category breakdown (Using productModel instead of category)
        const productBreakdown = allRequests.reduce((acc, req) => {
            const model = req.productModel || 'Other';
            acc[model] = (acc[model] || 0) + 1;
            return acc;
        }, {});

        // Request type breakdown
        const typeBreakdown = allRequests.reduce((acc, req) => {
            const type = req.requestType || 'Other';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});

        // Recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentRequests = allRequests.filter(req =>
            new Date(req.createdAt) >= sevenDaysAgo
        ).length;

        // Calculate actual average processing time
        const completedRequests = allRequests.filter(req => req.progressStatus === 'Production');
        let avgProcessingTime = 0;

        if (completedRequests.length > 0) {
            const totalDays = completedRequests.reduce((sum, req) => {
                const createdDate = new Date(req.createdAt);
                const now = new Date();
                const daysDiff = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
                return sum + daysDiff;
            }, 0);
            avgProcessingTime = (totalDays / completedRequests.length).toFixed(1);
        }

        const mhTrackers = await MHDevelopmentTracker.find({});
        const assetManagementRecords = await AssetManagement.find({});

        const stageMetrics = {
            mhRequests: {
                pendingList: allRequests.filter(r => r.status === 'Active').map(r => ({ id: r.mhRequestId, name: r.materialHandlingEquipment || r.handlingPartName || r.productModel })),
                completedList: allRequests.filter(r => r.status === 'Accepted').map(r => ({ id: r.mhRequestId, name: r.materialHandlingEquipment || r.handlingPartName || r.productModel }))
            },
            approval: {
                pendingList: allRequests.filter(r => r.status === 'Active').map(r => ({ id: r.mhRequestId, name: r.handlingPartName || r.productModel })),
                completedList: allRequests.filter(r => r.status === 'Accepted').map(r => ({ id: r.mhRequestId, name: r.handlingPartName || r.productModel }))
            },
            vendorSelection: {
                pendingList: mhTrackers.filter(t => !t.vendorCode).map(t => ({ id: t.assetRequestId, name: t.productModel || t.departmentName })),
                completedList: mhTrackers.filter(t => t.vendorCode).map(t => ({ id: t.assetRequestId, name: t.vendorName || t.vendorCode }))
            },
            designRelease: {
                pendingList: mhTrackers.filter(t => t.currentStage === 'Design').map(t => ({ id: t.assetRequestId, name: t.productModel || t.departmentName })),
                completedList: mhTrackers.filter(t => t.currentStage !== 'Design' && t.currentStage !== 'Not Started').map(t => ({ id: t.assetRequestId, name: t.productModel || t.departmentName }))
            },
            prPoRelease: {
                pendingList: mhTrackers.filter(t => t.currentStage === 'PR/PO').map(t => ({ id: t.assetRequestId, name: t.productModel || t.departmentName })),
                completedList: mhTrackers.filter(t => ['Sample Production', 'Production Ready', 'Completed'].includes(t.currentStage)).map(t => ({ id: t.assetRequestId, name: t.productModel || t.departmentName }))
            },
            sampleReceipt: {
                pendingList: mhTrackers.filter(t => t.currentStage === 'Sample Production').map(t => ({ id: t.assetRequestId, name: t.productModel || t.departmentName })),
                completedList: mhTrackers.filter(t => ['Production Ready', 'Completed'].includes(t.currentStage)).map(t => ({ id: t.assetRequestId, name: t.productModel || t.departmentName }))
            },
            bulkLot: {
                pendingList: mhTrackers.filter(t => t.currentStage === 'Production Ready').map(t => ({ id: t.assetRequestId, name: t.productModel || t.departmentName })),
                completedList: mhTrackers.filter(t => t.currentStage === 'Completed').map(t => ({ id: t.assetRequestId, name: t.productModel || t.departmentName }))
            },
            handover: {
                pendingList: assetManagementRecords.filter(a => !a.signOffDocument?.filename).map(a => ({ id: a.assetId, name: a.assetName })),
                completedList: assetManagementRecords.filter(a => a.signOffDocument?.filename).map(a => ({ id: a.assetId, name: a.assetName }))
            },
            assetImplementation: {
                pendingList: assetManagementRecords.filter(a => !a.signOffDocument?.filename).map(a => ({ id: a.assetId, name: a.assetName })),
                completedList: assetManagementRecords.filter(a => a.signOffDocument?.filename).map(a => ({ id: a.assetId, name: a.assetName }))
            }
        };

        res.json({
            kpiCards: {
                totalRequests,
                accepted,
                rejected,
                implemented
            },
            productionWorkflow: {
                requestStage,
                designStage,
                designApprovedStage,
                implementationStage,
                productionStage
            },
            additionalStats: {
                totalActiveRequests,
                completionRate,
                productBreakdown,
                typeBreakdown,
                recentRequests,
                avgProcessingTime
            },
            stageMetrics
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// @desc    Get recent activity/requests
// @route   GET /api/dashboard/recent-activity
// @access  Private
const getRecentActivity = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const recentRequests = await MHRequest.find({ activeStatus: true })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('mhRequestId userName departmentName status progressStatus createdAt');

        res.json(recentRequests);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// @desc    Get trend data for charts with optional date range
// @route   GET /api/dashboard/trends
// @access  Private
const getTrends = async (req, res) => {
    try {
        const { from, to } = req.query;

        let startDate, endDate;
        let groupByDay = false;

        if (from && to) {
            startDate = new Date(from);
            endDate = new Date(to);
            endDate.setHours(23, 59, 59, 999);
            groupByDay = true;
        } else {
            endDate = new Date();
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 11);
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
            groupByDay = false;
        }

        const requests = await MHRequest.find({
            activeStatus: true,
            createdAt: {
                $gte: startDate,
                $lte: endDate
            }
        });

        const trendsData = {};

        if (groupByDay) {
            let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                const dateKey = currentDate.toISOString().slice(0, 10);
                trendsData[dateKey] = {
                    displayDate: currentDate.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    }),
                    total: 0,
                    accepted: 0,
                    rejected: 0,
                    active: 0
                };
                currentDate.setDate(currentDate.getDate() + 1);
            }

            requests.forEach(req => {
                const dateKey = new Date(req.createdAt).toISOString().slice(0, 10);
                if (trendsData[dateKey]) {
                    trendsData[dateKey].total++;
                    if (req.status === 'Accepted') trendsData[dateKey].accepted++;
                    else if (req.status === 'Rejected') trendsData[dateKey].rejected++;
                    else if (req.status === 'Active') trendsData[dateKey].active++;
                }
            });
        } else {
            let currentDate = new Date(startDate);
            while (currentDate <= endDate) {
                const monthKey = currentDate.toISOString().slice(0, 7);
                trendsData[monthKey] = {
                    displayDate: currentDate.toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric'
                    }),
                    total: 0,
                    accepted: 0,
                    rejected: 0,
                    active: 0
                };
                currentDate.setMonth(currentDate.getMonth() + 1);
            }

            requests.forEach(req => {
                const monthKey = new Date(req.createdAt).toISOString().slice(0, 7);
                if (trendsData[monthKey]) {
                    trendsData[monthKey].total++;
                    if (req.status === 'Accepted') trendsData[monthKey].accepted++;
                    else if (req.status === 'Rejected') trendsData[monthKey].rejected++;
                    else if (req.status === 'Active') trendsData[monthKey].active++;
                }
            });
        }

        res.json(Object.values(trendsData));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

// @desc    Helper to update old records to current date for visibility
// @route   GET /api/dashboard/fix-data-dates
// @access  Private
const fixDataDates = async (req, res) => {
    try {
        const requests = await MHRequest.find({});
        const baseDate = new Date();
        let i = 0;

        for (const req of requests) {
            const newDate = new Date(baseDate);
            newDate.setDate(baseDate.getDate() - (i % 5));
            req.createdAt = newDate;
            await req.save();
            i++;
        }
        res.json({ success: true, count: requests.length, message: "MH Request dates updated to recent values." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

module.exports = {
    getStats,
    getRecentActivity,
    getTrends,
    fixDataDates
};
