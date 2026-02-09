import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CreateAssetRequestList from './pages/CreateAssetRequest/CreateAssetRequestList';
import CreateAssetRequestForm from './components/Forms/CreateAssetRequestForm';
import RequestTracker from './pages/RequestTracker';
import AssetProgressTracker from './pages/AssetProgressTracker';
import EmployeeMaster from './pages/EmployeeMaster/EmployeeMaster';
import EmployeeForm from './pages/EmployeeMaster/EmployeeForm';
import EmployeeView from './pages/EmployeeMaster/EmployeeView';
import VendorMaster from './pages/VendorMaster/VendorMaster';
import VendorForm from './pages/VendorMaster/VendorForm';
import VendorView from './pages/VendorMaster/VendorView';

import AssetSummary from './pages/AssetSummary';
import Settings from './pages/Settings';
import Login from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<Layout />}>
            <Route index element={
              <ProtectedRoute permission="dashboard">
                <Dashboard />
              </ProtectedRoute>
            } />

            {/* Create Asset Request Module */}
            <Route path="CreateAssetRequest">
              <Route index element={
                <ProtectedRoute permission="assetRequest">
                  <CreateAssetRequestList />
                </ProtectedRoute>
              } />
              <Route path="add" element={
                <ProtectedRoute permission="assetRequest">
                  <CreateAssetRequestForm />
                </ProtectedRoute>
              } />
              <Route path="edit/:id" element={
                <ProtectedRoute permission="assetRequest">
                  <CreateAssetRequestForm />
                </ProtectedRoute>
              } />
            </Route>

            {/* Request Tracker */}
            <Route path="request-tracker" element={
              <ProtectedRoute permission="requestTracker">
                <RequestTracker />
              </ProtectedRoute>
            } />

            <Route path="asset-progress" element={
              <ProtectedRoute permission="assetSummary">
                <AssetProgressTracker />
              </ProtectedRoute>
            } />



            <Route path="asset-summary" element={
              <ProtectedRoute permission="assetSummary">
                <AssetSummary />
              </ProtectedRoute>
            } />

            {/* Placeholder routes for other links in Sidebar */}
            <Route path="orders" element={
              <ProtectedRoute>
                <div className="p-8"><h1>Orders Page</h1></div>
              </ProtectedRoute>
            } />

            {/* Employee Master Module */}
            <Route path="employee-master">
              <Route index element={
                <ProtectedRoute permission="employeeMaster">
                  <EmployeeMaster />
                </ProtectedRoute>
              } />
              <Route path="add" element={
                <ProtectedRoute permission="employeeMaster">
                  <EmployeeForm mode="add" />
                </ProtectedRoute>
              } />
              <Route path="edit/:id" element={
                <ProtectedRoute permission="employeeMaster">
                  <EmployeeForm mode="edit" />
                </ProtectedRoute>
              } />
              <Route path="view/:id" element={
                <ProtectedRoute permission="employeeMaster">
                  <EmployeeView />
                </ProtectedRoute>
              } />
            </Route>

            <Route path="vendor-master">
              <Route index element={
                <ProtectedRoute permission="vendorMaster">
                  <VendorMaster />
                </ProtectedRoute>
              } />
              <Route path="add" element={
                <ProtectedRoute permission="vendorMaster">
                  <VendorForm mode="add" />
                </ProtectedRoute>
              } />
              <Route path="edit/:id" element={
                <ProtectedRoute permission="vendorMaster">
                  <VendorForm mode="edit" />
                </ProtectedRoute>
              } />
              <Route path="view/:id" element={
                <ProtectedRoute permission="vendorMaster">
                  <VendorView />
                </ProtectedRoute>
              } />
            </Route>

            <Route path="settings" element={
              <ProtectedRoute permission="settings">
                <Settings />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;