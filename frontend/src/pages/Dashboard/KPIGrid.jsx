import React from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import {
    Clock, CheckCircle, Loader, XCircle, Package, Users,
    TrendingUp, TrendingDown, Minus, ChevronRight
} from 'lucide-react';
import { Skeleton } from 'antd';

/* ── Stage config ─────────────────────────────────────────── */
const PHASE_STAGES = [
    { stage: 'Initiated',    colour: '#64748B' },
    { stage: 'Design',       colour: '#3B82F6' },
    { stage: 'PR/PO',        colour: '#F59E0B' },
    { stage: 'Sample Prod.', colour: '#8B5CF6' },
    { stage: 'Prod. Ready',  colour: '#10B981' },
    { stage: 'Released',     colour: '#CC1F1F' },
];

/* ── Colour palette for existing KPI cards ────────────────── */
const STATUS_COLOURS = {
    green:  { border: 'border-l-[#1D9E75]', bg: 'bg-emerald-50', icon: 'text-[#1D9E75]' },
    amber:  { border: 'border-l-[#BA7517]', bg: 'bg-amber-50',   icon: 'text-[#BA7517]' },
    red:    { border: 'border-l-[#E24B4A]', bg: 'bg-red-50',     icon: 'text-[#E24B4A]' },
    blue:   { border: 'border-l-[#378ADD]', bg: 'bg-blue-50',    icon: 'text-[#378ADD]' },
    purple: { border: 'border-l-[#534AB7]', bg: 'bg-purple-50',  icon: 'text-[#534AB7]' },
    teal:   { border: 'border-l-[#0F6E56]', bg: 'bg-teal-50',    icon: 'text-[#0F6E56]' },
};

const TrendIcon = ({ pct }) => {
    if (pct === undefined || pct === null) return null;
    if (pct > 0) return <span className="flex items-center gap-0.5 text-emerald-600 text-xs font-bold"><TrendingUp size={11} />+{pct}%</span>;
    if (pct < 0) return <span className="flex items-center gap-0.5 text-red-500 text-xs font-bold"><TrendingDown size={11} />{pct}%</span>;
    return <span className="flex items-center gap-0.5 text-gray-400 text-xs font-bold"><Minus size={11} />0%</span>;
};

