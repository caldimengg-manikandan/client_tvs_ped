const mongoose = require('mongoose');

const vendorScoringSchema = new mongoose.Schema({
    // Reference to Vendor Master
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    // Denormalized fields for quick access (auto-populated)
    vendorCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    vendorName: {
        type: String,
        required: true,
        trim: true
    },
    location: {
        type: String,
        required: true,
        trim: true
    },
    // Scoring Period
    scoringMonth: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    scoringYear: {
        type: Number,
        required: true,
        min: 2020,
        max: 2100
    },
    // Performance Scores (1-5 scale)
    qsrScore: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        default: 1
    },
    costScore: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        default: 1
    },
    deliveryScore: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        default: 1
    },
    // Calculated Overall Score
    qcdScore: {
        type: Number,
        default: 0
    },
    // Performance Metrics
    completionRate: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    delayRate: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    remarks: {
        type: String,
        trim: true,
        default: ''
    }
}, {
    timestamps: true
});

// Compound index to ensure one score per vendor per month
vendorScoringSchema.index({ vendorId: 1, scoringMonth: 1, scoringYear: 1 }, { unique: true });

// Calculate QCD Score before saving
vendorScoringSchema.pre('save', async function () {
    this.qcdScore = parseFloat((
        (this.qsrScore * 0.4) +
        (this.costScore * 0.3) +
        (this.deliveryScore * 0.3)
    ).toFixed(2));
});

// Handle updates
vendorScoringSchema.pre('findOneAndUpdate', async function () {
    const update = this.getUpdate();
    if (update.$set) {
        const { qsrScore, costScore, deliveryScore } = update.$set;
        if (qsrScore !== undefined || costScore !== undefined || deliveryScore !== undefined) {
            const qsr = qsrScore !== undefined ? qsrScore : (this._update.$set.qsrScore || 1);
            const cost = costScore !== undefined ? costScore : (this._update.$set.costScore || 1);
            const delivery = deliveryScore !== undefined ? deliveryScore : (this._update.$set.deliveryScore || 1);

            update.$set.qcdScore = parseFloat((
                (qsr * 0.4) +
                (cost * 0.3) +
                (delivery * 0.3)
            ).toFixed(2));
        }
    }
});

module.exports = mongoose.model('VendorScoring', vendorScoringSchema);
