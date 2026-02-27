import React, { useMemo } from 'react';
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
    const { pathname } = useLocation();
    const navigate = useNavigate();

    // Group configuration
    const navConfig = useMemo(() => [
        {
            name: 'Dashboard',
            icon: Home,
            path: '/dashboard',
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
    ], []);

    /**
     * Helper to determine if a specific path is active.
     * Uses strict matching for dashboard and prefix matching for modules (to handle sub-pages like /add).
     */
    const isLinkActive = (path) => {
        if (path === '/dashboard') return pathname === '/dashboard';
        return pathname === path || (path !== '/' && pathname.startsWith(path + '/'));
    };

    /**
     * Helper to check if a group is active (any of its sub-items match the current route)
     */
    const isParentActive = (item) => {
        if (!item.subItems) return isLinkActive(item.path);
        return item.subItems.some(sub => isLinkActive(sub.path));
    };

    /**
     * Handle clicking a Parent Module:
     * Navigates to the first child route automatically to ensure highlight moves.
     */
    const handleParentClick = (item) => {
        if (!isSidebarOpen) {
            setIsSidebarOpen(true);
        }
        
        if (item.subItems && item.subItems.length > 0) {
            navigate(item.subItems[0].path);
        }
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
                className={`h-screen fixed left-0 top-0 bg-white border-r border-gray-100 flex flex-col shadow-2xl transition-all duration-300 z-sidebar ${
                    isSidebarOpen ? 'w-[300px]' : 'w-[84px]'
                }`}
            >
                {/* Logo Section */}
                <div className="flex items-center justify-between pt-8 pb-4 border-b border-gray-50 px-6 bg-gradient-to-b from-gray-50/50 to-white relative group/header">
                    <div 
                        className="flex items-center gap-3 cursor-pointer group/logo flex-1 overflow-hidden" 
                        onClick={() => navigate('/dashboard')}
                    >
                        <div className="relative shrink-0">
                            <img 
                                src={tvsLogo} 
                                alt="TVS logo" 
                                className={`h-12 w-auto object-contain transition-all duration-500 ${isSidebarOpen ? 'scale-110' : 'scale-100'}`} 
                            />
                            <div className="absolute -inset-2 bg-tvs-blue/5 rounded-full blur-xl opacity-0 group-hover/logo:opacity-100 transition-opacity" />
                        </div>
                        
                        {isSidebarOpen && (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex flex-col min-w-0"
                            >
                                <span className="text-[13px] font-black tracking-tight text-tvs-blue leading-tight truncate">TVS MOTORS</span>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5 truncate">Plant Engineering</span>
                            </motion.div>
                        )}
                    </div>

                    {/* Toggle Button next to logo */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsSidebarOpen(!isSidebarOpen);
                        }}
                        className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 hover:bg-tvs-blue hover:text-white text-gray-400 transition-all duration-300 border border-gray-100 hover:border-tvs-blue shadow-sm ${!isSidebarOpen ? 'absolute -right-3 top-1/2 -translate-y-1/2 rounded-full border shadow-md' : 'ml-2'}`}
                    >
                        {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                    </button>
                </div>

                {/* Navigation Section */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden pt-4 pb-8 custom-scrollbar px-4 space-y-2">
                    {navConfig.map((item) => {
                        if (item.permission && !hasPermission(item.permission)) return null;

                        const isGroup = !!item.subItems;
                        const active = isParentActive(item);
                        const isExpanded = isGroup && active && isSidebarOpen;

                        if (isGroup) {
                            return (
                                <div key={item.groupKey} className="group/parent">
                                    <button
                                        onClick={() => handleParentClick(item)}
                                        className={`w-full flex items-center justify-between px-3 py-3.5 rounded-xl transition-all duration-300 relative overflow-hidden ${
                                            active 
                                                ? 'bg-tvs-blue text-white shadow-lg shadow-tvs-blue/25' 
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-tvs-blue'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3.5 relative z-10">
                                            <div className={`p-2 rounded-lg transition-all duration-300 ${
                                                active ? 'bg-white/15 text-white' : 'bg-gray-100 group-hover/parent:bg-tvs-blue/10'
                                            }`}>
                                                <item.icon size={19} />
                                            </div>
                                            {isSidebarOpen && (
                                                <span className="text-[13px] font-bold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis">
                                                    {item.name}
                                                </span>
                                            )}
                                        </div>
                                        {isSidebarOpen && (
                                            <ChevronDown 
                                                size={15} 
                                                className={`transition-transform duration-500 relative z-10 ${active ? 'text-white' : 'text-gray-400'} ${isExpanded ? 'rotate-180' : ''}`} 
                                            />
                                        )}
                                        {active && (
                                            <motion.div 
                                                layoutId={`activeBg-${item.groupKey}`}
                                                className="absolute inset-0 bg-gradient-to-r from-tvs-blue to-tvs-blue/90 z-0"
                                            />
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                                                className="overflow-hidden"
                                            >
                                                <ul className="mt-2 ml-5 border-l-[1.5px] border-gray-100 space-y-1 py-1">
                                                    {item.subItems.map((sub) => {
                                                        const subActive = isLinkActive(sub.path);
                                                        return (
                                                            <li key={sub.path}>
                                                                <NavLink
                                                                    to={sub.path}
                                                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-bold transition-all relative group/sub ${
                                                                        subActive
                                                                            ? 'text-tvs-blue bg-tvs-blue/5 ml-3'
                                                                            : 'text-gray-500 hover:text-tvs-blue hover:bg-gray-50/80 ml-3'
                                                                    }`}
                                                                >
                                                                    <sub.icon size={14} className={`transition-colors duration-300 ${subActive ? 'text-tvs-blue' : 'text-gray-400 group-hover/sub:text-tvs-blue'}`} />
                                                                    <span>{sub.name}</span>
                                                                    {subActive && (
                                                                        <motion.div 
                                                                            layoutId="activeSubIndicator"
                                                                            className="absolute left-[-11px] w-[5px] h-[5px] rounded-full bg-tvs-blue shadow-[0_0_10px_rgba(30,58,138,0.5)]"
                                                                        />
                                                                    )}
                                                                </NavLink>
                                                            </li>
                                                        );
                                                    })}
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
                                end={item.path === '/dashboard'}
                                className={({ isActive }) =>
                                    `flex items-center gap-3.5 px-3 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${
                                        isActive 
                                            ? 'bg-tvs-blue text-white shadow-lg shadow-tvs-blue/25' 
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-tvs-blue'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <div className={`p-2 rounded-lg transition-all duration-300 relative z-10 ${
                                            isActive ? 'bg-white/15 text-white' : 'bg-gray-100 group-hover:bg-tvs-blue/10'
                                        } ${!isSidebarOpen ? 'mx-auto' : ''}`}>
                                            <item.icon size={19} />
                                        </div>
                                        {isSidebarOpen && (
                                            <span className="text-[13px] font-bold tracking-tight whitespace-nowrap relative z-10">
                                                {item.name}
                                            </span>
                                        )}
                                        {!isSidebarOpen && (
                                            <div className="absolute left-[calc(100%+15px)] px-3 py-1.5 bg-gray-900 text-white text-[11px] rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 font-bold whitespace-nowrap z-[100] translate-x-[-10px] group-hover:translate-x-0 border border-white/10 shadow-xl">
                                                {item.name}
                                            </div>
                                        )}
                                        {isActive && (
                                            <motion.div 
                                                layoutId={`activeLinkBg-${item.path}`}
                                                className="absolute inset-0 bg-gradient-to-r from-tvs-blue to-tvs-blue/90 z-0"
                                            />
                                        )}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

            </motion.aside>
        </>
    );
};

export default Sidebar;
