require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;
const employeeRoutes = require('./routes/employeeRoutes');
const { initializeScheduler } = require('./jobs/reportScheduler');

// Connect Database
connectDB();

// Initialize Report Scheduler
initializeScheduler();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/vendor-scoring', require('./routes/vendorScoringRoutes'));
app.use('/api/vendor-loading', require('./routes/vendorLoadingRoutes'));
app.use('/api/vendors', require('./routes/vendorRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/email', require('./routes/emailRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/asset-request', require('./routes/assetRequestRoutes'));
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', require('./routes/departmentRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/user-activity', require('./routes/userActivityRoutes'));
app.use('/api/report-settings', require('./routes/reportSettingsRoutes'));

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error Middleware
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
app.use(notFound);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});