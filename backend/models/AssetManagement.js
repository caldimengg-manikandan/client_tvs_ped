const mongoose = require('mongoose');

const assetManagementSchema = new mongoose.Schema({
    assetId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
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
    departmentName: {
        type: String,
        required: true,
        trim: true
    },
    plantLocation: {
        type: String,
        required: true,
        trim: true
    },
    assetLocation: {
        type: String,
        required: true,
        trim: true
    },
    assetName: {
        type: String,
        required: true,
        trim: true
    },
    signOffDocument: {
        filename: String,
        path: String,
        uploadDate: Date
    },
    drawing: {
        filename: String,
        path: String,
        uploadDate: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

assetManagementSchema.pre('validate', async function() {
    if (!this.isNew || this.assetId) return;

    const prefix = 'ASSEST/TVS/';

    const lastAsset = await this.constructor.findOne(
        { assetId: { $regex: `^${prefix}` } },
        {},
        { sort: { assetId: -1 } }
    );

    let nextNumber = 1;

    if (lastAsset && lastAsset.assetId) {
        const match = lastAsset.assetId.match(/ASSEST\/TVS\/(\d+)/);
        if (match) {
            nextNumber = parseInt(match[1], 10) + 1;
        }
    }

    this.assetId = `${prefix}${String(nextNumber).padStart(3, '0')}`;
});

module.exports = mongoose.model('AssetManagement', assetManagementSchema);
