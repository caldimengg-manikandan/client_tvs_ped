import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, DatePicker, Button, message, Tooltip, Tag } from 'antd';
import { ClipboardList, Calendar, Activity, CheckCircle2, AlertCircle, MessageSquare, User, FileText, ArrowRight } from 'lucide-react';
import dayjs from 'dayjs';
import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import api from '../api/axiosConfig';

const { TextArea } = Input;

const PlainHeaderCell = ({ column }) => (
    <div className="h-full w-full flex items-center px-4">
        <span className="font-bold text-[11px] leading-tight tracking-[0.08em] uppercase whitespace-normal">
            {column.name}
        </span>
    </div>
);

const ProjectPlanActualModal = ({ visible, onCancel, onSave, trackerInfo }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible && trackerInfo) {
            const fetchActualsIfAny = async () => {
                setLoading(true);
                try {
                    const res = await api.get(`/project-plan/${trackerInfo._id}`);
                    const actualPlanDbo = res.data?.data;

                    const milestones = trackerInfo.projectPlan?.milestones || [];
                    const normalizedMilestones = milestones.map((m) => {
                        let actualStart = m.actualStart;
                        let actualEnd = m.actualEnd;
                        let remarks = m.remarks || '';

                        if (actualPlanDbo && actualPlanDbo.milestones) {
                            const dbMs = actualPlanDbo.milestones.find(x => x.sNo === m.sNo);
                            if (dbMs) {
                                actualStart = dbMs.actualStart || actualStart;
                                actualEnd = dbMs.actualEnd || actualEnd;
                                remarks = dbMs.remarks || remarks;
                            }
                        }

                        return {
                            key: `row-${m.sNo}`,
                            sNo: m.sNo,
                            activity: m.activity,
                            responsibility: m.responsibility,
                            planStart: m.planStart,
                            planEnd: m.planEnd,
                            actualStart: actualStart ? dayjs(actualStart) : null,
                            actualEnd: actualEnd ? dayjs(actualEnd) : null,
                            remarks: remarks
                        };
                    });

                    form.setFieldsValue({
                        milestones: normalizedMilestones,
                        overallRemarks: actualPlanDbo?.overallRemarks || trackerInfo.projectPlan?.remarks || ''
                    });
                } catch (error) {
                    console.error(error);
                } finally {
                    setLoading(false);
                }
            };
            fetchActualsIfAny();
        } else {
            form.resetFields();
        }
    }, [visible, trackerInfo, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            const originalMilestones = trackerInfo.projectPlan?.milestones || [];

            const formattedMilestones = (values.milestones || []).map((m) => {
                let delayInDays = 0;
                const orig = originalMilestones.find(x => x.sNo === m.sNo);
                const planEnd = orig?.planEnd;

                if (planEnd && m.actualEnd) {
                    const diff = dayjs(m.actualEnd).startOf('day').diff(dayjs(planEnd).startOf('day'), 'day');
                    if (!Number.isNaN(diff) && diff > 0) {
                        delayInDays = diff;
                    }
                }

                return {
                    sNo: m.sNo,
                    activity: m.activity,
                    actualStart: m.actualStart ? (dayjs.isDayjs(m.actualStart) ? m.actualStart.toISOString() : m.actualStart) : null,
                    actualEnd: m.actualEnd ? (dayjs.isDayjs(m.actualEnd) ? m.actualEnd.toISOString() : m.actualEnd) : null,
                    delayInDays,
                    remarks: m.remarks || ''
                };
            });

            await api.put(`/project-plan/${trackerInfo._id}`, {
                milestones: formattedMilestones,
                overallRemarks: values.overallRemarks || ''
            });

            message.success('Actuals updated successfully');
            onSave();
        } catch (error) {
            console.error('Validation failed:', error);
            message.error('Failed to update actuals');
        }
    };

    const columns = [
        {
            key: 'sNo',
            name: 'S.No',
            width: 70,
            frozen: true,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex items-center justify-center h-full w-full border-r border-gray-100 bg-gray-50/50">
                    <Form.Item name={[row.name, 'sNo']} className="m-0 w-full">
                        <Input disabled bordered={false} className="text-center font-bold text-[12px] w-full bg-transparent text-gray-400" />
                    </Form.Item>
                </div>
            )
        },
        {
            key: 'activity',
            name: 'ACTIVITY',
            width: 250,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex items-center h-full px-4 w-full border-r border-gray-100 group">
                    <div className="mr-3 text-indigo-400 opacity-50 group-hover:opacity-100 transition-opacity">
                        <FileText size={14} />
                    </div>
                    <Form.Item name={[row.name, 'activity']} className="m-0 w-full">
                        <Input readOnly bordered={false} className="text-[13px] font-semibold w-full bg-transparent text-gray-800 p-0" />
                    </Form.Item>
                </div>
            )
        },
        {
            key: 'responsibility',
            name: 'RESPONSIBILITY',
            width: 150,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex items-center h-full px-4 w-full border-r border-gray-100 group">
                    <div className="mr-2 text-gray-400 opacity-40 group-hover:opacity-100 transition-opacity">
                        <User size={13} />
                    </div>
                    <Form.Item name={[row.name, 'responsibility']} className="m-0 w-full">
                        <Input readOnly bordered={false} className="text-[11px] w-full bg-transparent text-gray-600 p-0 italic" />
                    </Form.Item>
                </div>
            )
        },
        {
            key: 'planStart',
            name: 'PLAN START',
            width: 130,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => {
                const val = form.getFieldValue(['milestones', row.name, 'planStart']);
                return (
                    <div className="flex flex-col items-center justify-center h-full w-full border-r border-gray-100 bg-blue-50/10">
                        <span className="text-[10px] text-blue-400 uppercase font-black tracking-tighter mb-0.5">Planned</span>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50/50 text-blue-700 font-bold text-[11px] border border-blue-100/50">
                            <Calendar size={12} className="opacity-60" />
                            {val ? dayjs(val).format('DD-MMM-YY') : '-'}
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'planEnd',
            name: 'PLAN END',
            width: 130,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => {
                const val = form.getFieldValue(['milestones', row.name, 'planEnd']);
                return (
                    <div className="flex flex-col items-center justify-center h-full w-full border-r border-gray-100 bg-indigo-50/10">
                        <span className="text-[10px] text-indigo-400 uppercase font-black tracking-tighter mb-0.5">Deadline</span>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-50/50 text-indigo-700 font-bold text-[11px] border border-indigo-100/50">
                            <CheckCircle2 size={12} className="opacity-60" />
                            {val ? dayjs(val).format('DD-MMM-YY') : '-'}
                        </div>
                    </div>
                );
            }
        },
        {
            key: 'actualStart',
            name: 'ACTUAL START',
            width: 160,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex items-center h-full w-full border-r border-gray-100 bg-emerald-50/10 group-hover:bg-emerald-50/30 transition-colors">
                    <Form.Item name={[row.name, 'actualStart']} className="m-0 w-full px-2">
                        <DatePicker 
                            bordered={false} 
                            popupClassName="premium-datepicker-popup"
                            className="text-[12px] font-black w-full text-emerald-700 hover:scale-[1.02] transform transition-all" 
                            format="DD-MMM-YYYY" 
                            placeholder="Set Start"
                            suffixIcon={<Activity size={14} className="text-emerald-400" />}
                        />
                    </Form.Item>
                </div>
            )
        },
        {
            key: 'actualEnd',
            name: 'ACTUAL END',
            width: 160,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex items-center h-full w-full border-r border-gray-100 bg-teal-50/10 group-hover:bg-teal-50/30 transition-colors">
                    <Form.Item name={[row.name, 'actualEnd']} className="m-0 w-full px-2">
                        <DatePicker 
                            bordered={false} 
                            popupClassName="premium-datepicker-popup"
                            className="text-[12px] font-black w-full text-teal-700 hover:scale-[1.02] transform transition-all" 
                            format="DD-MMM-YYYY" 
                            placeholder="Set Completion"
                            suffixIcon={<CheckCircle2 size={14} className="text-teal-400" />}
                        />
                    </Form.Item>
                </div>
            )
        },
        {
            key: 'delay',
            name: 'STATUS / DELAY',
            width: 140,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex items-center justify-center h-full w-full border-r border-gray-100">
                    <Form.Item
                        shouldUpdate={(prevValues, currentValues) => {
                            const prev = prevValues.milestones?.[row.name]?.actualEnd;
                            const curr = currentValues.milestones?.[row.name]?.actualEnd;
                            return prev !== curr;
                        }}
                        className="m-0 w-full flex items-center justify-center"
                    >
                        {({ getFieldValue }) => {
                            const actualEnd = getFieldValue(['milestones', row.name, 'actualEnd']);
                            const planEnd = getFieldValue(['milestones', row.name, 'planEnd']);

                            let delay = 0;
                            if (actualEnd && planEnd) {
                                const diff = dayjs(actualEnd).startOf('day').diff(dayjs(planEnd).startOf('day'), 'day');
                                delay = diff;
                            }

                            if (delay > 0) {
                                return (
                                    <Tag icon={<AlertCircle size={10} />} color="error" className="flex items-center gap-1 font-bold text-[10px] rounded-full px-2 py-0.5 animate-pulse">
                                        {delay} DAYS DELAY
                                    </Tag>
                                );
                            }
                            if (actualEnd) {
                                return (
                                    <Tag icon={<CheckCircle2 size={10} />} color="success" className="flex items-center gap-1 font-bold text-[10px] rounded-full px-2 py-0.5">
                                        ON PLAN
                                    </Tag>
                                );
                            }
                            return <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest italic">Pending</span>;
                        }}
                    </Form.Item>
                </div>
            )
        },
        {
            key: 'remarks',
            name: 'REMARKS',
            width: 200,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex items-center h-full px-3 w-full group">
                    <div className="mr-2 text-gray-400 opacity-30 group-hover:opacity-100 transition-opacity">
                        <MessageSquare size={13} />
                    </div>
                    <Form.Item name={[row.name, 'remarks']} className="m-0 w-full">
                        <Input 
                            bordered={false} 
                            className="text-[11px] w-full bg-transparent hover:bg-gray-50 rounded transition-colors" 
                            placeholder="Add memo..."
                        />
                    </Form.Item>
                </div>
            )
        }
    ];

    return (
        <Modal
            title={
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-200/50">
                            <Activity size={22} className="animate-pulse" />
                        </div>
                        <div>
                            <span className="text-xl font-black text-gray-800 tracking-tight">Track Production Progress</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider border border-indigo-100">
                                    {trackerInfo?.assetRequestId ? `ID: ${trackerInfo.assetRequestId}` : 'Live Monitoring'}
                                </span>
                                <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                                    <ArrowRight size={10} /> Real-time status updates & delay analysis
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            }
            open={visible}
            onCancel={onCancel}
            onOk={handleSubmit}
            width="98%"
            style={{ maxWidth: '1600px', top: '20px' }}
            confirmLoading={loading}
            okText="Update Actual Progress"
            centered
            okButtonProps={{ 
                className: 'bg-indigo-600 hover:bg-indigo-700 h-12 px-10 rounded-2xl font-black shadow-xl shadow-indigo-100 border-none transition-all transform hover:scale-105' 
            }}
            cancelButtonProps={{
                className: 'h-12 px-8 rounded-2xl font-bold border-gray-100 text-gray-400 hover:text-indigo-600 transition-all'
            }}
            className="custom-modal-tracking"
        >
            {trackerInfo && trackerInfo.projectPlan?.milestones?.length ? (
                <Form form={form} layout="vertical" className="mt-8">
                    <Form.List name="milestones">
                        {(fields) => {
                            return (
                                <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-2xl shadow-gray-200/50 ring-1 ring-gray-100">
                                    <DataGrid
                                        columns={columns}
                                        rows={fields}
                                        rowKeyGetter={(row) => row.key}
                                        className="rdg-light mh-development-grid-actual"
                                        style={{ blockSize: 'auto', minHeight: '450px' }}
                                        rowHeight={70}
                                        headerRowHeight={56}
                                        defaultColumnOptions={{ resizable: true, minWidth: 100 }}
                                    />
                                </div>
                            );
                        }}
                    </Form.List>

                    <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-white rounded-3xl border border-gray-100 shadow-sm">
                        <Form.Item 
                            name="overallRemarks" 
                            label={<span className="text-gray-600 font-black text-xs uppercase tracking-[0.1em] flex items-center gap-2"><MessageSquare size={14} className="text-indigo-500" /> Executive Summary / Performance Remarks</span>}
                        >
                            <TextArea 
                                rows={3} 
                                placeholder="Summarize project performance or highlight critical bottlenecks..."
                                className="text-sm rounded-2xl border-gray-100 focus:border-indigo-500 focus:ring-8 focus:ring-indigo-50 shadow-inner transition-all p-5 bg-white" 
                            />
                        </Form.Item>
                    </div>
                </Form>
            ) : (
                <div className="py-24 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-dashed border-gray-200">
                        <AlertCircle size={32} className="text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">No Execution Plan Found</h3>
                    <p className="text-gray-400 max-w-xs mx-auto mt-2 text-sm font-medium">Please define the project plan in the development tracker before adding actual milestones.</p>
                </div>
            )}

            <style>{`
                .custom-modal-tracking .ant-modal-content {
                    border-radius: 32px;
                    padding: 32px;
                    background: #ffffff;
                }
                .mh-development-grid-actual {
                    --rdg-border-color: #f1f5f9;
                    --rdg-row-hover-background-color: #f8fafc;
                    --rdg-header-background-color: #1e3a8a;
                    border: none;
                }
                .mh-development-grid-actual .rdg-header-row .rdg-cell {
                    border-right: 1px solid rgba(255,255,255,0.05);
                }
                .mh-development-grid-actual .rdg-cell {
                    transition: all 0.2s ease;
                }
                .mh-development-grid-actual .rdg-row:hover .rdg-cell {
                    background-color: var(--rdg-row-hover-background-color);
                }
                /* Hide scrolls but allow scrolling */
                .rdg {
                    scrollbar-width: thin;
                    scrollbar-color: #e2e8f0 transparent;
                }
                .ant-picker-panel-container {
                    border-radius: 20px !important;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.12) !important;
                }
            `}</style>
        </Modal>
    );
};

export default ProjectPlanActualModal;
