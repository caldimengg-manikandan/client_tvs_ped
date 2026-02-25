import React, { useState, useEffect } from 'react';
import {
    Home,
    Settings,
    FileText,
    ClipboardList,
    Activity,
    Users,
    Shield,
    BarChart,
    ChevronRight,
    TrendingUp,
    Menu,
    ChevronLeft,
    ChevronDown,
    Layout as LayoutIcon,
    PieChart
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import tvsLogo from '../assets/tvs bg.webp';

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen, windowWidth }) => {
    const { hasPermission } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Group state: only one group can be expanded at a time
    const [expandedGroup, setExpandedGroup] = useState(null);

    // Initial expansion based on current path
    useEffect(() => {
        const path = location.pathname;
        if (path.startsWith('/vendor-master')) {
            setExpandedGroup('vendorManagement');
        } else if (path.startsWith('/asset-')) {
            setExpandedGroup('assetManagement');
        } else if (path === '/project-plan-model' || path === '/mh-development-tracker') {
            setExpandedGroup('development');
        } else {
            // For simple links, we might want to collapse everything, 
            // but usually we keep the group open if we are on a page belonging to it.
            // If it doesn't match any group, collapse.
            // setExpandedGroup(null);
        }
    }, [location.pathname]);

    const navConfig = [
        {
            name: 'Dashboard',
            icon: Home,
            path: '/',
            permission: 'dashboard'
        },
        {
            name: 'Employee Master',
            icon: Users,
            path: '/employee-master',
            permission: 'employeeMaster'
        },
        {
            name: 'MH Requests',
            icon: FileText,
            path: '/mh-requests',
            permission: 'assetRequest'
        },
        {
            name: 'Request Tracker',
            icon: ClipboardList,
            path: '/request-tracker',
            permission: 'requestTracker'
        },
        {
            name: 'MH Dev Tracker',
            icon: TrendingUp,
            permission: 'mhDevelopmentTracker',
            groupKey: 'development',
            subItems: [
                { name: 'Live Tracker', icon: Activity, path: '/mh-development-tracker' },
                { name: 'Project Plan', icon: LayoutIcon, path: '/project-plan-model' }
            ]
        },
        {
            name: 'Vendor Management System',
            icon: Shield,
            permission: 'vendorMaster',
            groupKey: 'vendorManagement',
            subItems: [
                { name: 'Vendor Master', icon: Users, path: '/vendor-master' },
                { name: 'Vendor Scoring', icon: BarChart, path: '/vendor-master/scoring' },
                { name: 'Loading Chart', icon: PieChart, path: '/vendor-master/loading' }
            ]
        },
        {
            name: 'Asset Management',
            icon: ClipboardList,
            permission: 'assetSummary',
            groupKey: 'assetManagement',
            subItems: [
                { name: 'Asset Update', icon: Activity, path: '/asset-management-update' },
                { name: 'Asset Summary', icon: ClipboardList, path: '/asset-summary' }
            ]
        },
        {
            name: 'Settings',
            icon: Settings,
            path: '/settings',
            permission: 'settings'
        }
    ];

    const handleToggle = (groupKey) => {
        if (!isSidebarOpen) {
            setIsSidebarOpen(true);
            setExpandedGroup(groupKey);
            return;
        }
        setExpandedGroup(prev => (prev === groupKey ? null : groupKey));
    };

    const handleSimpleClick = () => {
        setExpandedGroup(null);
    };

    return (
        <>
            <AnimatePresence>
                {windowWidth <= 1024 && isSidebarOpen && (
                    <motion.div
                        key="sidebar-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 z-backdrop lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            <motion.aside
                className={`h-screen fixed left-0 top-0 bg-white border-r border-gray-100 flex flex-col shadow-xl transition-all duration-300 z-sidebar ${
                    isSidebarOpen ? 'w-[280px]' : 'w-[80px]'
                }`}
            >
                {/* Logo Section */}
                <div className="flex items-center justify-between px-4 py-6 border-b border-gray-50">
                    <div className="flex flex-col items-center gap-1 flex-1 overflow-hidden">
                        <img src={tvsLogo} alt="TVS logo" className={`h-16 w-auto object-contain transition-all duration-300 ${isSidebarOpen ? 'scale-100' : 'scale-75'}`} />
                        {isSidebarOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center"
                            >
                                <span className="text-xs font-black tracking-[0.2em] uppercase text-tvs-blue">TVS Motors</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Plant Engineering</span>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Navigation Section */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden py-6 custom-scrollbar px-3 space-y-1">
                    {navConfig.map((item) => {
                        if (item.permission && !hasPermission(item.permission)) return null;

                        const isGroup = !!item.subItems;
                        const isExpanded = expandedGroup === item.groupKey && isSidebarOpen;

                        if (isGroup) {
                            return (
                                <div key={item.groupKey} className="mb-1">
                                    <button
                                        onClick={() => handleToggle(item.groupKey)}
                                        className={`w-full flex items-center justify-between px-3 py-3 rounded-xl transition-all duration-200 group ${
                                            isExpanded ? 'bg-tvs-blue/5 text-tvs-blue' : 'text-gray-500 hover:bg-gray-50 hover:text-tvs-blue'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg transition-colors ${isExpanded ? 'bg-tvs-blue text-white' : 'bg-gray-50 group-hover:bg-tvs-blue/10'}`}>
                                                <item.icon size={20} />
                                            </div>
                                            {isSidebarOpen && <span className="text-sm font-bold whitespace-nowrap">{item.name}</span>}
                                        </div>
                                        {isSidebarOpen && (
                                            <ChevronDown size={16} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <ul className="mt-1 ml-4 border-l-2 border-gray-100 space-y-1 py-1">
                                                    {item.subItems.map((sub) => (
                                                        <li key={sub.path}>
                                                            <NavLink
                                                                to={sub.path}
                                                                className={({ isActive }) =>
                                                                    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all relative ${
                                                                        isActive
                                                                            ? 'text-tvs-blue bg-tvs-blue/5 ml-2'
                                                                            : 'text-gray-500 hover:text-tvs-blue hover:bg-gray-50 ml-2'
                                                                    }`
                                                                }
                                                            >
                                                                {({ isActive }) => (
                                                                    <>
                                                                        <sub.icon size={14} className={isActive ? 'text-tvs-blue' : 'text-gray-400'} />
                                                                        <span>{sub.name}</span>
                                                                        {isActive && (
                                                                            <motion.div 
                                                                                layoutId="activeSub"
                                                                                className="absolute left-[-10px] w-1.5 h-1.5 rounded-full bg-tvs-blue"
                                                                            />
                                                                        )}
                                                                    </>
                                                                )}
                                                            </NavLink>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        }

                        // Simple NavLink
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={handleSimpleClick}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
                                        isActive ? 'bg-tvs-blue text-white shadow-md shadow-tvs-blue/20' : 'text-gray-500 hover:bg-gray-50 hover:text-tvs-blue'
                                    }`
                                }
                            >
                                <div className={`p-2 rounded-lg transition-colors ${isSidebarOpen ? '' : 'mx-auto'}`}>
                                    <item.icon size={20} />
                                </div>
                                {isSidebarOpen && <span className="text-sm font-bold whitespace-nowrap">{item.name}</span>}
                                {!isSidebarOpen && (
                                    <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-bold">
                                        {item.name}
                                    </div>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Footer / Toggle Section */}
                <div className="p-4 border-t border-gray-50">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="w-full flex items-center justify-center p-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
                    >
                        {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                    </button>
                    {isSidebarOpen && (
                        <div className="mt-4 flex items-center gap-3 px-2">
                            <div className="w-8 h-8 rounded-full bg-tvs-blue flex items-center justify-center text-white font-black text-[10px]">
                                AD
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-gray-800">Admin Panel</span>
                                <span className="text-[10px] font-bold text-gray-400">Enterprise Mode</span>
                            </div>
                        </div>
                    )}
                </div>
            </motion.aside>
        </>
    );
};

export default Sidebar;
