import React from 'react';
import { Users, TrendingDown, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const MOCK_TEAM_PERFORMANCE = [
    { team: 'Sourcing Team A', phase: 'Initiated', avgTime: 1.1, target: 1.5, rating: 'Excellent' },
    { team: 'Design Team B', phase: 'Design', avgTime: 5.8, target: 4.0, rating: 'Needs Attention' },
    { team: 'Procurement', phase: 'PR/PO', avgTime: 2.1, target: 3.0, rating: 'Good' },
    { team: 'Production Line 1', phase: 'Sample Prod.', avgTime: 4.5, target: 5.0, rating: 'Good' },
];

const RatingBadge = ({ rating }) => {
    switch (rating) {
        case 'Excellent':
            return <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase">Excellent</span>;
        case 'Good':
            return <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase">Good</span>;
        case 'Needs Attention':
            return <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase">Needs Attention</span>;
        default:
            return null;
    }
};

const TeamPerformanceMetrics = () => {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 overflow-hidden flex flex-col h-full">
            <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                    <Users size={16} className="text-purple-600" />
                </div>
                <div>
                    <h3 className="text-sm font-extrabold text-[#0f172a] uppercase tracking-widest m-0">
                        Team Performance
                    </h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider m-0 mt-0.5">
                        Grouped by Phase
                    </p>
                </div>
            </div>

            <div className="flex-1">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100">
                            <th className="py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Team / Phase</th>
                            <th className="py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-right">Avg Days</th>
                            <th className="py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {MOCK_TEAM_PERFORMANCE.map((item, idx) => {
                            const isOver = item.avgTime > item.target;
                            return (
                                <motion.tr 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    key={item.team} 
                                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors"
                                >
                                    <td className="py-3">
                                        <div className="text-[12px] font-bold text-slate-700">{item.team}</div>
                                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{item.phase}</div>
                                    </td>
                                    <td className="py-3 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className={`text-[12px] font-extrabold ${isOver ? 'text-red-600' : 'text-slate-700'}`}>
                                                {item.avgTime}d
                                            </span>
                                            <span className="text-[9px] text-slate-400 font-medium">Target: {item.target}d</span>
                                        </div>
                                    </td>
                                    <td className="py-3 text-center">
                                        <RatingBadge rating={item.rating} />
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TeamPerformanceMetrics;
