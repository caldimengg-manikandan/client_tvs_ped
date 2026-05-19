const asyncHandler = require('express-async-handler');
const User = require('../models/UserModel');
const Employee = require('../models/EmployeeModel');

// @desc    Get user by Employee ID (custom string like EMP001)
// @route   GET /api/users/employee/:employeeId
// @access  Private/Admin
const getUserByEmployeeId = asyncHandler(async (req, res) => {
    const employee = await Employee.findOne({ employeeId: req.params.employeeId });
    if (!employee) {
        res.status(404);
        throw new Error('Employee not found');
    }

    const user = await User.findOne({ employeeId: employee._id });
    if (!user) {
        res.status(404);
        throw new Error('User account not found for this employee');
    }

    res.json({
        success: true,
        data: user,
        hasPassword: true
    });
});

// @desc    Get all users (with employee info populated)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({})
        .populate('employeeId', 'employeeName employeeId departmentName plantLocation mailId role')
        .select('-passwordHash')
        .sort({ createdAt: -1 });

    res.json({ success: true, count: users.length, data: users });
});

// @desc    Update user role (triggers pre-save hook for permissions)
// @route   PATCH /api/users/:id/role
// @access  Private/Admin
const updateUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;

    const validRoles = ['Admin', 'Employee', 'Approver', 'PED Engineer'];
    if (!role || !validRoles.includes(role)) {
        res.status(400);
        throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    // Use .save() so the pre-save hook fires and auto-updates permissions
    const user = await User.findById(req.params.id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    user.role = role;
    await user.save();

    // Also sync the associated employee's role field
    if (user.employeeId) {
        await Employee.findByIdAndUpdate(user.employeeId, { role });
    }

    const updated = await User.findById(user._id)
        .populate('employeeId', 'employeeName employeeId departmentName mailId')
        .select('-passwordHash');

    res.json({ success: true, data: updated });
});

module.exports = {
    getUserByEmployeeId,
    getAllUsers,
    updateUserRole
};
