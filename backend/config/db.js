const mongoose = require('mongoose');





const connectDB = async () => {
    try {
        const dbURI = process.env.MONGO_URI || process.env.ATLAS_URI;

        if (!dbURI) {
            throw new Error('No MongoDB connection string found in environment variables (MONGO_URI or ATLAS_URI)');
        }

        await mongoose.connect(dbURI, {
            dbName: 'tvs-ped'
        });
        console.log('MongoDB Connected Successfully to tvs-ped');
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;





