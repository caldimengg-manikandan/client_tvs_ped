const MHRequest = require('../models/MHRequest');
const MHDevelopmentTracker = require('../models/MHDevelopmentTracker');
const Vendor = require('../models/Vendor');
const AssetManagement = require('../models/AssetManagement');
const Employee = require('../models/EmployeeModel');
const VendorScoring = require('../models/VendorScoring');

/* ─────────────────────────────────────────────────────────────
   LEGACY ENDPOINTS (kept for backward compatibility)
───────────────────────────────────────────────────────────── */

const getStats = async (req, res) => {
    try {
        const allRequests = await MHRequest.find({ activeStatus: true });
        const totalRequests = allRequests.filter(req => req.status === 'Active').length;
        const accepted = allRequests.filter(req => req.status === 'Accepted').length;
        const rejected = allRequests.filter(req => req.status === 'Rejected').length;
        const requestStage = allRequests.filter(req => req.status === 'Active' || req.status === 'Accepted').length;
        const designStage = allRequests.filter(req => req.progressStatus === 'Design').length;
        const designApprovedStage = allRequests.filter(req => req.progressStatus === 'Design Approved').length;
        const implementationStage = allRequests.filter(req => req.progressStatus === 'Implementation').length;
        const productionStage = allRequests.filter(req => req.progressStatus === 'Production').length;
        const totalActiveRequests = allRequests.length;
        const completionRate = totalActiveRequests > 0 ? ((productionStage / totalActiveRequests) * 100).toFixed(1) : 0;
        const productBreakdown = allRequests.reduce((acc, req) => { const model = req.productModel || 'Other'; acc[model] = (acc[model] || 0) + 1; return acc; }, {});
        const typeBreakdown = allRequests.reduce((acc, req) => { const type = req.requestType || 'Other'; acc[type] = (acc[type] || 0) + 1; return acc; }, {});
        const deptBreakdown = allRequests.reduce((acc, req) => { const dept = req.departmentName || 'Other'; acc[dept] = (acc[dept] || 0) + 1; return acc; }, {});
        const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentRequests = allRequests.filter(req => new Date(req.createdAt) >= sevenDaysAgo).length;
        const completedRequests = allRequests.filter(req => req.progressStatus === 'Production');
        let avgProcessingTime = 0;
        if (completedRequests.length > 0) {
            const totalDays = completedRequests.reduce((sum, req) => { const daysDiff = Math.floor((new Date() - new Date(req.createdAt)) / 86400000); return sum + daysDiff; }, 0);
            avgProcessingTime = (totalDays / completedRequests.length).toFixed(1);
        }
        const mhTrackers = await MHDevelopmentTracker.find({});
        const assetManagementRecords = await AssetManagement.find({});
        const locationBreakdown = assetManagementRecords.reduce((acc, a) => { const loc = a.plantLocation || 'Unknown'; acc[loc] = (acc[loc] || 0) + 1; return acc; }, {});
        const stageMetrics = {
            mhRequests: { pendingList: allRequests.filter(r => r.status === 'Active').map(r => ({ id: r.mhRequestId, name: r.materialHandlingEquipment || r.handlingPartName || r.productModel })), completedList: allRequests.filter(r => r.status === 'Accepted').map(r => ({ id: r.mhRequestId, name: r.materialHandlingEquipment || r.handlingPartName || r.productModel })) },
            approval: { pendingList: allRequests.filter(r => r.status === 'Active').map(r => ({ id: r.mhRequestId, name: r.handlingPartName || r.productModel })), completedList: allRequests.filter(r => r.status === 'Accepted').map(r => ({ id: r.mhRequestId, name: r.handlingPartName || r.productModel })) },
            vendorSelection: { pendingList: mhTrackers.filter(t => !t.vendorCode).map(t => ({ id: t.assetRequestId, name: t.productModel || t.departmentName })), completedList: mhTrackers.filter(t => t.vendorCode).map(t => ({ id: t.assetRequestId, name: t.vendorName || t.vendorCode })) },
            designRelease: { pendingList: mhTrackers.filter(t => t.currentStage === 'Design').map(t => ({ id: t.assetRequestId, name: t.productModel || t.departmentName })), completedList: mhTrackers.filter(t => t.currentStage !== 'Design' && t.currentStage !== 'Not Started').map(t => ({ id: t.assetRequestId, name: t.productModel || t.departmentName })) },
            prPoRelease: { pendingList: mhTrackers.filter(t => t.currentStage === 'PR/PO').map(t => ({ id: t.assetRequestId, name: t.productModel || t.departmentName })), completedList: mhTrackers.filter(t => ['Sample Production', 'Production Ready', 'Completed'].includes(t.currentStage)).map(t => ({ id: t.assetRequestId, name: t.productModel || t.departmentName })) },
            sampleReceipt: { pendingList: mhTrackers.filter(t => t.currentStage === 'Sample Production').map(t => ({ id: t.assetRequestId, name: t.productModel || t.departmentName })), completedList: mhTrackers.filter(t => ['Production Ready', 'Completed'].includes(t.currentStage)).map(t => ({ id: t.assetRequestId, name: t.productModel || t.departmentName })) },
            bulkLot: { pendingList: mhTrackers.filter(t => t.currentStage === 'Production Ready').map(t => ({ id: t.assetRequestId, name: t.productModel || t.departmentName })), completedList: mhTrackers.filter(t => t.currentStage === 'Completed').map(t => ({ id: t.assetRequestId, name: t.productModel || t.departmentName })) },
            handover: { pendingList: assetManagementRecords.filter(a => !a.signOffDocument?.filename).map(a => ({ id: a.assetId, name: a.assetName })), completedList: assetManagementRecords.filter(a => a.signOffDocument?.filename).map(a => ({ id: a.assetId, name: a.assetName })) },
            assetImplementation: { pendingList: assetManagementRecords.filter(a => !a.signOffDocument?.filename).map(a => ({ id: a.assetId, name: a.assetName })), completedList: assetManagementRecords.filter(a => a.signOffDocument?.filename).map(a => ({ id: a.assetId, name: a.assetName })) }
        };
        const workflowV2 = { mh_requests: stageMetrics.mhRequests.completedList.length + stageMetrics.mhRequests.pendingList.length, approval_stage: stageMetrics.approval.completedList.length, vendor_selection: stageMetrics.vendorSelection.completedList.length, design_release: stageMetrics.designRelease.completedList.length, pr_po_release: stageMetrics.prPoRelease.completedList.length, sample_receipt: stageMetrics.sampleReceipt.completedList.length, bulk_lot_clearance: stageMetrics.bulkLot.completedList.length, handover_signoff: stageMetrics.handover.completedList.length, asset_implementation: stageMetrics.assetImplementation.completedList.length };
        res.json({ kpiCards: { totalRequests: allRequests.length, accepted, rejected, implemented: allRequests.filter(r => ['Implementation', 'Production'].includes(r.progressStatus)).length }, productionWorkflow: workflowV2, locationBreakdown, additionalStats: { totalActiveRequests, completionRate, productBreakdown, typeBreakdown, deptBreakdown, recentRequests, avgProcessingTime }, stageMetrics });
    } catch (err) { console.error(err); res.status(500).json({ message: 'Server Error', error: err.message }); }
};

