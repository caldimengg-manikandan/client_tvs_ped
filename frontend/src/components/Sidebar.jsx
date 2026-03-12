import React, { useMemo, useState, useEffect } from 'react';
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
    ChevronDown,
    Layout as LayoutIcon,
    PieChart,
    LogOut,
    Briefcase,
    FileBarChart,
    Boxes,
    PanelLeftClose,
    PanelLeft
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import tvsLogo from '../assets/tvs bg.webp';

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen, windowWidth }) => {
    const { hasPermission, logout, user } = useAuth();
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const [expandedGroups, setExpandedGroups] = useState({});

    // SaaS Section Configuration
    const navSections = useMemo(() => [
        {
            title: 'Workspace',
            items: [
                { name: 'Dashboard', icon: Home, path: '/dashboard', permission: 'dashboard' },
                { name: 'Employee Master', icon: Users, path: '/employee-master', permission: 'employeeMaster' },
            ]
        },
        {
            title: 'Operations',
            items: [
                { name: 'MH Requests', icon: FileText, path: '/mh-requests', permission: 'assetRequest' },
                { name: 'Request Tracker', icon: ClipboardList, path: '/request-tracker', permission: 'requestTracker' },
                {
                    name: 'Development',
                    icon: TrendingUp,
                    permission: 'mhDevelopmentTracker',
                    groupKey: 'development',
                    subItems: [
                        { name: 'Live Tracker', icon: Activity, path: '/mh-development-tracker' },
                        { name: 'Project Plan', icon: LayoutIcon, path: '/project-plan-model' }
                    ]
                }
            ]
        },
        {
            title: 'Management',
            items: [
                {
                    name: 'Vendors',
                    icon: Shield,
                    permission: 'vendorMaster',
                    groupKey: 'vendorManagement',
                    subItems: [
                        { name: 'Master List', icon: Users, path: '/vendor-master' },
                        { name: 'Scoring', icon: BarChart, path: '/vendor-master/scoring' },
                        { name: 'Loading', icon: PieChart, path: '/vendor-master/loading' }
                    ]
                },
                {
                    name: 'Assets',
                    icon: Boxes,
                    permission: 'assetSummary',
                    groupKey: 'assetManagement',
                    subItems: [
                        { name: 'Update', icon: Activity, path: '/asset-management-update' },
                        { name: 'Summary', icon: ClipboardList, path: '/asset-summary' }
                    ]
                }
            ]
        },
        {
            title: 'System',
            items: [
                { name: 'Settings', icon: Settings, path: '/settings', permission: 'settings' }
            ]
        }
    ], []);

    // Auto-expand groups that contain active links
    useEffect(() => {
        const newExpanded = { ...expandedGroups };
        let changed = false;
        navSections.forEach(section => {
            section.items.forEach(item => {
                if (item.subItems && item.subItems.some(sub => pathname.startsWith(sub.path))) {
                    if (!newExpanded[item.groupKey]) {
                        newExpanded[item.groupKey] = true;
                        changed = true;
                    }
                }
            });
        });
        if (changed) setExpandedGroups(newExpanded);
    }, [pathname, navSections]);

    const toggleGroup = (key) => {
        if (!isSidebarOpen) {
            setIsSidebarOpen(true);
            setExpandedGroups({ [key]: true });
            return;
        }
        setExpandedGroups(prev => ({
            // If already expanded, close it. Otherwise, expand it and close all others.
            [key]: !prev[key]
        }));
    };

    const isLinkActive = (path) => {
        if (path === '/dashboard') return pathname === '/dashboard';
        return pathname === path || (path !== '/' && pathname.startsWith(path + '/'));
    };

    const isParentActive = (item) => {
        if (!item.subItems) return isLinkActive(item.path);
        return item.subItems.some(sub => isLinkActive(sub.path));
    };

    return (
        <motion.aside
            className={`h-screen fixed left-0 top-0 bg-white border-r border-slate-100 flex flex-col shadow-saas transition-all duration-300 z-sidebar ${
                isSidebarOpen ? 'w-64' : 'w-[72px]'
            }`}
        >
            {/* Logo Section */}
            <div className="h-header flex items-center justify-between px-4 border-b border-slate-50 relative">
                <div 
                    className="flex items-center gap-3 cursor-pointer overflow-hidden p-1" 
                    onClick={() => navigate('/dashboard')}
                >
                    <div className="shrink-0 w-10 h-10 bg-white rounded-lg shadow-sm border border-slate-100 flex items-center justify-center p-1.5 transition-transform hover:scale-105 active:scale-95">
                        <img src={tvsLogo} alt="TVS" className="h-full w-auto object-contain" />
                    </div>
                    {isSidebarOpen && (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col">
                            <span className="text-sm font-black text-primary tracking-tighter leading-tight">TVS MOTORS</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Plant Eng.</span>
                        </motion.div>
                    )}
                </div>

                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-primary transition-all active:scale-90 ${!isSidebarOpen ? 'absolute -right-3 top-1/2 -translate-y-1/2 bg-white border border-slate-100 shadow-md' : ''}`}
                >
                    {isSidebarOpen ? <PanelLeftClose size={18} /> : <ChevronRight size={14} />}
                </button>
            </div>

            {/* Navigation Section */}
            <nav className="flex-1 overflow-y-auto overflow-x-hidden pt-6 px-3 space-y-8 custom-scrollbar">
                {navSections.map((section, sIdx) => {
                    const visibleItems = section.items.filter(item => !item.permission || hasPermission(item.permission));
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={sIdx} className="space-y-2">
                            {isSidebarOpen && (
                                <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-300/80 mb-3">
                                    {section.title}
                                </h3>
                            )}
                            
                            <div className="space-y-1">
                                {visibleItems.map((item, iIdx) => {
                                    const isGroup = !!item.subItems;
                                    const active = isParentActive(item);
                                    const isExpanded = expandedGroups[item.groupKey];

                                    if (isGroup) {
                                        return (
                                            <div key={item.groupKey} className="group/parent">
                                                <button
                                                    onClick={() => toggleGroup(item.groupKey)}
                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 relative ${
                                                        active 
                                                            ? 'bg-primary/5 text-primary' 
                                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
                                                    }`}
                                                >
                                                    {active && (
                                                        <motion.span layoutId="activeIndicator" className="absolute left-[-12px] w-1 h-6 bg-primary rounded-r-full" />
                                                    )}
                                                    <item.icon size={20} className={`shrink-0 transition-all duration-300 ${active ? 'text-primary scale-110' : 'text-slate-400 group-hover/parent:text-slate-600'}`} />
                                                    
                                                    {isSidebarOpen && (
                                                        <>
                                                            <span className="text-[13px] font-bold tracking-tight flex-1 text-left">{item.name}</span>
                                                            <ChevronDown size={14} className={`transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isExpanded ? 'rotate-180' : ''} text-slate-400`} />
                                                        </>
                                                    )}

                                                    {!isSidebarOpen && (
                                                        <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[11px] font-bold rounded-lg opacity-0 group-hover/parent:opacity-100 pointer-events-none transition-all duration-200 z-[1100] whitespace-nowrap shadow-xl">
                                                            {item.name}
                                                        </div>
                                                    )}
                                                </button>

                                                <AnimatePresence initial={false}>
                                                    {isSidebarOpen && isExpanded && (
                                                        <motion.ul
                                                            initial={{ height: 0, opacity: 0, y: -5 }}
                                                            animate={{ height: 'auto', opacity: 1, y: 0 }}
                                                            exit={{ height: 0, opacity: 0, y: -5 }}
                                                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                                            className="ml-9 border-l border-slate-100 mt-2 space-y-1 overflow-hidden"
                                                        >
                                                            {item.subItems.map(sub => {
                                                                const subActive = isLinkActive(sub.path);
                                                                return (
                                                                    <li key={sub.path}>
                                                                        <NavLink
                                                                            to={sub.path}
                                                                            className={`
                                                                                block px-4 py-2 text-xs font-bold transition-all relative
                                                                                ${subActive 
                                                                                    ? 'text-primary' 
                                                                                    : 'text-slate-400 hover:text-slate-900'}
                                                                            `}
                                                                        >
                                                                            {subActive && (
                                                                                <motion.div 
                                                                                    layoutId={`subActive-${item.groupKey}`}
                                                                                    className="absolute left-[-1px] top-1/2 -translate-y-1/2 w-[2px] h-4 bg-primary rounded-full"
                                                                                />
                                                                            )}
                                                                            {sub.name}
                                                                        </NavLink>
                                                                    </li>
                                                                );
                                                            })}
                                                        </motion.ul>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    }

                                    return (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            className={({ isActive }) => `
                                                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 relative group/nav
                                                ${isActive 
                                                    ? 'bg-primary/5 text-primary' 
                                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-medium'
                                                }
                                            `}
                                        >
                                            {({ isActive }) => (
                                                <>
                                                    {isActive && (
                                                        <motion.span layoutId="activeIndicator" className="absolute left-[-12px] w-1 h-6 bg-primary rounded-r-full" />
                                                    )}
                                                    <item.icon size={20} className={`shrink-0 transition-all duration-300 ${isActive ? 'text-primary scale-110' : 'text-slate-400 group-hover/nav:text-slate-600'}`} />
                                                    {isSidebarOpen && (
                                                        <span className="text-[13px] font-bold tracking-tight">{item.name}</span>
                                                    )}
                                                    {!isSidebarOpen && (
                                                        <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[11px] font-bold rounded-lg opacity-0 group-hover/nav:opacity-100 pointer-events-none transition-all duration-200 z-[1100] whitespace-nowrap shadow-xl">
                                                            {item.name}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </NavLink>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Profile Section */}
            <div className="p-4 border-t border-slate-50 bg-white/50 backdrop-blur-sm">
                <div 
                    onClick={() => navigate('/settings')}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all group/user cursor-pointer active:scale-[0.98]"
                >
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs border border-primary/10 shadow-sm transition-transform group-hover/user:scale-105">
                        {user?.name?.charAt(0) || 'A'}
                    </div>
                    {isSidebarOpen && (
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-black text-slate-800 truncate leading-none">{user?.name || 'Admin User'}</p>
                            <p className="text-[10px] font-bold text-slate-400 truncate uppercase mt-1 leading-none tracking-widest">{user?.role || 'Admin'}</p>
                        </div>
                    )}
                    {isSidebarOpen && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); logout(); }} 
                            className="p-1.5 text-slate-300 hover:text-red-500 transition-all hover:bg-red-50 rounded-lg"
                        >
                            <LogOut size={16} />
                        </button>
                    )}
                </div>
            </div>
        </motion.aside>
    );
};

export default Sidebar;
