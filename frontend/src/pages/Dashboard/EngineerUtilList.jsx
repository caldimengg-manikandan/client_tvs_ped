import React, { useState } from 'react';
import { Skeleton, Modal, Tooltip, Tag } from 'antd';

const utilColour = (pct) => {
    if (pct >= 90) return { bar: '#E24B4A', badge: 'bg-red-50 text-red-700' };
    if (pct >= 70) return { bar: '#BA7517', badge: 'bg-amber-50 text-amber-700' };
    return { bar: '#1D9E75', badge: 'bg-emerald-50 text-emerald-700' };
};

const EngineerUtilList = ({ data, loading, currentUser }) => {
    const [modalEngineer, setModalEngineer] = useState(null);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-border p-5">
                <Skeleton active paragraph={{ rows: 5 }} />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-border p-5 h-72 flex flex-col items-center justify-center text-txt-3">
                <span className="text-3xl mb-2">👷</span>
                <p className="text-sm font-semibold">No engineer data</p>
            </div>
        );
    }

    const isCurrentEngineer = (eng) =>
        currentUser?.role === 'PED Engineer' &&
        (eng.engineerName === currentUser?.name || eng.engineerId?.toString() === currentUser?._id?.toString());

    return (
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="text-sm font-bold text-txt-1 mb-4">Engineer Utilisation</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {data.map((eng, i) => {
                    const c = utilColour(eng.utilisationPct);
                    const isMe = isCurrentEngineer(eng);
                    return (
                        <Tooltip key={i} title={`${eng.assignedCount} active / ${eng.completedCount} completed this period`}>
                            <div
                                className={`cursor-pointer rounded-xl p-2 -mx-2 transition-colors ${isMe ? 'bg-blue-50 ring-1 ring-blue-200' : 'hover:bg-surface'}`}
                                onClick={() => setModalEngineer(eng)}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-txt-1 truncate max-w-[55%]">
                                        {eng.engineerName}
                                        {isMe && <span className="ml-1 text-blue-600 text-[10px]">(You)</span>}
                                    </span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.badge}`}>{eng.utilisationPct}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${eng.utilisationPct}%`, backgroundColor: c.bar }} />
                                </div>
                                <div className="text-xs text-txt-3 mt-0.5">{eng.department} · {eng.assignedCount} active</div>
                            </div>
                        </Tooltip>
                    );
                })}
            </div>

            {/* Engineer detail modal */}
            <Modal
                open={!!modalEngineer}
                title={<span className="font-bold text-txt-1">{modalEngineer?.engineerName} — Assigned Requests</span>}
                onCancel={() => setModalEngineer(null)}
                footer={null}
                width={480}
            >
                {modalEngineer && (
                    <div className="space-y-3 py-2">
                        <div className="flex gap-4 text-sm">
                            <div className="flex-1 bg-surface rounded-xl p-3 text-center">
                                <div className="text-2xl font-bold text-txt-1">{modalEngineer.assignedCount}</div>
                                <div className="text-xs text-txt-3">Active requests</div>
                            </div>
                            <div className="flex-1 bg-surface rounded-xl p-3 text-center">
                                <div className="text-2xl font-bold text-txt-1">{modalEngineer.completedCount}</div>
                                <div className="text-xs text-txt-3">Completed</div>
                            </div>
                            <div className="flex-1 bg-surface rounded-xl p-3 text-center">
                                <div className="text-2xl font-bold text-txt-1">{modalEngineer.utilisationPct}%</div>
                                <div className="text-xs text-txt-3">Utilisation</div>
                            </div>
                        </div>
                        <div className="text-xs text-txt-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                            Department: <strong>{modalEngineer.department}</strong>
                        </div>
                        <p className="text-xs text-txt-3 pt-1">
                            Go to <strong>MH Requests</strong> and filter by assigned engineer to see the full list.
                        </p>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default EngineerUtilList;
