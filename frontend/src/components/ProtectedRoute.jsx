import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, permission }) => {
    const { user, isAuthenticated, loading, hasPermission } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tvs-blue"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (permission && !hasPermission(permission)) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
                <p className="text-gray-500 mb-6">You do not have permission to view this page.</p>
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg border border-red-200">
                    Required Permission: <span className="font-mono font-bold">{permission}</span>
                </div>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;
