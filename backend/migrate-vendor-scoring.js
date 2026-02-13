// Migration script to add vendorId references to existing vendor scoring data
const mongoose = require('mongoose');
require('dotenv').config();

const VendorScoring = require('./models/VendorScoring');
const Vendor = require('./models/Vendor');

const migrateVendorScoring = async () => {
    try {
        console.log('🔄 Starting Vendor Scoring migration...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.ATLAS_URI || process.env.MONGO_URI);
        console.log('✅ MongoDB Connected\n');

        // Get all vendor scoring records
        const scores = await VendorScoring.find({});
        console.log(`📊 Found ${scores.length} vendor scoring records\n`);

        let updated = 0;
        let skipped = 0;
        let errors = 0;

        for (const score of scores) {
            try {
                // Skip if already has vendorId
                if (score.vendorId) {
                    console.log(`⏭️  Skipping ${score.vendorCode} - already has vendorId`);
                    skipped++;
                    continue;
                }

                // Find vendor by code
                const vendor = await Vendor.findOne({ vendorCode: score.vendorCode });

                if (!vendor) {
                    console.log(`❌ Vendor not found for code: ${score.vendorCode}`);
                    errors++;
                    continue;
                }

                // Update the score with vendorId
                score.vendorId = vendor._id;

                // Update vendor details from Vendor Master
                score.vendorName = vendor.vendorName;
                score.location = vendor.vendorLocation;

                // Add default period if missing
                if (!score.scoringMonth) {
                    score.scoringMonth = new Date().getMonth() + 1;
                }
                if (!score.scoringYear) {
                    score.scoringYear = new Date().getFullYear();
                }

                await score.save();
                console.log(`✅ Updated ${score.vendorCode} → vendorId: ${vendor._id}`);
                updated++;

            } catch (error) {
                console.error(`❌ Error updating ${score.vendorCode}:`, error.message);
                errors++;
            }
        }

        console.log('\n═══════════════════════════════════════════');
        console.log('✅ MIGRATION COMPLETE');
        console.log('═══════════════════════════════════════════');
        console.log(`✅ Updated: ${updated}`);
        console.log(`⏭️  Skipped: ${skipped}`);
        console.log(`❌ Errors: ${errors}`);
        console.log(`📊 Total: ${scores.length}`);
        console.log('═══════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
};

// Run migration
migrateVendorScoring();
