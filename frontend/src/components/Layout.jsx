import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import InactivityTracker from './InactivityTracker';

/* ── Page transition variants ── */
const pageVariants = {
    initial: { opacity: 0, y: 16, scale: 0.995 },
    animate: { opacity: 1, y: 0,  scale: 1 },
    exit:    { opacity: 0, y: -8, scale: 0.998 },
};
const pageTransition = {
    type: 'spring',
    stiffness: 340,
    damping: 32,
    mass: 0.8,
};

const Layout = () => {
    const location = useLocation();
    const mainRef  = useRef(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [windowWidth,   setWindowWidth]   = useState(window.innerWidth);

    /* Resize handler */
    useEffect(() => {
        const onResize = () => {
            const w = window.innerWidth;
            setWindowWidth(w);
            if (w <= 1024) setIsSidebarOpen(false);
            else if (!window.sidebarManualClose) setIsSidebarOpen(true);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    /* Scroll to top on every route change */
    useEffect(() => {
        if (mainRef.current) {
            mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [location.pathname]);

    const handleToggle = (state) => {
        window.sidebarManualClose = !state;
        setIsSidebarOpen(state);
    };

    const sidebarW   = isSidebarOpen ? 272 : 72;
    const isFullPage = ['/', '/mh-development-tracker', '/project-plan-model'].includes(location.pathname);

    return (
        <div className="flex h-screen font-inter" style={{ background: '#F5F7FA', overflow: 'hidden' }}>
            <InactivityTracker />

            <Sidebar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={handleToggle}
                windowWidth={windowWidth}
            />

            {/* Main area */}
            <div
                className="flex flex-col min-h-screen flex-1 relative overflow-hidden"
                style={{
                    marginLeft: windowWidth > 1024 ? sidebarW : 0,
                    transition: 'margin-left 0.32s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
            >
                {/* Ambient background blobs */}
                <div
                    className="absolute pointer-events-none"
                    style={{
                        top: '-8%', right: '-4%',
                        width: '38%', height: '38%',
                        background: 'rgba(0,201,167,0.04)',
                        borderRadius: '50%',
                        filter: 'blur(80px)',
                    }}
                />
                <div
                    className="absolute pointer-events-none"
                    style={{
                        bottom: '-6%', left: '-4%',
                        width: '30%', height: '30%',
                        background: 'rgba(37,60,128,0.05)',
                        borderRadius: '50%',
                        filter: 'blur(80px)',
                    }}
                />

                <Header isSidebarOpen={isSidebarOpen} setIsSidebarOpen={handleToggle} />

                <main
                    ref={mainRef}
                    className={`flex-1 overflow-x-hidden relative z-10 custom-scrollbar flex flex-col ${isFullPage ? 'p-4 md:p-5' : 'p-4 sm:p-6 lg:p-7'}`}
                    style={{ marginTop: 68, overflowY: 'auto', scrollBehavior: 'smooth' }}
                >
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={location.pathname}
                            variants={pageVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={pageTransition}
                            className={isFullPage ? 'w-full flex-1 flex flex-col' : 'w-full max-w-[1600px] mx-auto'}
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