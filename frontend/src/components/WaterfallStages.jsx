import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Settings, Package, Rocket, ChevronRight } from 'lucide-react';

const WaterfallStages = ({ stats }) => {
    const stages = [
        {
            title: 'Request',
            count: stats?.requestStage || 0,
            id: 'request',
            description: 'Assets Received',
            icon: Package,
            color: 'blue'
        },
        {
            title: 'Design',
            count: stats?.designStage || 0,
            id: 'design',
            description: 'Engineering',
            icon: Settings,
            color: 'purple'
        },
        {
            title: 'Approval',
            count: stats?.designApprovedStage || 0,
            id: 'design_approved',
            description: 'QC Validated',
            icon: CheckCircle,
            color: 'emerald'
        },
        {
            title: 'Implementation',
            count: stats?.implementationStage || 0,
            id: 'implementation',
            description: 'Workshop',
            icon: Clock,
            color: 'amber'
        },
        {
            title: 'Production',
            count: stats?.productionStage || 0,
            id: 'production',
            description: 'Deployed',
            icon: Rocket,
            color: 'tvs-red'
        },
    ];

    return (
        <div className="relative py-12">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-gray-100 -translate-y-[80px] hidden md:block z-0 opacity-50"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative z-10">
                {stages.map((stage, index) => {
                    const Icon = stage.icon;
                    const isActive = stage.count > 0;
                    const stageColor = stage.color === 'tvs-red' ? 'rose' : stage.color;
                    
                    return (
                        <motion.div
                            key={stage.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex flex-col items-center group/stage"
                        >
                            {/* Icon Circle */}
                            <div className="relative mb-8">
                                <motion.div
                                    whileHover={{ scale: 1.15, rotate: 8 }}
                                    className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 z-20 relative
                                        ${isActive 
                                            ? `bg-${stageColor}-500 text-white shadow-${stageColor}-200` 
                                            : 'bg-white text-gray-300 border border-gray-100'
                                        }`}
                                >
                                    <Icon size={28} className={isActive ? 'animate-pulse' : ''} />
                                </motion.div>
                                
                                {isActive && (
                                    <>
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0 }}
                                            animate={{ opacity: [0, 0.4, 0], scale: [1, 1.4, 1.8] }}
                                            transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                                            className={`absolute inset-0 rounded-2xl bg-${stageColor}-400 -z-10`}
                                        />
                                        <div className={`absolute -inset-4 bg-${stageColor}-500/5 rounded-full blur-2xl -z-20 opacity-0 group-hover/stage:opacity-100 transition-opacity duration-500`}></div>
                                    </>
                                )}
                            </div>

                            {/* Stage Content */}
                            <div className={`p-6 rounded-[2.5rem] border w-full text-center transition-all duration-500 backdrop-blur-sm relative overflow-hidden
                                ${isActive 
                                    ? 'bg-white/80 border-gray-100 shadow-xl shadow-gray-200/50' 
                                    : 'bg-gray-50/30 border-transparent opacity-40'
                                }`}
                            >
                                {isActive && <div className={`absolute top-0 left-0 w-full h-1 bg-${stageColor}-500/30`}></div>}
                                
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-2">{stage.description}</div>
                                <h3 className={`text-sm font-black font-outfit truncate ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {stage.title}
                                </h3>
                                
                                <div className="mt-5 flex flex-col items-center gap-1">
                                    <span className={`text-3xl font-black font-outfit tracking-tighter ${isActive ? `text-${stageColor}-600` : 'text-gray-300'}`}>
                                        {stage.count}
                                    </span>
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Units</span>
                                </div>

                                {isActive && (
                                    <div className={`mt-4 h-1 w-16 mx-auto rounded-full bg-gray-100 overflow-hidden`}>
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: '100%' }}
                                            transition={{ duration: 1.5, delay: 0.5 + index * 0.1 }}
                                            className={`h-full rounded-full bg-gradient-to-r from-${stageColor}-400 to-${stageColor}-600`}
                                        />
                                    </div>
                                )}
                            </div>
                            
                            {/* Connector Arrow (desktop only) */}
                            {index < stages.length - 1 && (
                                <div className="hidden md:flex absolute right-[-20px] top-[30px] text-gray-200 z-0">
                                    <ChevronRight size={32} className="opacity-30 group-hover/stage:opacity-100 group-hover/stage:translate-x-2 transition-all duration-500" />
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default WaterfallStages;
