import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, TrendingDown, Clock, ChevronRight } from 'lucide-react';

const KPIAlertsPanel = ({ data }) => {
    // Generate some mock bottleneck logic based on typical data patterns
    // In a real scenario, this would come from the backend's analytics engine.
    
    // Mock conditions
    const hasBottleneck = true;
    
    if (!hasBottleneck) return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm relative overflow-hidden"
            >
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                    <AlertTriangle size={120} />
                </div>

                <div className="flex items-start gap-4 relative z-10">
                    <div className="bg-red-100 p-2.5 rounded-full text-red-600 mt-0.5">
                        <AlertTriangle size={20} />
                    </div>
                    <div>
                        <h3 className="text-red-800 font-bold text-sm m-0 uppercase tracking-wide">
                            Process Bottleneck Detected
                        </h3>
                        <p className="text-red-700 text-[13px] mt-1 mb-0 leading-relaxed max-w-2xl">
                            The <strong>Design Phase</strong> is currently taking <strong className="font-extrabold text-red-900">45% longer</strong> than its target duration (5.8 days vs 4.0 days target). This is increasing the risk of delay for 12 pending projects.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 relative z-10 w-full md:w-auto mt-2 md:mt-0">
                    <div className="bg-white/60 px-3 py-1.5 rounded-lg border border-red-200/50 flex items-center gap-2 text-xs font-semibold text-red-800">
                        <TrendingDown size={14} className="text-red-600" />
                        -1.8 Days Variance
                    </div>
                    <button className="flex items-center gap-1 text-xs font-bold text-red-700 hover:text-red-900 transition-colors bg-white hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 shadow-sm">
                        View At-Risk Items
                        <ChevronRight size={14} />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default KPIAlertsPanel;