const getRecentActivity = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const recentRequests = await MHRequest.find({ activeStatus: true }).sort({ createdAt: -1 }).limit(limit).select('mhRequestId userName departmentName status progressStatus createdAt');
        res.json(recentRequests);
    } catch (err) { console.error(err); res.status(500).json({ message: 'Server Error', error: err.message }); }
};

const getTrends = async (req, res) => {
    try {
        const { from, to } = req.query;
        let startDate, endDate, groupByDay = false;
        if (from && to) {
            startDate = new Date(from); endDate = new Date(to); endDate.setHours(23, 59, 59, 999); groupByDay = true;
        } else {
            endDate = new Date(); startDate = new Date(); startDate.setMonth(startDate.getMonth() - 11); startDate.setDate(1); startDate.setHours(0, 0, 0, 0);
        }
        const requests = await MHRequest.find({ activeStatus: true, createdAt: { $gte: startDate, $lte: endDate } });
        const trendsData = {};
        if (groupByDay) {
            let cur = new Date(startDate);
            while (cur <= endDate) { const k = cur.toISOString().slice(0, 10); trendsData[k] = { displayDate: cur.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), total: 0, accepted: 0, rejected: 0, active: 0 }; cur.setDate(cur.getDate() + 1); }
            requests.forEach(r => { const k = new Date(r.createdAt).toISOString().slice(0, 10); if (trendsData[k]) { trendsData[k].total++; if (r.status === 'Accepted') trendsData[k].accepted++; else if (r.status === 'Rejected') trendsData[k].rejected++; else trendsData[k].active++; } });
        } else {
            let cur = new Date(startDate);
            while (cur <= endDate) { const k = cur.toISOString().slice(0, 7); trendsData[k] = { displayDate: cur.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), total: 0, accepted: 0, rejected: 0, active: 0 }; cur.setMonth(cur.getMonth() + 1); }
            requests.forEach(r => { const k = new Date(r.createdAt).toISOString().slice(0, 7); if (trendsData[k]) { trendsData[k].total++; if (r.status === 'Accepted') trendsData[k].accepted++; else if (r.status === 'Rejected') trendsData[k].rejected++; else trendsData[k].active++; } });
        }
        res.json(Object.values(trendsData));
    } catch (err) { console.error(err); res.status(500).json({ message: 'Server Error', error: err.message }); }
};

