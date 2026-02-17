import React from 'react';
import { Home, Settings, FileText, ClipboardList, Activity, Users, Shield, BarChart, ChevronRight, TrendingUp, Menu, ChevronLeft } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import tvsLogo from '../assets/tvslogo.jpg';

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen, windowWidth }) => {
    const { hasPermission, loading } = useAuth();

    const navItems = [
        { name: 'Dashboard', icon: Home, path: '/', permission: 'dashboard' },
        { name: 'Employee Master', icon: Users, path: '/employee-master', permission: 'employeeMaster' },
        { name: 'MH Requests', icon: FileText, path: '/mh-requests', permission: 'assetRequest' },
        { name: 'Request Tracker', icon: ClipboardList, path: '/request-tracker', permission: 'requestTracker' },
        { name: 'MH Dev Tracker', icon: TrendingUp, path: '/mh-development-tracker', permission: 'mhDevelopmentTracker' },
        { name: 'Project Plan Model', icon: ClipboardList, path: '/project-plan-model', permission: 'mhDevelopmentTracker', isSubItem: true },
        // {
        //     name: 'Vendor Master',
        //     icon: Shield,
        //     path: '#', // Header just toggles or acts as group
        //     permission: 'vendorMaster',
        //     isHeader: true
        // },
        { name: 'Vendor Master', icon: Shield, path: '/vendor-master', permission: 'vendorMaster' },
        { name: 'Vendor Scoring', icon: Shield, path: '/vendor-master/scoring', permission: 'vendorMaster' },
        { name: 'Loading Chart', icon: ClipboardList, path: '/vendor-master/loading', permission: 'vendorMaster' },
        { name: 'Asset Progress', icon: Activity, path: '/asset-progress', permission: 'assetSummary' },
        { name: 'Asset Management Update', icon: ClipboardList, path: '/asset-management-update', permission: 'assetSummary' },
        { name: 'Asset Summary', icon: ClipboardList, path: '/asset-summary', permission: 'assetSummary' },
        { name: 'Settings', icon: Settings, path: '/settings', permission: 'settings' }
    ];

    if (loading) return null;

    return (
        <>
            {/* Mobile Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[950] lg:hidden"
                    />
                )}
            </AnimatePresence>

            <motion.aside
                initial={false}
                animate={{
                    width: isSidebarOpen ? 280 : 72,
                    x: (isSidebarOpen || (windowWidth && windowWidth > 1024)) ? 0 : -280
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className={`h-screen fixed left-0 top-0 bg-white border-r border-gray-100/50 z-sidebar flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-colors duration-300`}
            >
                {/* Logo Section */}
                <div className={`h-header flex items-center ${isSidebarOpen ? 'px-6' : 'px-0 justify-center'} border-b border-gray-50 bg-white/50 backdrop-blur-md overflow-hidden transition-all duration-300`}>
                    <div className={`flex items-center gap-3 group cursor-pointer ${isSidebarOpen ? 'w-full' : ''}`}>
                        <AnimatePresence mode="wait">
                            {isSidebarOpen ? (
                                <motion.div
                                    key="full-logo"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="flex items-center justify-between w-full"
                                >
                                    <div className="flex items-center gap-3">
                                        <motion.div
                                            whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                                            animate={{ y: [0, -2, 0] }}
                                            transition={{ y: { duration: 4, repeat: Infinity, ease: "easeInOut" } }}
                                            className="relative"
                                        >
                                            <img src={tvsLogo} alt="TVS Logo" className="h-12 w-full object-cover drop-shadow-sm" />
                                        </motion.div>
                                    </div>
                                    <button
                                        onClick={() => setIsSidebarOpen(false)}
                                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-tvs-blue transition-colors"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.button
                                    key="collapsed-menu"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    onClick={() => setIsSidebarOpen(true)}
                                    className="p-2 hover:bg-gray-100 rounded-xl text-tvs-blue transition-colors"
                                >
                                    <Menu size={24} />
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Navigation Section */}
                <nav className="flex-1 overflow-y-auto py-8 custom-scrollbar">
                    {isSidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-8 mb-4"
                        >
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">Main Menu</span>
                        </motion.div>
                    )}
                    <ul className={`space-y-1 list-none ${isSidebarOpen ? 'px-3' : 'px-2'}`}>
                        {navItems.map((item, index) => {
                            if (item.permission && !hasPermission(item.permission)) {
                                return null;
                            }

                            // Completely hide headers and sub-items when collapsed
                            if (!isSidebarOpen && (item.isHeader || item.isSubItem)) return null;

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
                                <motion.li
                                    key={item.name}
                                    initial={item.isSubItem && isSidebarOpen ? { opacity: 0, x: -10 } : false}
                                    animate={item.isSubItem && isSidebarOpen ? { opacity: 1, x: 0 } : false}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                >
                                    <NavLink
                                        to={item.path}
                                        end
                                        className={({ isActive }) =>
                                            `group flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'} px-4 py-3.5 rounded-2xl transition-all duration-300 font-semibold text-sm transform relative
                                         ${isSidebarOpen && item.isSubItem ? 'ml-6 py-2.5' : ''}
                                         ${isActive && item.path !== '#' ? 'scale-[1.03] bg-tvs-blue/5 text-tvs-blue' : 'hover:scale-[1.01] text-gray-500 hover:bg-gray-50 hover:text-tvs-blue'}`
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <div className="flex items-center gap-3">
                                                    {!item.isSubItem ? (
                                                        <div className={`p-2 rounded-xl transition-all duration-300 flex items-center justify-center ${isActive ? 'bg-tvs-blue text-white scale-100' : 'bg-transparent group-hover:bg-tvs-blue/10 group-hover:scale-110'}`}>
                                                            <item.icon size={18} />
                                                        </div>
                                                    ) : (
                                                        <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-tvs-blue scale-125' : 'bg-gray-300'}`}></div>
                                                    )}
                                                    {isSidebarOpen && (
                                                        <span className={`${item.isSubItem ? 'text-xs font-bold' : 'font-inter'}`}>{item.name}</span>
                                                    )}
                                                </div>

                                                {isSidebarOpen && isActive && item.path !== '#' && (
                                                    <motion.div
                                                        layoutId="active-nav"
                                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                                        className="w-1.5 h-1.5 rounded-full bg-tvs-blue shadow-[0_0_8px_rgba(30,58,138,0.4)]"
                                                    />
                                                )}

                                                {!isSidebarOpen && isActive && (
                                                    <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1 h-6 bg-tvs-blue rounded-l-full shadow-[0_0_8px_rgba(30,58,138,0.3)]" />
                                                )}
                                            </>
                                        )}
                                    </NavLink>
                                </motion.li>
                            );
                        })}
                    </ul>
                </nav>

                {/* User Access Highlight */}
                <div className="p-4 border-t border-gray-50">
                    <div className={`bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border border-gray-100 transition-all duration-300 ${isSidebarOpen ? 'p-4' : 'p-2 flex justify-center'}`}>
                        {isSidebarOpen ? (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                    <Shield size={16} className="text-tvs-blue" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-700">System Secure</span>
                                    <span className="text-[10px] text-gray-400 font-medium">Access Level: High</span>
                                </div>
                            </div>
                        ) : (
                            <Shield size={20} className="text-tvs-blue opacity-50" />
                        )}
                    </div>
                </div>
            </motion.aside>
        </>
    );
};

export default Sidebar;
