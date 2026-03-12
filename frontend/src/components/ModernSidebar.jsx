import React, { useMemo, useState } from 'react';
import { 
    Home, 
    Users, 
    FileText, 
    ClipboardList, 
    TrendingUp, 
    Shield, 
    Activity, 
    Settings,
    Lock,
    ChevronRight,
    Layout as LayoutIcon,
    PieChart,
    BarChart,
    ChevronDown,
    Menu,
    LogOut,
    HelpCircle
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import tvsLogo from '../assets/tvs bg.webp';

const ModernSidebar = ({ isSidebarOpen, setIsSidebarOpen, windowWidth }) => {
    const { hasPermission, logout, user } = useAuth();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const [hoveredItem, setHoveredItem] = useState(null);

    // Navigation configuration - derived from original Sidebar.jsx
    const navConfig = useMemo(() => [
        {
            section: "General",
            items: [
                { name: 'Dashboard', icon: Home, path: '/dashboard', permission: 'dashboard' },
                { name: 'Employee Master', icon: Users, path: '/employee-master', permission: 'employeeMaster' },
            ]
        },
        {
            section: "Management",
            items: [
                { name: 'MH Requests', icon: FileText, path: '/mh-requests', permission: 'assetRequest' },
                { name: 'Request Tracker', icon: ClipboardList, path: '/request-tracker', permission: 'requestTracker' },
            ]
        },
        {
            section: "Operations",
            items: [
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
                    name: 'Vendor System',
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
            ]
        },
        {
            section: "System",
            items: [
                { name: 'Settings', icon: Settings, path: '/settings', permission: 'settings' },
                { name: 'Locked Feature', icon: Lock, path: '/locked', disabled: true },
            ]
        }
    ], []);

    const isLinkActive = (path) => {
        if (path === '/dashboard') return pathname === '/dashboard';
        return pathname === path || (path !== '/' && pathname.startsWith(path + '/'));
    };

    const isParentActive = (item) => {
        if (!item.subItems) return isLinkActive(item.path);
        return item.subItems.some(sub => isLinkActive(sub.path));
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    // Sidebar Widths
    const sidebarWidth = isSidebarOpen ? 'w-64' : 'w-[68px] hover:w-64';
    
    return (
        <>
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {windowWidth <= 1024 && isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[1001] lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Container */}
            <aside
                className={`fixed left-0 top-0 h-screen bg-white/70 backdrop-blur-md border-r border-gray-100/50 
                    z-[1002] transition-all duration-300 ease-in-out group/sidebar
                    ${windowWidth <= 1024 
                        ? (isSidebarOpen ? 'translate-x-0' : '-translate-x-full') 
                        : 'translate-x-0'
                    }
                    ${isSidebarOpen ? 'w-64' : 'w-[68px] hover:w-64'}
                    shadow-[2px_0_24px_0_rgba(37,60,128,0.06)] hover:shadow-2xl hover:shadow-tvs-blue/10
                `}
                onMouseEnter={() => !isSidebarOpen && windowWidth > 1024 && setIsSidebarOpen(false)} // Just to handle hover logic if we want state sync
            >
                {/* Logo Section */}
                <div className="flex items-center h-20 px-4 mb-4 border-b border-gray-50/50 relative">
                    <div 
                        className="flex items-center gap-3 cursor-pointer group/logo w-full overflow-hidden"
                        onClick={() => navigate('/dashboard')}
                    >
                        <div className="shrink-0 p-1 bg-white rounded-xl shadow-sm border border-gray-50 flex items-center justify-center">
                            <img src={tvsLogo} alt="TVS" className="h-8 w-auto object-contain" />
                        </div>
                        <div className={`transition-all duration-300 whitespace-nowrap ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 group-hover/sidebar:opacity-100 group-hover/sidebar:translate-x-0'}`}>
                            <span className="text-sm font-black tracking-tighter text-tvs-blue block">TVS MOTORS</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block -mt-1">Engineer Hub</span>
                        </div>
                    </div>

                    {/* Desktop Toggle Button */}
                    {windowWidth > 1024 && (
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsSidebarOpen(!isSidebarOpen);
                            }}
                            className={`absolute -right-3 top-7 w-6 h-6 bg-white border border-gray-100 rounded-full flex items-center justify-center shadow-md text-gray-400 hover:text-tvs-blue transition-all duration-300 z-10 ${isSidebarOpen ? 'rotate-180' : 'rotate-0'}`}
                        >
                            <ChevronRight size={14} />
                        </button>
                    )}
                </div>

                {/* Navigation Items */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 space-y-6 custom-scrollbar h-[calc(100vh-160px)]">
                    {navConfig.map((section, sidx) => (
                        <div key={sidx} className="space-y-1">
                            {/* Section Header */}
                            <div className={`px-3 mb-2 transition-all duration-300 ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover/sidebar:opacity-100 group-hover/sidebar:translate-x-0'}`}>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400/80">
                                    {section.section}
                                </h3>
                            </div>

                            <div className="space-y-1">
                                {section.items.map((item, iidx) => {
                                    if (item.permission && !hasPermission(item.permission)) return null;

                                    const active = isParentActive(item);
                                    const isDisabled = item.disabled;

                                    return (
                                        <div key={iidx} className="relative group/item">
                                            {isDisabled ? (
                                                /* Disabled/Locked Item */
                                                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl opacity-50 grayscale cursor-not-allowed text-gray-400">
                                                    <div className="relative shrink-0">
                                                        <item.icon size={20} className="transition-colors" />
                                                        <Lock size={10} className="absolute -top-1 -right-1" />
                                                    </div>
                                                    <span className={`text-[13px] font-semibold whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 group-hover/sidebar:opacity-100 group-hover/sidebar:translate-x-0'}`}>
                                                        {item.name}
                                                    </span>
                                                </div>
                                            ) : (
                                                /* Regular Nav Link */
                                                <NavLink
                                                    to={item.path || '#'}
                                                    className={({ isActive }) => `
                                                        flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group/nav relative
                                                        ${isActive 
                                                            ? 'bg-tvs-blue/5 text-tvs-blue' 
                                                            : 'text-gray-500 hover:bg-gray-50/80 hover:text-tvs-blue'
                                                        }
                                                    `}
                                                >
                                                    {({ isActive }) => (
                                                        <>
                                                            {/* Active Indicator */}
                                                            {isActive && (
                                                                <motion.span 
                                                                    layoutId="activeIndicator"
                                                                    className="absolute left-[-12px] w-1 h-6 bg-tvs-blue rounded-r-full shadow-[2px_0_8px_rgba(37,60,128,0.2)]"
                                                                />
                                                            )}

                                                            <div className={`shrink-0 p-1 transition-colors duration-200 ${isActive ? 'text-tvs-blue' : 'text-gray-400 group-hover/nav:text-tvs-blue'}`}>
                                                                <item.icon size={20} />
                                                            </div>

                                                            <span className={`text-[13px] font-bold tracking-tight whitespace-nowrap transition-all duration-300 ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 group-hover/sidebar:opacity-100 group-hover/sidebar:translate-x-0'}`}>
                                                                {item.name}
                                                            </span>

                                                            {/* Sub-item indicator */}
                                                            {item.subItems && (
                                                                <ChevronDown 
                                                                    size={14} 
                                                                    className={`ml-auto transition-all duration-300 ${isSidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 group-hover/sidebar:opacity-100'} ${active ? 'rotate-180' : ''}`} 
                                                                />
                                                            )}
                                                            
                                                            {/* Tooltip for collapsed mode */}
                                                            {!isSidebarOpen && (
                                                                <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900/95 backdrop-blur-sm text-white text-[11px] font-bold rounded-lg opacity-0 pointer-events-none transition-all duration-200 z-[1100] whitespace-nowrap shadow-xl border border-white/10 translate-x-2 group-hover/item:opacity-100 group-hover/item:translate-x-0 lg:flex hidden items-center justify-center">
                                                                    {item.name}
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </NavLink>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer / Profile Section */}
                <div className="p-4 border-t border-gray-50/50">
                    <div className="flex flex-col gap-2">
                         <div className="flex items-center gap-3 p-2 rounded-xl border border-transparent hover:border-gray-100 hover:bg-gray-50/50 transition-all group/user cursor-pointer">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-tvs-blue to-[#4A69BD] flex items-center justify-center text-white text-xs font-black shadow-sm">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className={`transition-all duration-300 overflow-hidden opacity-0 group-hover/sidebar:opacity-100 ${isSidebarOpen ? 'opacity-100' : 'hidden group-hover/sidebar:block'}`}>
                                <p className="text-xs font-black text-gray-800 tracking-tight truncate">{user?.name || 'User'}</p>
                                <p className="text-[10px] font-medium text-gray-400 truncate -mt-0.5">{user?.role || 'Engineer'}</p>
                            </div>
                            <div className={`ml-auto opacity-0 group-hover/sidebar:opacity-100 ${isSidebarOpen ? 'opacity-100' : 'hidden group-hover/sidebar:block'}`}>
                                <LogOut 
                                    size={14} 
                                    className="text-gray-300 hover:text-red-500 transition-colors" 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleLogout();
                                    }}
                                />
                            </div>
                         </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default ModernSidebar;
