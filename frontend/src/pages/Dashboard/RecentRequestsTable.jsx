import React, { useMemo } from 'react';
import { Skeleton, Tag, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from '../../utils/dateUtils';

const STATUS_STYLE = {
    Pending:      { bg: 'bg-amber-50  border-amber-200',  text: 'text-amber-700',   dot: '#BA7517' },
    Notified:     { bg: 'bg-blue-50   border-blue-200',   text: 'text-blue-700',    dot: '#378ADD' },
    Assigned:     { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700',  dot: '#534AB7' },
    Rejected:     { bg: 'bg-red-50    border-red-200',    text: 'text-red-700',     dot: '#E24B4A' },
    'In Progress':{ bg: 'bg-blue-50   border-blue-200',   text: 'text-blue-700',    dot: '#378ADD' },
    Completed:    { bg: 'bg-teal-50   border-teal-200',   text: 'text-teal-700',    dot: '#0F6E56' },
    Active:       { bg: 'bg-amber-50  border-amber-200',  text: 'text-amber-700',   dot: '#BA7517' },
    Accepted:     { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: '#1D9E75' },
};

const PRIORITY_STYLE = {
    Normal: 'bg-gray-100 text-gray-600',
    High:   'bg-amber-100 text-amber-700',
    Urgent: 'bg-red-100 text-red-700',
};

const StatusBadge = ({ status }) => {
    const s = STATUS_STYLE[status] || STATUS_STYLE['Pending'];
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${s.bg} ${s.text}`}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.dot }} />
            {status}
        </span>
    );
};

const PriorityBadge = ({ priority }) => {
    const s = PRIORITY_STYLE[priority] || PRIORITY_STYLE['Normal'];
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${s}`}>{priority}</span>;
};

const FIVE_MIN = 5 * 60 * 1000;

const RecentRequestsTable = ({ data, loading, user }) => {
    const navigate = useNavigate();
    const now = Date.now();

    const rows = useMemo(() => {
        if (!data) return [];
        if (user?.role === 'Employee') {
            return data.filter(r => r.submittedByName === user.name || r.submittedByName === user.employeeName);
        }
        if (user?.role === 'PED Engineer') {
            return data.filter(r => r.assignedEngineerName === user.name || r.assignedEngineerName === user.employeeName);
        }
        return data;
    }, [data, user]);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-border p-5">
                <Skeleton active paragraph={{ rows: 6 }} />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-txt-1">Recent MH Requests</h3>
                <button onClick={() => navigate('/mh-requests')} className="text-xs text-tvs-primary font-semibold hover:underline">
                    View all →
                </button>
            </div>
            {rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-txt-3">
                    <span className="text-2xl mb-2">📋</span>
                    <p className="text-sm">No recent requests</p>
                </div>
            ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {rows.map((r, i) => {
                        const isRecent = now - new Date(r.createdAt).getTime() < FIVE_MIN;
                        return (
                            <div
                                key={r._id || i}
                                onClick={() => navigate('/mh-requests')}
                                className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${isRecent ? 'bg-yellow-50 ring-1 ring-yellow-200' : 'hover:bg-surface'}`}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-tvs-primary">{r.requestId}</span>
                                        <PriorityBadge priority={r.priority} />
                                    </div>
                                    <div className="text-xs text-txt-1 font-medium truncate mt-0.5">{r.assetName}</div>
                                    <div className="text-xs text-txt-3">{r.department} · {r.submittedByName}</div>
                                </div>
                                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                    <StatusBadge status={r.status} />
                                    <span className="text-[10px] text-txt-3">{formatDistanceToNow(r.createdAt)}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default RecentRequestsTable;
