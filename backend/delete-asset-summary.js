// Script to delete ALL asset summary data from AssetManagement collection
const mongoose = require('mongoose');
require('dotenv').config();

const AssetManagement = require('./models/AssetManagement');

const deleteAssetSummary = async () => {
    try {
        await mongoose.connect(process.env.ATLAS_URI || process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get count before deletion
        const beforeCount = await AssetManagement.countDocuments({});
        console.log(`📊 Assets in Database Before Deletion: ${beforeCount}`);
        
        if (beforeCount > 0) {
            console.log('\nAssets to be deleted:');
            const assets = await AssetManagement.find({}).limit(10);
            assets.forEach((asset, idx) => {
                console.log(`  ${idx + 1}. ${asset.assetId} - ${asset.assetName} (${asset.vendorName})`);
            });
            if (beforeCount > 10) {
                console.log(`  ... and ${beforeCount - 10} more`);
            }
        }
        console.log('');

        // Confirm deletion
        console.log('⚠️  WARNING: This will DELETE ALL asset summary data!');
        console.log('Proceeding with deletion...\n');

        // DELETE ALL ASSET MANAGEMENT RECORDS
        const result = await AssetManagement.deleteMany({});
        
        console.log(`🗑️  Deletion Complete!`);
        console.log(`✅ Deleted ${result.deletedCount} asset record(s) from database`);
        console.log('');

        // Verify deletion
        const afterCount = await AssetManagement.countDocuments({});
        console.log(`📊 Assets in Database After Deletion: ${afterCount}`);
        
        if (afterCount === 0) {
            console.log('✅ Asset Summary Database is now EMPTY');
        }

        await mongoose.connection.close();
        console.log('\n✅ Deletion completed successfully');
    } catch (error) {
        console.error('❌ Error during deletion:', error.message);
        process.exit(1);
    }
};

deleteAssetSummary();
