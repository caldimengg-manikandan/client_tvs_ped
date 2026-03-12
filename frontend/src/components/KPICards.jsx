import React from 'react';
import { Package, CheckCircle, XCircle, Cog, ArrowUpRight, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const KPICards = ({ stats, onCardClick }) => {
    const kpis = [
        {
            title: 'Asset Requests',
            label: 'Total',
            value: stats?.totalRequests || 0,
            id: 'total',
            icon: Package,
            colorClass: 'text-primary',
            bgClass: 'bg-primary/5',
            trend: '+12%',
            trendUp: true
        },
        {
            title: 'Approved',
            label: 'Accepted',
            value: stats?.accepted || 0,
            id: 'accepted',
            icon: CheckCircle,
            colorClass: 'text-emerald-600',
            bgClass: 'bg-emerald-50',
            trend: '+8%',
            trendUp: true
        },
        {
            title: 'Implemented',
            label: 'Production',
            value: stats?.implemented || 0,
            id: 'implemented',
            icon: Cog,
            colorClass: 'text-amber-600',
            bgClass: 'bg-amber-50',
            trend: '+5%',
            trendUp: true
        },
        {
            title: 'Rejected',
            label: 'Declined',
            value: stats?.rejected || 0,
            id: 'rejected',
            icon: XCircle,
            colorClass: 'text-rose-600',
            bgClass: 'bg-rose-50',
            trend: '-2%',
            trendUp: false
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, index) => {
                const Icon = kpi.icon;
                
                return (
                    <motion.div
                        key={kpi.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -4, transition: { duration: 0.2 } }}
                        className="saas-card relative group cursor-pointer"
                        onClick={() => onCardClick && onCardClick(kpi.id)}
                    >
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <div className={`w-10 h-10 rounded-xl ${kpi.bgClass} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
                                    <Icon className={kpi.colorClass} size={20} />
                                </div>
                                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black ${kpi.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    <TrendingUp size={12} className={kpi.trendUp ? '' : 'rotate-180'} />
                                    {kpi.trend}
                                </div>
                            </div>

                            <div>
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">
                                    {kpi.label}
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter font-mono">
                                        {kpi.value}
                                    </h3>
                                    <ArrowUpRight size={16} className="text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                                </div>
                                <p className="text-xs font-bold text-slate-500 mt-1">
                                    {kpi.title}
                                </p>
                            </div>

                            {/* Decorative line */}
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-100 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
};

export default KPICards;
