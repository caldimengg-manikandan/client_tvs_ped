const Role = require('../models/RoleModel');

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private
const getRoles = async (req, res) => {
    try {
        const roles = await Role.find({}).sort({ isSystemRole: -1, name: 1 });
        res.status(200).json(roles);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new role
// @route   POST /api/roles
// @access  Private (Admin only ideally, but we'll let any authenticated user add roles based on UI)
const addRole = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Role name is required' });
        }

        const existingRole = await Role.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
        if (existingRole) {
            return res.status(400).json({ message: 'Role already exists' });
        }

        const role = await Role.create({
            name,
            isSystemRole: false
        });

        res.status(201).json(role);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getRoles,
    addRole
};
