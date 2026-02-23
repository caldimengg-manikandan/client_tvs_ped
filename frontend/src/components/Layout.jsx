import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
                // Auto open only if not manually closed by user
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
        <div className="flex h-screen bg-tvs-light selection:bg-tvs-blue/10 selection:text-tvs-blue font-inter overflow-hidden">
            <InactivityTracker />
            <Sidebar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={handleToggleSidebar}
                windowWidth={windowWidth}
            />

            <div className={`flex-1 ${isSidebarOpen ? 'lg:pl-[280px]' : 'lg:pl-[72px]'} pl-0 flex flex-col min-h-screen transition-all duration-300 relative overflow-hidden`}>
                {/* Global decorative background elements */}
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-tvs-blue/5 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-tvs-red/5 rounded-full blur-[100px] pointer-events-none"></div>

                <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={handleToggleSidebar} />

                <main className={`flex-1 overflow-x-hidden mt-20 relative z-10 custom-scrollbar flex flex-col ${['/mh-development-tracker', '/project-plan-model'].includes(location.pathname) ? 'p-4 md:p-6 lg:p-6' : 'p-8'}`}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className={['/project-plan-model', '/mh-development-tracker'].includes(location.pathname) ? 'w-full flex-1 flex flex-col' : 'container mx-auto'}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default Layout;