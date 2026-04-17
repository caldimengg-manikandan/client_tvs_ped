import React from 'react';
import { Package, CheckCircle, XCircle, Cog, ArrowUpRight, TrendingUp } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const KPICardItem = ({ kpi, index, onCardClick, total }) => {
    const Icon = kpi.icon;
    const pct = total > 0 ? Math.round((kpi.value / total) * 100) : 0;
    const isPositive = !kpi.trend.startsWith('-');

    // 3D Tilt Values
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const mouseXSpring = useSpring(x);
    const mouseYSpring = useSpring(y);
    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = (e) => {
        x.set(0);
        y.set(0);
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(13,27,62,0.06)';
        e.currentTarget.style.borderColor = '#E0E4EF';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.45 }}
            style={{
                rotateX,
                rotateY,
                perspective: 1000,
                transformStyle: "preserve-3d",
                background: '#ffffff',
                border: '1px solid #E0E4EF',
                boxShadow: '0 2px 12px rgba(13,27,62,0.06)',
                padding: '24px',
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={e => {
                e.currentTarget.style.boxShadow = `0 12px 36px ${kpi.glow}, 0 4px 12px rgba(13,27,62,0.06)`;
                e.currentTarget.style.borderColor = `${kpi.accent}33`;
            }}
            onClick={() => onCardClick?.(kpi.id)}
            className="relative overflow-hidden rounded-2xl cursor-pointer group"
        >
            {/* Gradient top stripe */}
            <div
                className="absolute top-0 left-0 right-0 h-[3.5px]"
                style={{ background: kpi.gradient, transform: 'translateZ(10px)' }}
            />

            {/* Background blob on hover */}
            <div
                className="absolute -right-8 -top-8 w-28 h-28 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: kpi.light, filter: 'blur(20px)', transform: 'translateZ(5px)' }}
            />

            <div className="relative z-10" style={{ transform: "translateZ(30px)" }}>
                {/* Top row */}
                <div className="flex items-center justify-between mb-5">
                    <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-500 group-hover:rotate-6"
                        style={{ background: kpi.light }}
                    >
                        <Icon size={20} style={{ color: kpi.accent }} />
                    </div>

                    {/* Trend badge */}
                    <div
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold"
                        style={{
                            background: isPositive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            color: isPositive ? '#059669' : '#DC2626',
                        }}
                    >
                        <TrendingUp size={10} style={{ transform: isPositive ? 'none' : 'scaleY(-1)' }} />
                        {kpi.trend}
                    </div>
                </div>

                {/* Value */}
                <div className="flex items-baseline gap-1.5 mb-1">
                    <span
                        className="text-[38px] font-black leading-none"
                        style={{ fontFamily: 'Outfit, sans-serif', color: '#0D1B3E' }}
                    >
                        {kpi.value}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#B0BBC9' }}>
                        Reqs
                    </span>
                </div>

                <p className="text-[12px] font-semibold mb-4" style={{ color: '#7B8AAB' }}>
                    {kpi.title}
                </p>

                {/* Progress bar */}
                <div>
                    <div
                        className="h-1.5 w-full rounded-full overflow-hidden"
                        style={{ background: 'rgba(13,27,62,0.06)' }}
                    >
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ delay: 0.6 + index * 0.1, duration: 1.2, ease: 'easeOut' }}
                            className="h-full rounded-full"
                            style={{ background: kpi.gradient }}
                        />
                    </div>
                    <div className="flex justify-between mt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#B0BBC9' }}>
                            Share
                        </span>
                        <span className="text-[10px] font-black" style={{ color: kpi.accent }}>
                            {pct}%
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const KPICards = ({ stats, onCardClick }) => {
    const kpis = [
        {
            id: 'total',
            title: 'Total Requests',
            label: 'All Requests',
            value: stats?.totalRequests || 0,
            icon: Package,
            gradient: 'linear-gradient(135deg, #253C80, #1C3A6E)',
            glow: 'rgba(37, 60, 128, 0.22)',
            accent: '#253C80',
            light: 'rgba(37, 60, 128, 0.08)',
            trend: '+12%',
        },
        {
            id: 'accepted',
            title: 'Approved',
            label: 'Accepted',
            value: stats?.accepted || 0,
            icon: CheckCircle,
            gradient: 'linear-gradient(135deg, #00C9A7, #00A98A)',
            glow: 'rgba(0, 201, 167, 0.22)',
            accent: '#00C9A7',
            light: 'rgba(0, 201, 167, 0.08)',
            trend: '+8%',
        },
        {
            id: 'implemented',
            title: 'Implemented',
            label: 'Done',
            value: stats?.implemented || 0,
            icon: Cog,
            gradient: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
            glow: 'rgba(139, 92, 246, 0.22)',
            accent: '#8B5CF6',
            light: 'rgba(139, 92, 246, 0.08)',
            trend: '+5%',
        },
        {
            id: 'rejected',
            title: 'Rejected',
            label: 'Rejected',
            value: stats?.rejected || 0,
            icon: XCircle,
            gradient: 'linear-gradient(135deg, #EF4444, #DC2626)',
            glow: 'rgba(239, 68, 68, 0.22)',
            accent: '#EF4444',
            light: 'rgba(239, 68, 68, 0.08)',
            trend: '-3%',
        },
    ];

    const total = kpis.reduce((s, k) => s + k.value, 0);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {kpis.map((kpi, index) => (
                <KPICardItem
                    key={kpi.id}
                    kpi={kpi}
                    index={index}
                    total={total}
                    onCardClick={onCardClick}
                />
            ))}
        </div>
    );
};

export default KPICards;
