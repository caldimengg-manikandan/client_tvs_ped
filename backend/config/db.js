const mongoose = require('mongoose');





const connectDB = async () => {
    try {
        let dbURI = process.env.MONGO_URI || process.env.ATLAS_URI;
        let isInMemory = false;

        if (!dbURI || dbURI.includes('your_mongodb_atlas_connection_string_here')) {
            console.log('No valid MongoDB connection string found. Spinning up in-memory MongoDB server...');
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongoServer = await MongoMemoryServer.create();
            dbURI = mongoServer.getUri();
            console.log('In-memory MongoDB server started successfully at:', dbURI);
            
            // Save the dynamic URI so other parts of the application or separate scripts can read it
            process.env.MONGO_URI = dbURI;
            isInMemory = true;
        }

        await mongoose.connect(dbURI, {
            dbName: 'tvs-ped'
        });
        console.log('MongoDB Connected Successfully to tvs-ped');

        if (isInMemory) {
            await seedInMemoryData();
        }
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
};

const seedInMemoryData = async () => {
    try {
        const User = require('../models/UserModel');
        const Employee = require('../models/EmployeeModel');
        const bcrypt = require('bcryptjs');

        // Check if admin user already exists to avoid duplicate seeding
        const adminExists = await User.findOne({ email: 'admin@tvs.com' });
        if (adminExists) {
            console.log('In-memory database already seeded.');
            return;
        }

        console.log('Seeding in-memory database with default data...');

        // 1. Create Admin Employee
        const adminEmployee = await Employee.create({
            employeeId: 'EMP001',
            employeeName: 'System Admin',
            departmentName: 'IT',
            plantLocation: 'Madurai',
            mailId: 'admin@tvs.com',
            designation: 'Administrator',
            dateOfJoining: new Date(),
            accessLevel: 'Admin',
            permissions: {
                dashboard: true,
                assetRequest: true,
                requestTracker: true,
                assetSummary: true,
                reports: true,
                employeeMaster: true,
                vendorMaster: true,
                settings: true
            },
            status: 'Active'
        });

        // 2. Create Admin User
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        await User.create({
            userId: 'ADM001',
            employeeId: adminEmployee._id,
            email: 'admin@tvs.com',
            passwordHash: hashedPassword,
            role: 'Admin',
            permissions: {
                dashboard: true,
                assetRequest: true,
                requestTracker: true,
                assetSummary: true,
                reports: true,
                employeeMaster: true,
                vendorMaster: true,
                settings: true
            },
            status: 'Active'
        });

        // 3. Create Regular Employee
        const userEmployee = await Employee.create({
            employeeId: 'EMP002',
            employeeName: 'John Doe',
            departmentName: 'Quality',
            plantLocation: 'Chennai',
            mailId: 'john.doe@tvs.com',
            designation: 'Engineer',
            dateOfJoining: new Date(),
            accessLevel: 'Employee',
            permissions: {
                dashboard: true,
                assetRequest: true,
                requestTracker: false,
                assetSummary: false,
                reports: false,
                employeeMaster: false,
                vendorMaster: false,
                settings: false
            },
            status: 'Active'
        });

        const hashedUserPassword = await bcrypt.hash('user123', salt);

        await User.create({
            userId: 'USR001',
            employeeId: userEmployee._id,
            email: 'john.doe@tvs.com',
            passwordHash: hashedUserPassword,
            role: 'Employee',
            permissions: {
                dashboard: true,
                assetRequest: true,
                requestTracker: false,
                assetSummary: false,
                reports: false,
                employeeMaster: false,
                vendorMaster: false,
                settings: false
            },
            status: 'Active'
        });

        console.log('In-memory database seeded successfully!');
        console.log('Admin Email: admin@tvs.com | Password: admin123');
    } catch (err) {
        console.error('Error seeding in-memory database:', err.message);
    }
};

module.exports = connectDB;


