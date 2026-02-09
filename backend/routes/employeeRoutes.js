const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { protect, checkPermission } = require('../middleware/authMiddleware');

// Apply protection to all routes
router.use(protect);

// Employee Master CRUD operations
router.route('/')
    .get(employeeController.getAllEmployees)
    .post(checkPermission('employeeMaster'), employeeController.createEmployee);

// Place next-id route before generic id route to avoid conflict
router.get('/next-id', employeeController.getNextEmployeeId);
router.post('/check-id', employeeController.checkEmployeeId);

// Generic employee routes (by MongoDB _id)
router.route('/:id')
    .get(employeeController.getEmployee)
    .put(checkPermission('employeeMaster'), employeeController.updateEmployee)
    .delete(checkPermission('employeeMaster'), employeeController.deleteEmployee);

// Bulk operations
router.post('/bulk-upload', checkPermission('employeeMaster'), employeeController.bulkUpload);
router.post('/export', checkPermission('employeeMaster'), employeeController.exportEmployees);

// Filtering routes
router.get('/filter/by-department/:department', employeeController.getEmployeesByDepartment);
router.get('/filter/by-location/:location', employeeController.getEmployeesByLocation);
router.get('/filter/by-access/:accessLevel', employeeController.getEmployeesByAccessLevel);
router.get('/search/:keyword', employeeController.searchEmployees);

module.exports = router;