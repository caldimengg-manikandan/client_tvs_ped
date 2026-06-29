const mongoose = require('mongoose');
const dotenv = require('dotenv');
const MHRequest = require('../models/MHRequest');
const MHDevelopmentTracker = require('../models/MHDevelopmentTracker');
const Employee = require('../models/EmployeeModel');

// Load env
dotenv.config();

// Connect DB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tvs_db');
        console.log('✅ MongoDB connected successfully for simulation.\n');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    }
};

// Helper: colored logging
const log = {
    info: (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
    success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
    warn: (msg) => console.log(`\x1b[33m[WARNING]\x1b[0m ${msg}`),
    error: (msg) => console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`)
};

const runSimulation = async () => {
    await connectDB();

    log.info('--- Starting E2E Workflow Simulation ---');

    // --- Scenario 1: Happy Path ---
    log.info('\n▶ Scenario 1: Happy Path (Request -> Approval -> Design -> Completed)');
    
    // 1. Create Request
    const dummyUserId = new mongoose.Types.ObjectId();
    const req1 = new MHRequest({
        mhRequestId: `SIM-${Date.now()}-1`,
        departmentName: 'Assembly',
        userName: 'Sim Employee',
        handlingPartName: 'Electric Motor V2',
        requestType: 'New Project',
        problemStatement: 'Need better handling for motor assembly',
        status: 'Active', // Active means waiting for approval
        activeStatus: true,
        volumePerDay: 500,
        from: 'Line A',
        to: 'Line B',
        location: 'Hosur Plant 1 (TN)',
        materialHandlingLocation: 'Zone A',
        productModel: 'Scooter X',
        user: dummyUserId,
        mailId: 'sim1@example.com',
        plantLocation: 'Hosur Plant 1 (TN)'
    });
    await req1.save();
    log.success(`Created MH Request: ${req1.mhRequestId}`);

    // 2. Approve Request
    req1.status = 'Accepted'; // Using accepted as per controller logic
    await req1.save();
    log.success(`Approver ACCEPTED request: ${req1.mhRequestId}`);

    // 3. Create Development Tracker automatically (simulating controller logic)
    const tracker1 = new MHDevelopmentTracker({
        departmentName: req1.departmentName,
        userName: req1.userName,
        assetRequestId: req1.mhRequestId,
        requestType: req1.requestType,
        productModel: req1.productModel,
        plantLocation: req1.plantLocation,
        status: 'Not Started',
        currentStage: 'Not Started',
    });
    await tracker1.save();
    log.success(`System automatically created Kanban Tracker for ${tracker1.assetRequestId}`);

    // 4. Move through Kanban Stages
    const stages = ['Design', 'PR/PO', 'Sample Production', 'Production Ready', 'Completed'];
    for (let i = 0; i < stages.length; i++) {
        tracker1.currentStage = stages[i];
        
        // Mock bottleneck: delay the Design phase by 12 days to trigger the "Bottleneck" warning on Dashboard
        if (stages[i] === 'Design') {
            tracker1.updatedAt = new Date(Date.now() - (12 * 24 * 60 * 60 * 1000)); 
            log.warn(`Simulating delay in Design phase (12 days) to trigger Bottleneck UI...`);
        } else {
            tracker1.updatedAt = new Date();
        }
        
        await tracker1.save();
        log.info(`PED Engineer moved tracker to stage: \x1b[1m${stages[i]}\x1b[0m`);
    }


    // --- Scenario 2: Upfront Rejection ---
    log.info('\n▶ Scenario 2: Upfront Rejection');
    const req2 = new MHRequest({
        mhRequestId: `SIM-${Date.now()}-2`,
        departmentName: 'Machining',
        userName: 'Sim Employee 2',
        handlingPartName: 'Engine Block',
        status: 'Active',
        location: 'Mysore (KA)',
        materialHandlingLocation: 'Zone B',
        productModel: 'Motorcycle Y',
        requestType: 'Modification',
        user: dummyUserId,
        mailId: 'sim2@example.com',
        plantLocation: 'Mysore (KA)',
        volumePerDay: 300,
        from: 'Storage',
        to: 'CNC Machine',
        problemStatement: 'Engine blocks are too heavy to lift manually'
    });
    await req2.save();
    log.success(`Created MH Request: ${req2.mhRequestId}`);

    req2.status = 'Rejected';
    req2.rejectionReason = 'Out of budget for Q3';
    await req2.save();
    log.success(`Approver REJECTED request: ${req2.mhRequestId}. Reason: ${req2.rejectionReason}`);
    

    // --- Scenario 3: Design Iteration (Reject then Approve) ---
    log.info('\n▶ Scenario 3: Design Iteration (Design Rejected -> Resubmitted)');
    const req3 = new MHRequest({
        mhRequestId: `SIM-${Date.now()}-3`,
        departmentName: 'Testing',
        userName: 'Sim Employee 3',
        handlingPartName: 'Test Rig Wiring',
        status: 'Accepted',
        location: 'Hosur Plant 1 (TN)',
        materialHandlingLocation: 'Testing Bay',
        productModel: 'Moped Z',
        requestType: 'Capacity',
        user: dummyUserId,
        mailId: 'sim3@example.com',
        plantLocation: 'Hosur Plant 1 (TN)',
        volumePerDay: 100,
        from: 'Line C',
        to: 'Testing Rig',
        problemStatement: 'Testing rig requires new harness'
    });
    await req3.save();
    log.success(`Created & Accepted MH Request: ${req3.mhRequestId}`);

    const tracker3 = new MHDevelopmentTracker({
        departmentName: req3.departmentName,
        userName: req3.userName,
        assetRequestId: req3.mhRequestId,
        currentStage: 'Design',
        requestType: req3.requestType,
        productModel: req3.productModel,
        plantLocation: req3.plantLocation
    });
    await tracker3.save();
    log.info(`Tracker created and moved to Design: ${tracker3.assetRequestId}`);

    // Design rejection
    log.warn(`Approver REJECTED the Design (missing safety checks)`);
    // Engineer resubmits
    log.info(`PED Engineer updated design and resubmitted.`);
    tracker3.currentStage = 'PR/PO';
    await tracker3.save();
    log.success(`Approver ACCEPTED the new Design. Tracker moved to PR/PO.`);

    
    log.info('\n✅ Simulation Complete! The dashboard now contains these realistic test cases.');
    process.exit(0);
};

runSimulation();
