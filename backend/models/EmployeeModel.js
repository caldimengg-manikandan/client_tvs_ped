const mongoose = require('mongoose');

const employeeSchema = mongoose.Schema({
    sNo: {
        type: Number,
        unique: true
    },
    employeeId: {
        type: String,
        required: true,
        unique: true
    },
    employeeName: {
        type: String,
        required: true
    },
    departmentName: {
        type: String,
        required: true
    },
    plantLocation: {
        type: String,
        required: true
    },
    mailId: {
        type: String,
        required: true,
        unique: true
    },
    designation: {
        type: String
    },
    dateOfJoining: {
        type: Date
    },
    accessLevel: {
        type: String,
        enum: ['Employee', 'Viewer', 'Manager', 'Admin', 'Super Admin'],
        default: 'Employee'
    },
    permissions: {
        type: Object,
        default: {}
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Suspended'],
        default: 'Active'
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

// Auto-increment sNo before validation
employeeSchema.pre('validate', async function () {
    if (!this.isNew) return;
    const lastEmployee = await this.constructor.findOne({}, {}, { sort: { 'sNo': -1 } });
    this.sNo = lastEmployee && lastEmployee.sNo ? lastEmployee.sNo + 1 : 1;
});

module.exports = mongoose.model('Employee', employeeSchema);