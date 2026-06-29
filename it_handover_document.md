# IT Handover Document: TVS PED Material Handling System

## 1. System Architecture & Tech Stack
- **Frontend Layer**: React.js, Vite, Tailwind CSS, Ant Design.
- **Backend Layer**: Node.js, Express.js REST API.
- **Data Layer**: MongoDB (accessed via Mongoose ODM).
- **Authentication**: JWT (JSON Web Tokens) with Bearer token strategies.
- **File Storage**: Local file system (via Multer) for design uploads and asset documents.
- **Notifications**: SMTP Email integration via Nodemailer.

## 2. Codebase Structure
The repository is split into two primary directories:
```text
client_tvs_ped/
├── backend/                  # Node.js / Express API
│   ├── config/               # Database and environment configurations
│   ├── controllers/          # Business logic (e.g., mhRequestController, dashboardController)
│   ├── middleware/           # Auth and Role-based access middlewares
│   ├── models/               # Mongoose schemas (MHRequest, Employee, RoleModel, etc.)
│   ├── routes/               # Express route definitions
│   ├── services/             # Helper services (e.g., emailService, leadTimeService)
│   └── server.js             # Main application entry point
└── frontend/                 # React UI
    ├── src/
    │   ├── api/              # Axios interceptors and API configuration
    │   ├── components/       # Reusable UI components
    │   ├── pages/            # Page-level components (Dashboard, EmployeeMaster, Settings, etc.)
    │   ├── store/            # Redux or Context state management (if applicable)
    │   └── App.jsx           # Frontend router setup
```

## 3. Database Schema Overview
Key MongoDB Collections:
- `users`: Authentication credentials and core user mapping.
- `employees`: Extensive employee details linking to users, including `departmentName` and mapped `roles`.
- `roles`: Dynamic registry of system and custom roles (created to replace hardcoded enums).
- `mhrequests`: Core tracking for the initial validation and design phases of material handling equipment.
- `mhdevelopmenttrackers`: Tracks the secondary phase (Vendor selection, PR/PO, bulk production, delivery milestones).
- `assetmanagements`: Final implemented assets inventory.

## 4. Environment Variables (`.env`)
The backend requires a `.env` file at `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/tvs_ped
JWT_SECRET=your_super_secret_jwt_key
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# SMTP Configuration for Emails
SMTP_HOST=smtp.your-company.com
SMTP_PORT=587
SMTP_USER=no-reply@your-company.com
SMTP_PASS=your_email_password
```

## 5. Deployment & Run Instructions

### 5.1. Local Development
**Backend**:
```bash
cd backend
npm install
npm run dev # Starts server on port 5000 using nodemon
```
**Frontend**:
```bash
cd frontend
npm install
npm run dev # Starts Vite server on port 5173
```

### 5.2. Production Build
**Frontend Compilation**:
```bash
cd frontend
npm run build
```
*The resulting `dist/` folder should be served statically (e.g., via Nginx, Apache, or Node static middleware).*

**Backend Execution**:
Use a process manager like PM2 to keep the backend alive:
```bash
cd backend
pm2 start server.js --name "tvs-ped-api"
```

## 6. Maintenance & Troubleshooting

### 6.1. Dynamic Role Migration
The system recently migrated from hardcoded `enum` roles to dynamic roles. If the database is completely reset, you must seed the default roles before creating employees:
```bash
cd backend
node seedRoles.js
```

### 6.2. Common Issues
- **Emails Not Sending**: Check the `SMTP_*` variables in the `.env` file. Ensure the backend server has network access to the SMTP host port.
- **Workflow State Stuck**: If a request does not advance after L1 Approval or Design upload, check the `progressStatus` and `status` fields in the `mhrequests` collection. Verify the assigned employee actually holds the specific System Role (`PED Engineer`, `Designer`, etc.) mapped in the `roles` collection.
- **File Upload Errors**: Ensure the `backend/uploads/` directory exists and the Node process has read/write permissions for that directory.

## 7. Escalation Matrix
- **L1 Support**: General UI bugs, user credential resets.
- **L2 Support**: Workflow routing issues, missing email triggers, role permission adjustments.
- **L3 Support (Development Team)**: Database schema migrations, new dashboard KPIs, integration with third-party ERPs.
