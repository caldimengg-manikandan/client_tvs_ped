import React from 'react';
import { Home, Settings, FileText, Bell, ClipboardList, Activity, Users, Shield, BarChart } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import tvsLogo from '../assets/tvslogo.jpg';

const Sidebar = () => {
    const { hasPermission, loading } = useAuth();

    const navItems = [
        { name: 'Dashboard', icon: Home, path: '/', permission: 'dashboard' },
        { name: 'Asset Requests', icon: FileText, path: '/CreateAssetRequest', permission: 'assetRequest' },
        { name: 'Request Tracker', icon: ClipboardList, path: '/request-tracker', permission: 'requestTracker' },
        { name: 'Asset Progress', icon: Activity, path: '/asset-progress', permission: 'assetSummary' },
        { name: 'Asset Summary', icon: ClipboardList, path: '/asset-summary', permission: 'assetSummary' },
        { name: 'Employee Master and Access', icon: Users, path: '/employee-master', permission: 'employeeMaster' },
        { name: 'Vendor Master', icon: Shield, path: '/vendor-master', permission: 'vendorMaster' },
        { name: 'Settings', icon: Settings, path: '/settings', permission: 'settings' }
    ];

    if (loading) return null;

    return (
        <aside className="w-sidebar h-screen fixed left-0 top-0 bg-white border-r border-tvs-border z-sidebar flex flex-col shadow-sm transition-all duration-300">
            <div className="h-header flex items-center justify-center border-b border-tvs-border bg-white">
                <div className="flex items-center gap-3">
                    <img src={tvsLogo} alt="TVS Logo" className="h-[150px] w-auto rounded object-contain p-2" />
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-6">
                <ul className="space-y-2 px-3 list-none">
                    {navItems.map((item) => {
                        // Only render if user has permission
                        if (item.permission && !hasPermission(item.permission)) {
                            return null;
                        }

                        return (
                            <li key={item.name}>
                                <NavLink
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-medium text-sm
                                         ${isActive
                                            ? 'bg-tvs-blue text-white shadow-md'
                                            : 'text-gray-500 hover:bg-gray-50 hover:text-tvs-blue'
                                        }`
                                    }
                                >
                                    <item.icon size={20} />
                                    <span>{item.name}</span>
                                </NavLink>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Notifications Removed */}
            <div className="p-4 border-t border-tvs-border bg-gray-50">
                {/* Empty footer area or could be removed entirely if desired, keeping for spacing consistency for now but empty content inside if needed, 
                 actually removing the inner content is best based on request */}
            </div>
        </aside>
    );
};

export default Sidebar;