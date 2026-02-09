import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut, ChevronDown, Clock, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Modal } from 'antd';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const Header = () => {
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

    // Fallback if user is not fully loaded yet
    const displayName = user?.name || "User";
    const displayEmail = user?.email || "";
    const displayInitials = user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : "U";

    const handleLogout = async () => {
        setIsPopoverOpen(false);
        await logout();
        navigate('/login', { replace: true });
    };

    // Close on click outside and Escape key
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

    // Breadcrumb Logic
    const generateBreadcrumbs = () => {
        const pathnames = location.pathname.split('/').filter(x => x);
        const breadcrumbs = [];

        // Always start with Dashboard/Home if we are not on dashboard
        if (location.pathname !== '/') {
            breadcrumbs.push({ name: 'Dashboard', path: '/' });
        }

        let currentPath = '';

        pathnames.forEach((value, index) => {
            currentPath += `/${value}`;

            // Map specific paths to readable names
            let name = '';

            // Dynamic ID handling (skip IDs in breadcrumb name usually, or show as 'Details')
            if (value.match(/^[0-9a-fA-F]{24}$/) || value === 'edit' || value === 'view' || value === 'add') {
                // Determine context from previous segment
                const prevSegment = pathnames[index - 1];

                if (value === 'add') name = 'Create New';
                else if (value === 'edit') name = 'Edit';
                else if (value === 'view') name = 'View Details';
                else return; // Skip showing ID directly in breadcrumb text
            } else {
                switch (value) {
                    case 'CreateAssetRequest': name = 'Asset Requests'; break;
                    case 'request-tracker': name = 'Request Tracker'; break;
                    case 'asset-progress': name = 'Asset Progress'; break;
                    case 'asset-summary': name = 'Asset Summary'; break;

                    case 'employee-master': name = 'Employee Master'; break;
                    case 'vendor-master': name = 'Vendor Master'; break;
                    case 'settings': name = 'Settings'; break;
                    default: name = value.charAt(0).toUpperCase() + value.slice(1);
                }
            }

            if (name) {
                breadcrumbs.push({ name, path: currentPath });
            }
        });

        return breadcrumbs;
    };

    const breadcrumbs = generateBreadcrumbs();
    const currentPageTitle = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].name : 'Dashboard';

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
        <header className="h-header fixed top-0 right-0 left-sidebar bg-white border-b border-tvs-border z-header px-8 flex items-center justify-between shadow-sm transition-all duration-300">
            {/* Left side - Breadcrumbs & Title */}
            <div className="flex flex-col justify-center">
                {/* Main Title */}
                <h2 className="text-xl font-bold text-tvs-dark-gray m-0 leading-tight">
                    {currentPageTitle}
                </h2>
                {/* Breadcrumbs */}
                {location.pathname !== '/' && (
                    <nav className="flex items-center text-xs text-gray-500 mb-1">
                        {breadcrumbs.map((crumb, index) => (
                            <React.Fragment key={crumb.path}>
                                {index > 0 && <ChevronRight size={12} className="mx-1 text-gray-400" />}
                                <Link
                                    to={crumb.path}
                                    className={`hover:text-tvs-blue transition-colors ${index === breadcrumbs.length - 1 ? 'font-medium text-gray-700 pointer-events-none' : ''}`}
                                >
                                    {crumb.name}
                                </Link>
                            </React.Fragment>
                        ))}
                    </nav>
                )}
            </div>

            {/* Right side - Actions & Profile */}
            <div className="flex items-center gap-6">

                {/* Last Login Button */}
                {userActivity && (
                    <button
                        onClick={() => setIsActivityModalOpen(true)}
                        className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-100 hover:bg-blue-100 transition-colors"
                    >
                        <Clock size={14} />
                        <span>
                            Last Login: {userActivity.previousLoginAt ? formatDate(userActivity.previousLoginAt) : 'First Login'}
                        </span>
                    </button>
                )}

                {/* User Profile */}
                <div className="flex items-center">
                    <div className="relative" ref={popoverRef}>
                        <div
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => setIsPopoverOpen(!isPopoverOpen)}
                        >
                            <div className="w-9 h-9 bg-tvs-blue text-white rounded-full flex items-center justify-center font-bold text-sm tracking-wider">
                                {displayInitials}
                            </div>
                            <div className="hidden md:flex flex-col items-start">
                                <span className="font-medium text-tvs-dark-gray text-sm leading-tight">{displayName}</span>
                                <span className="text-xs text-gray-500 leading-tight">{user?.department || 'Employee'}</span>
                            </div>
                            <ChevronDown size={16} className="text-gray-400" />
                        </div>

                        {isPopoverOpen && (
                            <div className="absolute top-full right-0 mt-2 w-[280px] bg-white border border-tvs-border rounded-xl shadow-lg z-modal overflow-hidden fade-in animate-in slide-in-from-top-2 duration-200">
                                <div className="p-5 bg-gray-50 border-b border-tvs-border flex items-center gap-4">
                                    <div className="w-12 h-12 bg-tvs-blue text-white rounded-full flex items-center justify-center text-lg font-bold tracking-wider">
                                        {displayInitials}
                                    </div>
                                    <div className="flex flex-col overflow-hidden">
                                        <h4 className="m-0 text-sm font-semibold text-tvs-dark-gray truncate" title={displayName}>{displayName}</h4>
                                        <span className="text-xs text-gray-500 truncate" title={displayEmail}>{displayEmail}</span>
                                    </div>
                                </div>

                                <div className="p-3 border-t border-tvs-border">
                                    <button
                                        className="w-full flex items-center justify-center gap-2 p-3 bg-transparent text-tvs-red border border-tvs-red-muted rounded-lg font-semibold cursor-pointer transition-all hover:bg-tvs-red hover:text-white"
                                        onClick={handleLogout}
                                    >
                                        <LogOut size={16} />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* User Activity Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2 text-tvs-blue">
                        <Activity size={20} />
                        <span>My Login Activity Details</span>
                    </div>
                }
                open={isActivityModalOpen}
                onCancel={() => setIsActivityModalOpen(false)}
                footer={null}
                width={600}
                centered
            >
                {userActivity ? (
                    <div className="py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-center">
                                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Last Visit</p>
                                <p className="text-base font-bold text-gray-800">
                                    {userActivity.previousLoginAt ? formatDate(userActivity.previousLoginAt) : 'First Login'}
                                </p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-center">
                                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Total Visits</p>
                                <p className="text-base font-bold text-gray-800">{userActivity.totalVisits}</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 ml-1">Recent Sessions History</h3>
                            <div className="overflow-y-auto overflow-x-auto max-h-60 border border-gray-200 rounded-lg custom-scrollbar">
                                <table className="min-w-full text-sm text-left text-gray-500 relative">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10 shadow-sm">
                                        <tr>
                                            <th className="px-4 py-3 border-b">Login Time</th>
                                            <th className="px-4 py-3 border-b">Duration</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {userActivity.recentSessions?.map(session => (
                                            <tr key={session._id} className="bg-white hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                    {formatDate(session.loginAt)}
                                                </td>


                                                <td className="px-4 py-3">
                                                    {session.logoutAt
                                                        ? formatDurationTime(session.sessionDuration)
                                                        : <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">Active</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-8 text-center text-gray-500">Loading activity details...</div>
                )}
            </Modal>
        </header>
    );
};

export default Header;