const fixDataDates = async (req, res) => {
    try {
        const requests = await MHRequest.find({});
        const baseDate = new Date();
        let i = 0;
        for (const req of requests) { const newDate = new Date(baseDate); newDate.setDate(baseDate.getDate() - (i % 5)); req.createdAt = newDate; await req.save(); i++; }
        res.json({ success: true, count: requests.length, message: 'MH Request dates updated to recent values.' });
    } catch (err) { console.error(err); res.status(500).json({ message: 'Server Error', error: err.message }); }
};

/* ─────────────────────────────────────────────────────────────
   UNIFIED DASHBOARD ENDPOINT
   GET /api/dashboard  (with optional ?from=YYYY-MM-DD&to=YYYY-MM-DD)
───────────────────────────────────────────────────────────── */

const getDashboardData = async (req, res) => {
    try {
        const { from, to } = req.query;
        const now = new Date();

        // Build date range filter
        let dateFilter = {};
        let startDate, endDate;
        if (from && to) {
            startDate = new Date(from);
            endDate = new Date(to);
            endDate.setHours(23, 59, 59, 999);
            dateFilter = { createdAt: { $gte: startDate, $lte: endDate } };
        } else {
            endDate = now;
            startDate = new Date(now);
            startDate.setFullYear(startDate.getFullYear() - 1);
        }

        // Month helpers
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30);

        const [
            mhSummaryRaw,
            mhTrendRaw,
            mhByDeptRaw,
            mhByStatusRaw,
            mhByPriorityRaw,
            pedEngineers,
            vendorScores,
            assetDocs,
            devTrackerRaw,
            recentRequestsDocs,
            activityDocs,
            totalEmployeesCount,
            activeVendorCount,
            emailLogCount,
            mhDevPhasesRaw
        ] = await Promise.all([
            // 1. mhSummary aggregation
            MHRequest.aggregate([
                { $match: { activeStatus: true, ...dateFilter } },
                {
                    $group: {
                        _id: null,
                        totalRequested: { $sum: 1 },
                        totalApproved: { $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] } },
                        totalRejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } },
                        totalPending: { $sum: { $cond: [{ $eq: ['$workflowStatus', 'Pending'] }, 1, 0] } },
                        totalAssigned: { $sum: { $cond: [{ $eq: ['$workflowStatus', 'Assigned'] }, 1, 0] } },
                        thisMonth: { $sum: { $cond: [{ $gte: ['$createdAt', thisMonthStart] }, 1, 0] } },
                        thisMonthApproved: { $sum: { $cond: [{ $and: [{ $gte: ['$createdAt', thisMonthStart] }, { $eq: ['$status', 'Accepted'] }] }, 1, 0] } },
                        lastMonth: { $sum: { $cond: [{ $and: [{ $gte: ['$createdAt', lastMonthStart] }, { $lte: ['$createdAt', lastMonthEnd] }] }, 1, 0] } }
                    }
                }
            ]),

            // 2. mhTrend: last 12 months
            MHRequest.aggregate([
                { $match: { activeStatus: true, createdAt: { $gte: new Date(new Date().setMonth(now.getMonth() - 11, 1)) } } },
                {
                    $group: {
                        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                        requested: { $sum: 1 },
                        approved: { $sum: { $cond: [{ $eq: ['$status', 'Accepted'] }, 1, 0] } },
                        rejected: { $sum: { $cond: [{ $eq: ['$status', 'Rejected'] }, 1, 0] } }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } }
            ]),

            // 3. mhByDepartment
            MHRequest.aggregate([
                { $match: { activeStatus: true, ...dateFilter } },
                {
                    $group: {
                        _id: '$departmentName',
                        requestCount: { $sum: 1 },
                        totalVolume: { $sum: { $ifNull: ['$volumePerDay', 0] } }
                    }
                },
                { $sort: { requestCount: -1 } },
                { $limit: 10 }
            ]),

            // 4. mhByStatus (workflowStatus)
            MHRequest.aggregate([
                { $match: { activeStatus: true, ...dateFilter } },
                { $group: { _id: '$workflowStatus', count: { $sum: 1 } } }
            ]),

            // 5. mhByPriority - MHRequest doesn't have priority field natively, use requestType as proxy
            MHRequest.aggregate([
                { $match: { activeStatus: true, ...dateFilter } },
                { $group: { _id: '$requestType', count: { $sum: 1 } } }
            ]),

            // 6. PED Engineers
            Employee.find({ role: 'PED Engineer', status: 'Active' }).lean(),

            // 7. Vendor scores
            VendorScoring.aggregate([
                {
                    $group: {
                        _id: '$vendorName',
                        avgScore: { $avg: '$qcdScore' },
                        avgCompletion: { $avg: '$completionRate' },
                        avgDelay: { $avg: '$delayRate' },
                        lastScored: { $max: '$updatedAt' }
                    }
                },
                { $sort: { avgScore: -1 } },
                { $limit: 10 }
            ]),

            // 8. Assets
            AssetManagement.find({}).lean(),

            // 9. Dev tracker funnel
            MHDevelopmentTracker.aggregate([
                { $group: { _id: '$currentStage', count: { $sum: 1 } } }
            ]),

            // 10. Recent requests (last 10)
            MHRequest.find({ activeStatus: true })
                .sort({ createdAt: -1 })
                .limit(10)
                .populate('assignedEngineer', 'employeeName')
                .lean(),

            // 11. Activity feed source (last 20 updated)
            MHRequest.find({ activeStatus: true })
                .sort({ updatedAt: -1 })
                .limit(20)
                .lean(),

            // 12. Total employees
            Employee.countDocuments({ status: 'Active' }),

            // 13. Active vendors
            Vendor.countDocuments({}),

            // 14. Email count
            MHRequest.aggregate([
                { $project: { emailCount: { $size: { $ifNull: ['$emailLog', []] } } } },
                { $group: { _id: null, total: { $sum: '$emailCount' } } }
            ]),

            // 15. MH Development phase counts (by currentStage)
            MHDevelopmentTracker.aggregate([
                { $match: dateFilter },
                { $group: { _id: '$currentStage', count: { $sum: 1 } } }
            ])
        ]);

        // ── Process mhSummary ──
        const s = mhSummaryRaw[0] || {};
        const totalRequested = s.totalRequested || 0;
        const totalApproved = s.totalApproved || 0;
        const thisMonthCount = s.thisMonth || 0;
        const lastMonthCount = s.lastMonth || 0;
        const vsLastMonthPct = lastMonthCount > 0
            ? parseFloat((((thisMonthCount - lastMonthCount) / lastMonthCount) * 100).toFixed(2))
            : 0;

        const mhSummary = {
            totalRequested,
            totalApproved,
            totalPending: s.totalPending || 0,
            totalRejected: s.totalRejected || 0,
            totalAssigned: s.totalAssigned || 0,
            approvalRate: totalRequested > 0 ? parseFloat(((totalApproved / totalRequested) * 100).toFixed(2)) : 0,
            thisMonthRequested: thisMonthCount,
            thisMonthApproved: s.thisMonthApproved || 0,
            vsLastMonthPct
        };

        // ── Process mhTrend (fill missing months) ──
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const trendMap = {};
        mhTrendRaw.forEach(d => {
            const key = `${d._id.year}-${String(d._id.month).padStart(2, '0')}`;
            trendMap[key] = { requested: d.requested, approved: d.approved, rejected: d.rejected };
        });
        const mhTrend = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            const entry = trendMap[key] || { requested: 0, approved: 0, rejected: 0 };
            mhTrend.push({ month: label, requested: entry.requested, approved: entry.approved, rejected: entry.rejected });
        }

        // ── Process mhByDepartment ──
        const mhByDepartment = mhByDeptRaw.map(d => ({
            department: d._id || 'Unknown',
            requestCount: d.requestCount,
            totalHours: d.totalVolume
        }));

        // ── Process mhByStatus ──
        const mhByStatus = { Pending: 0, Notified: 0, Assigned: 0, Rejected: 0, 'In Progress': 0, Completed: 0 };
        mhByStatusRaw.forEach(d => { if (d._id && mhByStatus.hasOwnProperty(d._id)) mhByStatus[d._id] = d.count; });

        // ── Process mhByPriority (map requestType to priority tiers) ──
        const priorityMap = { 'New Project': 'Normal', 'Upgrade': 'Normal', 'Refresh': 'Normal', 'Capacity': 'High', 'Special Improvements': 'Urgent' };
        const mhByPriority = { Normal: 0, High: 0, Urgent: 0 };
        mhByPriorityRaw.forEach(d => {
            const bucket = priorityMap[d._id] || 'Normal';
            mhByPriority[bucket] = (mhByPriority[bucket] || 0) + d.count;
        });

        // ── Engineer utilisation ──
        const ENGINEER_CAPACITY = 10;
        const engineerIds = pedEngineers.map(e => e._id);
        const [assignedCounts, completedCounts] = await Promise.all([
            MHRequest.aggregate([
                { $match: { assignedEngineer: { $in: engineerIds }, workflowStatus: { $in: ['Assigned', 'In Progress', 'Notified'] } } },
                { $group: { _id: '$assignedEngineer', count: { $sum: 1 } } }
            ]),
            MHRequest.aggregate([
                { $match: { assignedEngineer: { $in: engineerIds }, workflowStatus: 'Completed' } },
                { $group: { _id: '$assignedEngineer', count: { $sum: 1 } } }
            ])
        ]);
        const assignedMap = {};
        assignedCounts.forEach(d => { assignedMap[d._id.toString()] = d.count; });
        const completedMap = {};
        completedCounts.forEach(d => { completedMap[d._id.toString()] = d.count; });
        const engineerUtilisation = pedEngineers.map(e => {
            const assigned = assignedMap[e._id.toString()] || 0;
            const completed = completedMap[e._id.toString()] || 0;
            return {
                engineerId: e._id,
                engineerName: e.employeeName,
                department: e.departmentName,
                assignedCount: assigned,
                completedCount: completed,
                utilisationPct: Math.min(100, Math.round((assigned / ENGINEER_CAPACITY) * 100))
            };
        });

        // ── Vendor performance ──
        const vendorPerformance = vendorScores.map(v => ({
            vendorName: v._id,
            avgScore: parseFloat(((v.avgScore || 0) / 5 * 100).toFixed(1)),
            onTimeRate: parseFloat((v.avgCompletion || 0).toFixed(1)),
            defectRate: parseFloat((v.avgDelay || 0).toFixed(1)),
            lastScored: v.lastScored
        }));

        // ── Asset summary ──
        const totalAssets = assetDocs.length;
        const recentlyAdded = assetDocs.filter(a => a.createdAt && new Date(a.createdAt) >= thirtyDaysAgo).length;
        const categoryMap = {};
        assetDocs.forEach(a => {
            const cat = a.plantLocation || 'Other';
            categoryMap[cat] = (categoryMap[cat] || 0) + 1;
        });
        const assetSummary = {
            totalAssets,
            byCategory: Object.entries(categoryMap).map(([category, count]) => ({ category, count })),
            recentlyAdded,
            maintenanceDue: 0
        };

        // ── Dev tracker funnel ──
        const stageOrder = ['Not Started', 'Design', 'PR/PO', 'Sample Production', 'Production Ready', 'Completed'];
        const stageLabels = ['Initiated', 'Design', 'PR/PO', 'Sample Prod.', 'Prod. Ready', 'Released'];
        const stageCountMap = {};
        devTrackerRaw.forEach(d => { stageCountMap[d._id] = d.count; });
        const mhDevTrackerFunnel = stageOrder.map((stage, i) => ({
            stage: stageLabels[i],
            originalStage: stage,
            count: stageCountMap[stage] || 0
        }));

        // ── Recent requests ──
        const recentRequests = recentRequestsDocs.map(r => ({
            _id: r._id,
            requestId: r.mhRequestId,
            assetName: r.handlingPartName || r.materialHandlingEquipment || r.productModel || '—',
            department: r.departmentName,
            estimatedHours: r.volumePerDay || 0,
            status: r.workflowStatus || r.status || 'Pending',
            priority: (['Capacity'].includes(r.requestType) ? 'High' : ['Special Improvements'].includes(r.requestType) ? 'Urgent' : 'Normal'),
            createdAt: r.createdAt,
            submittedByName: r.userName,
            assignedEngineerName: r.assignedEngineer?.employeeName || null
        }));

        // ── Activity feed ──
        const feedEvents = [];
        activityDocs.forEach(r => {
            // email log events
            (r.emailLog || []).forEach(e => {
                feedEvents.push({
                    type: 'email',
                    message: `Email sent for ${r.mhRequestId || 'request'}: ${e.subject || 'notification'}`,
                    timestamp: e.sentAt || r.updatedAt,
                    actor: r.userName || 'System',
                    severity: e.status === 'Failed' ? 'danger' : 'info'
                });
            });
            // history events
            (r.history || []).forEach(h => {
                const typeMap = { 'Approved': 'approval', 'Rejected': 'rejection', 'Assigned': 'assignment' };
                const sevMap = { 'Approved': 'success', 'Rejected': 'danger', 'Assigned': 'info' };
                const action = h.action || 'update';
                feedEvents.push({
                    type: typeMap[action] || 'info',
                    message: h.details || `${r.mhRequestId} — ${action}`,
                    timestamp: h.date || r.updatedAt,
                    actor: r.userName || 'System',
                    severity: sevMap[action] || 'info'
                });
            });
            // status change event
            if (r.workflowStatus && r.workflowStatus !== 'Pending') {
                const sevMap2 = { Notified: 'info', Assigned: 'success', Rejected: 'danger', 'In Progress': 'info', Completed: 'success' };
                feedEvents.push({
                    type: r.workflowStatus === 'Assigned' ? 'assignment' : r.workflowStatus === 'Rejected' ? 'rejection' : 'info',
                    message: `${r.mhRequestId} — ${r.workflowStatus}`,
                    timestamp: r.updatedAt || r.createdAt,
                    actor: r.userName || 'System',
                    severity: sevMap2[r.workflowStatus] || 'info'
                });
            }
        });
        feedEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        const activityFeed = feedEvents.slice(0, 20);

        // ── MH Development phase counts ──
        const STAGE_DISPLAY_MAP = {
            'Not Started':       'Initiated',
            'Design':            'Design',
            'PR/PO':             'PR/PO',
            'Sample Production': 'Sample Prod.',
            'Production Ready':  'Prod. Ready',
            'Completed':         'Released',
        };
        const phaseCountMap = {
            'Initiated':    0,
            'Design':       0,
            'PR/PO':        0,
            'Sample Prod.': 0,
            'Prod. Ready':  0,
            'Released':     0,
        };
        mhDevPhasesRaw.forEach(p => {
            const displayStage = STAGE_DISPLAY_MAP[p._id];
            if (displayStage && phaseCountMap.hasOwnProperty(displayStage)) {
                phaseCountMap[displayStage] = p.count;
            }
        });
        const mhDevPhases = Object.entries(phaseCountMap).map(([stage, count]) => ({ stage, count }));
        const mhDevTotal  = mhDevPhases.reduce((sum, p) => sum + p.count, 0);

                // ── Top stats ──
        const topStats = {
            activeVendors: activeVendorCount || 0,
            activePEDEngineers: pedEngineers.length,
            emailsDispatched: emailLogCount[0]?.total || 0,
            totalEmployees: totalEmployeesCount || 0
        };

        res.json({
            mhSummary,
            mhTrend,
            mhByDepartment,
            mhByStatus,
            mhByPriority,
            engineerUtilisation,
            vendorPerformance,
            assetSummary,
            mhDevTrackerFunnel,
            mhDevPhases,
            mhDevTotal,
            recentRequests,
            activityFeed,
            topStats
        });

    } catch (err) {
        console.error('[getDashboardData]', err);
        res.status(500).json({ message: 'Dashboard data error', error: err.message });
    }
};


