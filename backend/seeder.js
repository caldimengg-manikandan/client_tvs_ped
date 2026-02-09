const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/UserModel');
const Employee = require('./models/EmployeeModel');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const seedData = async () => {
    try {
        await User.deleteMany();
        await Employee.collection.drop().catch(() => {
            // Collection might not exist, that's ok
        });

        console.log('Data Destroyed...');

        // 1. Create Admin Employee
        const adminEmployee = await Employee.create({
            employeeId: 'EMP001',
            employeeName: 'System Admin',
            departmentName: 'IT',
            plantLocation: 'Madurai',
            mailId: 'logaprasath@caldimengg.in',
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

        console.log('Admin Employee Created:', adminEmployee.employeeName);

        // 2. Create Admin User
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        const adminUser = await User.create({
            userId: 'ADM001',
            employeeId: adminEmployee._id,
            email: 'logaprasath@caldimengg.in',
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

        console.log('Admin User Created:', adminUser.email);
        console.log('Password: admin123');

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

        const regularUser = await User.create({
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

        console.log('Regular User Created:', regularUser.email);
        console.log('Password: user123');

        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

seedData();
