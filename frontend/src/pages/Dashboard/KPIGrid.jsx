import React from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { Clock, CheckCircle, Loader, XCircle, Package, Users, Truck, Mail, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Skeleton } from 'antd';

const STATUS_COLOURS = {
    green:  { border: 'border-l-[#1D9E75]', bg: 'bg-emerald-50', icon: 'text-[#1D9E75]', badge: 'bg-emerald-100 text-emerald-700' },
    amber:  { border: 'border-l-[#BA7517]', bg: 'bg-amber-50',   icon: 'text-[#BA7517]', badge: 'bg-amber-100 text-amber-700' },
    red:    { border: 'border-l-[#E24B4A]', bg: 'bg-red-50',     icon: 'text-[#E24B4A]', badge: 'bg-red-100 text-red-700' },
    blue:   { border: 'border-l-[#378ADD]', bg: 'bg-blue-50',    icon: 'text-[#378ADD]', badge: 'bg-blue-100 text-blue-700' },
    purple: { border: 'border-l-[#534AB7]', bg: 'bg-purple-50',  icon: 'text-[#534AB7]', badge: 'bg-purple-100 text-purple-700' },
    teal:   { border: 'border-l-[#0F6E56]', bg: 'bg-teal-50',    icon: 'text-[#0F6E56]', badge: 'bg-teal-100 text-teal-700' },
};

const TrendIcon = ({ pct }) => {
    if (pct === undefined || pct === null) return null;
    if (pct > 0) return <span className="flex items-center gap-0.5 text-emerald-600 text-xs font-bold"><TrendingUp size={11} />+{pct}%</span>;
    if (pct < 0) return <span className="flex items-center gap-0.5 text-red-500 text-xs font-bold"><TrendingDown size={11} />{pct}%</span>;
    return <span className="flex items-center gap-0.5 text-gray-400 text-xs font-bold"><Minus size={11} />0%</span>;
};

const KPICard = ({ icon: Icon, label, value, sub, colour, trend, alert, delay = 0 }) => {
    const c = STATUS_COLOURS[colour] || STATUS_COLOURS.blue;
    const isAlert = alert && value > alert;
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay }}
            className={`bg-white rounded-2xl border border-border border-l-4 ${c.border} shadow-sm p-4 flex flex-col gap-2 hover:shadow-md transition-shadow ${isAlert ? 'ring-1 ring-red-300' : ''}`}
        >
            <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center`}>
                    <Icon size={18} className={c.icon} />
                </div>
                {trend !== undefined && <TrendIcon pct={trend} />}
            </div>
            <div>
                <div className="text-2xl font-bold text-txt-1 font-outfit leading-none">
                    <CountUp end={value || 0} duration={1.2} separator="," />
                </div>
                <div className="text-xs font-semibold text-txt-3 mt-1 uppercase tracking-wide">{label}</div>
            </div>
            {sub && <div className="text-xs text-txt-3">{sub}</div>}
        </motion.div>
    );
};

const KPIGrid = ({ data, loading, user }) => {
    if (loading || !data) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-4">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-border p-4">
                        <Skeleton active paragraph={{ rows: 2 }} title={false} />
                    </div>
                ))}
            </div>
        );
    }

    const { mhSummary, assetSummary, topStats } = data;
    const isEmployee = user?.role === 'Employee';

    const cards = [
        {
            icon: Clock,
            label: 'MH Requested',
            value: isEmployee ? (mhSummary?.thisMonthRequested ?? 0) : (mhSummary?.totalRequested ?? 0),
            sub: isEmployee ? 'This month (your requests)' : `This month: ${mhSummary?.thisMonthRequested ?? 0}`,
            colour: 'blue',
            trend: mhSummary?.vsLastMonthPct,
        },
        {
            icon: CheckCircle,
            label: 'MH Approved',
            value: mhSummary?.totalApproved ?? 0,
            sub: `Approval rate: ${mhSummary?.approvalRate ?? 0}%`,
            colour: 'green',
        },
        {
            icon: Loader,
            label: 'MH Pending',
            value: mhSummary?.totalPending ?? 0,
            colour: 'amber',
            alert: 50,
        },
        {
            icon: XCircle,
            label: 'MH Rejected',
            value: mhSummary?.totalRejected ?? 0,
            colour: 'red',
            alert: 10,
        },
        {
            icon: Package,
            label: 'Active Assets',
            value: assetSummary?.totalAssets ?? 0,
            sub: `+${assetSummary?.recentlyAdded ?? 0} last 30 days`,
            colour: 'teal',
        },
        {
            icon: Users,
            label: 'PED Engineers',
            value: topStats?.activePEDEngineers ?? 0,
            sub: 'Active',
            colour: 'purple',
        },
        {
            icon: Truck,
            label: 'Active Vendors',
            value: topStats?.activeVendors ?? 0,
            colour: 'blue',
        },
        {
            icon: Mail,
            label: 'Emails Sent',
            value: topStats?.emailsDispatched ?? 0,
            sub: 'Auto-notifications',
            colour: 'blue',
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
            {cards.map((card, i) => (
                <KPICard key={i} {...card} delay={i * 0.05} />
            ))}
        </div>
    );
};

export default KPIGrid;
