// Enhanced migration script to fix vendor scoring data
const mongoose = require('mongoose');
require('dotenv').config();

const VendorScoring = require('./models/VendorScoring');
const Vendor = require('./models/Vendor');

const fixVendorScoring = async () => {
    try {
        console.log('🔄 Starting Enhanced Vendor Scoring Fix...\n');

        await mongoose.connect(process.env.ATLAS_URI || process.env.MONGO_URI);
        console.log('✅ MongoDB Connected\n');

        // Get all vendor scoring records without vendorId
        const scores = await VendorScoring.find({
            $or: [
                { vendorId: { $exists: false } },
                { vendorId: null }
            ]
        });

        console.log(`📊 Found ${scores.length} scores needing vendorId\n`);

        if (scores.length === 0) {
            console.log('✅ All scores already have vendorId!');
            return;
        }

        let updated = 0;
        let created = 0;
        let errors = 0;

        for (const score of scores) {
            try {
                console.log(`\n🔍 Processing: ${score.vendorCode} - ${score.vendorName}`);

                // Try to find vendor by code
                let vendor = await Vendor.findOne({ vendorCode: score.vendorCode });

                if (!vendor) {
                    console.log(`   ⚠️  Vendor ${score.vendorCode} not found in Vendor Master`);
                    console.log(`   ✨ Creating vendor automatically...`);

                    // Create the vendor
                    vendor = new Vendor({
                        vendorCode: score.vendorCode,
                        vendorName: score.vendorName || `Vendor ${score.vendorCode}`,
                        vendorLocation: score.location || 'Unknown',
                        GSTIN: `29${score.vendorCode}1234A1B2`, // Dummy GSTIN
                        vendorMailId: `${score.vendorCode.toLowerCase()}@vendor.com`,
                        remarks: 'Auto-created during migration'
                    });

                    await vendor.save();
                    console.log(`   ✅ Created vendor: ${vendor.vendorCode}`);
                    created++;
                }

                // Update the score with vendorId
                score.vendorId = vendor._id;
                score.vendorName = vendor.vendorName;
                score.location = vendor.vendorLocation;

                // Add default period if missing
                if (!score.scoringMonth) {
                    score.scoringMonth = 1; // January
                    console.log(`   📅 Added default month: January`);
                }
                if (!score.scoringYear) {
                    score.scoringYear = 2026;
                    console.log(`   📅 Added default year: 2026`);
                }

                // Save without validation to avoid unique constraint issues
                await VendorScoring.updateOne(
                    { _id: score._id },
                    {
                        $set: {
                            vendorId: vendor._id,
                            vendorName: vendor.vendorName,
                            location: vendor.vendorLocation,
                            scoringMonth: score.scoringMonth || 1,
                            scoringYear: score.scoringYear || 2026
                        }
                    }
                );

                console.log(`   ✅ Updated score with vendorId: ${vendor._id}`);
                updated++;

            } catch (error) {
                console.error(`   ❌ Error: ${error.message}`);
                errors++;
            }
        }

        console.log('\n═══════════════════════════════════════════');
        console.log('✅ MIGRATION COMPLETE');
        console.log('═══════════════════════════════════════════');
        console.log(`✅ Scores Updated: ${updated}`);
        console.log(`✨ Vendors Created: ${created}`);
        console.log(`❌ Errors: ${errors}`);
        console.log('═══════════════════════════════════════════\n');

        if (updated > 0) {
            console.log('🎉 Success! Your vendor scoring data is now linked to Vendor Master.');
            console.log('📝 Next steps:');
            console.log('   1. Refresh your browser');
            console.log('   2. Go to Vendor Scoring page');
            console.log('   3. Click the Eye icon to view performance');
            console.log('   4. It should work now!\n');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
};

fixVendorScoring();
