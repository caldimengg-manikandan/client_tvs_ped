const express = require('express');
const router = express.Router();
const { getDepartments, createDepartment } = require('../controllers/departmentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getDepartments);
router.post('/', protect, createDepartment);

module.exports = router;