/* ─────────────────────────────────────────────────────────────
   PHASE ITEMS ENDPOINT
   GET /api/dashboard/phase-items?stage=Design
───────────────────────────────────────────────────────────── */
const DISPLAY_TO_DB_STAGE = {
    'Initiated':    'Not Started',
    'Design':       'Design',
    'PR/PO':        'PR/PO',
    'Sample Prod.': 'Sample Production',
    'Prod. Ready':  'Production Ready',
    'Released':     'Completed',
};

const dashboardPhaseItems = async (req, res) => {
    try {
        const displayStage = req.query.stage || '';
        const dbStage      = DISPLAY_TO_DB_STAGE[displayStage] || displayStage;

        const items = await MHDevelopmentTracker
            .find({ currentStage: dbStage })
            .populate('vendorId', 'vendorName vendorCode vendorLocation')
            .sort({ updatedAt: -1 })
            .lean();

        const mapped = items.map(item => ({
            _id:                    item._id,
            assetRequestId:         item.assetRequestId,
            productModel:           item.productModel,
            materialHandlingEquipment: item.materialHandlingEquipment,
            departmentName:         item.departmentName,
            userName:               item.userName,
            requestType:            item.requestType,
            plantLocation:          item.plantLocation,
            vendorName:             item.vendorId?.vendorName || item.vendorName || '—',
            vendorCode:             item.vendorId?.vendorCode || item.vendorCode || '—',
            status:                 item.status,
            currentStage:           item.currentStage,
            displayStage,
            implementationTarget:   item.implementationTarget,
            remarks:                item.remarks,
            drawingUrl:             item.drawingUrl,
            createdAt:              item.createdAt,
            updatedAt:              item.updatedAt,
        }));

        res.json({ stage: displayStage, total: mapped.length, items: mapped });
    } catch (err) {
        console.error('[dashboardPhaseItems]', err);
        res.status(500).json({ message: 'Phase items error', error: err.message });
    }
};