/* ── Regular KPI card ─────────────────────────────────────── */
const KPICard = ({ icon: Icon, label, value, sub, colour, trend, alert, delay = 0, onClick }) => {
    const c = STATUS_COLOURS[colour] || STATUS_COLOURS.blue;
    const isAlert = alert && value > alert;
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay }}
            onClick={onClick}
            className={`bg-white rounded-2xl border border-border border-l-4 ${c.border} shadow-sm p-4 flex flex-col gap-2 hover:shadow-md transition-all ${isAlert ? 'ring-1 ring-red-300' : ''} ${onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}
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

/* ── Phase KPI card ───────────────────────────────────────── */
const PhaseKPICard = ({ stage, colour, count, total, delay = 0, onClick }) => {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay }}
            onClick={onClick}
            whileHover={{ y: -2, boxShadow: '0 4px 16px rgba(0,0,0,0.10)' }}
            className="bg-white rounded-2xl border border-border shadow-sm p-4 flex flex-col gap-1.5 cursor-pointer transition-all"
            style={{ borderLeft: `3px solid ${colour}` }}
        >
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide" style={{ color: colour }}>
                    {stage}
                </span>
                <ChevronRight size={14} className="text-txt-3" />
            </div>
            <div className="text-2xl font-bold text-txt-1 font-outfit leading-none">
                <CountUp end={count || 0} duration={1.2} separator="," />
            </div>
            <div className="text-xs text-txt-3">{pct}% of total</div>
            <div className="text-xs text-txt-3">items in this phase</div>
        </motion.div>
    );
};

/* ── Section label ────────────────────────────────────────── */
const SectionLabel = ({ children }) => (
    <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-txt-3 mt-1 mb-1">
        {children}
    </div>
);

/* ── Main grid ────────────────────────────────────────────── */
const KPIGrid = ({ data, loading, user, onKpiClick, onPhaseClick }) => {
    if (loading || !data) {
        return (
            <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-border p-4">
                            <Skeleton active paragraph={{ rows: 2 }} title={false} />
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-border p-4">
                            <Skeleton active paragraph={{ rows: 2 }} title={false} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const { mhSummary, assetSummary, topStats, mhDevPhases, mhDevTotal } = data;
    const isEmployee = user?.role === 'Employee';

    // Build phase count lookup
    const phaseCountLookup = {};
    (mhDevPhases || []).forEach(p => { phaseCountLookup[p.stage] = p.count; });
    const phaseTotalCount = mhDevTotal || 0;

    /* ── Row 1: Request overview cards ── */
    const overviewCards = [
        {
            icon: Clock,
            label: 'MH Requested',
            value: isEmployee ? (mhSummary?.thisMonthRequested ?? 0) : (mhSummary?.totalRequested ?? 0),
            sub: isEmployee ? 'This month (your requests)' : `This month: ${mhSummary?.thisMonthRequested ?? 0}`,
            colour: 'blue',
            trend: mhSummary?.vsLastMonthPct,
            kpiType: 'mh-requested',
            kpiTitle: 'All MH Requests',
        },
        {
            icon: CheckCircle,
            label: 'MH Approved',
            value: mhSummary?.totalApproved ?? 0,
            sub: `Approval rate: ${mhSummary?.approvalRate ?? 0}%`,
            colour: 'green',
            kpiType: 'mh-approved',
            kpiTitle: 'Approved Requests',
        },
        {
            icon: Loader,
            label: 'MH Pending',
            value: mhSummary?.totalPending ?? 0,
            colour: 'amber',
            alert: 50,
            kpiType: 'mh-pending',
            kpiTitle: 'Pending Requests',
        },
        {
            icon: XCircle,
            label: 'MH Rejected',
            value: mhSummary?.totalRejected ?? 0,
            colour: 'red',
            alert: 10,
            kpiType: 'mh-rejected',
            kpiTitle: 'Rejected Requests',
        },
        {
            icon: Package,
            label: 'Active Assets',
            value: assetSummary?.totalAssets ?? 0,
            sub: `+${assetSummary?.recentlyAdded ?? 0} last 30 days`,
            colour: 'teal',
            kpiType: 'assets',
            kpiTitle: 'Asset Register',
        },
        {
            icon: Users,
            label: 'Total Employees',
            value: topStats?.totalEmployees ?? 0,
            sub: 'Active headcount',
            colour: 'purple',
            kpiType: 'employees',
            kpiTitle: 'Employee Directory',
        },
    ];

    return (
        <div className="space-y-3">
            {/* ── ROW 1: Request Overview ── */}
            <SectionLabel>Request Overview</SectionLabel>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {overviewCards.map((card, i) => (
                    <KPICard
                        key={card.kpiType}
                        icon={card.icon}
                        label={card.label}
                        value={card.value}
                        sub={card.sub}
                        colour={card.colour}
                        trend={card.trend}
                        alert={card.alert}
                        delay={i * 0.05}
                        onClick={onKpiClick ? () => onKpiClick(card.kpiType, card.kpiTitle) : undefined}
                    />
                ))}
            </div>

            {/* ── ROW 2: MH Development Phases ── */}
            <SectionLabel>MH Development Phases</SectionLabel>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {PHASE_STAGES.map((ps, i) => (
                    <PhaseKPICard
                        key={ps.stage}
                        stage={ps.stage}
                        colour={ps.colour}
                        count={phaseCountLookup[ps.stage] ?? 0}
                        total={phaseTotalCount}
                        delay={0.3 + i * 0.05}
                        onClick={onPhaseClick ? () => onPhaseClick(ps.stage, ps.colour) : undefined}
                    />
                ))}
            </div>
        </div>
    );
};

export default KPIGrid;
