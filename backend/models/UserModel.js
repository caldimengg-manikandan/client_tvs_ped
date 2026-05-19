const mongoose = require('mongoose');

/**
 * Role-based permission map.
 * Exported so authController and userController can use it directly.
 */
const ROLE_PERMISSIONS = {
    'Admin': {
        dashboard: true, assetRequest: true, requestTracker: true,
        mhDevelopmentTracker: true, assetSummary: true, reports: true,
        employeeMaster: true, vendorMaster: true, settings: true
    },
    'Employee': {
        dashboard: true, assetRequest: true, requestTracker: true,
        mhDevelopmentTracker: false, assetSummary: false, reports: false,
        employeeMaster: false, vendorMaster: false, settings: false
    },
    'Approver': {
        dashboard: true, assetRequest: true, requestTracker: true,
        mhDevelopmentTracker: true, assetSummary: false, reports: false,
        employeeMaster: false, vendorMaster: false, settings: false
    },
    'PED Engineer': {
        dashboard: true, assetRequest: false, requestTracker: true,
        mhDevelopmentTracker: true, assetSummary: true, reports: false,
        employeeMaster: false, vendorMaster: false, settings: false
    }
};

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
        enum: ['Admin', 'Employee', 'Approver', 'PED Engineer'],
        default: 'Employee'
    },
    permissions: {
        dashboard: { type: Boolean, default: true },
        assetRequest: { type: Boolean, default: true },
        requestTracker: { type: Boolean, default: false },
        mhDevelopmentTracker: { type: Boolean, default: false },
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

/**
 * Pre-save hook: auto-set permissions whenever role is new or changed.
 * Fires on User.create() and user.save().
 * Uses async style (Mongoose 9 recommended — no next() callback needed).
 */
userSchema.pre('save', async function () {
    if (this.isNew || this.isModified('role')) {
        const perms = ROLE_PERMISSIONS[this.role];
        if (perms) {
            Object.keys(perms).forEach(function(key) {
                this.permissions[key] = perms[key];
            }.bind(this));
        }
    }
});

/**
 * Pre-update hook: auto-set permissions when role is changed via
 * findByIdAndUpdate / findOneAndUpdate / updateOne.
 */
userSchema.pre(['findOneAndUpdate', 'updateOne'], async function () {
    var update = this.getUpdate();
    var newRole = (update && update.$set && update.$set.role) || (update && update.role);
    if (newRole) {
        var perms = ROLE_PERMISSIONS[newRole];
        if (perms) {
            if (!update.$set) update.$set = {};
            Object.keys(perms).forEach(function(key) {
                update.$set['permissions.' + key] = perms[key];
            });
        }
    }
});

const User = mongoose.model('User', userSchema);

// Attach ROLE_PERMISSIONS so other modules can import it
User.ROLE_PERMISSIONS = ROLE_PERMISSIONS;

module.exports = User;
