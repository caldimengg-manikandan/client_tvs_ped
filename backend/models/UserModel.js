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
        requestTracker: { type: Boolean, default: true },
        mhDevelopmentTracker: { type: Boolean, default: true },
        assetSummary: { type: Boolean, default: true },
        reports: { type: Boolean, default: true },
        employeeMaster: { type: Boolean, default: true },
        vendorMaster: { type: Boolean, default: true },
        settings: { type: Boolean, default: true }
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
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
