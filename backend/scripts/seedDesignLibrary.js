/**
 * seedDesignLibrary.js
 * Seeds initial Design Library data (Trolleys, Conveyors, etc.).
 * Usage:
 *   node backend/scripts/seedDesignLibrary.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const DesignLibrary = require('../models/DesignLibrary');

// ─── Dummy / Realistic Seed Data ─────────────────────────────────────────────
const LIBRARY_DATA = [
    {
        libraryId: 'DL-TRL-001',
        name: 'Standard Material Handling Trolley',
        category: 'Trolley',
        equipmentType: 'Trolley',
        tags: ['trolley', 'standard', 'material handling', 'manual'],
        variants: [
            {
                variantId: 'VAR-TRL-001-A',
                name: 'Light Duty (up to 50kg)',
                specifications: { maxLoad: '50kg', dimensions: '1000x500x900mm', material: 'Aluminum' },
                drawingRef: 'DWG-TRL-LD-01',
                standardLeadTimeDays: 7,
                complexityScore: 2
            },
            {
                variantId: 'VAR-TRL-001-B',
                name: 'Heavy Duty (up to 200kg)',
                specifications: { maxLoad: '200kg', dimensions: '1200x600x1000mm', material: 'Steel' },
                drawingRef: 'DWG-TRL-HD-01',
                standardLeadTimeDays: 10,
                complexityScore: 4
            }
        ]
    },
    {
        libraryId: 'DL-TRL-002',
        name: 'Custom Motorized Trolley',
        category: 'Trolley',
        equipmentType: 'Motorized Trolley',
        tags: ['trolley', 'motorized', 'custom', 'AGV-lite'],
        variants: [
            {
                variantId: 'VAR-TRL-002-A',
                name: 'Battery Operated Trolley v1',
                specifications: { batteryLife: '8 hours', maxLoad: '500kg', material: 'Reinforced Steel' },
                drawingRef: 'DWG-MOT-01',
                standardLeadTimeDays: 18,
                complexityScore: 7
            }
        ]
    },
    {
        libraryId: 'DL-CVY-001',
        name: 'Modular Roller Conveyor',
        category: 'Conveyor',
        equipmentType: 'Conveyor',
        tags: ['conveyor', 'roller', 'modular', 'standard'],
        variants: [
            {
                variantId: 'VAR-CVY-001-A',
                name: 'Gravity Roller Module (2m)',
                specifications: { length: '2m', width: '500mm', type: 'Gravity' },
                drawingRef: 'DWG-CVY-G-01',
                standardLeadTimeDays: 12,
                complexityScore: 3
            },
            {
                variantId: 'VAR-CVY-001-B',
                name: 'Powered Roller Module (2m)',
                specifications: { length: '2m', width: '500mm', type: 'Powered', motor: '0.5HP' },
                drawingRef: 'DWG-CVY-P-01',
                standardLeadTimeDays: 20,
                complexityScore: 6
            }
        ]
    },
    {
        libraryId: 'DL-RCK-001',
        name: 'Heavy Duty Storage Rack',
        category: 'Rack',
        equipmentType: 'Storage Rack',
        tags: ['rack', 'storage', 'heavy duty', 'warehouse'],
        variants: [
            {
                variantId: 'VAR-RCK-001-A',
                name: '4-Tier Pallet Rack',
                specifications: { tiers: 4, maxLoadPerTier: '1000kg', height: '4m' },
                drawingRef: 'DWG-RCK-4T',
                standardLeadTimeDays: 14,
                complexityScore: 5
            }
        ]
    }
];

async function seed() {
    try {
        let uri = process.env.ATLAS_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/tvs_ped';
        console.log('Connecting to:', uri);
        await mongoose.connect(uri);
        console.log('✅  Connected to MongoDB');

        let created = 0, updated = 0;

        for (const design of LIBRARY_DATA) {
            const result = await DesignLibrary.findOneAndUpdate(
                { libraryId: design.libraryId },
                { ...design, activeStatus: true },
                { upsert: true, new: true }
            );
            
            // Checking if newly created or updated
            if (result.createdAt.getTime() === result.updatedAt.getTime()) {
                created++;
            } else {
                updated++;
            }
            console.log(`  ✓  ${design.libraryId} - ${design.name}`);
        }

        console.log(`\n✅  Design Library Seeded: ${created} created, ${updated} updated`);
        process.exit(0);
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
}

seed();
