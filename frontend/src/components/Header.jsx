import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut, ChevronDown, Clock, Activity, Search, Bell, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Modal } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const Header = ({ isSidebarOpen, setIsSidebarOpen }) => {
    const location = useLocation();
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const popoverRef = useRef(null);

    // User Activity State
    const [userActivity, setUserActivity] = useState(null);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

    useEffect(() => {
        if (user) {
            fetchUserActivity();
        }
    }, [user]);

    const fetchUserActivity = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/user-activity/stats`);
            setUserActivity(res.data);
        } catch (err) {
            console.error('Error fetching user activity', err);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const displayName = user?.name || "User";
    const displayEmail = user?.email || "";
    const displayInitials = user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : "U";

    const handleLogout = async () => {
        setIsPopoverOpen(false);
        await logout();
        navigate('/login', { replace: true });
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target)) {
                setIsPopoverOpen(false);
            }
        };

        const handleEscapeKey = (event) => {
            if (event.key === 'Escape') {
                setIsPopoverOpen(false);
            }
        };

        if (isPopoverOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscapeKey);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [isPopoverOpen]);

    const generateBreadcrumbs = () => {
        const pathnames = location.pathname.split('/').filter(x => x);
        const breadcrumbs = [];

        if (location.pathname !== '/') {
            breadcrumbs.push({ name: 'Dashboard', path: '/' });
        }

        let currentPath = '';

        pathnames.forEach((value, index) => {
            currentPath += `/${value}`;

            let name = '';

            if (value.match(/^[0-9a-fA-F]{24}$/) || value === 'edit' || value === 'view' || value === 'add') {
                const prevSegment = pathnames[index - 1];
                if (value === 'add') name = 'Create New';
                else if (value === 'edit') name = 'Edit';
                else if (value === 'view') name = 'View Details';
                else return;
            } else {
                switch (value) {
                    case 'employee-master': name = 'Employee Master'; break;
                    case 'mh-requests': name = 'MH Requests'; break;
                    case 'request-tracker': name = 'Request Tracker'; break;
                    case 'mh-development-tracker': name = 'MH Development Tracker'; break;
                    case 'vendor-master': name = 'Vendor Master'; break;
                    case 'settings': name = 'Settings'; break;
                    case 'scoring': name = 'Vendor Scoring'; break;
                    case 'loading': name = 'Loading Chart'; break;
                    case 'asset-progress': name = 'Asset Progress'; break;
                    case 'asset-management-update': name = 'Management Update'; break;
                    case 'asset-summary': name = 'Asset Summary'; break;
                    default: name = value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' ');
                }
            }

            if (name) {
                breadcrumbs.push({ name, path: currentPath });
            }
        });

        return breadcrumbs;
    };

    const breadcrumbs = generateBreadcrumbs();
    const currentPageTitle = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : 'Dashboard Overview';

    const formatDurationTime = (seconds) => {
        if (!seconds) return '0s';
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m ${remainingSeconds}s`;
    };

    return (
        <header className={`h-header fixed top-0 right-0 ${isSidebarOpen ? 'lg:left-[280px]' : 'lg:left-[72px]'} left-0 bg-white/70 backdrop-blur-xl border-b border-gray-100/50 z-header px-4 lg:px-8 flex items-center justify-between shadow-[0_4px_20px_rgba(0,0,0,0.01)] transition-all duration-300`}>
            {/* Left side - Breadcrumbs & Title */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 hover:bg-gray-100 rounded-lg text-tvs-blue lg:hidden transition-colors"
                >
                    <Menu size={20} />
                </button>
                <div className="flex flex-col justify-center">
                    <nav className="hidden md:flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                        {breadcrumbs.map((crumb, index) => (
                            <React.Fragment key={crumb.path}>
                                {index > 0 && <ChevronRight size={10} className="mx-1 text-gray-300" />}
                                <Link
                                    to={crumb.path}
                                    className={`hover:text-tvs-blue transition-colors ${index === breadcrumbs.length - 1 ? 'text-gray-600 pointer-events-none' : ''}`}
                                >
                                    {crumb.name}
                                </Link>
                            </React.Fragment>
                        ))}
                    </nav>
                    <h2 className="text-xl font-black text-gray-900 font-outfit m-0 leading-none">
                        {currentPageTitle}
                    </h2>
                </div>
            </div>

            {/* Right side - Actions & Profile */}
            <div className="flex items-center gap-4">


                <div className="h-8 w-[1px] bg-gray-100 mx-2 hidden md:block"></div>



                {/* Last Login Button */}
                {userActivity && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsActivityModalOpen(true)}
                        className="hidden xl:flex items-center gap-2 px-4 py-2.5 bg-tvs-blue/5 text-tvs-blue rounded-xl text-xs font-bold border border-tvs-blue/10 hover:bg-tvs-blue/10 transition-colors"
                    >
                        <Clock size={14} />
                        <span>
                            Last: {userActivity.previousLoginAt ? formatDate(userActivity.previousLoginAt) : 'Fresh'}
                        </span>
                    </motion.button>
                )}

                {/* User Profile */}
                <div className="relative" ref={popoverRef}>
                    <motion.div
                        whileHover={{ y: -1 }}
                        className="flex items-center gap-3 p-1.5 pl-3 rounded-2xl bg-gray-50/50 hover:bg-white border border-transparent hover:border-gray-100 hover:shadow-lg transition-all cursor-pointer group"
                        onClick={() => setIsPopoverOpen(!isPopoverOpen)}
                    >
                        <div className="hidden md:flex flex-col items-end mr-1">
                            <span className="font-bold text-gray-900 text-sm leading-tight group-hover:text-tvs-blue transition-colors">{displayName}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter leading-tight">{user?.department || 'Employee'}</span>
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-br from-tvs-blue to-tvs-blue/80 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-lg shadow-tvs-blue/20">
                            {displayInitials}
                        </div>
                        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isPopoverOpen ? 'rotate-180' : ''}`} />
                    </motion.div>

                    <AnimatePresence>
                        {isPopoverOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full right-0 mt-3 w-72 glass-card rounded-2xl shadow-2xl z-modal overflow-hidden border border-white/50"
                            >
                                <div className="p-6 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100 flex flex-col items-center text-center">
                                    <div className="w-16 h-16 bg-tvs-blue text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-xl shadow-tvs-blue/20 mb-4">
                                        {displayInitials}
                                    </div>
                                    <h4 className="m-0 text-base font-black text-gray-900 font-outfit">{displayName}</h4>
                                    <span className="text-xs font-medium text-gray-400 mt-1">{displayEmail}</span>

                                    <div className="flex gap-2 mt-4">
                                        <span className="px-2.5 py-1 bg-tvs-blue/10 text-tvs-blue text-[10px] font-black rounded-lg uppercase tracking-wider">{user?.role || 'User'}</span>
                                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg uppercase tracking-wider">Active</span>
                                    </div>
                                </div>

                                <div className="p-3 bg-white">
                                    <button
                                        className="w-full flex items-center justify-center gap-3 p-3.5 bg-rose-50 text-rose-600 rounded-xl font-bold text-sm cursor-pointer transition-all hover:bg-rose-600 hover:text-white hover:shadow-lg hover:shadow-rose-100 group"
                                        onClick={handleLogout}
                                    >
                                        <LogOut size={18} className="transition-transform group-hover:translate-x-1" />
                                        <span>Sign Out</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* User Activity Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-3 text-tvs-blue font-outfit py-2">
                        <div className="w-10 h-10 rounded-xl bg-tvs-blue/10 flex items-center justify-center">
                            <Activity size={20} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-black tracking-tight leading-none">Activity Log</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Personnel Session History</span>
                        </div>
                    </div>
                }
                open={isActivityModalOpen}
                onCancel={() => setIsActivityModalOpen(false)}
                footer={null}
                width={650}
                centered
                className="custom-modal"
            >
                {userActivity ? (
                    <div className="py-6 space-y-8">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 text-center group hover:bg-white hover:shadow-xl hover:shadow-gray-200 transition-all duration-300">
                                <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-[2px]">Last Visit</p>
                                <p className="text-lg font-black text-gray-800 font-outfit">
                                    {userActivity.previousLoginAt ? formatDate(userActivity.previousLoginAt) : 'Fresh Entry'}
                                </p>
                            </div>
                            <div className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 text-center group hover:bg-white hover:shadow-xl hover:shadow-gray-200 transition-all duration-300">
                                <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-[2px]">Total Sessions</p>
                                <p className="text-4xl font-black text-tvs-blue font-outfit tracking-tighter">
                                    {userActivity.totalVisits}
                                </p>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-4 px-2">
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Recent Session Log</h3>
                                <span className="text-[10px] font-bold text-tvs-blue px-2 py-0.5 bg-tvs-blue/5 rounded-full">LIVE DATA</span>
                            </div>
                            <div className="overflow-hidden border border-gray-100 rounded-[2rem] shadow-sm">
                                <table className="w-full text-sm text-left relative">
                                    <thead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4">Timestamp</th>
                                            <th className="px-6 py-4 text-right">Duration</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {userActivity.recentSessions?.map((session, idx) => (
                                            <tr key={session._id} className="bg-white hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-gray-700">
                                                    {formatDate(session.loginAt)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {session.logoutAt
                                                        ? <span className="text-xs font-semibold text-gray-500">{formatDurationTime(session.sessionDuration)}</span>
                                                        : <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider animate-pulse">Online Now</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-4">
                        <div className="w-12 h-12 border-4 border-tvs-blue/10 border-t-tvs-blue rounded-full animate-spin"></div>
                        <p className="text-sm font-bold uppercase tracking-widest animate-pulse">Accessing secure logs...</p>
                    </div>
                )}
            </Modal>
        </header>
    );
};

export default Header;
