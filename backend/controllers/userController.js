const asyncHandler = require('express-async-handler');
const User = require('../models/UserModel');
const Employee = require('../models/EmployeeModel');

// @desc    Get user by Employee ID (custom string like EMP001)
// @route   GET /api/users/employee/:employeeId
// @access  Private/Admin
const getUserByEmployeeId = asyncHandler(async (req, res) => {
    // Find the Employee document using the custom employeeId string
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

module.exports = {
    getUserByEmployeeId
};
