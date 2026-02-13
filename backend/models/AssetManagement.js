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

// Auto-generate Asset ID before validation
assetManagementSchema.pre('validate', async function() {
    if (!this.isNew || this.assetId) return;
    
    const lastAsset = await this.constructor.findOne({}, {}, { sort: { 'assetId': -1 } });
    
    if (lastAsset && lastAsset.assetId) {
        // Extract number from AID001, AID002, etc.
        const match = lastAsset.assetId.match(/AID(\d+)/);
        if (match) {
            const nextNumber = parseInt(match[1]) + 1;
            this.assetId = `AID${String(nextNumber).padStart(3, '0')}`;
        } else {
            this.assetId = 'AID001';
        }
    } else {
        this.assetId = 'AID001';
    }
});

module.exports = mongoose.model('AssetManagement', assetManagementSchema);
