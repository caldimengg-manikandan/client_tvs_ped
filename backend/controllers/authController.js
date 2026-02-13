const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/UserModel');
const Employee = require('../models/EmployeeModel');
const UserActivity = require('../models/UserActivity');

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

        // Update User's lastLoginAt and previousLoginAt
        if (user.lastLoginAt) {
            user.previousLoginAt = user.lastLoginAt;
        }
        user.lastLoginAt = now;
        await user.save();

        // Close any previous open sessions to ensure history is accurate
        const previousSessions = await UserActivity.find({
            userId: user._id,
            logoutAt: null
        });

        for (const session of previousSessions) {
            session.logoutAt = now;
            const duration = (now - session.loginAt) / 1000;
            session.sessionDuration = Math.round(duration);
            await session.save();
        }

        // Create User Activity Log
        const userActivity = await UserActivity.create({
            userId: user._id,
            loginAt: now,
            userAgent: req.headers['user-agent']
        });

        // Successful login
        res.json({
            _id: user.userId, // Using custom userId as requested
            dbId: user._id,   // Also sending DB ID just in case
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
        userId,
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
            settings: true
        },
        status: 'Active'
    });

    res.status(201).json({ message: 'Database seeded successfully. You can now login with admin@tvs.com / admin123' });
});

module.exports = {
    loginUser,
    registerUser,
    getMe,
    logoutUser,
    seedDatabase
};
