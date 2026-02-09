const express = require('express');
const router = express.Router();
const { getUserByEmployeeId } = require('../controllers/userController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/employee/:employeeId', checkPermission('employeeMaster'), getUserByEmployeeId);

module.exports = router;
