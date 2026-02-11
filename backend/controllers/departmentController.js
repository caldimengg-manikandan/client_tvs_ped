const Department = require('../models/Department');
const asyncHandler = require('express-async-handler');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
const getDepartments = asyncHandler(async (req, res) => {
  const depts = await Department.find({}).sort({ name: 1 });
  res.json({ success: true, count: depts.length, data: depts });
});

// @desc    Create a new department
// @route   POST /api/departments
// @access  Private (Admin)
const createDepartment = asyncHandler(async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    res.status(400);
    throw new Error('Department name is required');
  }

  const exists = await Department.findOne({ name: name.trim() });
  if (exists) {
    res.status(400);
    throw new Error('Department already exists');
  }

  const dept = await Department.create({ name: name.trim(), createdBy: req.user?.id });
  res.status(201).json({ success: true, data: dept });
});

module.exports = { getDepartments, createDepartment };
