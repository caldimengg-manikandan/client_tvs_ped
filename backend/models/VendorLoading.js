const mongoose = require('mongoose');

const vendorLoadingSchema = new mongoose.Schema({
    vendorCode: {
        type: String,
        required: true,
        unique: true, // Should be one entry per vendor
        trim: true,
        uppercase: true
    },
    totalProjects: {
        type: Number,
        default: 0
    },
    completedProjects: {
        type: Number,
        default: 0
    },
    designStageProjects: {
        type: Number,
        default: 0
    },
    trialStageProjects: {
        type: Number,
        default: 0
    },
    bulkProjects: {
        type: Number,
        default: 0
    },
    vendorCapacity: {
        type: Number,
        default: 10, // Default capacity
        required: true
    },
    loadingPercentage: {
        type: Number,
        default: 0
    },
    gap: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Calculate Loading % and Gap before saving
vendorLoadingSchema.pre('save', async function () {
    if (this.vendorCapacity > 0) {
        this.loadingPercentage = parseFloat(((this.totalProjects / this.vendorCapacity) * 100).toFixed(2));
    } else {
        this.loadingPercentage = 0;
    }
    this.gap = this.vendorCapacity - this.totalProjects;
});

module.exports = mongoose.model('VendorLoading', vendorLoadingSchema);
