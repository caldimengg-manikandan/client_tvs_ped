// Script to delete SPECIFIC assets from AssetManagement collection
const mongoose = require('mongoose');
require('dotenv').config();

const AssetManagement = require('./models/AssetManagement');

const deleteSpecificAssets = async () => {
    try {
        await mongoose.connect(process.env.ATLAS_URI || process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get count before deletion
        const beforeCount = await AssetManagement.countDocuments({});
        console.log(`📊 Total Assets Before Deletion: ${beforeCount}\n`);

        // List of asset IDs to delete (from the image)
        const assetsToDelete = [
            'ASSEST/TVS/015',
            'ASSEST/TVS/016'
        ];

        console.log('Assets to be deleted:');
        for (const assetId of assetsToDelete) {
            const asset = await AssetManagement.findOne({ assetId });
            if (asset) {
                console.log(`  ❌ ${asset.assetId} - ${asset.assetName} (${asset.vendorName || '-'})`);
            } else {
                console.log(`  ⚠️  ${assetId} - NOT FOUND`);
            }
        }
        console.log('');

        // Delete the specific assets
        const result = await AssetManagement.deleteMany({
            assetId: { $in: assetsToDelete }
        });

        console.log(`🗑️  Deletion Complete!`);
        console.log(`✅ Deleted ${result.deletedCount} asset record(s) from database`);
        console.log('');

        // Show remaining assets
        const afterCount = await AssetManagement.countDocuments({});
        console.log(`📊 Total Assets After Deletion: ${afterCount}`);
        
        const remainingAssets = await AssetManagement.find({});
        if (remainingAssets.length > 0) {
            console.log('\nRemaining Assets:');
            remainingAssets.forEach((asset, idx) => {
                console.log(`  ${idx + 1}. ${asset.assetId} - ${asset.assetName} (${asset.vendorName})`);
            });
        } else {
            console.log('(No assets remaining)');
        }

        await mongoose.connection.close();
        console.log('\n✅ Deletion completed successfully');
    } catch (error) {
        console.error('❌ Error during deletion:', error.message);
        process.exit(1);
    }
};

deleteSpecificAssets();
