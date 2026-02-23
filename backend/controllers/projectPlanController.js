const ProjectPlan = require('../models/ProjectPlan');
const MHDevelopmentTracker = require('../models/MHDevelopmentTracker');

const asyncHandler = require('express-async-handler');

// @desc    Get project plan actuals by tracker
// @route   GET /api/project-plan/:trackerId
// @access  Private
const getProjectPlan = asyncHandler(async (req, res) => {
    const { trackerId } = req.params;
    let plan = await ProjectPlan.findOne({ trackerId });
    if (!plan) {
        return res.status(200).json({ data: null });
    }
    res.status(200).json({ data: plan });
});

// @desc    Update project plan actuals
// @route   PUT /api/project-plan/:trackerId
// @access  Private
const updateProjectPlan = asyncHandler(async (req, res) => {
    const { trackerId } = req.params;
    const { milestones, overallRemarks } = req.body;

    // Check if tracker exists
    const tracker = await MHDevelopmentTracker.findById(trackerId);
    if (!tracker) {
        res.status(404);
        throw new Error('MH Development Tracker not found');
    }

    let plan = await ProjectPlan.findOne({ trackerId });

    if (plan) {
        plan.milestones = milestones;
        plan.overallRemarks = overallRemarks;
        await plan.save();
    } else {
        plan = await ProjectPlan.create({
            trackerId,
            assetRequestId: tracker.assetRequestId,
            milestones,
            overallRemarks
        });
    }

    res.status(200).json({
        success: true,
        data: plan
    });
});

module.exports = {
    getProjectPlan,
    updateProjectPlan
};
