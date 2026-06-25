const mongoose = require('mongoose');

// ─── Adjustment factor for lead time calculation ──────────────────────────────
const adjustmentFactorSchema = new mongoose.Schema({
    factor:           { type: String, required: true },  // e.g. 'EXISTING_DESIGN_AVAILABLE'
    label:            { type: String, required: true },  // e.g. '✓ Existing Design Available'
    adjustment:       { type: Number, default: 0 },      // days to add/subtract (negative = reduce)
    confidenceBoost:  { type: Number, default: 0 }       // confidence % change
}, { _id: false });

// ─── LeadTimeMaster ───────────────────────────────────────────────────────────
const leadTimeMasterSchema = new mongoose.Schema({
    requestType: {
        type: String,
        enum: ['New Project', 'Modification', 'Replacement', 'Upgrade', 'Refresh', 'Capacity', 'Special Improvements'],
        required: true
    },
    equipmentType: {
        type: String,
        default: ''          // '' = applies to all equipment types
    },
    plantLocation: {
        type: String,
        default: ''          // '' = applies to all plant locations
    },
    complexityBand: {
        type: String,
        enum: ['LOW', 'MEDIUM', 'HIGH', 'ANY'],
        default: 'ANY'
    },
    baseLeadTimeDays:   { type: Number, required: true, default: 14 },
    confidenceDefault:  { type: Number, required: true, default: 70 },  // 0-100
    adjustmentFactors:  { type: [adjustmentFactorSchema], default: [] },
    activeStatus:       { type: Boolean, default: true },
    lastUpdated:        { type: Date, default: Date.now }
}, {
    timestamps: true
});

leadTimeMasterSchema.index({ requestType: 1 });
leadTimeMasterSchema.index({ plantLocation: 1 });
leadTimeMasterSchema.index({ activeStatus: 1 });

module.exports = mongoose.model('LeadTimeMaster', leadTimeMasterSchema);
