const fs = require('fs');
const file = 'backend/controllers/dashboardController.js';
let content = fs.readFileSync(file, 'utf8');

const exportMatch = content.match(/module\.exports\s*=\s*\{[\s\S]*?\};/);
if (exportMatch) {
    let newExports = exportMatch[0].replace('}', '    ,getCalendarData\n};');
    const newFunc = `
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

`;
    content = content.replace(exportMatch[0], newFunc + newExports);
    fs.writeFileSync(file, content);
    console.log('Successfully added getCalendarData');
} else {
    console.log('Failed to find module.exports');
}
