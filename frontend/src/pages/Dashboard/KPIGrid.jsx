import React from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import {
    Clock, CheckCircle, Loader, XCircle, Package, Users,
    TrendingUp, TrendingDown, Minus
} from 'lucide-react';
import { Skeleton } from 'antd';
import KanbanPipeline from './KanbanPipeline';

/* ── Custom SVG Sparkline ─────────────────────────────────── */
const Sparkline = ({ data, color }) => {
    if (!data || data.length === 0) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min === 0 ? 1 : max - min;
    const width = 60;
    const height = 24;
    
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="overflow-visible">
            <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                className="drop-shadow-sm"
            />
        </svg>
    );
};

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
    green:  { text: '#10B981', bg: 'bg-emerald-50' },
    amber:  { text: '#F59E0B', bg: 'bg-amber-50' },
    red:    { text: '#EF4444', bg: 'bg-red-50' },
    blue:   { text: '#3B82F6', bg: 'bg-blue-50' },
    purple: { text: '#8B5CF6', bg: 'bg-purple-50' },
    teal:   { text: '#14B8A6', bg: 'bg-teal-50' },
};

const TrendIcon = ({ pct, lastMonthVal }) => {
    if (pct === undefined || pct === null) return null;
    const suffix = lastMonthVal ? ` vs ${lastMonthVal} last mo.` : '';
    if (pct > 0) return <span className="flex items-center gap-0.5 text-emerald-600 text-[10px] font-bold whitespace-nowrap"><TrendingUp size={10} />+{pct}%<span className="text-slate-400 font-medium ml-1 hidden lg:inline">{suffix}</span></span>;
    if (pct < 0) return <span className="flex items-center gap-0.5 text-red-500 text-[10px] font-bold whitespace-nowrap"><TrendingDown size={10} />{pct}%<span className="text-slate-400 font-medium ml-1 hidden lg:inline">{suffix}</span></span>;
    return <span className="flex items-center gap-0.5 text-gray-400 text-[10px] font-bold whitespace-nowrap"><Minus size={10} />0%<span className="text-slate-400 font-medium ml-1 hidden lg:inline">{suffix}</span></span>;
};

/* ── Mini KPI card ────────────────────────────────────────── */
const MiniKPICard = ({ icon: Icon, label, value, colour, trend, target, alert, delay = 0, onClick, isActive }) => {
    const c = STATUS_COLOURS[colour] || STATUS_COLOURS.blue;
    const isAlert = alert && value > alert;
    
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay }}
            onClick={onClick}
            className={`
                relative bg-white rounded-xl p-3 flex items-center justify-between cursor-pointer transition-all duration-300
                ${isActive 
                    ? 'border border-[#F59E0B] shadow-md bg-amber-50/10 scale-[1.02]' 
                    : 'border border-slate-200 shadow-sm hover:shadow hover:border-slate-300'}
                ${isAlert && !isActive ? 'border-red-300 bg-red-50/30' : ''}
            `}
        >
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center shrink-0`}>
                    <Icon size={16} color={c.text} />
                </div>
                <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</div>
                    <div className="text-xl font-extrabold text-[#0f172a] font-outfit leading-none tracking-tight mt-0.5">
                        <CountUp end={value || 0} duration={1.2} separator="," />
                    </div>
                </div>
            </div>
            <div className="text-right flex flex-col items-end">
                <TrendIcon pct={trend} />
                {target && (
                    <span className="text-[9px] text-slate-400 font-medium mt-1 uppercase tracking-wider">
                        Limit: {target}
                    </span>
                )}
            </div>
        </motion.div>
    );
};

/* ── Phase KPI card (Expanded) ────────────────────────────── */
const PhaseKPICard = ({ stage, colour, count, total, delay = 0, onClick, isActive, isBottleneck }) => {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay }}
            onClick={onClick}
            className={`
                relative bg-white rounded-2xl p-5 flex flex-col justify-between cursor-pointer transition-all duration-300 h-full min-h-[160px]
                ${isActive 
                    ? 'border-2 border-[#F59E0B] shadow-lg scale-[1.02] z-10' 
                    : 'border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 hover:-translate-y-1'}
                ${isBottleneck ? 'bg-red-50/10 border-red-200' : ''}
            `}
        >
            <div>
                <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${colour}1A` }}>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colour }} />
                    </div>
                    {isBottleneck && (
                        <div className="flex items-center gap-1 text-red-500 bg-red-50 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">
                            ⚠️ Bottleneck
                        </div>
                    )}
                    {isActive && !isBottleneck && (
                        <div className="text-[#F59E0B] bg-[#F59E0B]/10 text-[9px] font-extrabold px-2 py-1 rounded-full uppercase tracking-wider">
                            Selected
                        </div>
                    )}
                </div>
                <div className="text-[11px] font-extrabold uppercase tracking-widest mt-2 mb-1" style={{ color: colour }}>
                    {stage}
                </div>
            </div>
            
            <div>
                <div className="text-4xl font-black text-[#0f172a] font-outfit leading-none tracking-tighter">
                    <CountUp end={count || 0} duration={1.2} separator="," />
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Share</span>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {pct}%
                    </span>
                </div>
            </div>
            
            {/* Progress Bar background representing the percentage */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-50 rounded-b-2xl overflow-hidden">
                <div className="h-full transition-all duration-1000 ease-out" style={{ width: `${pct}%`, backgroundColor: colour }} />
            </div>
        </motion.div>
    );
};

