const express = require('express');
const router  = express.Router();
const MHRequest        = require('../models/MHRequest');
const Vendor           = require('../models/Vendor');
const VendorScoring    = require('../models/VendorScoring');
const EmployeeModel    = require('../models/EmployeeModel');
const AssetManagement  = require('../models/AssetManagement');

/**
 * @route   GET /api/public/stats
 * @desc    Aggregated platform stats for the public landing page
 * @access  Public (no auth required)
 */
router.get('/stats', async (req, res) => {
    try {
        const [requests, vendors, scorings, employees, assets] = await Promise.all([
            MHRequest.find({ activeStatus: true }).select('status progressStatus'),
            Vendor.find({}).select('_id'),
            VendorScoring.find({}).select('qcdScore'),
            EmployeeModel.find({}).select('_id'),
            AssetManagement.find({}).select('status signOffDocument'),
        ]);

        const totalRequests  = requests.length;
        const accepted       = requests.filter(r => r.status === 'Accepted').length;
        const rejected       = requests.filter(r => r.status === 'Rejected').length;
        const implemented    = requests.filter(r =>
            ['Implementation', 'Production'].includes(r.progressStatus)
        ).length;

        const totalVendors   = vendors.length;
        const avgScore       = scorings.length
            ? parseFloat(
                (scorings.reduce((s, v) => s + (v.qcdScore || 0), 0) / scorings.length).toFixed(1)
              )
            : null;

        const totalEmployees = employees.length;
        const totalAssets    = assets.length;

        res.json({
            totalRequests,
            accepted,
            rejected,
            implemented,
            totalVendors,
            avgScore,
            totalEmployees,
            totalAssets,
        });
    } catch (err) {
        console.error('[public/stats] error:', err.message);
        res.status(500).json({ message: 'Server Error', error: err.message });
    }
});

module.exports = router;
