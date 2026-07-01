const KPITargetSettings = require('../models/KPITargetSettings');

const getSettings = async (req, res) => {
    try {
        let settings = await KPITargetSettings.findOne();
        if (!settings) {
            settings = await KPITargetSettings.create({});
        }
        res.json(settings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error retrieving KPI settings' });
    }
};

const updateSettings = async (req, res) => {
    try {
        let settings = await KPITargetSettings.findOne();
        if (!settings) {
            settings = new KPITargetSettings();
        }
        
        const { phaseTargets, activeAssetsTarget, pendingRequestsAlertThreshold, rejectedRequestsAlertThreshold } = req.body;
        
        if (phaseTargets) settings.phaseTargets = phaseTargets;
        if (activeAssetsTarget !== undefined) settings.activeAssetsTarget = activeAssetsTarget;
        if (pendingRequestsAlertThreshold !== undefined) settings.pendingRequestsAlertThreshold = pendingRequestsAlertThreshold;
        if (rejectedRequestsAlertThreshold !== undefined) settings.rejectedRequestsAlertThreshold = rejectedRequestsAlertThreshold;

        await settings.save();
        res.json(settings);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error updating KPI settings' });
    }
};

module.exports = {
    getSettings,
    updateSettings
};
