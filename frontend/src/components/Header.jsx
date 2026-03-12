import React, { useState, useEffect } from 'react';
import { 
    Bell, 
    Search, 
    User, 
    LogOut, 
    ChevronDown, 
    Menu,
    MessageSquare,
    Command
} from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Header = ({ isSidebarOpen, setIsSidebarOpen }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getBreadcrumbs = () => {
        const paths = location.pathname.split('/').filter(x => x);
        return paths.map((path, index) => {
            const url = `/${paths.slice(0, index + 1).join('/')}`;
            const isLast = index === paths.length - 1;
            const name = path.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            
            return (
                <div key={url} className="flex items-center">
                    <span className="mx-2 text-slate-300 font-medium">/</span>
                    <Link 
                        to={url} 
                        className={`text-xs font-bold transition-colors ${isLast ? 'text-slate-900 cursor-default' : 'text-slate-400 hover:text-primary'}`}
                        onClick={(e) => isLast && e.preventDefault()}
                    >
                        {name}
                    </Link>
                </div>
            );
        });
    };

    const displayName = user?.employeeName || user?.name || 'Admin User';
    const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

    return (
        <header className={`h-header fixed top-0 right-0 ${isSidebarOpen ? 'lg:left-64' : 'lg:left-[72px]'} left-0 bg-white/70 backdrop-blur-xl border-b border-slate-100 z-header px-4 lg:px-8 flex items-center justify-between transition-all duration-300`}>
            {/* Left Section - Breadcrumbs */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 transition-colors lg:hidden"
                >
                    <Menu size={20} />
                </button>
                
                <div className="hidden sm:flex items-center">
                    <Link to="/dashboard" className="text-xs font-bold text-slate-400 hover:text-primary transition-colors">
                        Dashboard
                    </Link>
                    {getBreadcrumbs()}
                </div>
            </div>

            {/* Middle Section - Search Removed */}
            <div className="hidden md:flex flex-1 max-w-md mx-8"></div>

            {/* Right Section - Actions & User */}
            <div className="flex items-center gap-2 sm:gap-4">
                {/* Time Display */}
                <div className="hidden lg:flex flex-col items-end mr-4">
                    <span className="text-[11px] font-black text-slate-900 tabular-nums">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-[-2px]">
                        {currentTime.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                </div>

                {/* Notifications */}
                <button className="relative p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-primary transition-all">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-white"></span>
                </button>

                {/* Vertical Divider */}
                <div className="w-px h-6 bg-slate-100 mx-1"></div>

                {/* User Dropdown */}
                <div className="relative">
                    <button 
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className={`flex items-center gap-2 p-1 pl-2 rounded-xl border transition-all ${isProfileOpen ? 'bg-slate-50 border-slate-200' : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'}`}
                    >
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-xs font-black text-slate-900 leading-none">{displayName}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{user?.role || 'User'}</span>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-black text-xs border border-primary/10">
                            {initials}
                        </div>
                        <ChevronDown size={14} className={`text-slate-400 transition-transform duration-300 ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isProfileOpen && (
                            <>
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-40 bg-transparent"
                                    onClick={() => setIsProfileOpen(false)}
                                />
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-saas-lg z-50 overflow-hidden py-1.5"
                                >
                                    <div className="px-4 py-3 border-b border-slate-50 mb-1">
                                        <p className="text-[13px] font-black text-slate-900">{displayName} </p>
                                        <p className="text-[11px] font-bold text-slate-400 truncate">{user?.email || ''}</p>
                                    </div>
                                    
                                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors text-left">
                                        <User size={16} className="text-slate-400" />
                                        Profile Settings
                                    </button>
                                    <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors text-left">
                                        <MessageSquare size={16} className="text-slate-400" />
                                        Support Chat
                                    </button>
                                    
                                    <div className="h-px bg-slate-50 my-1"></div>
                                    
                                    <button 
                                        onClick={logout}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 transition-colors text-left"
                                    >
                                        <LogOut size={16} />
                                        Sign out
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
};

export default Header;
