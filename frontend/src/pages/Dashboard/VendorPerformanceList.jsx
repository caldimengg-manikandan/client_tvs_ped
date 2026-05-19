import React from 'react';
import { Skeleton, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';

const scoreColour = (score) => {
    if (score >= 75) return { bar: '#1D9E75', bg: 'bg-emerald-50', text: 'text-emerald-700' };
    if (score >= 50) return { bar: '#BA7517', bg: 'bg-amber-50', text: 'text-amber-700' };
    return { bar: '#E24B4A', bg: 'bg-red-50', text: 'text-red-700' };
};

const VendorPerformanceList = ({ data, loading }) => {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-border p-5">
                <Skeleton active paragraph={{ rows: 6 }} />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-border p-5 h-72 flex flex-col items-center justify-center text-txt-3">
                <span className="text-3xl mb-2">🏭</span>
                <p className="text-sm font-semibold">No vendor performance data</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="text-sm font-bold text-txt-1 mb-4">Vendor Performance</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {data.map((v, i) => {
                    const c = scoreColour(v.avgScore);
                    return (
                        <Tooltip key={i} title={`On-time: ${v.onTimeRate}%  |  Delay rate: ${v.defectRate}%`}>
                            <div
                                className="cursor-pointer hover:bg-surface rounded-xl p-2 -mx-2 transition-colors"
                                onClick={() => navigate('/vendor-master')}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-txt-1 truncate max-w-[60%]">{v.vendorName}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>{v.avgScore.toFixed(0)}/100</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${v.avgScore}%`, backgroundColor: c.bar }} />
                                </div>
                                <div className="text-xs text-txt-3 mt-0.5">On-time: {v.onTimeRate}%</div>
                            </div>
                        </Tooltip>
                    );
                })}
            </div>
        </div>
    );
};

export default VendorPerformanceList;
