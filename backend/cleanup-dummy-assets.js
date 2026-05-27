// Script to delete dummy asset data from AssetManagement collection
const mongoose = require('mongoose');
require('dotenv').config();

const AssetManagement = require('./models/AssetManagement');

const cleanupAssets = async () => {
    try {
        await mongoose.connect(process.env.ATLAS_URI || process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get all assets before cleanup
        const allAssets = await AssetManagement.find({});
        console.log(`📊 Total Assets Before Cleanup: ${allAssets.length}`);
        console.log('Current Assets:');
        allAssets.forEach((asset, idx) => {
            console.log(`  ${idx + 1}. ${asset.assetId} - ${asset.assetName} (${asset.vendorName})`);
        });
        console.log('');

        // Option 1: Delete specific asset by assetId
        // Uncomment and modify the assetId to delete a specific asset
        // const result = await AssetManagement.deleteOne({ assetId: 'ASSEST/TVS/001' });
        // console.log(`✅ Deleted asset: ${result.deletedCount} record(s) removed`);

        // Option 2: Delete all assets with dummy patterns
        // Examples: contains "test", "dummy", "demo", etc.
        const dummyPatterns = ['test', 'dummy', 'demo', 'sample', 'temp', 'trial'];
        
        for (const pattern of dummyPatterns) {
            const result = await AssetManagement.deleteMany({
                $or: [
                    { assetName: { $regex: pattern, $options: 'i' } },
                    { vendorName: { $regex: pattern, $options: 'i' } },
                    { assetId: { $regex: pattern, $options: 'i' } }
                ]
            });
            if (result.deletedCount > 0) {
                console.log(`🗑️  Deleted ${result.deletedCount} asset(s) matching pattern: "${pattern}"`);
            }
        }
        console.log('');

        // Option 3: Delete all assets (CAUTION - USE ONLY IF YOU WANT TO START FRESH)
        // Uncomment the next line ONLY if you want to delete ALL assets
        // const deleteAll = await AssetManagement.deleteMany({});
        // console.log(`🗑️  Deleted ALL ${deleteAll.deletedCount} asset(s)`);

        // Show remaining assets
        const remainingAssets = await AssetManagement.find({});
        console.log(`✅ Total Assets After Cleanup: ${remainingAssets.length}`);
        console.log('Remaining Assets:');
        if (remainingAssets.length > 0) {
            remainingAssets.forEach((asset, idx) => {
                console.log(`  ${idx + 1}. ${asset.assetId} - ${asset.assetName} (${asset.vendorName})`);
            });
        } else {
            console.log('  (No assets found)');
        }

        await mongoose.connection.close();
        console.log('\n✅ Database cleanup completed successfully');
    } catch (error) {
        console.error('❌ Error during cleanup:', error.message);
        process.exit(1);
    }
};

cleanupAssets();
