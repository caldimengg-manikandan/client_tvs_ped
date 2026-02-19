const VendorLoading = require('../models/VendorLoading');
const VendorScoring = require('../models/VendorScoring');
const Vendor = require('../models/Vendor');

const getVendorLoadingData = async (req, res) => {
    try {
        const loadingData = await Vendor.aggregate([
            { $sort: { sNo: 1 } },
            {
                $lookup: {
                    from: 'vendorloadings',
                    localField: 'vendorCode',
                    foreignField: 'vendorCode',
                    as: 'loading'
                }
            },
            {
                $unwind: {
                    path: '$loading',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'vendorscorings',
                    let: { vCode: '$vendorCode' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$vendorCode', '$$vCode'] }
                            }
                        },
                        {
                            $sort: {
                                scoringYear: -1,
                                scoringMonth: -1
                            }
                        },
                        { $limit: 1 }
                    ],
                    as: 'score'
                }
            },
            {
                $unwind: {
                    path: '$score',
                    preserveNullAndEmptyArrays: true
                }
            },
            // Lookup actual projects from MH Development Tracker
            {
                $lookup: {
                    from: 'mhdevelopmenttrackers',
                    localField: 'vendorCode',
                    foreignField: 'vendorCode',
                    as: 'trackerProjects'
                }
            },
            {
                $addFields: {
                    _totalProjects: { $size: '$trackerProjects' },
                    _vendorCapacity: { $ifNull: ['$vendorCapacity', 10] }
                }
            },
            {
                $project: {
                    _id: '$_id',
                    vendorId: '$_id',
                    loadingId: '$loading._id',
                    vendorCode: 1,
                    vendorName: 1,
                    location: '$vendorLocation',
                    totalProjects: '$_totalProjects',
                    completedProjects: { $ifNull: ['$loading.completedProjects', 0] },
                    designStageProjects: { $ifNull: ['$loading.designStageProjects', 0] },
                    trialStageProjects: { $ifNull: ['$loading.trialStageProjects', 0] },
                    bulkProjects: { $ifNull: ['$loading.bulkProjects', 0] },
                    vendorCapacity: '$_vendorCapacity',
                    loadingPercentage: {
                        $cond: {
                            if: { $gt: ['$_vendorCapacity', 0] },
                            then: {
                                $round: [
                                    { $multiply: [{ $divide: ['$_totalProjects', '$_vendorCapacity'] }, 100] },
                                    2
                                ]
                            },
                            else: 0
                        }
                    },
                    gap: { $subtract: ['$_vendorCapacity', '$_totalProjects'] },
                    qcdScore: '$score.qcdScore'
                }
            }
        ]);

        res.status(200).json(loadingData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update vendor loading details
// @route   PUT /api/vendor-loading/:id
// @access  Private
const updateVendorLoading = async (req, res) => {
    try {
        const loadingEntry = await VendorLoading.findById(req.params.id);
        if (!loadingEntry) {
            return res.status(404).json({ message: 'Loading entry not found' });
        }

        // Update fields
        Object.keys(req.body).forEach(key => {
            // Be careful not to update vendorCode here to maintain join integrity
            if (key !== 'vendorCode') {
                loadingEntry[key] = req.body[key];
            }
        });

        // Sum up total projects if individual stages are updated? 
        // Or assume the user provides totalProjects?
        // User image says "Total Projects" is a column.
        // Let's assume totalProjects = completed + design + trial + bulk
        loadingEntry.totalProjects = (Number(loadingEntry.completedProjects) || 0) +
            (Number(loadingEntry.designStageProjects) || 0) +
            (Number(loadingEntry.trialStageProjects) || 0) +
            (Number(loadingEntry.bulkProjects) || 0);

        const updatedLoading = await loadingEntry.save(); // triggers pre('save') for % and gap
        res.status(200).json(updatedLoading);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Bulk import vendor loading data
// @route   POST /api/vendor-loading/bulk-import
// @access  Private
const bulkImportVendorLoading = async (req, res) => {
    const loadingData = req.body;

    if (!Array.isArray(loadingData)) {
        return res.status(400).json({ message: 'Invalid data format. Expected an array.' });
    }

    const results = {
        successCount: 0,
        errorCount: 0,
        errors: []
    };

    for (const data of loadingData) {
        try {
            const { vendorCode, vendorCapacity, completedProjects, designStageProjects, trialStageProjects, bulkProjects } = data;

            if (!vendorCode) {
                results.errorCount++;
                results.errors.push(`Missing Vendor Code for entry: ${JSON.stringify(data)}`);
                continue;
            }

            const upperCode = vendorCode.trim().toUpperCase();
            let entry = await VendorLoading.findOne({ vendorCode: upperCode });

            if (!entry) {
                // We shouldn't create loading entries for vendors that don't exist in Scoring
                // as the join will fail. Check if Scoring exists first.
                const scoringExists = await VendorScoring.findOne({ vendorCode: upperCode });
                if (!scoringExists) {
                    results.errorCount++;
                    results.errors.push(`Vendor ${upperCode} does not exist in Scoring Master. Register vendor first.`);
                    continue;
                }

                entry = new VendorLoading({ vendorCode: upperCode });
            }

            // Update fields if provided
            if (vendorCapacity !== undefined) entry.vendorCapacity = Number(vendorCapacity);
            if (completedProjects !== undefined) entry.completedProjects = Number(completedProjects);
            if (designStageProjects !== undefined) entry.designStageProjects = Number(designStageProjects);
            if (trialStageProjects !== undefined) entry.trialStageProjects = Number(trialStageProjects);
            if (bulkProjects !== undefined) entry.bulkProjects = Number(bulkProjects);

            // Recalculate totalProjects
            entry.totalProjects = (Number(entry.completedProjects) || 0) +
                (Number(entry.designStageProjects) || 0) +
                (Number(entry.trialStageProjects) || 0) +
                (Number(entry.bulkProjects) || 0);

            await entry.save();
            results.successCount++;
        } catch (error) {
            results.errorCount++;
            results.errors.push(`Error processing ${data.vendorCode}: ${error.message}`);
        }
    }

    res.status(200).json(results);
};

module.exports = {
    getVendorLoadingData,
    updateVendorLoading,
    bulkImportVendorLoading
};
