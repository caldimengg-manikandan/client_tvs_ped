import React from 'react';

const Skeleton = ({ className }) => {
    return (
        <div className={`animate-pulse bg-slate-100 rounded-lg ${className}`}></div>
    );
};

export const CardSkeleton = () => (
    <div className="saas-card p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="w-12 h-5 rounded-lg" />
        </div>
        <div className="space-y-2">
            <Skeleton className="w-16 h-4" />
            <Skeleton className="w-24 h-8" />
            <Skeleton className="w-32 h-4" />
        </div>
    </div>
);

export const TableRowSkeleton = () => (
    <div className="flex items-center gap-4 py-3 px-4 border-b border-slate-50">
        <Skeleton className="w-8 h-4" />
        <Skeleton className="w-24 h-4" />
        <Skeleton className="flex-1 h-4" />
        <Skeleton className="w-32 h-4" />
        <Skeleton className="w-20 h-4 rounded-full" />
    </div>
);

export default Skeleton;
