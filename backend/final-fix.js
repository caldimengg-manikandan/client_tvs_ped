// Final fix script - handles all edge cases
const mongoose = require('mongoose');
require('dotenv').config();

const finalFix = async () => {
    try {
        await mongoose.connect(process.env.ATLAS_URI || process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const VendorScoring = mongoose.connection.collection('vendorscorings');
        const Vendors = mongoose.connection.collection('vendors');

        // Get all scores without vendorId
        const scores = await VendorScoring.find({
            $or: [
                { vendorId: { $exists: false } },
                { vendorId: null }
            ]
        }).toArray();

        console.log(`📊 Found ${scores.length} scores needing fix\n`);

        let updated = 0;
        let vendorsCreated = 0;

        for (const score of scores) {
            try {
                console.log(`🔧 Processing: ${score.vendorCode} - ${score.vendorName}`);

                // Find vendor
                let vendor = await Vendors.findOne({ vendorCode: score.vendorCode });

                if (!vendor) {
                    console.log(`   Creating vendor ${score.vendorCode}...`);

                    // Get next sNo
                    const lastVendor = await Vendors.findOne({}, { sort: { sNo: -1 } });
                    const nextSNo = lastVendor && lastVendor.sNo ? lastVendor.sNo + 1 : 1;

                    const newVendor = {
                        sNo: nextSNo,
                        vendorCode: score.vendorCode,
                        vendorName: score.vendorName || `Vendor ${score.vendorCode}`,
                        vendorLocation: score.location || 'Unknown',
                        GSTIN: `29${score.vendorCode.replace(/[^A-Z0-9]/g, '')}1234A1Z5`.substring(0, 15),
                        vendorMailId: `${score.vendorCode.toLowerCase().replace(/[^a-z0-9]/g, '')}@vendor.com`,
                        remarks: 'Auto-created during vendor scoring migration',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    };

                    const result = await Vendors.insertOne(newVendor);
                    vendor = { _id: result.insertedId, ...newVendor };
                    vendorsCreated++;
                    console.log(`   ✅ Created vendor with sNo: ${nextSNo}`);
                }

                // Update score with vendorId
                const updateResult = await VendorScoring.updateOne(
                    { _id: score._id },
                    {
                        $set: {
                            vendorId: new mongoose.Types.ObjectId(vendor._id),
                            vendorName: vendor.vendorName,
                            location: vendor.vendorLocation,
                            scoringMonth: score.scoringMonth || 1,
                            scoringYear: score.scoringYear || 2026,
                            updatedAt: new Date()
                        }
                    }
                );

                if (updateResult.modifiedCount > 0) {
                    console.log(`   ✅ Updated score with vendorId\n`);
                    updated++;
                } else {
                    console.log(`   ⚠️  Score not updated\n`);
                }

            } catch (error) {
                console.error(`   ❌ Error: ${error.message}\n`);
            }
        }

        console.log('\n═══════════════════════════════════════════');
        console.log('✅ FIX COMPLETE');
        console.log('═══════════════════════════════════════════');
        console.log(`✅ Scores Updated: ${updated}`);
        console.log(`✨ Vendors Created: ${vendorsCreated}`);
        console.log('═══════════════════════════════════════════\n');

        // Verify
        const remaining = await VendorScoring.countDocuments({
            $or: [
                { vendorId: { $exists: false } },
                { vendorId: null }
            ]
        });

        if (remaining === 0) {
            console.log('🎉 SUCCESS! All vendor scores now have vendorId!');
            console.log('\n📝 Next Steps:');
            console.log('   1. Refresh your browser (Ctrl+R)');
            console.log('   2. Navigate to Vendor Scoring page');
            console.log('   3. Click the Eye icon on any score');
            console.log('   4. Performance analytics should now work!\n');
        } else {
            console.log(`⚠️  Still ${remaining} scores without vendorId`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
};

finalFix();
