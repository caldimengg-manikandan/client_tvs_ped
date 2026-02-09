const mongoose = require('mongoose');

const assetRequestSchema = new mongoose.Schema({
    assetRequestId: {
        type: String,
        required: true,
        unique: true
    },
    departmentName: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    requestType: {
        type: String,
        required: true,
        enum: ['New', 'Modify']
    },
    category: {
        type: String,
        required: true,
        enum: ['New Project', 'Current Product Support']
    },
    problemStatement: {
        type: String,
        required: true
    },
    handlingPartName: {
        type: String,
        required: true
    },
    assetNeededLocation: {
        type: String,
        required: true
    },
    assetName: {
        type: String,
        required: false
    },
    poPrice: {
        type: Number,
        required: false
    },
    assetLocation: {
        type: String, // Actual location after procurement/deployment
        required: false
    },
    drawingFile: {
        type: String // We store the path to the uploaded file
    },
    status: {
        type: String,
        default: 'Active',
        enum: ['Active', 'Accepted', 'Rejected']
    },
    progressStatus: {
        type: String,
        default: 'Initial',
        enum: ['Initial', 'Design', 'Design Approved', 'Production', 'Implementation']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedVendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        default: null
    },
    designReceiptFromVendor: {
        type: Boolean,
        default: false
    },
    designApproval: {
        type: Boolean,
        default: false
    },
    production: {
        type: Boolean,
        default: false
    },
    implementation: {
        type: Boolean,
        default: false
    },
    allocationAssetId: {
        type: String,
        default: null
    },
    remark: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    activeStatus: {
        type: Boolean,
        default: true
    },
    history: [{
        action: String, // 'Created', 'Updated', 'Deleted', 'Restored'
        date: {
            type: Date,
            default: Date.now
        },
        details: String
    }]
});

module.exports = mongoose.model('AssetRequest', assetRequestSchema);
