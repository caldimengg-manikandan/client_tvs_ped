require('dotenv').config();
const connectDB = require('./config/db');

const User = require('./models/UserModel');

async function fixPermissions() {
    try {
        await connectDB();

        const result = await User.updateMany({}, {
            $set: {
                'permissions.dashboard': true,
                'permissions.assetRequest': true,
                'permissions.requestTracker': true,
                'permissions.mhDevelopmentTracker': true,
                'permissions.assetSummary': true,
                'permissions.reports': true,
                'permissions.employeeMaster': true,
                'permissions.vendorMaster': true,
                'permissions.settings': true,
                'role': 'Admin' // Force everyone to Admin for now to bypass sidebar checks
            }
        });

        console.log(`Updated ${result.modifiedCount} users.`);
        process.exit(0);
    } catch (err) {
        console.error('Error updating users:', err);
        process.exit(1);
    }
}

fixPermissions();
