import React from 'react';
import { Package, CheckCircle, XCircle, Cog } from 'lucide-react';

const KPICards = ({ stats, onCardClick }) => {
    const kpis = [
        {
            title: 'Asset Requests',
            label: 'Total',
            value: stats?.totalRequests || 0,
            id: 'total',
            icon: Package,
            color: 'red',
            bgColor: 'bg-red-50',
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            textColor: 'text-red-600',
            progressColor: 'bg-red-500'
        },
        {
            title: 'Approved Requests',
            label: 'Accepted',
            value: stats?.accepted || 0,
            id: 'accepted',
            icon: CheckCircle,
            color: 'green',
            bgColor: 'bg-green-50',
            iconBg: 'bg-green-100',
            iconColor: 'text-green-600',
            textColor: 'text-green-600',
            progressColor: 'bg-green-500'
        },
        {
            title: 'Implemented',
            label: 'Implemented',
            value: stats?.implemented || 0,
            id: 'implemented',
            icon: Cog,
            color: 'blue',
            bgColor: 'bg-blue-50',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            textColor: 'text-blue-600',
            progressColor: 'bg-blue-500'
        },
        {
            title: 'Rejected',
            label: 'Rejected',
            value: stats?.rejected || 0,
            id: 'rejected',
            icon: XCircle,
            color: 'red',
            bgColor: 'bg-red-50',
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            textColor: 'text-red-600',
            progressColor: 'bg-red-500'
        },
    ];

    // Calculate total for progress bar percentages
    const total = kpis.reduce((sum, kpi) => sum + kpi.value, 0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi) => {
                const Icon = kpi.icon;
                const progressPercent = total > 0 ? (kpi.value / total) * 100 : 0;

                return (
                    <div
                        key={kpi.id}
                        className={`${kpi.bgColor} rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer`}
                        onClick={() => onCardClick && onCardClick(kpi.id)}
                    >
                        {/* Icon and Value */}
                        <div className="flex items-start justify-between mb-4">
                            <div className={`${kpi.iconBg} p-3 rounded-lg`}>
                                <Icon className={kpi.iconColor} size={24} />
                            </div>
                            <div className="text-right">
                                <div className={`text-3xl font-bold ${kpi.textColor}`}>
                                    {kpi.value}
                                </div>
                                <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">
                                    {kpi.label}
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <div className="mb-3">
                            <h3 className="text-sm font-semibold text-gray-800">
                                {kpi.title}
                            </h3>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                                className={`${kpi.progressColor} h-full rounded-full transition-all duration-500`}
                                style={{ width: `${Math.min(progressPercent, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// Import Clock icon
import { Clock } from 'lucide-react';

export default KPICards;
