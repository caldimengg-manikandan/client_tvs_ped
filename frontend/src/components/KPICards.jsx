import React from 'react';
import { Package, CheckCircle, XCircle, Cog, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
            iconBg: 'bg-blue-50',
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
            iconBg: 'bg-emerald-50',
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
            iconBg: 'bg-indigo-50',
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
            iconBg: 'bg-rose-50',
            iconColor: 'text-rose-600',
            textColor: 'text-rose-900',
            accentColor: 'rose'
        },
    ];

    const total = kpis.reduce((sum, kpi) => sum + kpi.value, 0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, index) => {
                const Icon = kpi.icon;
                const progressPercent = total > 0 ? (kpi.value / total) * 100 : 0;

                return (
                    <motion.div
                        key={kpi.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        className={`group relative overflow-hidden glass-card p-6 rounded-3xl cursor-pointer`}
                        onClick={() => onCardClick && onCardClick(kpi.id)}
                    >
                        {/* Decorative background glow */}
                        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity bg-${kpi.accentColor}-500`}></div>
                        
                        <div className="relative flex flex-col h-full">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`${kpi.iconBg} p-3 rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon className={kpi.iconColor} size={22} />
                                </div>
                                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-gray-600 transition-colors">
                                    {kpi.label}
                                    <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </div>

                            <div className="mt-auto">
                                <div className="flex items-baseline gap-2">
                                    <h3 className={`text-3xl font-bold font-outfit ${kpi.textColor}`}>
                                        {kpi.value}
                                    </h3>
                                    {/* Optional secondary metric */}
                                    <span className="text-xs font-medium text-gray-400">requests</span>
                                </div>
                                
                                <p className="text-sm font-semibold text-gray-600 mt-1 font-inter">
                                    {kpi.title}
                                </p>

                                {/* Progress Indicator */}
                                <div className="mt-4">
                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                                            transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
                                            className={`h-full rounded-full bg-${kpi.accentColor}-500/80 shadow-[0_0_8px_rgba(0,0,0,0.05)]`}
                                        ></motion.div>
                                    </div>
                                    <div className="flex justify-between items-center mt-2 group-hover:opacity-100 transition-opacity duration-300">
                                        <span className="text-[10px] font-medium text-gray-400">Relative Volume</span>
                                        <span className="text-[10px] font-bold text-gray-500">{Math.round(progressPercent)}%</span>
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
