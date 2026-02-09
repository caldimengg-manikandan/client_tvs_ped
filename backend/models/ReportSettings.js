const mongoose = require('mongoose');

const reportSettingsSchema = new mongoose.Schema({
    frequency: {
        type: String,
        enum: ['Daily', 'Weekly', 'Fortnightly', 'Monthly'],
        required: true,
        default: 'Weekly'
    },
    reportType: {
        type: String,
        enum: [
            'Progress Report of Asset Requests',
            'Progress Report of Approved Requests',
            'Progress Report of Implemented',
            'Progress Report of Rejected'
        ],
        required: true,
        default: 'Progress Report of Asset Requests'
    },
    recipients: [{
        type: String, // Email addresses
        required: true
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    lastRunAt: {
        type: Date,
        default: null
    },
    nextRunAt: {
        type: Date,
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Calculate next run date based on frequency
reportSettingsSchema.methods.calculateNextRun = function () {
    const now = new Date();
    let nextRun = new Date(now);

    // Set to 8 AM
    nextRun.setHours(8, 0, 0, 0);

    switch (this.frequency) {
        case 'Daily':
            // If it's past 8 AM today, schedule for tomorrow
            if (now.getHours() >= 8) {
                nextRun.setDate(nextRun.getDate() + 1);
            }
            break;
        case 'Weekly':
            // Next Monday at 8 AM
            const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
            nextRun.setDate(nextRun.getDate() + daysUntilMonday);
            if (now.getDay() === 1 && now.getHours() >= 8) {
                nextRun.setDate(nextRun.getDate() + 7);
            }
            break;
        case 'Fortnightly':
            // Next Monday, but skip one week
            const daysUntilNextMonday = (8 - now.getDay()) % 7 || 7;
            nextRun.setDate(nextRun.getDate() + daysUntilNextMonday + 7);
            break;
        case 'Monthly':
            // First day of next month
            nextRun.setMonth(nextRun.getMonth() + 1);
            nextRun.setDate(1);
            break;
    }

    return nextRun;
};

module.exports = mongoose.model('ReportSettings', reportSettingsSchema);
