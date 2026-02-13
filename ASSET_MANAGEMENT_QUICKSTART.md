# Asset Management Update Module - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
✅ All dependencies are already installed
✅ MongoDB connection configured
✅ Backend server running
✅ Frontend development server running

### 1. Start Backend Server

```bash
cd backend
npm run dev
```

The server should start on port 5000 (or your configured PORT).

### 2. Start Frontend Server

```bash
cd frontend
npm run dev
```

The Vite dev server will start (typically on http://localhost:5173).

### 3. Access the Module

1. **Login** to the application
2. Look in the **sidebar** for "Asset Management Update" (appears above "Asset Summary")
3. Click to navigate to `/asset-management-update`

## 📋 How to Use

### Creating a New Asset

1. Click the **"Add Asset"** button (top right)
2. Modal opens with a form:
   - **Select Vendor**: Choose from dropdown (auto-fills Vendor Name & Plant Location)
   - **Department**: Pre-filled from your logged-in user profile
   - **Plant Location**: Auto-filled from selected vendor (read-only)
   - **Asset Location**: Enter manually
   - **Asset Name**: Enter manually
   - **Sign-off Document** (Optional): Upload PDF or Word file
   - **Drawing** (Optional): Upload PNG, JPG, JPEG, WEBP, PDF, or Word file
3. Click **"Create Asset"**
4. Asset ID is auto-generated (e.g., AID001, AID002...)
5. Grid refreshes automatically

### Editing an Asset

1. Click the **Edit** button (pencil icon) in the Actions column
2. Modal opens with pre-filled data
3. Modify any fields as needed
4. Upload new files to replace existing ones (optional)
5. Click **"Update Asset"**
6. Grid refreshes automatically

### Deleting Files

1. In the **Sign-off Doc** or **Drawing** column, click the **trash icon** next to the file
2. Confirm deletion
3. File is removed but the asset record remains
4. Grid refreshes automatically

### Deleting an Asset

1. Click the **Delete** button (trash icon) in the Actions column
2. Confirm deletion
3. Asset and all associated files are permanently deleted
4. Grid refreshes automatically

### Downloading Files

1. In the **Sign-off Doc** or **Drawing** column, click the **download icon**
2. File opens in a new browser tab

### Searching

1. Use the search box above the grid
2. Search works across:
   - Asset ID
   - Asset Name
   - Vendor Name
   - Department Name
   - Plant Location
   - Asset Location
3. Results filter in real-time

## 🎨 AG Grid Features

- ✅ **Pagination**: 20 items per page (customizable: 10, 20, 50, 100)
- ✅ **Sorting**: Click column headers to sort
- ✅ **Filtering**: Built-in column filters
- ✅ **Resizable columns**: Drag column edges
- ✅ **Hover effects**: Row highlighting on hover
- ✅ **Responsive**: Adjusts to screen size

## 🔒 Permissions

This module requires the **`assetSummary`** permission.

Users without this permission will not see:
- The sidebar menu item
- The route (redirected if accessed directly)

Admins have access to all features by default.

## 📁 File Upload Limits

- **Sign-off Document**: PDF, DOC, DOCX
- **Drawing**: PNG, JPG, JPEG, WEBP, PDF, DOC, DOCX
- **Max file size**: 10MB per file
- **Storage location**: `backend/uploads/AssetManagement/`

## 🧪 Testing the Integration

### Test Vendor Integration:
1. Go to **Vendor Master → Vendor Scoring**
2. Ensure at least one vendor exists
3. Note the vendor code, name, and location
4. Return to **Asset Management Update**
5. Create an asset using that vendor
6. Verify vendor name and plant location auto-populate

### Test Department Integration:
1. Go to **Employee Master**
2. Ensure your logged-in user has a department
3. Return to **Asset Management Update**
4. Create an asset
5. Verify department is pre-filled

### Test Asset ID Auto-generation:
1. Create multiple assets back-to-back
2. Verify Asset IDs increment: AID001, AID002, AID003...
3. Delete an asset (e.g., AID002)
4. Create a new asset
5. Verify it continues from the highest existing ID (not reusing deleted IDs)

## 🐛 Troubleshooting

### Asset ID not generating:
- Check MongoDB connection
- Verify AssetManagement model is imported in server
- Check backend console for errors

### Files not uploading:
- Verify `uploads/AssetManagement/` directory exists
- Check file format matches allowed types
- Ensure file size is under 10MB
- Check backend console for multer errors

### Vendor dropdown empty:
- Ensure vendors exist in VendorScoring collection
- Check `/api/asset-management/vendors/list` endpoint
- Verify VendorScoring model is correct

### Department dropdown empty:
- Ensure employees exist in Employee Master
- Check `/api/asset-management/departments/list` endpoint
- Verify EmployeeModel has departmentName field

### Permission denied:
- Verify user has `assetSummary` permission
- Check AuthContext hasPermission logic
- Admins should have automatic access

## 📊 Database Schema

The AssetManagement collection in MongoDB has this structure:

```json
{
  "_id": "ObjectId",
  "assetId": "AID001",
  "vendorCode": "V001",
  "vendorName": "ABC Vendor Ltd",
  "departmentName": "Production",
  "plantLocation": "Chennai",
  "assetLocation": "Assembly Line 3",
  "assetName": "Robotic Arm X200",
  "signOffDocument": {
    "filename": "signOffDocument-1707734567890-123456789.pdf",
    "path": "uploads/AssetManagement/signOffDocument-1707734567890-123456789.pdf",
    "uploadDate": "2024-02-12T10:22:47.890Z"
  },
  "drawing": {
    "filename": "drawing-1707734567891-987654321.png",
    "path": "uploads/AssetManagement/drawing-1707734567891-987654321.png",
    "uploadDate": "2024-02-12T10:22:47.891Z"
  },
  "createdBy": "ObjectId(user)",
  "updatedBy": "ObjectId(user)",
  "createdAt": "2024-02-12T10:22:47.890Z",
  "updatedAt": "2024-02-12T10:22:47.890Z"
}
```

## 🔄 Data Flow Diagram

```
User Action → Frontend (React) → API Call (Axios) → Backend Route → Controller → Model → MongoDB
                ↓                                                                              ↓
            AG Grid ← JSON Response ← Express JSON ← Business Logic ← Mongoose ← Database
```

## 📞 Support

If you encounter issues:
1. Check browser console for frontend errors
2. Check backend terminal for server errors
3. Verify MongoDB is running and connected
4. Check network tab for API call failures
5. Review the implementation documentation: `ASSET_MANAGEMENT_IMPLEMENTATION.md`

## ✅ Success Indicators

Your implementation is working correctly if:
- ✅ Sidebar shows "Asset Management Update" menu item
- ✅ Clicking it navigates to the page without errors
- ✅ AG Grid loads with proper styling
- ✅ Vendor dropdown populates from database
- ✅ Department dropdown populates from database
- ✅ Creating an asset generates Asset ID automatically
- ✅ Files upload successfully
- ✅ Edit modal pre-fills with existing data
- ✅ Files can be downloaded and deleted
- ✅ Assets can be updated and deleted
- ✅ Search filters results in real-time
- ✅ Data persists after page refresh

## 🎉 You're All Set!

The Asset Management Update module is now fully functional and integrated into your application.