const getCalendarData = async (req, res) => {
    try {
        const events = [];
        const requests = await MHRequest.find({ activeStatus: true }).select('mhRequestId materialHandlingEquipment handlingPartName productModel departmentName currentStage status progressStatus createdAt');
        requests.forEach(req => {
            if (req.createdAt) {
                events.push({
                    date: new Date(req.createdAt).toISOString().split('T')[0],
                    type: 'Creation',
                    id: req.mhRequestId,
                    title: req.materialHandlingEquipment || req.handlingPartName || req.productModel || 'Unknown Request',
                    phase: req.currentStage || req.progressStatus || req.status || 'Active',
                    department: req.departmentName,
                    details: 'Request Created'
                });
            }
        });
        const trackers = await MHDevelopmentTracker.find({}).select('assetRequestId productModel departmentName implementationTarget currentStage projectPlan vendorName');
        trackers.forEach(t => {
            if (t.implementationTarget) {
                events.push({
                    date: new Date(t.implementationTarget).toISOString().split('T')[0],
                    type: 'Delivery',
                    id: t.assetRequestId,
                    title: t.productModel || t.departmentName || 'Unknown',
                    phase: t.currentStage,
                    department: t.departmentName,
                    vendor: t.vendorName,
                    details: 'Vendor Delivery Priority'
                });
            }
            if (t.projectPlan && t.projectPlan.milestones) {
                t.projectPlan.milestones.forEach(m => {
                    if (m.planEnd) {
                        events.push({
                            date: new Date(m.planEnd).toISOString().split('T')[0],
                            type: 'Milestone',
                            id: t.assetRequestId,
                            title: t.productModel || t.departmentName || 'Unknown',
                            phase: m.activity,
                            department: t.departmentName,
                            vendor: t.vendorName,
                            details: 'Milestone: ' + m.activity + ' - Plan End'
                        });
                    }
                });
            }
        });
        const groupedEvents = events.reduce((acc, event) => {
            if (!acc[event.date]) acc[event.date] = [];
            acc[event.date].push(event);
            return acc;
        }, {});
        res.json(groupedEvents);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
};

module.exports = {
    getStats,
    getRecentActivity,
    getTrends,
    fixDataDates,
    getDashboardData,
    dashboardPhaseItems
    ,getCalendarData
};;
