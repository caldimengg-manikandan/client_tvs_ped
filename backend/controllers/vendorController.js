const Vendor = require('../models/Vendor');

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Private
const getAllVendors = async (req, res) => {
    try {
        const vendors = await Vendor.find().sort({ createdAt: -1 });
        res.json({
            success: true,
            data: vendors,
            count: vendors.length
        });
    } catch (error) {
        console.error('Error fetching vendors:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vendors'
        });
    }
};

// @desc    Get next vendor ID
// @route   GET /api/vendors/next-id
// @access  Private
const getNextVendorId = async (req, res) => {
    try {
        const latestVendor = await Vendor.findOne().sort({ createdAt: -1 });
        let nextId = 'VEND001';

        if (latestVendor && latestVendor.vendorCode) {
            const currentId = latestVendor.vendorCode;
            const numericPart = parseInt(currentId.replace('VEND', ''), 10);
            if (!isNaN(numericPart)) {
                nextId = `VEND${String(numericPart + 1).padStart(3, '0')}`;
            }
        }

        res.json({
            success: true,
            nextVendorId: nextId
        });
    } catch (error) {
        console.error('Error generating next vendor ID:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate next vendor ID'
        });
    }
};

// @desc    Get single vendor
// @route   GET /api/vendors/:id
// @access  Private
const getVendorById = async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        res.json({
            success: true,
            data: vendor
        });
    } catch (error) {
        console.error('Error fetching vendor:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vendor'
        });
    }
};

// @desc    Create new vendor
// @route   POST /api/vendors
// @access  Private
const createVendor = async (req, res) => {
    try {
        const vendorData = req.body;

        // Check if vendorCode already exists
        const existingByCode = await Vendor.findOne({ vendorCode: vendorData.vendorCode });
        if (existingByCode) {
            return res.status(400).json({
                success: false,
                message: 'Vendor Code already exists'
            });
        }

        // Check if GSTIN already exists
        const existingByGSTIN = await Vendor.findOne({ GSTIN: vendorData.GSTIN });
        if (existingByGSTIN) {
            return res.status(400).json({
                success: false,
                message: 'GSTIN already registered'
            });
        }

        // Check if email already exists
        const existingByEmail = await Vendor.findOne({ vendorMailId: vendorData.vendorMailId });
        if (existingByEmail) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered'
            });
        }

        const vendor = new Vendor(vendorData);
        await vendor.save();

        res.status(201).json({
            success: true,
            message: 'Vendor created successfully',
            data: vendor
        });
    } catch (error) {
        console.error('Error creating vendor:', error);
        // Mongoose duplicate key error
        if (error.code === 11000 && error.keyValue) {
            const keyed = Object.keys(error.keyValue)[0];
            const value = error.keyValue[keyed];
            return res.status(400).json({ success: false, message: `${keyed} already registered: ${value}` });
        }
        if (error.name === 'ValidationError') {
            // Return first validation error message
            const firstKey = Object.keys(error.errors)[0];
            const message = error.errors[firstKey].message;
            return res.status(400).json({ success: false, message });
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create vendor'
        });
    }
};

// @desc    Update vendor
// @route   PUT /api/vendors/:id
// @access  Private
const updateVendor = async (req, res) => {
    try {
        const vendorData = req.body;
        const vendorId = req.params.id;

        // Check if vendorCode is being changed and if it already exists
        if (vendorData.vendorCode) {
            const existingCode = await Vendor.findOne({
                vendorCode: vendorData.vendorCode,
                _id: { $ne: vendorId }
            });

            if (existingCode) {
                return res.status(400).json({
                    success: false,
                    message: 'Vendor Code already exists' // updated message
                });
            }
        }

        // Check if GSTIN is being changed and if it already exists
        if (vendorData.GSTIN) {
            const existingVendor = await Vendor.findOne({
                GSTIN: vendorData.GSTIN,
                _id: { $ne: vendorId }
            });

            if (existingVendor) {
                return res.status(400).json({
                    success: false,
                    message: 'GSTIN already registered to another vendor'
                });
            }
        }

        // Check if email is being changed and if it already exists
        if (vendorData.vendorMailId) {
            const existingVendor = await Vendor.findOne({
                vendorMailId: vendorData.vendorMailId,
                _id: { $ne: vendorId }
            });

            if (existingVendor) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered to another vendor'
                });
            }
        }

        const vendor = await Vendor.findByIdAndUpdate(
            vendorId,
            { ...vendorData, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        res.json({
            success: true,
            message: 'Vendor updated successfully',
            data: vendor
        });
    } catch (error) {
        console.error('Error updating vendor:', error);
        if (error.code === 11000 && error.keyValue) {
            const keyed = Object.keys(error.keyValue)[0];
            const value = error.keyValue[keyed];
            return res.status(400).json({ success: false, message: `${keyed} already registered: ${value}` });
        }
        if (error.name === 'ValidationError') {
            const firstKey = Object.keys(error.errors)[0];
            const message = error.errors[firstKey].message;
            return res.status(400).json({ success: false, message });
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update vendor'
        });
    }
};

// @desc    Delete vendor
// @route   DELETE /api/vendors/:id
// @access  Private
const deleteVendor = async (req, res) => {
    try {
        const vendor = await Vendor.findByIdAndDelete(req.params.id);

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        res.json({
            success: true,
            message: 'Vendor deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting vendor:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete vendor'
        });
    }
};

module.exports = {
    getAllVendors,
    getNextVendorId,
    getVendorById,
    createVendor,
    updateVendor,
    deleteVendor
};
