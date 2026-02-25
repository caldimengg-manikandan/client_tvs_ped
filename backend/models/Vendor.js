// models/Vendor.js
const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
    sNo: {
        type: Number,
        required: true,
        unique: true,
        index: true
    },
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
    GSTIN: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true,
        validate: {
            validator: function (v) {
                return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v);
            },
            message: props => `${props.value} is not a valid GSTIN!`
        }
    },
    vendorLocation: {
        type: String,
        required: true,
        trim: true
    },
    vendorMailId: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    vendorCapacity: {
        type: Number,
        default: 10,
        min: 1
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'ACTIVE',
        uppercase: true
    },
    remarks: {
        type: String,
        trim: true,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Auto-increment S.No BEFORE validation so that required validation passes
// Use async pre hook without `next` parameter so Mongoose handles promise rejections
vendorSchema.pre('validate', async function () {
    if (!this.isNew) return;

    const lastVendor = await this.constructor.findOne({}, {}, { sort: { 'sNo': -1 } });
    this.sNo = lastVendor ? lastVendor.sNo + 1 : 1;
});

module.exports = mongoose.model('Vendor', vendorSchema);