import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';

const ProtectedRoute = ({ children, permission }) => {
    const { isAuthenticated, loading, hasPermission } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-tvs-light">
                <div className="relative">
                    <div className="w-20 h-20 border-4 border-tvs-blue/10 border-t-tvs-blue rounded-full animate-spin"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <Fingerprint className="text-tvs-blue/40" size={32} />
                    </div>
                </div>
                <p className="mt-8 text-sm font-bold text-gray-400 uppercase tracking-[4px] animate-pulse">Authenticating...</p>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (permission && !hasPermission(permission)) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center h-[70vh] p-8 text-center"
            >
                <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-rose-100/50">
                    <ShieldAlert size={48} />
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-2 font-mono">Security Restriction</h1>
                <p className="text-gray-500 mb-10 max-w-md font-medium">Your account does not have the necessary clearance levels to access this protected resource.</p>
                
                <div className="glass-card px-8 py-4 rounded-2xl border border-rose-100 flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-none">
                        Required Permission: 
                        <span className="text-rose-600 ml-2 font-mono">{permission}</span>
                    </span>
                </div>
            </motion.div>
        );
    }

    return children;
};

export default ProtectedRoute;
