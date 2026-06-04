const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/UserModel');

dotenv.config();

const resetPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        const result = await User.updateOne(
            { email: 'admin@tvs.com' },
            { $set: { passwordHash: hashedPassword } }
        );
        
        if (result.modifiedCount > 0) {
            console.log('Successfully reset admin@tvs.com password to: admin123');
        } else {
            console.log('User not found or password already matches.');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit(0);
    }
};

resetPassword();
