const cron = require('node-cron');
const MHDevelopmentTracker = require('../models/MHDevelopmentTracker');
const KPITargetSettings = require('../models/KPITargetSettings');
const Employee = require('../models/EmployeeModel');
const emailService = require('../services/emailService');

const initializeAlertScheduler = () => {
    // Run weekly on Monday at 11:00 AM
    cron.schedule('0 11 * * 1', async () => {
        try {
            console.log('[ALERT CRON] Starting weekly KPI bottleneck alert check...');
            
            // Get targets
            let settings = await KPITargetSettings.findOne();
            if (!settings) {
                console.log('[ALERT CRON] No KPI settings found. Using defaults.');
                settings = new KPITargetSettings();
            }

            // Target mapping logic
            const STAGE_DISPLAY_MAP = {
                'Not Started':       'Initiated',
                'Design':            'Design',
                'PR/PO':             'PR/PO',
                'Sample Production': 'Sample Prod.',
                'Production Ready':  'Prod. Ready',
                'Completed':         'Released',
            };

            // Query active trackers
            const activeTrackers = await MHDevelopmentTracker.find({
                currentStage: { $ne: 'Completed' }
            }).populate('assignedEngineerId');

            let alertCount = 0;

            for (const tracker of activeTrackers) {
                // Calculate days in current stage
                const stageStartDate = tracker.updatedAt || tracker.createdAt;
                const daysInStage = (new Date() - stageStartDate) / (1000 * 60 * 60 * 24);
                
                const displayStage = STAGE_DISPLAY_MAP[tracker.currentStage] || tracker.currentStage;
                const targetDays = settings.phaseTargets[displayStage];

                if (targetDays && daysInStage > targetDays) {
                    // Bottleneck detected! Email the assigned engineer
                    if (tracker.assignedEngineerId && tracker.assignedEngineerId.email) {
                        const emailHtml = `
                            <div style="font-family: Arial, sans-serif; padding: 20px;">
                                <h2 style="color: #CC1F1F;">🚨 Bottleneck Alert</h2>
                                <p>Hello ${tracker.assignedEngineerId.employeeName},</p>
                                <p>The following asset request has exceeded its target cycle time for the <strong>${displayStage}</strong> phase.</p>
                                
                                <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #CC1F1F; margin: 20px 0;">
                                    <p><strong>Request ID:</strong> ${tracker.assetRequestId}</p>
                                    <p><strong>Asset/Part:</strong> ${tracker.productModel || tracker.departmentName}</p>
                                    <p><strong>Current Phase:</strong> ${displayStage}</p>
                                    <p><strong>Days in Phase:</strong> ${daysInStage.toFixed(1)} days (Target: ${targetDays} days)</p>
                                </div>
                                
                                <p>Please review this item in the portal and take necessary actions to unblock it.</p>
                                <br/>
                                <p>Best regards,<br/>TVS-PED Automated Alerts</p>
                            </div>
                        `;

                        await emailService.sendEmail(
                            tracker.assignedEngineerId.email,
                            `Action Required: Bottleneck in ${displayStage} for ${tracker.assetRequestId}`,
                            emailHtml
                        );
                        alertCount++;
                    }
                }
            }

            console.log(`[ALERT CRON] Completed. Sent ${alertCount} bottleneck alerts to PED Engineers.`);
        } catch (error) {
            console.error('[ALERT CRON] Error executing alert job:', error);
        }
    });
    
    console.log('[Scheduler] KPI Alert Cron initialized. (Runs Weekly Mon 11:00 AM)');
};

module.exports = {
    initializeAlertScheduler
};
