import React from 'react';
import { Home, Settings, FileText, ClipboardList, Activity, Users, Shield, BarChart, ChevronRight, TrendingUp, Menu, ChevronLeft, ChevronDown } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import tvsLogo from '../assets/tvs bg.webp';

const Sidebar = ({ isSidebarOpen, setIsSidebarOpen, windowWidth }) => {
    const { hasPermission, loading } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [openGroups, setOpenGroups] = React.useState({
        vendorManagement: true
    });

    const isVendorGroupActive = location.pathname.startsWith('/vendor-master');

    React.useEffect(() => {
        if (isVendorGroupActive) {
            setOpenGroups(prev => ({
                ...prev,
                vendorManagement: true
            }));
        }
    }, [isVendorGroupActive]);

    const navItems = [
        { name: 'Dashboard', icon: Home, path: '/', permission: 'dashboard' },
        { name: 'Employee Master', icon: Users, path: '/employee-master', permission: 'employeeMaster' },
        { name: 'MH Requests', icon: FileText, path: '/mh-requests', permission: 'assetRequest' },
        { name: 'Request Tracker', icon: ClipboardList, path: '/request-tracker', permission: 'requestTracker' },
        { name: 'MH Dev Tracker', icon: TrendingUp, path: '/mh-development-tracker', permission: 'mhDevelopmentTracker' },
        { name: 'Project Plan Tracking', icon: ClipboardList, path: '/project-plan-model', permission: 'mhDevelopmentTracker', isSubItem: true },
        {
            name: 'Vendor Management System',
            icon: Shield,
            path: '#',
            permission: 'vendorMaster',
            isHeader: true,
            groupKey: 'vendorManagement'
        },
        { name: 'Vendor Master', icon: Shield, path: '/vendor-master', permission: 'vendorMaster', isSubItem: true, groupKey: 'vendorManagement' },
        { name: 'Vendor Scoring', icon: Shield, path: '/vendor-master/scoring', permission: 'vendorMaster', isSubItem: true, groupKey: 'vendorManagement' },
        { name: 'Loading Chart', icon: ClipboardList, path: '/vendor-master/loading', permission: 'vendorMaster', isSubItem: true, groupKey: 'vendorManagement' },
        { name: 'Asset Management Update', icon: ClipboardList, path: '/asset-management-update', permission: 'assetSummary' },
        { name: 'Asset Summary', icon: ClipboardList, path: '/asset-summary', permission: 'assetSummary' },
        { name: 'Settings', icon: Settings, path: '/settings', permission: 'settings' }
    ];

    return (
        <>
            <AnimatePresence>
                {windowWidth <= 1024 && isSidebarOpen && (
                    <motion.div
                        key="sidebar-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/30 z-backdrop lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            <motion.aside
                key="sidebar"
                initial={{ x: windowWidth <= 1024 ? -280 : 0, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -280, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                className={`h-screen fixed left-0 top-0 bg-white border-r border-gray-100/50 z-sidebar flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-[width] duration-300 ${
                    isSidebarOpen ? 'w-[280px]' : 'w-[72px]'
                }`}
            >
                <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
                    <div className="flex flex-col items-center gap-1 flex-1">
                        <img src={tvsLogo} alt="TVS logo" className="h-20 w-auto object-contain" />
                        {isSidebarOpen && (
                            <>
                                <span className="text-[10px] font-bold tracking-[0.18em] uppercase text-tvs-blue">
                                    TVS Motors
                                </span>
                                <span className="text-[10px] text-gray-400">
                                    Plant engineering department..
                                </span>
                            </>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded-lg hover:bg-gray-100 text-tvs-blue hidden lg:inline-flex"
                    >
                        {isSidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto overflow-x-hidden py-8 custom-scrollbar">
                    {isSidebarOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="px-8 mb-4"
                        >
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">
                                Main Menu
                            </span>
                        </motion.div>
                    )}
                    <ul className={`space-y-2 list-none ${isSidebarOpen ? 'px-3' : 'px-2'}`}>
                        {navItems.map((item, index) => {
                            if (item.permission && !hasPermission(item.permission)) {
                                return null;
                            }

                            if (!isSidebarOpen && (item.isHeader || item.isSubItem)) {
                                return null;
                            }

                            if (item.groupKey && !item.isHeader && openGroups[item.groupKey] === false) {
                                return null;
                            }

                            if (item.isHeader) {
                                const isGroupActive = item.groupKey === 'vendorManagement' && isVendorGroupActive;

                                return (
                                    <li key={item.name} className="pt-1 pb-1 shadow-none">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (item.groupKey) {
                                                    setOpenGroups(prev => ({
                                                        ...prev,
                                                        [item.groupKey]: !prev[item.groupKey]
                                                    }));
                                                }
                                                navigate('/vendor-master');
                                            }}
                                            className={`group w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 font-semibold text-xs ${
                                                isGroupActive
                                                    ? 'bg-tvs-blue/5 text-tvs-blue'
                                                    : 'text-gray-500 hover:bg-gray-50 hover:text-tvs-blue'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`p-2 rounded-xl transition-all duration-300 flex items-center justify-center ${
                                                        isGroupActive
                                                            ? 'bg-tvs-blue text-white'
                                                            : 'bg-transparent group-hover:bg-tvs-blue/10 group-hover:text-tvs-blue'
                                                    }`}
                                                >
                                                    <item.icon size={18} />
                                                </div>
                                                {isSidebarOpen && (
                                                    <span className="font-inter whitespace-nowrap truncate">
                                                        {item.name}
                                                    </span>
                                                )}
                                            </div>

                                            {item.groupKey && (
                                                <ChevronDown
                                                    size={14}
                                                    className={`transition-transform duration-200 ${
                                                        openGroups[item.groupKey]
                                                            ? 'rotate-180 text-tvs-blue'
                                                            : 'text-gray-300'
                                                    }`}
                                                />
                                            )}
                                        </button>
                                    </li>
                                );
                            }

                            return (
                                <motion.li
                                    key={item.name}
                                    initial={
                                        item.isSubItem && isSidebarOpen
                                            ? { opacity: 0, x: -10 }
                                            : false
                                    }
                                    animate={
                                        item.isSubItem && isSidebarOpen
                                            ? { opacity: 1, x: 0 }
                                            : false
                                    }
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                >
                                    <NavLink
                                        to={item.path}
                                        end
                                        className={({ isActive }) =>
                                            `group flex items-center ${
                                                isSidebarOpen ? 'justify-between' : 'justify-center'
                                            } px-4 py-3.5 rounded-2xl transition-all duration-300 font-semibold text-sm transform relative
                                         ${
                                             isSidebarOpen && item.isSubItem
                                                 ? 'ml-4 py-2.5'
                                                 : ''
                                         }
                                         ${
                                             isActive && item.path !== '#'
                                                 ? 'scale-[1.03] bg-tvs-blue/5 text-tvs-blue'
                                                 : 'hover:scale-[1.01] text-gray-500 hover:bg-gray-50 hover:text-tvs-blue'
                                         }`
                                        }
                                    >
                                        {({ isActive }) => (
                                            <>
                                                <div className="flex items-center gap-3">
                                                    {!item.isSubItem ? (
                                                        <div
                                                            className={`p-2 rounded-xl transition-all duration-300 flex items-center justify-center ${
                                                                isActive
                                                                    ? 'bg-tvs-blue text-white scale-100'
                                                                    : 'bg-transparent group-hover:bg-tvs-blue/10 group-hover:scale-110'
                                                            }`}
                                                        >
                                                            <item.icon size={18} />
                                                        </div>
                                                    ) : (
                                                        <div
                                                            className={`p-1.5 rounded-lg transition-all duration-300 flex items-center justify-center ${
                                                                isActive
                                                                    ? 'bg-tvs-blue/10 text-tvs-blue'
                                                                    : 'bg-transparent group-hover:bg-tvs-blue/5 group-hover:text-tvs-blue'
                                                            }`}
                                                        >
                                                            <item.icon size={14} />
                                                        </div>
                                                    )}
                                                    {isSidebarOpen && (
                                                        <span
                                                            className={`${
                                                                item.isSubItem
                                                                    ? 'text-xs font-bold'
                                                                    : 'font-inter'
                                                            }`}
                                                        >
                                                            {item.name}
                                                        </span>
                                                    )}
                                                </div>

                                                {isSidebarOpen &&
                                                    isActive &&
                                                    item.path !== '#' && (
                                                        <motion.div
                                                            layoutId="active-nav"
                                                            transition={{
                                                                type: 'spring',
                                                                stiffness: 400,
                                                                damping: 30
                                                            }}
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

                <div className="p-4 border-t border-gray-50">
                    <div
                        className={`bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border border-gray-100 transition-all duration-300 ${
                            isSidebarOpen ? 'p-4' : 'p-2 flex justify-center'
                        }`}
                    >
                        {isSidebarOpen ? (
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                                    <Shield size={16} className="text-tvs-blue" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-700">
                                        System Secure
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-medium">
                                        Access Level: High
                                    </span>
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
