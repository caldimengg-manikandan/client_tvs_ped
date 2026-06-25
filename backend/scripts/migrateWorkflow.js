/**
 * migrateWorkflow.js
 * ──────────────────────────────────────────────────────────────────────────────
 * One-time migration script: migrates ALL existing MHRequests to Enterprise
 * Workflow v2 state machine.
 *
 * Migration Logic:
 *  status='Active'   + progressStatus='Initial'          → SUBMITTED       (stage 1)
 *  status='Accepted' + progressStatus='Initial'          → L1_APPROVED     (stage 2)
 *  status='Accepted' + progressStatus='Design'           → DESIGN_IN_PROGRESS (stage 3)
 *  status='Accepted' + progressStatus='Design Approved'  → DESIGN_APPROVED  (stage 4)
 *  status='Accepted' + progressStatus='Production'       → IN_PRODUCTION    (stage 6)
 *  status='Accepted' + progressStatus='Implementation'   → COMPLETED        (stage 7)
 *  status='Rejected'                                     → L1_REJECTED      (stage 2)
 *
 * Safe to run multiple times (idempotent — skips already-migrated records).
 *
 * Usage:
 *   node backend/scripts/migrateWorkflow.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose  = require('mongoose');
const MHRequest = require('../models/MHRequest');

const STATE_MAP = [
    { status: 'Active',    progressStatus: 'Initial',          workflowState: 'SUBMITTED',          currentStage: 1 },
    { status: 'Accepted',  progressStatus: 'Initial',          workflowState: 'L1_APPROVED',         currentStage: 2 },
    { status: 'Accepted',  progressStatus: 'Design',           workflowState: 'DESIGN_IN_PROGRESS',  currentStage: 3 },
    { status: 'Accepted',  progressStatus: 'Design Approved',  workflowState: 'DESIGN_APPROVED',     currentStage: 4 },
    { status: 'Accepted',  progressStatus: 'Production',       workflowState: 'IN_PRODUCTION',       currentStage: 6 },
    { status: 'Accepted',  progressStatus: 'Implementation',   workflowState: 'COMPLETED',           currentStage: 7 },
    { status: 'Rejected',  progressStatus: null,               workflowState: 'L1_REJECTED',         currentStage: 2 }
];

async function migrate() {
    const dbURI = process.env.ATLAS_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/tvs_ped';
    await mongoose.connect(dbURI);
    console.log('✅  Connected to MongoDB');

    // Only process records that have NOT been migrated yet
    const unmigrated = await MHRequest.find({ workflowVersion: null });
    console.log(`📦  Found ${unmigrated.length} un-migrated requests`);

    let migrated = 0, skipped = 0, errors = 0;

    for (const req of unmigrated) {
        try {
            // Determine target state
            let mapping = null;

            if (req.status === 'Rejected') {
                mapping = STATE_MAP.find(m => m.status === 'Rejected');
            } else {
                mapping = STATE_MAP.find(m =>
                    m.status === req.status && m.progressStatus === req.progressStatus
                );
            }

            if (!mapping) {
                console.warn(`  ⚠️  No mapping for ${req.mhRequestId} (status=${req.status}, progress=${req.progressStatus}) — defaulting to SUBMITTED`);
                mapping = { workflowState: 'SUBMITTED', currentStage: 1 };
            }

            const historyEntry = {
                stage:     'MIGRATION',
                state:     mapping.workflowState,
                action:    'MIGRATED_FROM_LEGACY',
                actor:     null,
                actorName: 'System Migration',
                actorRole: 'System',
                comment:   `Migrated from legacy status='${req.status}', progressStatus='${req.progressStatus}'`,
                timestamp: new Date(),
                metadata:  { migratedAt: new Date(), legacyStatus: req.status, legacyProgressStatus: req.progressStatus }
            };

            await MHRequest.findByIdAndUpdate(req._id, {
                workflowState:   mapping.workflowState,
                workflowVersion: 2,
                currentStage:    mapping.currentStage,
                $push: { stageHistory: historyEntry }
            });

            console.log(`  ✓  ${req.mhRequestId} → ${mapping.workflowState} (stage ${mapping.currentStage})`);
            migrated++;
        } catch (err) {
            console.error(`  ✗  ${req.mhRequestId}: ${err.message}`);
            errors++;
        }
    }

    console.log('\n─────────────────────────────────────────────────');
    console.log(`✅  Migration complete`);
    console.log(`   Migrated : ${migrated}`);
    console.log(`   Skipped  : ${skipped}`);
    console.log(`   Errors   : ${errors}`);
    console.log('─────────────────────────────────────────────────');

    await mongoose.disconnect();
    process.exit(0);
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
