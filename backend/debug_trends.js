const mongoose = require('mongoose');
const AssetRequest = require('./models/AssetRequest');
require('dotenv').config();

const debugTrends = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // From 1st Dec to 17th Dec
        const startDate = new Date('2025-12-01T00:00:00.000Z');
        const endDate = new Date('2025-12-17T23:59:59.999Z');

        console.log('Querying from:', startDate.toISOString(), 'to:', endDate.toISOString());

        const requests = await AssetRequest.find({
            activeStatus: true,
            createdAt: {
                $gte: startDate,
                $lte: endDate
            }
        });

        console.log(`Found ${requests.length} requests.`);

        requests.forEach(req => {
            const dateKey = new Date(req.createdAt).toISOString().slice(0, 10);
            console.log(`- Request ${req.assetRequestId}: Created=${req.createdAt.toISOString()} Key=${dateKey} Status=${req.status}`);
        });

        if (requests.length === 0) {
            console.log('--- No requests found in date range ---');
            console.log('Listing ALL active requests to verify dates:');
            const all = await AssetRequest.find({ activeStatus: true }).limit(5);
            all.forEach(req => {
                console.log(`  ${req.assetRequestId}: ${req.createdAt.toISOString()}`);
            });
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

debugTrends();
