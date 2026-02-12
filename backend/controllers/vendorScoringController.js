const VendorScoring = require('../models/VendorScoring');
const VendorLoading = require('../models/VendorLoading');

// @desc    Get all vendor scores
// @route   GET /api/vendor-scoring
// @access  Private
const getVendorScores = async (req, res) => {
    try {
        const vendors = await VendorScoring.find().sort({ qcdScore: -1 });
        res.status(200).json(vendors);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a new vendor with scores
// @route   POST /api/vendor-scoring
// @access  Private
const createVendorScore = async (req, res) => {
    const { vendorCode, vendorName, location, qsrScore, costScore, deliveryScore } = req.body;

    try {
        const upperCode = vendorCode.trim().toUpperCase();

        // 1. Check if vendor already exists in Scoring
        const vendorExists = await VendorScoring.findOne({ vendorCode: upperCode });
        if (vendorExists) {
            return res.status(400).json({ message: `Vendor Code ${upperCode} is already registered.` });
        }

        // 2. Check for orphaned Loading entry
        const loadingExists = await VendorLoading.findOne({ vendorCode: upperCode });

        // 3. Create Vendor Scoring entry
        const vendor = new VendorScoring({
            vendorCode: upperCode,
            vendorName: vendorName.trim(),
            location: location.trim(),
            qsrScore: Number(qsrScore) || 1,
            costScore: Number(costScore) || 1,
            deliveryScore: Number(deliveryScore) || 1
        });

        const savedVendor = await vendor.save();

        // 4. Handle Loading entry
        if (!loadingExists) {
            const initialLoading = new VendorLoading({
                vendorCode: savedVendor.vendorCode,
                vendorCapacity: 10
            });
            await initialLoading.save();
        }

        res.status(201).json(savedVendor);
    } catch (error) {
        console.error('Error creating vendor scoring:', error);
        res.status(400).json({
            message: error.message || 'Validation failed during registration',
            errors: error.errors
        });
    }
};

// @desc    Update vendor score
// @route   PUT /api/vendor-scoring/:id
// @access  Private
const updateVendorScore = async (req, res) => {
    try {
        const vendor = await VendorScoring.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Update fields
        Object.keys(req.body).forEach(key => {
            vendor[key] = req.body[key];
        });

        const updatedVendor = await vendor.save(); // save() will trigger the pre('save') hook for QCD calculation
        res.status(200).json(updatedVendor);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete vendor scoring and linked loading entry
// @route   DELETE /api/vendor-scoring/:id
// @access  Private
const deleteVendorScore = async (req, res) => {
    try {
        const vendor = await VendorScoring.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }

        // Delete associated loading info first (internal business rule)
        await VendorLoading.findOneAndDelete({ vendorCode: vendor.vendorCode });
        await VendorScoring.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Vendor and associated data deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Bulk import vendor scores
// @route   POST /api/vendor-scoring/bulk-import
// @access  Private
const bulkImportVendorScores = async (req, res) => {
    const vendorsData = req.body; // Expecting an array of vendor objects

    if (!Array.isArray(vendorsData)) {
        return res.status(400).json({ message: 'Invalid data format. Expected an array of vendors.' });
    }

    const results = {
        successCount: 0,
        errorCount: 0,
        errors: []
    };

    for (const data of vendorsData) {
        try {
            const { vendorCode, vendorName, location, qsrScore, costScore, deliveryScore } = data;

            if (!vendorCode || !vendorName) {
                results.errorCount++;
                results.errors.push(`Missing required fields for: ${JSON.stringify(data)}`);
                continue;
            }

            const upperCode = vendorCode.trim().toUpperCase();

            // Look for existing vendor to update or create new
            let vendor = await VendorScoring.findOne({ vendorCode: upperCode });

            if (vendor) {
                // Update existing
                vendor.vendorName = vendorName.trim();
                vendor.location = location ? location.trim() : vendor.location;
                vendor.qsrScore = Number(qsrScore) || vendor.qsrScore;
                vendor.costScore = Number(costScore) || vendor.costScore;
                vendor.deliveryScore = Number(deliveryScore) || vendor.deliveryScore;
            } else {
                // Create new
                vendor = new VendorScoring({
                    vendorCode: upperCode,
                    vendorName: vendorName.trim(),
                    location: location ? location.trim() : 'N/A',
                    qsrScore: Number(qsrScore) || 1,
                    costScore: Number(costScore) || 1,
                    deliveryScore: Number(deliveryScore) || 1
                });
            }

            await vendor.save();

            // Handle Loading entry for new vendors
            const loadingExists = await VendorLoading.findOne({ vendorCode: upperCode });
            if (!loadingExists) {
                const initialLoading = new VendorLoading({
                    vendorCode: upperCode,
                    vendorCapacity: 10
                });
                await initialLoading.save();
            }

            results.successCount++;
        } catch (error) {
            results.errorCount++;
            results.errors.push(`Error processing ${data.vendorCode}: ${error.message}`);
        }
    }

    res.status(200).json(results);
};

module.exports = {
    getVendorScores,
    createVendorScore,
    updateVendorScore,
    deleteVendorScore,
    bulkImportVendorScores
};
