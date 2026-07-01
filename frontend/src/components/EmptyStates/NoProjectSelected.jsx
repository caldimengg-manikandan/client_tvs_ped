import React from 'react';
import { HelpCircle } from 'lucide-react';

export default function NoProjectSelected() {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center h-[500px]">
            {/* Soft Red tint icon container */}
            <div className="w-20 h-20 bg-[#FFF0F0] rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-[#F5D0D0]">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-[#F5D0D0]">
                    <HelpCircle className="text-[#CC1F1F]" size={24} strokeWidth={2} />
                </div>
            </div>

            <h2 className="text-xl font-bold text-[#0F4C81] mb-3">No Project Selected</h2>
            
            <p className="text-slate-400 text-sm max-w-[460px] leading-relaxed">
                Please select a project from the dropdown at the top right to start view,
                configure, and manage erection takeoff schedules, connections,
                miscellaneous metals, cost codes and final bid summary details.
            </p>
        </div>
    );
}
