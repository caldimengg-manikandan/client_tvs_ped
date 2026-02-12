const mongoose = require('mongoose');

const vendorScoringSchema = new mongoose.Schema({
    vendorCode: {
        type: String,
        required: true,
        unique: true,
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
    qcdScore: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Calculate QCD Score before saving
vendorScoringSchema.pre('save', async function () {
    this.qcdScore = parseFloat((
        (this.qsrScore * 0.4) +
        (this.costScore * 0.3) +
        (this.deliveryScore * 0.3)
    ).toFixed(2));
});

// Also handle updates
vendorScoringSchema.pre('findOneAndUpdate', async function () {
    const update = this.getUpdate();
    if (update.qsrScore !== undefined || update.costScore !== undefined || update.deliveryScore !== undefined) {
        // ...
    }
});

module.exports = mongoose.model('VendorScoring', vendorScoringSchema);
