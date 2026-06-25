/**
 * designLibraryController.js
 * CRUD + search for the Design Library master data.
 * Used by Admin to manage trolley models, variants, and templates.
 */

const asyncHandler  = require('express-async-handler');
const DesignLibrary = require('../models/DesignLibrary');
const LeadTimeMaster = require('../models/LeadTimeMaster');

// ─── GET /api/design-library ─────────────────────────────────────────────────
const getAllDesigns = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, category, activeStatus = 'true' } = req.query;

    const query = { activeStatus: activeStatus === 'true' };
    if (category) query.category = category;

    const [data, total] = await Promise.all([
        DesignLibrary.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean(),
        DesignLibrary.countDocuments(query)
    ]);

    res.json({ total, page: parseInt(page), data });
});

// ─── GET /api/design-library/search ──────────────────────────────────────────
const searchDesigns = asyncHandler(async (req, res) => {
    const { q = '', category, equipmentType } = req.query;

    const query = { activeStatus: true };
    if (category)      query.category      = category;
    if (equipmentType) query.equipmentType = equipmentType;
    if (q) {
        query.$or = [
            { name:          { $regex: q, $options: 'i' } },
            { equipmentType: { $regex: q, $options: 'i' } },
            { tags:          { $in: [new RegExp(q, 'i')] } }
        ];
    }

    const results = await DesignLibrary.find(query).limit(30).lean();
    res.json({ count: results.length, data: results });
});

// ─── GET /api/design-library/:id ─────────────────────────────────────────────
const getDesignById = asyncHandler(async (req, res) => {
    const design = await DesignLibrary.findById(req.params.id).lean();
    if (!design) return res.status(404).json({ message: 'Design not found' });
    res.json(design);
});

// ─── POST /api/design-library ────────────────────────────────────────────────
const createDesign = asyncHandler(async (req, res) => {
    const { libraryId, name, category, equipmentType, variants, tags } = req.body;

    const existing = await DesignLibrary.findOne({ libraryId });
    if (existing) return res.status(400).json({ message: 'Library ID already exists' });

    const design = await DesignLibrary.create({
        libraryId, name, category, equipmentType: equipmentType || '',
        variants: variants || [],
        tags:     tags || [],
        createdBy: req.user._id
    });

    res.status(201).json(design);
});

// ─── PUT /api/design-library/:id ─────────────────────────────────────────────
const updateDesign = asyncHandler(async (req, res) => {
    const design = await DesignLibrary.findById(req.params.id);
    if (!design) return res.status(404).json({ message: 'Design not found' });

    const { name, category, equipmentType, variants, tags, activeStatus } = req.body;
    if (name)          design.name          = name;
    if (category)      design.category      = category;
    if (equipmentType) design.equipmentType = equipmentType;
    if (variants)      design.variants      = variants;
    if (tags)          design.tags          = tags;
    if (activeStatus !== undefined) design.activeStatus = activeStatus;
    design.version += 1;

    await design.save();
    res.json(design);
});

// ─── GET /api/design-library/lead-time-master ─────────────────────────────────
const getLeadTimeMasterRules = asyncHandler(async (req, res) => {
    const rules = await LeadTimeMaster.find({ activeStatus: true }).lean();
    res.json(rules);
});

// ─── POST /api/design-library/lead-time-master ────────────────────────────────
const upsertLeadTimeMasterRule = asyncHandler(async (req, res) => {
    const { requestType, equipmentType, plantLocation, baseLeadTimeDays, confidenceDefault, adjustmentFactors } = req.body;

    const rule = await LeadTimeMaster.findOneAndUpdate(
        { requestType, plantLocation: plantLocation || '' },
        {
            requestType,
            equipmentType:      equipmentType || '',
            plantLocation:      plantLocation || '',
            baseLeadTimeDays:   baseLeadTimeDays   || 14,
            confidenceDefault:  confidenceDefault   || 70,
            adjustmentFactors:  adjustmentFactors   || [],
            activeStatus:       true,
            lastUpdated:        new Date()
        },
        { upsert: true, new: true }
    );

    res.status(200).json(rule);
});

module.exports = {
    getAllDesigns,
    searchDesigns,
    getDesignById,
    createDesign,
    updateDesign,
    getLeadTimeMasterRules,
    upsertLeadTimeMasterRule
};
