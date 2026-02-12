import React from 'react';
import { Home, Settings, FileText, Bell, ClipboardList, Activity, Users, Shield, BarChart, ChevronRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import tvsLogo from '../assets/tvslogo.jpg';

const Sidebar = () => {
    const { hasPermission, loading } = useAuth();

    const navItems = [
        { name: 'Dashboard', icon: Home, path: '/', permission: 'dashboard' },
        { name: 'Employee Master', icon: Users, path: '/employee-master', permission: 'employeeMaster' },
        { name: 'MH Requests', icon: FileText, path: '/mh-requests', permission: 'assetRequest' },
        { name: 'Request Tracker', icon: ClipboardList, path: '/request-tracker', permission: 'requestTracker' },
        {
            name: 'Vendor Master',
            icon: Shield,
            path: '#', // Header just toggles or acts as group
            permission: 'vendorMaster',
            isHeader: true
        },
        { name: 'Vendor Scoring', icon: ChevronRight, path: '/vendor-master/scoring', permission: 'vendorMaster', isSubItem: true },
        { name: 'Loading Chart', icon: ChevronRight, path: '/vendor-master/loading', permission: 'vendorMaster', isSubItem: true },
        { name: 'Asset Progress', icon: Activity, path: '/asset-progress', permission: 'assetSummary' },
        { name: 'Asset Management Update', icon: ClipboardList, path: '/asset-management-update', permission: 'assetSummary' },
        { name: 'Asset Summary', icon: ClipboardList, path: '/asset-summary', permission: 'assetSummary' },

        { name: 'Settings', icon: Settings, path: '/settings', permission: 'settings' }
    ];

    if (loading) return null;

    return (
        <aside className="w-sidebar h-screen fixed left-0 top-0 bg-white border-r border-gray-100/50 z-sidebar flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300">
            {/* Logo Section */}
            <div className="h-header flex items-center px-6 border-b border-gray-50 bg-white/50 backdrop-blur-md overflow-hidden">
                <div className="flex items-center gap-3 group cursor-pointer w-full">
                    <motion.div
                        className="relative flex items-center justify-center"
                        whileHover={{
                            scale: 1.1,
                            rotate: [0, -5, 5, 0],
                            transition: { duration: 0.5 }
                        }}
                        animate={{
                            y: [0, -2, 0],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <motion.div
                            className="absolute inset-0 bg-tvs-blue/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                        />
                        <img
                            src={tvsLogo}
                            alt="TVS Logo"
                            className="h-10 w-auto object-contain drop-shadow-md relative z-10"
                        />
                    </motion.div>
                </div>
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 overflow-y-auto py-8 custom-scrollbar">
                <div className="px-4 mb-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px] px-4">Main Menu</span>
                </div>
                <ul className="space-y-1.5 px-3 list-none">
                    {navItems.map((item, index) => {
                        if (item.permission && !hasPermission(item.permission)) {
                            return null;
                        }

                        if (item.isHeader) {
                            return (
                                <li key={item.name} className="pt-4 pb-2 px-4 shadow-none">
                                    <div className="flex items-center gap-3 text-gray-400">
                                        <item.icon size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-[2px]">{item.name}</span>
                                    </div>
                                </li>
                            );
                        }

                        return (
                            <li key={item.name}>
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `group flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 font-semibold text-sm
                                         ${item.isSubItem ? 'ml-4 py-2.5' : ''}
                                         ${isActive && item.path !== '#'
                                            ? 'bg-tvs-blue/5 text-tvs-blue shadow-[0_4px_12px_rgba(30,58,138,0.05)]'
                                            : 'text-gray-500 hover:bg-gray-50 hover:text-tvs-blue'
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            <div className="flex items-center gap-3">
                                                {!item.isSubItem ? (
                                                    <div className={`p-2 rounded-xl transition-all duration-300 ${isActive ? 'bg-tvs-blue text-white' : 'bg-transparent group-hover:bg-tvs-blue/10'}`}>
                                                        <item.icon size={18} />
                                                    </div>
                                                ) : (
                                                    <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-tvs-blue' : 'bg-gray-300'}`}></div>
                                                )}
                                                <span className={`${item.isSubItem ? 'text-xs font-bold' : 'font-inter'}`}>{item.name}</span>
                                            </div>
                                            {isActive && item.path !== '#' && (
                                                <motion.div
                                                    layoutId="active-nav"
                                                    className="w-1.5 h-1.5 rounded-full bg-tvs-blue shadow-[0_0_8px_rgba(30,58,138,0.4)]"
                                                />
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* User Access Highlight */}
            <div className="p-6 border-t border-gray-50">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-4 border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                            <Shield size={16} className="text-tvs-blue" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-gray-700">System Secure</span>
                            <span className="text-[10px] text-gray-400 font-medium">Access Level: High</span>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;