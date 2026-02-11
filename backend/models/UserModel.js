const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Admin', 'Employee'],
        default: 'Employee'
    },
    permissions: {
        dashboard: { type: Boolean, default: true },
        assetRequest: { type: Boolean, default: true },
        requestTracker: { type: Boolean, default: false },
        assetSummary: { type: Boolean, default: false },
        reports: { type: Boolean, default: false },
        employeeMaster: { type: Boolean, default: false },
        vendorMaster: { type: Boolean, default: false },
        settings: { type: Boolean, default: false }
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },
    lastLoginAt: {
        type: Date
    },
    previousLoginAt: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
