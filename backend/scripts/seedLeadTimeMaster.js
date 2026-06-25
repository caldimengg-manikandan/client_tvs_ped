/**
 * seedLeadTimeMaster.js
 * Seeds initial LeadTimeMaster rules for TVS plant operations.
 * Safe to run multiple times (upserts on requestType + plantLocation).
 *
 * Usage:
 *   node backend/scripts/seedLeadTimeMaster.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose       = require('mongoose');
const LeadTimeMaster = require('../models/LeadTimeMaster');

const RULES = [
    // ─── New Project ───────────────────────────────────────────────────────────
    { requestType: 'New Project', plantLocation: '',                    baseLeadTimeDays: 21, confidenceDefault: 60,
      adjustmentFactors: [] },
    { requestType: 'New Project', plantLocation: 'Hosur Plant 1 (TN)', baseLeadTimeDays: 18, confidenceDefault: 65,
      adjustmentFactors: [] },
    { requestType: 'New Project', plantLocation: 'Nalagarh (HP)',       baseLeadTimeDays: 25, confidenceDefault: 55,
      adjustmentFactors: [] },

    // ─── Modification ──────────────────────────────────────────────────────────
    { requestType: 'Modification', plantLocation: '', baseLeadTimeDays: 12, confidenceDefault: 75,
      adjustmentFactors: [
          { factor: 'EXISTING_DESIGN_AVAILABLE', label: '✓ Modification uses existing base design', adjustment: -2, confidenceBoost: 10 }
      ]
    },

    // ─── Replacement ───────────────────────────────────────────────────────────
    { requestType: 'Replacement', plantLocation: '', baseLeadTimeDays: 10, confidenceDefault: 80,
      adjustmentFactors: [
          { factor: 'SAME_SPECS_AS_ORIGINAL', label: '✓ Direct replacement (identical specs)', adjustment: -3, confidenceBoost: 8 }
      ]
    },

    // ─── Upgrade ───────────────────────────────────────────────────────────────
    { requestType: 'Upgrade', plantLocation: '', baseLeadTimeDays: 14, confidenceDefault: 72,
      adjustmentFactors: [] },

    // ─── Refresh ───────────────────────────────────────────────────────────────
    { requestType: 'Refresh', plantLocation: '', baseLeadTimeDays: 8, confidenceDefault: 82,
      adjustmentFactors: [
          { factor: 'MINOR_CHANGES_ONLY', label: '✓ Refresh (minor changes only)', adjustment: -2, confidenceBoost: 5 }
      ]
    },

    // ─── Capacity ──────────────────────────────────────────────────────────────
    { requestType: 'Capacity', plantLocation: '', baseLeadTimeDays: 16, confidenceDefault: 65,
      adjustmentFactors: [] },

    // ─── Special Improvements ──────────────────────────────────────────────────
    { requestType: 'Special Improvements', plantLocation: '', baseLeadTimeDays: 18, confidenceDefault: 62,
      adjustmentFactors: [] }
];

async function seed() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tvs_ped');
    console.log('✅  Connected to MongoDB');

    let created = 0, updated = 0;

    for (const rule of RULES) {
        const result = await LeadTimeMaster.findOneAndUpdate(
            { requestType: rule.requestType, plantLocation: rule.plantLocation },
            { ...rule, activeStatus: true, lastUpdated: new Date() },
            { upsert: true, new: true }
        );
        if (result.createdAt.getTime() === result.updatedAt.getTime()) created++;
        else updated++;
        console.log(`  ✓  ${rule.requestType} / "${rule.plantLocation || 'ALL'}" — ${rule.baseLeadTimeDays} days base`);
    }

    console.log(`\n✅  Seeded: ${created} created, ${updated} updated`);
    await mongoose.disconnect();
    process.exit(0);
}

seed().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
