const mongoose = require('mongoose');

const userActivitySchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    loginAt: {
        type: Date,
        default: Date.now
    },
    logoutAt: {
        type: Date
    },
    sessionDuration: {
        type: Number, // Duration in seconds
        default: 0
    },
    userAgent: {
        type: String
    },
    deviceInfo: {
        type: Object
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('UserActivity', userActivitySchema);
