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
        <div className="relative py-8">
            {/* Connection Line */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-[60px] hidden md:block z-0"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative z-10">
                {stages.map((stage, index) => {
                    const Icon = stage.icon;
                    const isActive = stage.count > 0;
                    
                    return (
                        <motion.div
                            key={stage.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex flex-col items-center"
                        >
                            {/* Icon Circle */}
                            <div className="relative mb-6">
                                <motion.div
                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-500 z-20 relative
                                        ${isActive 
                                            ? `bg-${stage.color === 'tvs-red' ? 'rose' : stage.color}-500 text-white shadow-${stage.color === 'tvs-red' ? 'rose' : stage.color}-200` 
                                            : 'bg-white text-gray-300 border border-gray-100'
                                        }`}
                                >
                                    <Icon size={24} />
                                </motion.div>
                                
                                {isActive && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0 }}
                                        animate={{ opacity: [0, 0.5, 0], scale: [1, 1.5, 2] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className={`absolute inset-0 rounded-2xl bg-${stage.color === 'tvs-red' ? 'rose' : stage.color}-500 -z-10`}
                                    />
                                )}
                            </div>

                            {/* Stage Content */}
                            <div className={`p-5 rounded-[2rem] border w-full text-center transition-all duration-300 group
                                ${isActive 
                                    ? 'bg-white border-gray-100 shadow-xl shadow-gray-100/50' 
                                    : 'bg-gray-50/50 border-transparent opacity-60'
                                }`}
                            >
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{stage.description}</div>
                                <h3 className={`text-sm font-black font-outfit truncate ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {stage.title}
                                </h3>
                                
                                <div className="mt-4 flex items-center justify-center gap-2">
                                    <span className={`text-2xl font-black font-outfit ${isActive ? `text-${stage.color === 'tvs-red' ? 'rose' : stage.color}-600` : 'text-gray-300'}`}>
                                        {stage.count}
                                    </span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Units</span>
                                </div>

                                {isActive && (
                                    <div className={`mt-3 h-1 w-12 mx-auto rounded-full bg-${stage.color === 'tvs-red' ? 'rose' : stage.color}-500/20`}>
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: '100%' }}
                                            transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                                            className={`h-full rounded-full bg-${stage.color === 'tvs-red' ? 'rose' : stage.color}-500`}
                                        />
                                    </div>
                                )}
                            </div>
                            
                            {/* Connector Arrow (desktop only) */}
                            {index < stages.length - 1 && (
                                <div className="hidden md:flex absolute right-[-15px] top-[20px] text-gray-200 z-0">
                                    <ChevronRight size={30} />
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
