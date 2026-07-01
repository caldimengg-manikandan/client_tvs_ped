import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Bell, ArrowLeft, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function EstimationLayout() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const timeString = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    }).toLowerCase();

    const dateString = currentTime.toLocaleDateString('en-US', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.split(' ');
        if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
        return name.slice(0, 2).toUpperCase();
    };

    return (
        <div className="flex flex-col min-h-screen bg-white font-inter">
            {/* Top Bar */}
            <header className="h-[72px] border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 bg-white z-50">
                {/* Left: Back Button */}
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
                >
                    <ArrowLeft size={18} />
                    <span className="font-semibold text-sm">Back</span>
                </button>

                {/* Center: Title */}
                <div className="absolute left-1/2 -translate-x-1/2">
                    <h1 className="text-xl font-bold text-[#0F4C81]">Estimation</h1>
                </div>

                {/* Right: Info & Profile */}
                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <div className="text-sm font-bold text-slate-700">{timeString}</div>
                        <div className="text-[11px] font-medium text-slate-400">{dateString}</div>
                    </div>
                    
                    <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
                        <Bell size={20} />
                        <span className="absolute top-0 right-0 w-2 h-2 bg-[#B31818] rounded-full ring-2 ring-white"></span>
                    </button>

                    <div className="w-9 h-9 rounded-full bg-[#B31818] text-white flex items-center justify-center font-bold text-sm shadow-sm cursor-pointer hover:opacity-90 transition-opacity">
                        {getInitials(user?.employeeName || 'User')}
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-x-hidden relative">
                <Outlet />

                {/* Floating Action Button */}
                <button className="fixed bottom-8 right-8 w-14 h-14 bg-[#B31818] hover:bg-[#991515] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 z-50">
                    <MessageSquare size={24} />
                </button>
            </main>
        </div>
    );
}
