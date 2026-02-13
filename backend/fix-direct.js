// Direct database update to fix vendorId issue
const mongoose = require('mongoose');
require('dotenv').config();

const fixDirectly = async () => {
    try {
        await mongoose.connect(process.env.ATLAS_URI || process.env.MONGO_URI);
        console.log('✅ Connected\n');

        const VendorScoring = mongoose.connection.collection('vendorscorings');
        const Vendors = mongoose.connection.collection('vendors');

        // Get all scores without vendorId
        const scores = await VendorScoring.find({
            $or: [
                { vendorId: { $exists: false } },
                { vendorId: null }
            ]
        }).toArray();

        console.log(`Found ${scores.length} scores without vendorId\n`);

        for (const score of scores) {
            console.log(`Processing: ${score.vendorCode}`);

            // Find or create vendor
            let vendor = await Vendors.findOne({ vendorCode: score.vendorCode });

            if (!vendor) {
                console.log(`  Creating vendor ${score.vendorCode}...`);
                const newVendor = {
                    vendorCode: score.vendorCode,
                    vendorName: score.vendorName || `Vendor ${score.vendorCode}`,
                    vendorLocation: score.location || 'Unknown',
                    GSTIN: `29${score.vendorCode}ABCD1Z5`,
                    vendorMailId: `${score.vendorCode.toLowerCase()}@vendor.com`,
                    remarks: 'Auto-created',
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                const result = await Vendors.insertOne(newVendor);
                vendor = { _id: result.insertedId, ...newVendor };
                console.log(`  ✅ Created vendor`);
            }

            // Update score
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
            console.log(`  ✅ Updated score\n`);
        }

        console.log('✅ All done!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

fixDirectly();
