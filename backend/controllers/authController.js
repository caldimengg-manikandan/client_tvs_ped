const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const User = require('../models/UserModel');
const Employee = require('../models/EmployeeModel');
const UserActivity = require('../models/UserActivity');
const sendEmail = require('../utils/emailService');

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Check for user email
    const user = await User.findOne({ email }).populate('employeeId', 'employeeName departmentName plantLocation mailId employeeId');

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
        // Track Login Activity
        const now = new Date();

        if (user.lastLoginAt) {
            user.previousLoginAt = user.lastLoginAt;
        }
        user.lastLoginAt = now;
        await user.save();

        const closePreviousSessionsPromise = UserActivity.find({
            userId: user._id,
            logoutAt: null
        }).then(async (previousSessions) => {
            await Promise.all(
                previousSessions.map(async (session) => {
                    session.logoutAt = now;
                    const duration = (now - session.loginAt) / 1000;
                    session.sessionDuration = Math.round(duration);
                    await session.save();
                })
            );
        }).catch((err) => {
            console.error('Error closing previous user sessions', err);
        });

        const userActivity = await UserActivity.create({
            userId: user._id,
            loginAt: now,
            userAgent: req.headers['user-agent']
        });

        res.json({
            _id: user.userId,
            dbId: user._id,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
            employeeId: user.employeeId ? user.employeeId.employeeId : null,
            name: user.employeeId ? user.employeeId.employeeName : 'Admin User',
            department: user.employeeId ? user.employeeId.departmentName : 'System',
            location: user.employeeId ? user.employeeId.plantLocation : '',
            token: generateToken(user._id),
            sessionId: userActivity._id,
            lastLoginAt: user.lastLoginAt,
            previousLoginAt: user.previousLoginAt
        });

        closePreviousSessionsPromise.catch(() => { });
    } else {
        res.status(401);
        throw new Error('Invalid credentials');
    }
});

// @desc    Logout user & record session end
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = asyncHandler(async (req, res) => {
    const { sessionId } = req.body;

    if (sessionId) {
        const activity = await UserActivity.findById(sessionId);
        if (activity) {
            activity.logoutAt = new Date();
            // Calculate duration in seconds
            const duration = (activity.logoutAt - activity.loginAt) / 1000;
            activity.sessionDuration = Math.round(duration);
            await activity.save();
        }
    }

    res.status(200).json({ message: 'Logged out successfully' });
});

// @desc    Register a new user (Seed/Internal use)
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const {
        userId,
        employeeId,
        email,
        password,
        role,
        permissions
    } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Check if employee exists
    const employee = await Employee.findOne({ employeeId: employeeId });
    if (!employee) {
        res.status(400);
        throw new Error(`Employee with ID ${employeeId} not found`);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
        userId: userId || employeeId, // Use provided userId or fallback to employeeId
        employeeId: employee._id, // Save the ObjectId reference
        email,
        passwordHash: hashedPassword,
        role: role || 'Employee',
        permissions: permissions || {},
        status: 'Active'
    });

    if (user) {
        res.status(201).json({
            _id: user.id,
            userId: user.userId,
            email: user.email,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Get current user data
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).populate('employeeId', 'employeeName departmentName plantLocation mailId employeeId');

    if (user) {
        res.json({
            _id: user.userId,
            dbId: user._id,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
            employeeId: user.employeeId ? user.employeeId.employeeId : null,
            name: user.employeeId ? user.employeeId.employeeName : 'Admin User',
            department: user.employeeId ? user.employeeId.departmentName : 'System',
            location: user.employeeId ? user.employeeId.plantLocation : '',
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'tvs_secret_key_123', {
        expiresIn: '30d',
    });
};

// @desc    Seed database (Auto-fix for empty DB)
// @route   GET /api/auth/seed
// @access  Public
const seedDatabase = asyncHandler(async (req, res) => {
    const userCount = await User.countDocuments();
    if (userCount > 0 && !req.query.force) {
        return res.json({ message: 'Database already initialized. Use ?force=true to reset.' });
    }

    if (req.query.force) {
        await User.deleteMany();
        await Employee.deleteMany();
    }

    // 1. Create Admin Employee
    const adminEmployee = await Employee.create({
        employeeId: 'EMP001',
        employeeName: 'System Admin',
        departmentName: 'IT',
        plantLocation: 'Madurai',
        mailId: 'admin@tvs.com',
        designation: 'Administrator',
        dateOfJoining: new Date(),
        accessLevel: 'Admin',
        permissions: {
            dashboard: true,
            assetRequest: true,
            requestTracker: true,
            assetSummary: true,
            reports: true,
            employeeMaster: true,
            vendorMaster: true,
            mhDevelopmentTracker: true,
            settings: true
        },
        status: 'Active'
    });

    // 2. Create Admin User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    await User.create({
        userId: 'ADM001',
        employeeId: adminEmployee._id,
        email: 'admin@tvs.com',
        passwordHash: hashedPassword,
        role: 'Admin',
        permissions: {
            dashboard: true,
            assetRequest: true,
            requestTracker: true,
            assetSummary: true,
            reports: true,
            employeeMaster: true,
            vendorMaster: true,
            mhDevelopmentTracker: true,
            settings: true
        },
        status: 'Active'
    });

    res.status(201).json({ message: 'Database seeded successfully. You can now login with admin@tvs.com / admin123' });
});

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        res.status(404);
        throw new Error('User not found with this email');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expires
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // Create reset url
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;

    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px; max-width: 600px;">
            <h2 style="color: #253C80;">TVS MH Request - Password Reset Request</h2>
            <p>You are receiving this email because you (or someone else) have requested the reset of a password.</p>
            <p>Please click on the following button to complete the process:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #253C80; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
            </div>
            <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
            <hr style="border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #777;">Link expires in 1 hour.</p>
        </div>
    `;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Password Reset Request',
            html
        });

        res.status(200).json({ success: true, message: 'Email sent' });
    } catch (err) {
        console.error('Email sending error:', err);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(500);
        throw new Error(`Email could not be sent: ${err.message}`);
    }
});

// @desc    Reset Password
// @route   POST /api/auth/reset-password/:token
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    // Hash URL token
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired token');
    }

    // Set new password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(req.body.password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({
        success: true,
        message: 'Password reset successful',
        token: generateToken(user._id)
    });
});

module.exports = {
    loginUser,
    registerUser,
    getMe,
    logoutUser,
    seedDatabase,
    forgotPassword,
    resetPassword
};
