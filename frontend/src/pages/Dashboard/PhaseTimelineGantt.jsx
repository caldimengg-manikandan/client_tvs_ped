import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const MOCK_ACTUALS = {
    'Initiated': 1.2,
    'Design': 5.8,
    'PR/PO': 2.1,
    'Sample Prod.': 4.5,
    'Prod. Ready': 1.8,
    'Released': 0.5
};

const PHASE_COLORS = {
    'Initiated': 'bg-slate-500',
    'Design': 'bg-blue-500',
    'PR/PO': 'bg-amber-500',
    'Sample Prod.': 'bg-purple-500',
    'Prod. Ready': 'bg-emerald-500',
    'Released': 'bg-red-500'
};

const PhaseTimelineGantt = ({ data }) => {
    const targets = data?.kpiSettings?.phaseTargets || {
        'Initiated': 1.5,
        'Design': 4.0,
        'PR/PO': 3.0,
        'Sample Prod.': 5.0,
        'Prod. Ready': 2.0,
        'Released': 1.0
    };

    const cycleTimes = Object.keys(MOCK_ACTUALS).map(phase => {
        const actual = MOCK_ACTUALS[phase];
        const target = targets[phase] || 1.0;
        return {
            phase,
            actual,
            target,
            color: PHASE_COLORS[phase],
            isBottleneck: actual > target
        };
    });

    const maxTime = Math.max(...cycleTimes.map(p => Math.max(p.actual, p.target))) + 2;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 overflow-hidden relative">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Clock size={16} className="text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-extrabold text-[#0f172a] uppercase tracking-widest m-0">
                            Phase Cycle Times
                        </h3>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider m-0 mt-0.5">
                            Average Days (Actual vs Target)
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-5 relative">
                {/* Vertical grid lines */}
                <div className="absolute inset-0 ml-[100px] pointer-events-none flex justify-between z-0">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-full border-l border-dashed border-slate-200" />
                    ))}
                </div>

                {cycleTimes.map((item, index) => {
                    const actualPct = (item.actual / maxTime) * 100;
                    const targetPct = (item.target / maxTime) * 100;
                    
                    return (
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            key={item.phase} 
                            className="flex items-center gap-4 relative z-10"
                        >
                            <div className="w-[84px] shrink-0 text-right">
                                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                    {item.phase}
                                </span>
                            </div>
                            
                            <div className="flex-1 relative h-8 group">
                                {/* Target Bar (Background, faint) */}
                                <div 
                                    className="absolute top-1/2 -translate-y-1/2 h-2 rounded-full bg-slate-100"
                                    style={{ width: `${targetPct}%` }}
                                    title={`Target: ${item.target} days`}
                                />
                                {/* Target Marker Line */}
                                <div 
                                    className="absolute top-1 bottom-1 w-0.5 bg-slate-300 z-0"
                                    style={{ left: `${targetPct}%` }}
                                />
                                
                                {/* Actual Bar (Foreground, bold) */}
                                <div 
                                    className={`absolute top-1/2 -translate-y-1/2 h-4 rounded-full ${item.color} shadow-sm flex items-center justify-end px-2 transition-all duration-500 group-hover:h-5`}
                                    style={{ width: `${actualPct}%` }}
                                >
                                    <span className="text-[9px] font-extrabold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        {item.actual}d
                                    </span>
                                </div>

                                {item.isBottleneck && (
                                    <div 
                                        className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center ml-2 text-red-500 animate-pulse"
                                        style={{ left: `${Math.max(actualPct, targetPct)}%` }}
                                    >
                                        <AlertCircle size={14} />
                                    </div>
                                )}
                            </div>
                            
                            <div className="w-16 shrink-0 text-right">
                                <span className={`text-[11px] font-extrabold ${item.isBottleneck ? 'text-red-500' : 'text-slate-500'}`}>
                                    {item.actual}d
                                </span>
                                <span className="text-[9px] text-slate-400 font-medium ml-1">
                                    / {item.target}
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default PhaseTimelineGantt;
