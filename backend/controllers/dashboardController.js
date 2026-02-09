const AssetRequest = require('../models/AssetRequest');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getStats = async (req, res) => {
    try {
        // Get all active asset requests
        const allRequests = await AssetRequest.find({ activeStatus: true });

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

        // Category breakdown
        const newProjects = allRequests.filter(req => req.category === 'New Project').length;
        const currentProductSupport = allRequests.filter(req => req.category === 'Current Product Support').length;

        // Request type breakdown
        const newRequests = allRequests.filter(req => req.requestType === 'New').length;
        const modifyRequests = allRequests.filter(req => req.requestType === 'Modify').length;

        // Recent activity (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentRequests = allRequests.filter(req =>
            new Date(req.createdAt) >= sevenDaysAgo
        ).length;

        // Calculate actual average processing time
        // For requests that have reached Production stage, calculate days from creation
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
                newProjects,
                currentProductSupport,
                newRequests,
                modifyRequests,
                recentRequests,
                avgProcessingTime
            }
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

        const recentRequests = await AssetRequest.find({ activeStatus: true })
            .sort({ createdAt: -1 })
            .limit(limit)
            .select('assetRequestId userName departmentName status progressStatus createdAt');

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

        // Set default date range (last 12 months) if not provided
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

        // Fetch requests within date range
        const requests = await AssetRequest.find({
            activeStatus: true,
            createdAt: {
                $gte: startDate,
                $lte: endDate
            }
        });

        const trendsData = {};

        if (groupByDay) {
            // Group by day for filtered date range
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

            // Count requests by day
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
            // Group by month for default view
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

            // Count requests by month
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
        const requests = await AssetRequest.find({});
        const baseDate = new Date();
        let i = 0;
        console.log(`[Fix] Found ${requests.length} requests to update.`);

        for (const req of requests) {
            const newDate = new Date(baseDate);
            newDate.setDate(baseDate.getDate() - (i % 5)); // Spread over last 5 days
            req.createdAt = newDate;
            await req.save();
            i++;
            console.log(`[Fix] Updated ${req.assetRequestId} to ${newDate.toISOString()}`);
        }
        res.json({ success: true, count: requests.length, message: "AssetRequest dates updated to recent values." });
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
