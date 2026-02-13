// Quick check script to verify vendor scoring data
const mongoose = require('mongoose');
require('dotenv').config();

const VendorScoring = require('./models/VendorScoring');
const Vendor = require('./models/Vendor');

const checkData = async () => {
    try {
        await mongoose.connect(process.env.ATLAS_URI || process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Check vendors
        const vendors = await Vendor.find({});
        console.log(`📊 Vendors in Vendor Master: ${vendors.length}`);
        if (vendors.length > 0) {
            console.log('Sample vendors:');
            vendors.slice(0, 3).forEach(v => {
                console.log(`  - ${v.vendorCode}: ${v.vendorName}`);
            });
        }
        console.log('');

        // Check vendor scores
        const scores = await VendorScoring.find({});
        console.log(`📊 Vendor Scoring Records: ${scores.length}`);
        if (scores.length > 0) {
            console.log('Sample scores:');
            scores.slice(0, 3).forEach(s => {
                console.log(`  - ${s.vendorCode}: vendorId=${s.vendorId ? '✅ ' + s.vendorId : '❌ MISSING'}`);
            });
        }
        console.log('');

        // Check for scores without vendorId
        const missingVendorId = await VendorScoring.find({ vendorId: { $exists: false } });
        console.log(`❌ Scores missing vendorId: ${missingVendorId.length}`);

        if (missingVendorId.length > 0) {
            console.log('\n⚠️  ACTION REQUIRED:');
            console.log('Run migration script to add vendorId references:');
            console.log('  node migrate-vendor-scoring.js\n');
        }

        // Check for orphaned scores (vendor doesn't exist)
        let orphaned = 0;
        for (const score of scores) {
            if (score.vendorId) {
                const vendor = await Vendor.findById(score.vendorId);
                if (!vendor) {
                    console.log(`⚠️  Orphaned score: ${score.vendorCode} (vendor not found)`);
                    orphaned++;
                }
            }
        }
        if (orphaned > 0) {
            console.log(`\n❌ Orphaned scores: ${orphaned}`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

checkData();
