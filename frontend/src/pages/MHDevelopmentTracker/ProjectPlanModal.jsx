import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Input, DatePicker, Table, message, Tooltip } from 'antd';
import { Plus, Minus, FileCheck, Save, ClipboardList, ChevronRight } from 'lucide-react';
import dayjs from 'dayjs';

const ProjectPlanModal = ({ visible, onCancel, onSave, trackerId, initialData }) => {
    const [rowData, setRowData] = useState([]);

    const calculateDelay = (planEnd, actualEnd) => {
        if (planEnd && actualEnd) {
            const plan = dayjs(planEnd);
            const actual = dayjs(actualEnd);
            const diff = actual.diff(plan, 'day');
            return diff > 0 ? diff : 0;
        }
        return 0;
    };

    useEffect(() => {
        if (visible) {
            if (initialData && Array.isArray(initialData) && initialData.length > 0) {
                setRowData(initialData.map(row => ({
                    ...row,
                    key: row.key || Math.random(),
                    planStart: row.planStart ? dayjs(row.planStart) : null,
                    planEnd: row.planEnd ? dayjs(row.planEnd) : null,
                    actualStart: row.actualStart ? dayjs(row.actualStart) : null,
                    actualEnd: row.actualEnd ? dayjs(row.actualEnd) : null,
                })));
            } else {
                setRowData([]);
            }
        }
    }, [visible, initialData]);

    const handleCellChange = (index, field, value) => {
        const newData = [...rowData];
        newData[index][field] = value;
        if (field === 'planEnd' || field === 'actualEnd') {
            const p = field === 'planEnd' ? value : newData[index].planEnd;
            const a = field === 'actualEnd' ? value : newData[index].actualEnd;
            newData[index].delay = calculateDelay(p, a);
        }
        setRowData(newData);
    };

    const addRow = () => {
        const newRow = {
            key: Math.random(),
            activity: '',
            responsibility: '',
            planStart: null,
            planEnd: null,
            actualStart: null,
            actualEnd: null,
            delay: 0,
            remarks: ''
        };
        setRowData([...rowData, newRow]);
    };

    const removeRow = (index) => {
        const newData = rowData.filter((_, i) => i !== index);
        setRowData(newData);
    };

    const handleSave = () => {
        const formattedData = rowData.map(row => ({
            ...row,
            planStart: row.planStart ? row.planStart.toISOString() : null,
            planEnd: row.planEnd ? row.planEnd.toISOString() : null,
            actualStart: row.actualStart ? row.actualStart.toISOString() : null,
            actualEnd: row.actualEnd ? row.actualEnd.toISOString() : null,
        }));
        onSave(formattedData);
        message.success('Project Plan Updated Perfectly');
    };

    const columns = [
        {
            title: <span className="text-[10px] uppercase font-black text-gray-500 tracking-tighter">S.NO</span>,
            dataIndex: 'sNo',
            width: 60,
            align: 'center',
            render: (_, __, index) => <div className="font-bold text-gray-400 text-xs">{index + 1}</div>
        },
        {
            title: <span className="text-[10px] uppercase font-black text-gray-500">Activity Detail</span>,
            dataIndex: 'activity',
            width: 350,
            render: (text, _, index) => (
                <Input 
                    placeholder="Describe the activity..." 
                    value={text} 
                    onChange={e => handleCellChange(index, 'activity', e.target.value)}
                    className="modern-input"
                />
            )
        },
        {
            title: <span className="text-[10px] uppercase font-black text-gray-500">Owner</span>,
            dataIndex: 'responsibility',
            width: 200,
            render: (text, _, index) => (
                <Input 
                    placeholder="Responsible Person" 
                    value={text} 
                    onChange={e => handleCellChange(index, 'responsibility', e.target.value)}
                    className="modern-input"
                />
            )
        },
        {
            title: <span className="text-[10px] uppercase font-black text-gray-500">Plan Timeline</span>,
            key: 'plan_timeline',
            width: 320,
            render: (_, record, index) => (
                <div className="flex gap-2 items-center">
                    <DatePicker 
                        className="w-full modern-datepicker" 
                        format="DD MMM YYYY"
                        value={record.planStart}
                        placeholder="Start"
                        onChange={val => handleCellChange(index, 'planStart', val)}
                    />
                    <ChevronRight size={14} className="text-gray-300" />
                    <DatePicker 
                        className="w-full modern-datepicker" 
                        format="DD MMM YYYY"
                        value={record.planEnd}
                        placeholder="End"
                        onChange={val => handleCellChange(index, 'planEnd', val)}
                    />
                </div>
            )
        },
        {
            title: <span className="text-[10px] uppercase font-black text-gray-500">Actual Timeline</span>,
            key: 'actual_timeline',
            width: 350,
            render: (_, record, index) => (
                <div className="flex gap-2 items-center">
                    <DatePicker 
                        className="w-full modern-datepicker" 
                        format="DD MMM YYYY"
                        value={record.actualStart}
                        placeholder="Start"
                        onChange={val => handleCellChange(index, 'actualStart', val)}
                    />
                    <ChevronRight size={14} className="text-gray-300" />
                    <DatePicker 
                        className="w-full modern-datepicker" 
                        format="DD MMM YYYY"
                        value={record.actualEnd}
                        placeholder="End"
                        onChange={val => handleCellChange(index, 'actualEnd', val)}
                    />
                </div>
            )
        },
        {
            title: <span className="text-[10px] uppercase font-black text-gray-500">Variance</span>,
            dataIndex: 'delay',
            width: 100,
            align: 'center',
            render: (val) => (
                <div className={`flex flex-col items-center justify-center h-full`}>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-black tracking-widest ${val > 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                        {val > 0 ? `+${val} DAYS` : 'ON TIME'}
                    </span>
                </div>
            )
        },
        {
            title: '',
            key: 'action',
            fixed: 'right',
            width: 50,
            render: (_, __, index) => (
                <button 
                    onClick={() => removeRow(index)}
                    className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                >
                    <Minus size={18} />
                </button>
            )
        }
    ];

    return (
        <Modal
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={1400}
            centered
            className="modern-plan-modal-v2"
            closable={true}
        >
            <div className="flex flex-col bg-white">
                {/* Modern Header Section */}
                <div className="p-8 border-b border-gray-100">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-tvs-blue/10 rounded-2xl flex items-center justify-center text-tvs-blue shadow-inner">
                            <ClipboardList size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-tvs-blue tracking-tight uppercase m-0 leading-none">Project Execution Plan</h1>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-2">Manage activities, timelines and delivery variances</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-gray-50/30">
                    {/* Modern Data Table */}
                    <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
                        <Table
                            dataSource={rowData}
                            columns={columns}
                            pagination={false}
                            scroll={{ x: 1300, y: 500 }}
                            className="premium-modern-table"
                            rowKey="key"
                        />
                        
                        {/* Inline Add Button */}
                        <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                            <button 
                                onClick={addRow}
                                className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center gap-3 text-gray-400 font-bold hover:border-tvs-blue hover:text-tvs-blue transition-all group"
                            >
                                <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                                ADD NEW ACTIVITY LINE
                            </button>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end mt-10">
                        <div className="flex gap-4">
                            <button className="px-8 py-3.5 bg-white border border-gray-200 text-gray-600 font-black rounded-xl hover:bg-gray-50 transition-all uppercase tracking-widest text-[11px] shadow-sm">
                                Preview
                            </button>
                            <button 
                                onClick={handleSave}
                                className="px-10 py-3.5 bg-tvs-blue text-white font-black rounded-xl shadow-lg shadow-tvs-blue/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-[11px] flex items-center gap-3"
                            >
                                <Save size={16} /> Update Plan
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .modern-plan-modal-v2 .ant-modal-content {
                    padding: 0 !important;
                    border-radius: 2rem !important;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15) !important;
                }
                
                .premium-modern-table .ant-table-thead > tr > th {
                    background-color: white !important;
                    padding: 20px 12px !important;
                    border-bottom: 2px solid #f1f5f9 !important;
                }

                .premium-modern-table .ant-table-tbody > tr > td {
                    padding: 12px 12px !important;
                    border-bottom: 1px solid #f8fafc !important;
                }

                .modern-input {
                    border: 1px solid #eef2f6 !important;
                    background: #fcfdfe !important;
                    border-radius: 0.75rem !important;
                    height: 44px !important;
                    font-weight: 500 !important;
                    font-size: 13px !important;
                    transition: all 0.2s !important;
                }

                .modern-input:focus, .modern-input:hover {
                    border-color: #253C80 !important;
                    background: white !important;
                    box-shadow: 0 4px 12px rgba(37, 60, 128, 0.05) !important;
                }

                .modern-datepicker {
                    border: 1px solid #eef2f6 !important;
                    background: #fcfdfe !important;
                    border-radius: 0.75rem !important;
                    height: 44px !important;
                }

                .modern-datepicker:focus-within, .modern-datepicker:hover {
                    border-color: #253C80 !important;
                    background: white !important;
                }

                .premium-modern-table .ant-table-tbody > tr:hover > td {
                    background: #fcfdfe !important;
                }

                .premium-modern-table .ant-table-header-column {
                    display: block !important;
                }

                .premium-modern-table .ant-table-cell::before {
                    display: none !important;
                }
            `}</style>
        </Modal>
    );
};

export default ProjectPlanModal;
