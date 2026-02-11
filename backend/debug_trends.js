const mongoose = require('mongoose');
const MHRequest = require('./models/MHRequest');
require('dotenv').config();

const debugTrends = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Check range
        const startDate = new Date('2025-12-01T00:00:00.000Z');
        const endDate = new Date('2026-12-31T23:59:59.999Z');

        console.log('Querying from:', startDate.toISOString(), 'to:', endDate.toISOString());

        const requests = await MHRequest.find({
            activeStatus: true,
            createdAt: {
                $gte: startDate,
                $lte: endDate
            }
        });

        console.log(`Found ${requests.length} MH requests.`);

        requests.forEach(req => {
            const dateKey = new Date(req.createdAt).toISOString().slice(0, 10);
            console.log(`- Request ${req.mhRequestId}: Created=${req.createdAt.toISOString()} Key=${dateKey} Status=${req.status}`);
        });

        if (requests.length === 0) {
            console.log('--- No MH requests found in date range ---');
            console.log('Listing ALL active MH requests to verify dates:');
            const all = await MHRequest.find({ activeStatus: true }).limit(5);
            all.forEach(req => {
                console.log(`  ${req.mhRequestId}: ${req.createdAt.toISOString()}`);
            });
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

debugTrends();
