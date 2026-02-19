const mongoose = require('mongoose');

const mhRequestSchema = new mongoose.Schema({
    mhRequestId: {
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
        enum: ['New Project', 'Upgrade', 'Refresh', 'Capacity', 'Special Improvements']
    },
    productModel: {
        type: String,
        required: true
    },
    materialHandlingEquipment: {
        type: String,
        default: ''
    },
    problemStatement: {
        type: String,
        required: true
    },
    handlingPartName: {
        type: String,
        required: true
    },
    materialHandlingLocation: {
        type: String,
        required: true
    },
    plantLocation: {
        type: String,
        required: true,
        enum: [
            'Hosur Plant 1 (TN)',
            'Hosur Plant 2 (TN)',
            'Hosur Plant 3 (TN)',
            'Mysore (KA)',
            'Nalagarh (HP)'
        ]
    },
    from: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: true
    },
    volumePerDay: {
        type: Number,
        required: true
    },
    mailId: {
        type: String,
        required: true
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
        ref: 'VendorScoring',
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
}, {
    timestamps: true
});

module.exports = mongoose.model('MHRequest', mhRequestSchema);
