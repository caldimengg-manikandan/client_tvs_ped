import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import InactivityTracker from './InactivityTracker';

const Layout = () => {
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    // Handle responsiveness
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            setWindowWidth(width);
            if (width <= 1024) {
                setIsSidebarOpen(false);
            } else if (width > 1024 && !isSidebarOpen && !window.sidebarToggledManually) {
                setIsSidebarOpen(true);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isSidebarOpen]);

    const handleToggleSidebar = (state) => {
        window.sidebarToggledManually = true;
        setIsSidebarOpen(state);
    };

    return (
        <div className="flex h-screen bg-white font-inter overflow-hidden">
            <InactivityTracker />
            <Sidebar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={handleToggleSidebar}
                windowWidth={windowWidth}
            />

            <div className={`flex-1 ${isSidebarOpen ? 'lg:pl-64' : 'lg:pl-[72px]'} pl-0 flex flex-col min-h-screen transition-all duration-300 relative overflow-hidden`}>
                {/* Global Saas Background Gradient */}
                <div className="absolute top-0 left-0 w-full h-full bg-slate-50/50 pointer-events-none -z-10"></div>
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
                
                <Header 
                    isSidebarOpen={isSidebarOpen} 
                    setIsSidebarOpen={handleToggleSidebar} 
                />

                <main className="flex-1 mt-header p-4 lg:p-8 overflow-y-auto custom-scrollbar relative z-0">
                    <div className="max-w-[1600px] mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
