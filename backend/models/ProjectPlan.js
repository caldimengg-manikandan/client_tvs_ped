const mongoose = require('mongoose');

const projectPlanSchema = new mongoose.Schema({
    trackerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MHDevelopmentTracker',
        required: true,
        unique: true
    },
    assetRequestId: {
        type: String,
        required: true
    },
    milestones: [{
        sNo: Number,
        activity: String,
        actualStart: Date,
        actualEnd: Date,
        delayInDays: { type: Number, default: 0 },
        remarks: String
    }],
    overallRemarks: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ProjectPlan', projectPlanSchema, 'projectplans');
