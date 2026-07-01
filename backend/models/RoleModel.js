const mongoose = require('mongoose');

const roleSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    isSystemRole: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Role', roleSchema);
