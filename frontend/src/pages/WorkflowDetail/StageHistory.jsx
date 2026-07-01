/**
 * StageHistory.jsx
 * Immutable audit trail timeline for all workflow state transitions.
 * Enterprise Vertical Timeline with Lucide icons and Tailwind styling.
 */

import React from 'react';
import { 
    ClipboardSignature, CheckCircle2, XCircle, Search, 
    Palette, PenTool, ShieldCheck, ShieldAlert, 
    Settings, Rocket, PartyPopper, RefreshCw, AlertCircle, UserCircle 
} from 'lucide-react';

const ACTION_MAP = {
    SUBMITTED:           { icon: ClipboardSignature, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    APPROVED:            { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    REJECTED:            { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    CHECKER_APPROVED:    { icon: Search, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    CHECKER_REJECTED:    { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    DESIGNER_ASSIGNED:   { icon: Palette, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
    DESIGN_SUBMITTED:    { icon: PenTool, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200' },
    FINAL_APPROVED:      { icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    FINAL_REJECTED:      { icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
    IN_PRODUCTION:       { icon: Settings, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    IMPLEMENTATION:      { icon: Rocket, color: 'text-[#0F4C81]', bg: 'bg-[#0F4C81]/10', border: 'border-[#0F4C81]/20' },
    COMPLETED:           { icon: PartyPopper, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    MIGRATED_FROM_LEGACY:{ icon: RefreshCw, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200' },
    REVISION_REQUIRED:   { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200' },
};

export default function StageHistory({ stageHistory = [] }) {
    if (!stageHistory.length) {
        return (
            <div className="py-12 text-center text-slate-400">
                <RefreshCw size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No workflow activity recorded yet.</p>
            </div>
        );
    }

    const sorted = [...stageHistory].sort((a, b) =>
        new Date(b.timestamp) - new Date(a.timestamp)
    );

    return (
        <div className="relative pl-6 py-2">
            {/* Vertical line */}
            <div className="absolute left-[38px] top-6 bottom-6 w-0.5 bg-slate-100 rounded-full z-0" />

            <div className="space-y-6">
                {sorted.map((entry, idx) => {
                    const style = ACTION_MAP[entry.action] || ACTION_MAP.MIGRATED_FROM_LEGACY;
                    const Icon  = style.icon;

                    return (
                        <div key={idx} className="relative z-10 flex gap-5 group">
                            
                            {/* Timeline Node */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 shrink-0 transition-transform group-hover:scale-110 ${style.bg} ${style.border} ${style.color}`}>
                                <Icon size={18} strokeWidth={2.5} />
                            </div>

                            {/* Content Box */}
                            <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-4 shadow-[0_2px_12px_rgba(15,23,42,0.03)] group-hover:border-slate-200 group-hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] transition-all">
                                <div className="flex justify-between items-start mb-2 gap-4 flex-wrap">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                                            {entry.action?.replace(/_/g, ' ')}
                                        </span>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${style.bg} ${style.border} ${style.color}`}>
                                            {entry.stage}
                                        </span>
                                    </div>
                                    <span className="text-[11px] font-semibold text-slate-400">
                                        {new Date(entry.timestamp).toLocaleString('en-GB', { 
                                            day: 'numeric', month: 'short', year: 'numeric', 
                                            hour: '2-digit', minute: '2-digit' 
                                        })}
                                    </span>
                                </div>

                                {entry.actorName && (
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
                                        <UserCircle size={14} className="text-slate-400" />
                                        <span>{entry.actorName}</span>
                                        {entry.actorRole && <span className="text-slate-400 font-medium ml-1">({entry.actorRole})</span>}
                                    </div>
                                )}

                                {entry.comment && (
                                    <div className="mt-3 relative">
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-md ${style.bg.replace('bg-', 'bg-').replace('50', '400')}`} />
                                        <div className="bg-slate-50 text-[13px] text-slate-600 font-medium italic p-3 pl-4 rounded-r-md rounded-l-sm">
                                            "{entry.comment}"
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
