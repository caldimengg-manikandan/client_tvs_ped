import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import InactivityTracker from './InactivityTracker';

const Layout = () => {
    const location = useLocation();

    return (
        <div className="flex h-screen bg-tvs-light selection:bg-tvs-blue/10 selection:text-tvs-blue font-inter">
            <InactivityTracker />
            <Sidebar />
            
            <div className="flex-1 pl-sidebar flex flex-col min-h-screen transition-all duration-300 relative overflow-hidden">
                {/* Global decorative background elements */}
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-tvs-blue/5 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-tvs-red/5 rounded-full blur-[100px] pointer-events-none"></div>
                
                <Header />
                
                <main className="flex-1 overflow-x-hidden p-8 mt-20 relative z-10 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="container mx-auto"
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
