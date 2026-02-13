const VendorScoring = require('../models/VendorScoring');
const Vendor = require('../models/Vendor');

// @desc    Get all vendor scores with vendor details
// @route   GET /api/vendor-scoring
// @access  Private
const getVendorScores = async (req, res) => {
    try {
        const scores = await VendorScoring.find()
            .sort({ scoringYear: -1, scoringMonth: -1, qcdScore: -1 });

        res.status(200).json({
            success: true,
            data: scores,
            count: scores.length
        });
    } catch (error) {
        console.error('Error fetching vendor scores:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vendor scores'
        });
    }
};

// @desc    Get vendor score by ID
// @route   GET /api/vendor-scoring/:id
// @access  Private
const getVendorScoreById = async (req, res) => {
    try {
        const score = await VendorScoring.findById(req.params.id)
            .populate('vendorId', 'vendorCode vendorName vendorLocation vendorMailId GSTIN');

        if (!score) {
            return res.status(404).json({
                success: false,
                message: 'Vendor score not found'
            });
        }

        res.status(200).json({
            success: true,
            data: score
        });
    } catch (error) {
        console.error('Error fetching vendor score:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vendor score'
        });
    }
};

// @desc    Create vendor score
// @route   POST /api/vendor-scoring
// @access  Private
const createVendorScore = async (req, res) => {
    try {
        const { vendorId, scoringMonth, scoringYear, qsrScore, costScore, deliveryScore, completionRate, delayRate, remarks } = req.body;

        // Validate vendor exists
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found in Vendor Master'
            });
        }

        // Check for duplicate score for same vendor and period
        const existingScore = await VendorScoring.findOne({
            vendorId,
            scoringMonth,
            scoringYear
        });

        if (existingScore) {
            return res.status(400).json({
                success: false,
                message: `Score already exists for ${vendor.vendorName} for ${getMonthName(scoringMonth)} ${scoringYear}`
            });
        }

        // Create new score with vendor details
        const vendorScore = new VendorScoring({
            vendorId,
            vendorCode: vendor.vendorCode,
            vendorName: vendor.vendorName,
            location: vendor.vendorLocation,
            scoringMonth: Number(scoringMonth),
            scoringYear: Number(scoringYear),
            qsrScore: Number(qsrScore),
            costScore: Number(costScore),
            deliveryScore: Number(deliveryScore),
            completionRate: Number(completionRate) || 0,
            delayRate: Number(delayRate) || 0,
            remarks: remarks || ''
        });

        const savedScore = await vendorScore.save();

        res.status(201).json({
            success: true,
            message: 'Vendor score created successfully',
            data: savedScore
        });
    } catch (error) {
        console.error('Error creating vendor score:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            name: error.name,
            errors: error.errors
        });

        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A score already exists for this vendor and period'
            });
        }

        if (error.name === 'ValidationError') {
            const firstKey = Object.keys(error.errors)[0];
            const message = error.errors[firstKey].message;
            console.error('Validation error:', firstKey, message);
            return res.status(400).json({ success: false, message });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create vendor score'
        });
    }
};

// @desc    Update vendor score
// @route   PUT /api/vendor-scoring/:id
// @access  Private
const updateVendorScore = async (req, res) => {
    try {
        const { qsrScore, costScore, deliveryScore, completionRate, delayRate, remarks } = req.body;

        const score = await VendorScoring.findById(req.params.id);
        if (!score) {
            return res.status(404).json({
                success: false,
                message: 'Vendor score not found'
            });
        }

        // Update only editable fields (vendor details are NOT editable)
        if (qsrScore !== undefined) score.qsrScore = Number(qsrScore);
        if (costScore !== undefined) score.costScore = Number(costScore);
        if (deliveryScore !== undefined) score.deliveryScore = Number(deliveryScore);
        if (completionRate !== undefined) score.completionRate = Number(completionRate);
        if (delayRate !== undefined) score.delayRate = Number(delayRate);
        if (remarks !== undefined) score.remarks = remarks;

        const updatedScore = await score.save();

        res.status(200).json({
            success: true,
            message: 'Vendor score updated successfully',
            data: updatedScore
        });
    } catch (error) {
        console.error('Error updating vendor score:', error);
        if (error.name === 'ValidationError') {
            const firstKey = Object.keys(error.errors)[0];
            const message = error.errors[firstKey].message;
            return res.status(400).json({ success: false, message });
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update vendor score'
        });
    }
};

