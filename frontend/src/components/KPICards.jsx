import React from 'react';
import { Package, CheckCircle, XCircle, Cog, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

const KPICards = ({ stats, onCardClick }) => {
    const kpis = [
        {
            title: 'Asset Requests',
            label: 'Total',
            value: stats?.totalRequests || 0,
            id: 'total',
            icon: Package,
            color: 'blue',
            bgColor: 'bg-white',
            iconBg: 'bg-blue-500/10',
            iconColor: 'text-blue-600',
            textColor: 'text-blue-900',
            accentColor: 'blue'
        },
        {
            title: 'Approved Requests',
            label: 'Accepted',
            value: stats?.accepted || 0,
            id: 'accepted',
            icon: CheckCircle,
            color: 'green',
            bgColor: 'bg-white',
            iconBg: 'bg-emerald-500/10',
            iconColor: 'text-emerald-600',
            textColor: 'text-emerald-900',
            accentColor: 'emerald'
        },
        {
            title: 'Implemented',
            label: 'Implemented',
            value: stats?.implemented || 0,
            id: 'implemented',
            icon: Cog,
            color: 'purple',
            bgColor: 'bg-white',
            iconBg: 'bg-indigo-500/10',
            iconColor: 'text-indigo-600',
            textColor: 'text-indigo-900',
            accentColor: 'indigo'
        },
        {
            title: 'Rejected',
            label: 'Rejected',
            value: stats?.rejected || 0,
            id: 'rejected',
            icon: XCircle,
            color: 'red',
            bgColor: 'bg-white',
            iconBg: 'bg-rose-500/10',
            iconColor: 'text-rose-600',
            textColor: 'text-rose-900',
            accentColor: 'rose'
        },
    ];

    const total = kpis.reduce((sum, kpi) => sum + kpi.value, 0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map((kpi, index) => {
                const Icon = kpi.icon;
                const progressPercent = total > 0 ? (kpi.value / total) * 100 : 0;

                return (
                    <motion.div
                        key={kpi.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        whileHover={{ y: -8, transition: { type: "spring", stiffness: 300 } }}
                        className="group relative overflow-hidden glass-card p-4 rounded-2xl cursor-pointer border border-white/40 shadow-lg hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300"
                        onClick={() => onCardClick && onCardClick(kpi.id)}
                    >
                        {/* Decorative background glow */}
                        <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity bg-${kpi.accentColor}-500/50`}></div>
                        
                        <div className="relative flex flex-col h-full z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`${kpi.iconBg} p-3 rounded-xl group-hover:rotate-6 transition-transform duration-500`}>
                                    <Icon className={kpi.iconColor} size={20} />
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-tvs-blue transition-colors">
                                    {kpi.label}
                                    <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                </div>
                            </div>

                            <div className="mt-auto">
                                <div className="flex items-baseline gap-2">
                                    <h3 className={`text-3xl font-black font-outfit tracking-tighter ${kpi.textColor}`}>
                                        {kpi.value}
                                    </h3>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 opacity-60">Reqs</span>
                                </div>
                                
                                <p className="text-xs font-bold text-gray-500 mt-1 font-inter">
                                    {kpi.title}
                                </p>

                                {/* Progress Indicator */}
                                <div className="mt-4">
                                    <div className="h-1 w-full bg-gray-100/50 rounded-full overflow-hidden p-[1px]">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                                            transition={{ delay: 0.8 + index * 0.1, duration: 1.5, ease: "easeOut" }}
                                            className={`h-full rounded-full bg-gradient-to-r from-${kpi.accentColor}-400 to-${kpi.accentColor}-600 shadow-[0_0_12px_rgba(0,0,0,0.1)]`}
                                        ></motion.div>
                                    </div>
                                    <div className="flex justify-between items-center mt-3">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Relative Weight</span>
                                        <span className={`text-[10px] font-black ${kpi.iconColor}`}>{Math.round(progressPercent)}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default KPICards;
