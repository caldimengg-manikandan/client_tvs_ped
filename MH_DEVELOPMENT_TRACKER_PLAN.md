# MH Development Tracker - Implementation Plan

## 📋 **Module Overview**

A comprehensive tracker to monitor MH requests from initiation to implementation, including vendor selection, project planning, progress tracking, and milestone updates.

---

## 🎯 **Implementation Steps**

### **Phase 1: Backend Setup**
1. ✅ Create MongoDB Schema
2. ✅ Create Controller with CRUD operations
3. ✅ Create API Routes
4. ✅ Add file upload handling for drawings
5. ✅ Integrate with Vendor Scoring API

### **Phase 2: Frontend Setup**
1. ✅ Create Redux slice
2. ✅ Create main tracker page component
3. ✅ Implement AG Grid with custom columns
4. ✅ Add vendor selection popup
5. ✅ Add project plan modal
6. ✅ Add file upload functionality
7. ✅ Add status indicators

### **Phase 3: Integration**
1. ✅ Add route to App.js
2. ✅ Add menu item to Sidebar
3. ✅ Test all workflows
4. ✅ Verify data persistence

---

## 📊 **Database Schema**

```javascript
{
  // Request Info
  departmentName: String,
  userName: String,
  assetRequestId: String (ref to MH Request),
  requestType: String,
  productModel: String,
  plantLocation: String,
  
  // Vendor Selection
  vendorCode: String,
  vendorName: String,
  vendorLocation: String,
  vendorId: ObjectId (ref to Vendor),
  
  // Project Planning
  projectPlan: {
    milestones: Array,
    timelines: Array,
    details: String
  },
  
  // Implementation
  implementationTarget: Date,
  status: Enum ['On Track', 'Likely Delay', 'Delayed'],
  implementationVisibility: Number (0-100),
  currentStage: Enum ['Design', 'PR/PO', 'Sample Production', 'Production Ready', 'Completed'],
  
  // Documentation
  remarks: String,
  drawingUrl: String,
  drawingFileName: String,
  
  // Metadata
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎨 **UI Components**

### **1. Main Tracker Grid**
- AG Grid with custom styling
- 14 columns as specified
- Color-coded status indicators
- Action buttons for vendor selection, project plan, file upload

### **2. Vendor Selection Popup**
- Modal with AG Grid
- Fetches data from Vendor Scoring
- Single selection with tick button
- Auto-populate selected vendor details

### **3. Project Plan Modal**
- Form for milestones and timelines
- Save/Cancel actions
- Updates tracker row

### **4. File Upload**
- Drag & drop or click to upload
- PDF/JPG/PNG support
- View/Download options

---

## 🔌 **API Endpoints**

```
GET    /api/mh-development-tracker          - Get all tracker records
GET    /api/mh-development-tracker/:id      - Get single record
POST   /api/mh-development-tracker          - Create new record
PUT    /api/mh-development-tracker/:id      - Update record
DELETE /api/mh-development-tracker/:id      - Delete record
POST   /api/mh-development-tracker/:id/upload-drawing - Upload drawing
GET    /api/mh-development-tracker/vendors  - Get vendors for selection
```

---

## 📁 **File Structure**

```
backend/
├── models/
│   └── MHDevelopmentTracker.js
├── controllers/
│   └── mhDevelopmentTrackerController.js
└── routes/
    └── mhDevelopmentTrackerRoutes.js

frontend/
├── redux/slices/
│   └── mhDevelopmentTrackerSlice.js
├── pages/
│   └── MHDevelopmentTracker/
│       ├── MHDevelopmentTracker.jsx
│       ├── VendorSelectionPopup.jsx
│       └── ProjectPlanModal.jsx
└── components/
    └── FileUpload.jsx (if needed)
```

---

## ✅ **Implementation Checklist**

- [ ] Backend Model
- [ ] Backend Controller
- [ ] Backend Routes
- [ ] Redux Slice
- [ ] Main Tracker Page
- [ ] Vendor Selection Popup
- [ ] Project Plan Modal
- [ ] File Upload
- [ ] Sidebar Integration
- [ ] Route Configuration
- [ ] Testing

---

**Let's build this module!** 🚀