// @desc    Delete vendor score
// @route   DELETE /api/vendor-scoring/:id
// @access  Private
const deleteVendorScore = async (req, res) => {
    try {
        const score = await VendorScoring.findByIdAndDelete(req.params.id);

        if (!score) {
            return res.status(404).json({
                success: false,
                message: 'Vendor score not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Vendor score deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting vendor score:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete vendor score'
        });
    }
};

// @desc    Get vendor performance analytics
// @route   GET /api/vendor-scoring/analytics/:vendorId
// @access  Private
const getVendorPerformance = async (req, res) => {
    try {
        const { vendorId } = req.params;
        const { year } = req.query;

        // Validate vendor exists
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: 'Vendor not found'
            });
        }

        const currentYear = year ? Number(year) : new Date().getFullYear();

        // Get monthly scores for the year
        const monthlyScores = await VendorScoring.find({
            vendorId,
            scoringYear: currentYear
        }).sort({ scoringMonth: 1 });

        // Get yearly averages
        const yearlyScores = await VendorScoring.aggregate([
            { $match: { vendorId: vendor._id } },
            {
                $group: {
                    _id: '$scoringYear',
                    avgQcdScore: { $avg: '$qcdScore' },
                    avgQsrScore: { $avg: '$qsrScore' },
                    avgCostScore: { $avg: '$costScore' },
                    avgDeliveryScore: { $avg: '$deliveryScore' },
                    avgCompletionRate: { $avg: '$completionRate' },
                    avgDelayRate: { $avg: '$delayRate' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Calculate overall statistics
        const allScores = await VendorScoring.find({ vendorId });
        const totalScores = allScores.length;
        const avgOverallScore = totalScores > 0
            ? allScores.reduce((sum, s) => sum + s.qcdScore, 0) / totalScores
            : 0;

        res.status(200).json({
            success: true,
            data: {
                vendor: {
                    _id: vendor._id,
                    vendorCode: vendor.vendorCode,
                    vendorName: vendor.vendorName,
                    vendorLocation: vendor.vendorLocation
                },
                currentYear,
                monthlyPerformance: monthlyScores,
                yearlyPerformance: yearlyScores,
                overallStats: {
                    totalScores,
                    avgOverallScore: parseFloat(avgOverallScore.toFixed(2)),
                    latestScore: allScores.length > 0 ? allScores[allScores.length - 1].qcdScore : 0
                }
            }
        });
    } catch (error) {
        console.error('Error fetching vendor performance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch vendor performance'
        });
    }
};

// @desc    Bulk import vendor scores
// @route   POST /api/vendor-scoring/bulk-import
// @access  Private
const bulkImportVendorScores = async (req, res) => {
    const scoresData = req.body;

    if (!Array.isArray(scoresData)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid data format. Expected an array of scores.'
        });
    }

    const results = {
        successCount: 0,
        errorCount: 0,
        errors: []
    };

    for (const data of scoresData) {
        try {
            const { vendorCode, scoringMonth, scoringYear, qsrScore, costScore, deliveryScore, completionRate, delayRate, remarks } = data;

            if (!vendorCode || !scoringMonth || !scoringYear) {
                results.errorCount++;
                results.errors.push(`Missing required fields for: ${JSON.stringify(data)}`);
                continue;
            }

            // Find vendor by code
            const vendor = await Vendor.findOne({ vendorCode: vendorCode.toUpperCase() });
            if (!vendor) {
                results.errorCount++;
                results.errors.push(`Vendor not found: ${vendorCode}`);
                continue;
            }

            // Check for existing score
            const existingScore = await VendorScoring.findOne({
                vendorId: vendor._id,
                scoringMonth: Number(scoringMonth),
                scoringYear: Number(scoringYear)
            });

            if (existingScore) {
                // Update existing
                existingScore.qsrScore = Number(qsrScore) || existingScore.qsrScore;
                existingScore.costScore = Number(costScore) || existingScore.costScore;
                existingScore.deliveryScore = Number(deliveryScore) || existingScore.deliveryScore;
                existingScore.completionRate = Number(completionRate) || existingScore.completionRate;
                existingScore.delayRate = Number(delayRate) || existingScore.delayRate;
                existingScore.remarks = remarks || existingScore.remarks;
                await existingScore.save();
            } else {
                // Create new
                const newScore = new VendorScoring({
                    vendorId: vendor._id,
                    vendorCode: vendor.vendorCode,
                    vendorName: vendor.vendorName,
                    location: vendor.vendorLocation,
                    scoringMonth: Number(scoringMonth),
                    scoringYear: Number(scoringYear),
                    qsrScore: Number(qsrScore) || 1,
                    costScore: Number(costScore) || 1,
                    deliveryScore: Number(deliveryScore) || 1,
                    completionRate: Number(completionRate) || 0,
                    delayRate: Number(delayRate) || 0,
                    remarks: remarks || ''
                });
                await newScore.save();
            }

            results.successCount++;
        } catch (error) {
            results.errorCount++;
            results.errors.push(`Error processing ${data.vendorCode}: ${error.message}`);
        }
    }

    res.status(200).json({
        success: true,
        ...results
    });
};

// Helper function
function getMonthName(month) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1] || 'Unknown';
}

module.exports = {
    getVendorScores,
    getVendorScoreById,
    createVendorScore,
    updateVendorScore,
    deleteVendorScore,
    getVendorPerformance,
    bulkImportVendorScores
};
