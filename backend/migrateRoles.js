const mongoose = require('mongoose');
const { Employee } = require('./models/EmployeeModel');
const UserModel = require('./models/UserModel');

mongoose.connect('mongodb://localhost:27017/tvs_db')
    .then(async () => {
        console.log('Connected to DB');
        
        const EmployeeModel = mongoose.model('Employee');
        const resEmp = await EmployeeModel.updateMany({ role: 'Employee' }, { $set: { role: 'Requester' } });
        console.log('Employees updated:', resEmp.modifiedCount);
        
        const resUser = await UserModel.updateMany({ role: 'Employee' }, { $set: { role: 'Requester' } });
        console.log('Users updated:', resUser.modifiedCount);
        
        const resEmpAccess = await EmployeeModel.updateMany({ accessLevel: 'Employee' }, { $set: { accessLevel: 'Requester' } });
        console.log('Employee accessLevels updated:', resEmpAccess.modifiedCount);
        
        mongoose.disconnect();
    })
    .catch(console.error);
