const mongoose = require('mongoose');

const mhDevelopmentTrackerSchema = new mongoose.Schema({
    // Request Information
    departmentName: {
        type: String,
        required: true,
        trim: true
    },
    userName: {
        type: String,
        required: true,
        trim: true
    },
    assetRequestId: {
        type: String,
        required: true,
        trim: true
    },
    assetId: {
        type: String,
        trim: true,
        default: ''
    },
    requestType: {
        type: String,
        required: true,
        trim: true
    },
    productModel: {
        type: String,
        required: true,
        trim: true
    },
    materialHandlingEquipment: {
        type: String,
        trim: true,
        default: ''
    },
    plantLocation: {
        type: String,
        required: true,
        trim: true
    },

    // Vendor Selection
    vendorCode: {
        type: String,
        trim: true,
        default: ''
    },
    vendorName: {
        type: String,
        trim: true,
        default: ''
    },
    vendorLocation: {
        type: String,
        trim: true,
        default: ''
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        default: null
    },

    // Project Planning
    projectPlan: {
        milestones: [{
            sNo: Number,
            activity: String,
            responsibility: String,
            planStart: Date,
            planEnd: Date,
            actualStart: Date,
            actualEnd: Date,
            delayInDays: { type: Number, default: 0 },
            remarks: String
        }],
        remarks: {
            type: String,
            default: ''
        }
    },

    // Implementation Tracking
    implementationTarget: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['On Track', 'Likely Delay', 'Delayed', 'Not Started'],
        default: 'Not Started'
    },
    implementationVisibility: {
        type: String,
        default: ''
    },
    currentStage: {
        type: String,
        enum: ['Design', 'PR/PO', 'Sample Production', 'Production Ready', 'Completed', 'Not Started'],
        default: 'Not Started'
    },

    // Documentation
    remarks: {
        type: String,
        trim: true,
        default: ''
    },
    drawingUrl: {
        type: String,
        default: ''
    },
    drawingFileName: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Index for faster queries
mhDevelopmentTrackerSchema.index({ assetRequestId: 1 });
mhDevelopmentTrackerSchema.index({ departmentName: 1 });
mhDevelopmentTrackerSchema.index({ status: 1 });
mhDevelopmentTrackerSchema.index({ currentStage: 1 });


module.exports = mongoose.model('MHDevelopmentTracker', mhDevelopmentTrackerSchema, 'mhdevelopmenttrackers');

