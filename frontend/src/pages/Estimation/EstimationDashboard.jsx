import React, { useState } from 'react';
import NoProjectSelected from '../../components/EmptyStates/NoProjectSelected';

const TABS = [
    { id: 'contracts', label: 'Contracts' },
    { id: 'estimation_model', label: 'ESTIMATION MODEL' },
    { id: 'erection', label: 'Erection Take-off' },
    { id: 'field_moment', label: 'Field Moment Conn.' },
    { id: 'misc_metals', label: 'Misc Metals' },
    { id: 'breakdown', label: 'Breakdown' },
    { id: 'estimate_datas', label: 'Estimate Datas' }
];

export default function EstimationDashboard() {
    const [selectedProject, setSelectedProject] = useState('');
    const [activeTab, setActiveTab] = useState('estimation_model');

    return (
        <div className="flex-1 flex flex-col p-6 w-full">
            
            {/* Filter Row */}
            <div className="flex items-center gap-4 mb-6">
                <span className="text-xs font-bold text-slate-500 tracking-wider">
                    SELECT PROJECT:
                </span>
                <select 
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="border border-slate-200 text-slate-600 text-sm rounded-lg px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-[#CC1F1F]/20 focus:border-[#CC1F1F] bg-white appearance-none cursor-pointer"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                        backgroundPosition: `right 0.75rem center`,
                        backgroundRepeat: `no-repeat`,
                        backgroundSize: `1.2em 1.2em`
                    }}
                >
                    <option value="">-- Choose Project --</option>
                    <option value="P1001">P1001 - Alpha Factory Expansion</option>
                    <option value="P1002">P1002 - Beta Warehouse Structural</option>
                </select>
            </div>

            {/* Main Card Container */}
            <div className="bg-white rounded-xl shadow-[0_2px_12px_rgba(15,23,42,0.04)] border border-slate-100 flex-1 flex flex-col overflow-hidden">
                
                {/* Tabs */}
                <div className="flex items-center overflow-x-auto border-b border-slate-100 px-2 scrollbar-hide">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-5 py-4 text-[13px] whitespace-nowrap transition-all border-b-2 font-bold ${
                                activeTab === tab.id 
                                    ? 'border-[#0F4C81] text-[#0F4C81]' 
                                    : 'border-transparent text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-slate-50/30 flex flex-col">
                    {!selectedProject ? (
                        <NoProjectSelected />
                    ) : (
                        <div className="p-8 text-center text-slate-500">
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Project Selected</h3>
                            <p>You have selected project {selectedProject}. This is the {TABS.find(t => t.id === activeTab)?.label} view.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
