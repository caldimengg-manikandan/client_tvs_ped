const mongoose = require('mongoose');

const kpiTargetSettingsSchema = new mongoose.Schema({
    phaseTargets: {
        Initiated: { type: Number, default: 1.5 },
        Design: { type: Number, default: 4.0 },
        'PR/PO': { type: Number, default: 3.0 },
        'Sample Prod.': { type: Number, default: 5.0 },
        'Prod. Ready': { type: Number, default: 2.0 },
        Released: { type: Number, default: 1.0 },
    },
    activeAssetsTarget: { type: Number, default: 150 },
    pendingRequestsAlertThreshold: { type: Number, default: 50 },
    rejectedRequestsAlertThreshold: { type: Number, default: 10 },
}, { timestamps: true });

module.exports = mongoose.model('KPITargetSettings', kpiTargetSettingsSchema);
