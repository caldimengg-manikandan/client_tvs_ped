import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import InactivityTracker from './InactivityTracker';

const Layout = () => {
    return (
        <div className="flex h-screen bg-tvs-light">
            <InactivityTracker />
            <Sidebar />
            <div className="flex-1 ml-sidebar flex flex-col min-h-screen transition-all duration-300">
                <Header />
                <main className="flex-1 overflow-x-hidden p-8 mt-20 fade-in">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
