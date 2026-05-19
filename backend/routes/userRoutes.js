const express = require('express');
const router = express.Router();
const { getUserByEmployeeId, getAllUsers, updateUserRole } = require('../controllers/userController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.use(protect);

// Get all users (Admin only)
router.get('/', checkPermission('settings'), getAllUsers);

// Get user by employee ID string (e.g. EMP001)
router.get('/employee/:employeeId', checkPermission('employeeMaster'), getUserByEmployeeId);

// Update user role (Admin only)
router.patch('/:id/role', checkPermission('settings'), updateUserRole);

module.exports = router;
