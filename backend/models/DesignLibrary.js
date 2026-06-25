const mongoose = require('mongoose');

// ─── Variant sub-document ────────────────────────────────────────────────────
const variantSchema = new mongoose.Schema({
    variantId:            { type: String, required: true },
    name:                 { type: String, required: true },
    specifications:       { type: mongoose.Schema.Types.Mixed, default: {} },
    drawingRef:           { type: String, default: '' },
    standardLeadTimeDays: { type: Number, default: 14 },
    complexityScore:      { type: Number, min: 1, max: 10, default: 5 }
}, { _id: true });

// ─── Historical lead time record ─────────────────────────────────────────────
const historicalLeadTimeSchema = new mongoose.Schema({
    requestId:    { type: String },
    actualDays:   { type: Number },
    requestType:  { type: String },
    plantLocation:{ type: String },
    recordedAt:   { type: Date, default: Date.now }
}, { _id: true });

// ─── DesignLibrary ───────────────────────────────────────────────────────────
const designLibrarySchema = new mongoose.Schema({
    libraryId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['Trolley', 'Conveyor', 'Rack', 'Fixture', 'Pallet', 'Container', 'Other'],
        required: true
    },
    equipmentType: {
        type: String,
        trim: true,
        default: ''
    },
    variants:             { type: [variantSchema], default: [] },
    historicalLeadTimes:  { type: [historicalLeadTimeSchema], default: [] },
    tags:                 { type: [String], default: [] },
    activeStatus:         { type: Boolean, default: true },
    createdBy:            { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    version:              { type: Number, default: 1 }
}, {
    timestamps: true
});

designLibrarySchema.index({ category: 1 });
designLibrarySchema.index({ equipmentType: 1 });
designLibrarySchema.index({ tags: 1 });
designLibrarySchema.index({ activeStatus: 1 });

module.exports = mongoose.model('DesignLibrary', designLibrarySchema);
