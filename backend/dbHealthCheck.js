/**
 * Database Health Check Script
 * Connects to MongoDB and reports document counts + sample data for every collection.
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Employee         = require('./models/EmployeeModel');
const User             = require('./models/UserModel');
const MHRequest        = require('./models/MHRequest');
const MHDevTracker     = require('./models/MHDevelopmentTracker');
const AssetManagement  = require('./models/AssetManagement');
const Vendor           = require('./models/Vendor');
const VendorLoading    = require('./models/VendorLoading');
const VendorScoring    = require('./models/VendorScoring');
const ProjectPlan      = require('./models/ProjectPlan');
const ReportSettings   = require('./models/ReportSettings');
const UserActivity     = require('./models/UserActivity');

const DIVIDER = '─'.repeat(60);

async function run() {
    const uri = process.env.ATLAS_URI || process.env.MONGO_URI;
    await mongoose.connect(uri);
    console.log(`\n✅  Connected to MongoDB\n${DIVIDER}`);

    const collections = [
        { label: 'Employees',              model: Employee,        sampleField: e => `${e.employeeId} | ${e.employeeName} | ${e.mailId} | ${e.role} | ${e.status}` },
        { label: 'Users (Login accounts)', model: User,            sampleField: u => `${u.email} | role: ${u.role} | status: ${u.status}` },
        { label: 'MH Requests',            model: MHRequest,       sampleField: r => `${r.mhRequestId} | ${r.userName} | ${r.status} | ${r.plantLocation}` },
        { label: 'MH Development Tracker', model: MHDevTracker,    sampleField: t => `${t.assetRequestId} | ${t.status} | stage: ${t.currentStage} | vendor: ${t.vendorName || '—'}` },
        { label: 'Asset Management',       model: AssetManagement, sampleField: a => `${a.assetId} | ${a.assetName} | dept: ${a.departmentName} | plant: ${a.plantLocation}` },
        { label: 'Vendors',                model: Vendor,          sampleField: v => `${v.vendorCode} | ${v.vendorName} | ${v.vendorLocation} | ${v.vendorMailId}` },
        { label: 'Vendor Loading',         model: VendorLoading,   sampleField: l => `${l.vendorCode} | total: ${l.totalProjects} | completed: ${l.completedProjects}` },
        { label: 'Vendor Scoring',         model: VendorScoring,   sampleField: s => `vendorId: ${s.vendorId} | QCD: ${s.qcdScore} | QSR: ${s.qsrScore}` },
        { label: 'Project Plans',          model: ProjectPlan,     sampleField: p => `trackerId: ${p.trackerId} | milestones: ${p.milestones?.length ?? 0}` },
        { label: 'Report Settings',        model: ReportSettings,  sampleField: r => `type: ${r.reportType} | recipients: ${r.recipients?.length ?? 0}` },
        { label: 'User Activity Logs',     model: UserActivity,    sampleField: a => `user: ${a.userId} | action: ${a.action}` },
    ];

    let totalDocs = 0;
    const issues = [];

    for (const { label, model, sampleField } of collections) {
        try {
            const count = await model.countDocuments();
            totalDocs += count;
            const samples = await model.find().sort({ createdAt: -1 }).limit(3).lean();

            const status = count === 0 ? '⚠️  EMPTY' : `✅  ${count} record(s)`;
            console.log(`\n📦  ${label.padEnd(28)} ${status}`);

            if (count === 0) {
                issues.push(label);
            } else {
                samples.forEach((s, i) => {
                    try {
                        console.log(`    ${i + 1}. ${sampleField(s)}`);
                    } catch {
                        console.log(`    ${i + 1}. [record]`);
                    }
                });
            }
        } catch (err) {
            console.log(`\n❌  ${label.padEnd(28)} ERROR: ${err.message}`);
            issues.push(`${label} (error)`);
        }
    }

    console.log(`\n${DIVIDER}`);
    console.log(`📊  TOTAL DOCUMENTS ACROSS ALL COLLECTIONS: ${totalDocs}`);

    if (issues.length === 0) {
        console.log('🎉  All collections have data. Database looks healthy!\n');
    } else {
        console.log(`\n⚠️  EMPTY / ERRORED COLLECTIONS (${issues.length}):`);
        issues.forEach(i => console.log(`    • ${i}`));
        console.log('');
    }

    await mongoose.disconnect();
    process.exit(0);
}

run().catch(err => {
    console.error('❌ DB Health Check failed:', err.message);
    process.exit(1);
});
