require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/UserModel');
const Employee = require('../models/EmployeeModel');
const bcrypt = require('bcryptjs');

const seedTestUsers = async () => {
    try {
        const dbURI = process.env.ATLAS_URI || process.env.MONGO_URI;
        await mongoose.connect(dbURI);
        console.log('✅ Connected to MongoDB');

        const testUsers = [
            { name: 'Diana Design', email: 'designer@tvs.com', role: 'Designer', empId: 'EMP-DES-01' },
            { name: 'Charlie Checker', email: 'checker@tvs.com', role: 'Checker', empId: 'EMP-CHK-01' },
            { name: 'Fiona Final', email: 'final@tvs.com', role: 'Final Approver', empId: 'EMP-FIN-01' },
            { name: 'Luke LevelOne', email: 'approver@tvs.com', role: 'Approver', empId: 'EMP-L1-01' }
        ];

        const emails = testUsers.map(u => u.email);
        await User.deleteMany({ email: { $in: emails } });
        await Employee.deleteMany({ mailId: { $in: emails } });
        console.log('Cleared existing test users.');

        for (const u of testUsers) {
            const exists = await User.findOne({ email: u.email });
            if (exists) {
                console.log(`User ${u.email} already exists. Skipping.`);
                continue;
            }

            // Create Employee record first
            const newEmp = await Employee.create({
                employeeId: u.empId,
                employeeName: u.name,
                departmentName: 'Engineering',
                plantLocation: 'Hosur Plant 1 (TN)',
                mailId: u.email,
                designation: u.role,
                status: 'Active'
            });

            // Create User record
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('Password123', salt);

            await User.create({
                _id: newEmp._id, // Share ID for simplicity in relations
                userId: u.empId,
                employeeId: newEmp._id,
                name: u.name,
                email: u.email,
                passwordHash: hashedPassword,
                role: u.role,
                status: 'Active',
                plantLocation: 'Hosur Plant 1 (TN)',
                permissions: { role: u.role }
            });

            console.log(`✅ Created ${u.role}: ${u.email} (Password: Password123)`);
        }

        console.log('\n🎉 Test user seeding complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding users:', err);
        process.exit(1);
    }
};

seedTestUsers();