/* ── Section label ────────────────────────────────────────── */
const SectionLabel = ({ children }) => (
    <div className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-slate-400 mb-2 pl-1">
        {children}
    </div>
);

/* ── Main grid ────────────────────────────────────────────── */
const KPIGrid = ({ data, loading, user, activeKpi, onKpiClick, onPhaseClick }) => {
    if (loading || !data) {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 h-[70px]">
                            <Skeleton active paragraph={{ rows: 1 }} title={false} />
                        </div>
                    ))}
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-4 h-[300px]">
                    <Skeleton active paragraph={{ rows: 4 }} title={false} />
                </div>
            </div>
        );
    }

    const { mhSummary, mhDevPhases, mhDevTotal, kpiSettings = {} } = data;
    const isEmployee = user?.role === 'Employee';

    // Build phase count lookup
    const phaseCountLookup = {};
    (mhDevPhases || []).forEach(p => { phaseCountLookup[p.stage] = p.count; });
    const phaseTotalCount = mhDevTotal || 0;

    /* ── 4 Core Metrics ── */
    const coreMetrics = [
        {
            icon: Clock,
            label: 'Requested',
            value: isEmployee ? (mhSummary?.thisMonthRequested ?? 0) : (mhSummary?.totalRequested ?? 0),
            colour: 'blue',
            trend: mhSummary?.vsLastMonthPct,
            kpiType: 'mh-requested',
            kpiTitle: 'All MH Requests',
        },
        {
            icon: CheckCircle,
            label: 'Approved',
            value: mhSummary?.totalApproved ?? 0,
            colour: 'green',
            trend: 5,
            kpiType: 'mh-approved',
            kpiTitle: 'Approved Requests',
        },
        {
            icon: Loader,
            label: 'Pending',
            value: mhSummary?.totalPending ?? 0,
            colour: 'amber',
            trend: -12,
            alert: kpiSettings?.pendingRequestsAlertThreshold || 50,
            target: kpiSettings?.pendingRequestsTarget || 20,
            kpiType: 'mh-pending',
            kpiTitle: 'Pending Requests',
        },
        {
            icon: XCircle,
            label: 'Rejected',
            value: mhSummary?.totalRejected ?? 0,
            colour: 'red',
            trend: -5,
            alert: kpiSettings?.rejectedRequestsAlertThreshold || 10,
            target: kpiSettings?.rejectedRequestsTarget || 10,
            kpiType: 'mh-rejected',
            kpiTitle: 'Rejected Requests',
        }
    ];

    return (
        <div className="flex flex-col gap-4">
            <style>{`
                ::view-transition-group(*),
                ::view-transition-old(*),
                ::view-transition-new(*) {
                    animation-duration: 0.25s;
                    animation-timing-function: cubic-bezier(0.19, 1, 0.22, 1);
                }
            `}</style>
            
            {/* ── ROW 1: 4 Core Metrics (Mini) ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {coreMetrics.map((card, i) => {
                    const isActive = activeKpi?.type === card.kpiType;
                    return (
                        <MiniKPICard
                            key={card.kpiType}
                            icon={card.icon}
                            label={card.label}
                            value={card.value}
                            colour={card.colour}
                            trend={card.trend}
                            target={card.target}
                            alert={card.alert}
                            delay={i * 0.05}
                            isActive={isActive}
                            onClick={onKpiClick ? () => onKpiClick(card.kpiType, card.kpiTitle) : undefined}
                        />
                    );
                })}
            </div>

            {/* ── ROW 2: Kanban Pipeline (Star of the Dashboard) ── */}
            <div>
                <SectionLabel>Kanban Pipeline</SectionLabel>
                <KanbanPipeline 
                    pipelineItems={data.pipelineItems} 
                    kpiSettings={data.kpiSettings} 
                    onPhaseClick={onPhaseClick} 
                />
            </div>
        </div>
    );
};

export default KPIGrid;
