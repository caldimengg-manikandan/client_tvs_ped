/**
 * LeadTimeInsightCard.jsx
 * Executive AI Lead Time Intelligence Card
 * Displays lead time, confidence gauge, risk levels, and contributing factors.
 */

import React from 'react';
import { BrainCircuit, AlertTriangle, AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';

const getRiskLevel = (confidence, days) => {
    if (confidence < 60 || days > 45) return { level: 'High', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle };
    if (confidence < 80 || days > 20) return { level: 'Medium', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertCircle };
    return { level: 'Low', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CheckCircle2 };
};

export default function LeadTimeInsightCard({ leadTime, loading = false }) {
    if (loading) {
        return (
            <div className="bg-white rounded-[18px] shadow-[0_8px_32px_rgba(15,23,42,0.04)] border border-slate-100 overflow-hidden flex items-center justify-center min-h-[280px]">
                <div className="text-center text-slate-400">
                    <Loader2 size={32} className="mx-auto mb-3 animate-spin text-[#0F4C81]/50" />
                    <p className="text-sm font-semibold tracking-wide">Analyzing AI Lead Time...</p>
                </div>
            </div>
        );
    }

    if (!leadTime || leadTime.estimatedDays === null) {
        return (
            <div className="bg-white rounded-[18px] shadow-[0_8px_32px_rgba(15,23,42,0.04)] border border-slate-100 overflow-hidden flex items-center justify-center min-h-[280px] p-6 text-center">
                <div className="text-slate-400">
                    <BrainCircuit size={32} className="mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-semibold tracking-wide">AI Insight Not Available</p>
                    <p className="text-xs mt-1 text-slate-400">Lead time forecast will generate upon progression.</p>
                </div>
            </div>
        );
    }

    const { estimatedDays, confidence, factors = [], source } = leadTime;
    const risk = getRiskLevel(confidence, estimatedDays);
    const RiskIcon = risk.icon;

    return (
        <section className="bg-white rounded-[18px] shadow-[0_8px_32px_rgba(15,23,42,0.04)] border border-slate-100 overflow-hidden hover:-translate-y-[2px] transition-transform duration-300">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <BrainCircuit className="text-[#0F4C81]" size={16} />
                    <h2 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider">Lead Time Forecast</h2>
                </div>
                <span className="bg-slate-200 text-slate-600 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                    {source || 'AI_MODEL'}
                </span>
            </div>

            <div className="p-5">
                {/* Core Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {/* Forecast */}
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Forecast</div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-[#0F4C81] leading-none">{estimatedDays}</span>
                            <span className="text-sm font-semibold text-slate-500">Days</span>
                        </div>
                    </div>

                    {/* Risk Level */}
                    <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Risk Level</div>
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${risk.bg} ${risk.border} ${risk.color}`}>
                            <RiskIcon size={14} strokeWidth={2.5} />
                            <span className="text-xs font-bold uppercase tracking-wide">{risk.level}</span>
                        </div>
                    </div>
                </div>

                {/* Confidence Gauge */}
                <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <div className="flex justify-between items-end mb-2">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Confidence Score</div>
                        <div className="text-sm font-black text-slate-700">{confidence}%</div>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-700 ease-out" 
                            style={{ width: `${confidence}%` }}
                        />
                    </div>
                </div>

                {/* Contributing Factors */}
                {factors.length > 0 && (
                    <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <Info size={12} />
                            Contributing Factors
                        </div>
                        <ul className="space-y-2">
                            {factors.map((factor, i) => {
                                // determine icon based on factor text (very basic heuristic for the enterprise look)
                                const isPositive = factor.toLowerCase().includes('existing') || factor.toLowerCase().includes('standard');
                                const IconNode = isPositive ? CheckCircle2 : AlertCircle;
                                const iconColor = isPositive ? 'text-emerald-500' : 'text-amber-500';

                                return (
                                    <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600 font-medium bg-[#F8FAFC] p-2 rounded-lg border border-slate-100">
                                        <IconNode size={14} className={`shrink-0 mt-0.5 ${iconColor}`} />
                                        <span className="leading-relaxed">{factor}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </section>
    );
}
