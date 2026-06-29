const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Role = require('./models/RoleModel');

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tvs_db')
    .then(async () => {
        console.log('Connected to DB for seeding roles...');

        const systemRoles = [
            'Requester',
            'L1 Approver',
            'PED Engineer',
            'Designer',
            'Checker',
            'Final Approver',
            'Admin',
            'Vendor'
        ];

        for (const roleName of systemRoles) {
            const exists = await Role.findOne({ name: roleName });
            if (!exists) {
                await Role.create({
                    name: roleName,
                    isSystemRole: true
                });
                console.log(`Created system role: ${roleName}`);
            }
        }

        console.log('Roles seeded successfully.');
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
