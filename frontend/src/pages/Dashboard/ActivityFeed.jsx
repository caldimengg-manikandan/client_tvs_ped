import React from 'react';
import { Skeleton } from 'antd';
import { CheckCircle, XCircle, ArrowUpRight, AlertTriangle, Mail, Package } from 'lucide-react';
import { formatDistanceToNow } from '../../utils/dateUtils';

const EVENT_CONFIG = {
    approval:   { icon: CheckCircle,   colour: 'text-[#1D9E75]', dot: '#1D9E75',  bg: 'bg-emerald-50'  },
    rejection:  { icon: XCircle,       colour: 'text-[#E24B4A]', dot: '#E24B4A',  bg: 'bg-red-50'      },
    assignment: { icon: ArrowUpRight,  colour: 'text-[#378ADD]', dot: '#378ADD',  bg: 'bg-blue-50'     },
    vendor:     { icon: AlertTriangle, colour: 'text-[#BA7517]', dot: '#BA7517',  bg: 'bg-amber-50'    },
    email:      { icon: Mail,          colour: 'text-[#378ADD]', dot: '#378ADD',  bg: 'bg-blue-50'     },
    asset:      { icon: Package,       colour: 'text-[#0F6E56]', dot: '#0F6E56',  bg: 'bg-teal-50'     },
    info:       { icon: ArrowUpRight,  colour: 'text-txt-3',     dot: '#94a3b8',  bg: 'bg-gray-50'     },
};

const ActivityFeed = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-border p-5">
                <Skeleton active paragraph={{ rows: 7 }} />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-txt-1">Activity Feed</h3>
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
            </div>
            {!data || data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-txt-3">
                    <span className="text-2xl mb-2">📡</span>
                    <p className="text-sm">No recent activity</p>
                </div>
            ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {data.map((event, i) => {
                        const cfg = EVENT_CONFIG[event.type] || EVENT_CONFIG.info;
                        const Icon = cfg.icon;
                        return (
                            <div key={i} className="flex gap-3 items-start">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${cfg.bg}`}>
                                    <Icon size={12} className={cfg.colour} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-txt-1 font-medium leading-snug m-0 truncate">{event.message}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[10px] text-txt-3">{event.actor}</span>
                                        <span className="text-[10px] text-txt-4">·</span>
                                        <span className="text-[10px] text-txt-3">{formatDistanceToNow(event.timestamp)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ActivityFeed;
