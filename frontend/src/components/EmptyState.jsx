import React from 'react';
import { motion } from 'framer-motion';
import { Search, Plus } from 'lucide-react';

const EmptyState = ({ 
    icon: Icon = Search, 
    title = "No results found", 
    description = "We couldn't find what you're looking for. Try adjusting your search or filters.",
    actionLabel,
    onAction
}) => {
    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 px-4 text-center"
        >
            <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-6 text-slate-300">
                <Icon size={40} strokeWidth={1.5} />
            </div>
            
            <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">
                {title}
            </h3>
            
            <p className="text-sm font-bold text-slate-500 max-w-sm mx-auto mb-8">
                {description}
            </p>
            
            {actionLabel && (
                <button
                    onClick={onAction}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:opacity-90 transition-all shadow-saas-md font-black text-sm"
                >
                    <Plus size={18} />
                    {actionLabel}
                </button>
            )}
        </motion.div>
    );
};

export default EmptyState;
