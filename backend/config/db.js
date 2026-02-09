const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // --- Database Connection Strings ---

        // 1. Local Connection
        // const dbURI = process.env.MONGO_URI;

        // 2. Atlas Connection (Default)
        const dbURI = process.env.ATLAS_URI;

        // -----------------------------------

        await mongoose.connect(dbURI);
        console.log('MongoDB Connected Successfully');
        // console.log(`Connected to: ${dbURI}`); 
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
