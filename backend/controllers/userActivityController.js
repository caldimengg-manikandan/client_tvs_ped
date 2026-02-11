const asyncHandler = require('express-async-handler');
const UserActivity = require('../models/UserActivity');
const User = require('../models/UserModel');

// @desc    Get user activity statistics
// @route   GET /api/user-activity/stats
// @access  Private
const getActivityStats = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Total Visits
    const totalVisits = await UserActivity.countDocuments({ userId });

    // Get fresh user data for last/previous login
    const user = await User.findById(userId);

    // Recent Sessions
    // Recent Sessions
    let recentSessions = await UserActivity.find({ userId })
        .sort({ loginAt: -1 })
        .limit(50);

    // Self-healing: Ensure historical sessions are closed
    // "Assume new login time is the last logout time"
    // Self-healing: Ensure historical sessions are closed
    const updates = [];

    // Create a lean copy for response modification
    const sessionsForResponse = recentSessions.map(s => s.toObject());

    for (let i = 0; i < sessionsForResponse.length; i++) {
        // Skip the most recent session (index 0), as it is likely the current active one
        if (i === 0) continue;

        const session = sessionsForResponse[i];
        const nextSession = sessionsForResponse[i - 1]; // The session that occurred AFTER this one (newer)

        // If a historical session is still "Active" (no logoutAt), close it using next session's login time
        // FORCE FIX: logic based on user request to calculate Gap
        if (nextSession) {
            // Update the response object
            session.logoutAt = nextSession.loginAt;
            const duration = (new Date(session.logoutAt) - new Date(session.loginAt)) / 1000;
            session.sessionDuration = Math.round(duration > 0 ? duration : 0);

            // Also update the database document (find the original Mongoose doc)
            const originalDoc = recentSessions[i];
            if (originalDoc) {
                // Only save if it actually changes significantly (ignore small ms drifts if already set)
                const oldDuration = originalDoc.sessionDuration || 0;
                if (Math.abs(oldDuration - session.sessionDuration) > 1) {
                    originalDoc.logoutAt = session.logoutAt;
                    originalDoc.sessionDuration = session.sessionDuration;
                    updates.push(originalDoc.save());
                }
            }
        }
    }

    // Fire-and-forget updates (don't block response)
    if (updates.length > 0) {
        Promise.all(updates).catch(err => console.error('Error healing sessions:', err));
    }

    res.json({
        lastLoginAt: user.lastLoginAt,
        previousLoginAt: user.previousLoginAt,
        totalVisits,
        recentSessions: sessionsForResponse
    });
});

module.exports = {
    getActivityStats
};
