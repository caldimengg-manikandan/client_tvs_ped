import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, DatePicker, Button, message } from 'antd';
import { ClipboardList } from 'lucide-react';
import dayjs from 'dayjs';
import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import api from '../api/axiosConfig';

const { TextArea } = Input;

const PlainHeaderCell = ({ column }) => (
    <div
        className="h-full w-full flex items-center px-3"
        style={{ backgroundColor: '#253C80' }}
    >
        <span className="font-bold text-white text-[11px] leading-tight tracking-wide whitespace-normal">
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
                    // Try to fetch to get overall remarks, though milestones are already merged
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
                <div className="flex items-center justify-center h-full px-3 w-full">
                    <Form.Item name={[row.name, 'sNo']} className="m-0 w-full flex items-center justify-center">
                        <Input disabled bordered={false} className="text-center text-xs w-full bg-transparent text-gray-500" />
                    </Form.Item>
                </div>
            )
        },
        {
            key: 'activity',
            name: 'LIST OF ACTIVITIES',
            width: 280,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex items-center h-full px-3 w-full">
                    <Form.Item name={[row.name, 'activity']} className="m-0 w-full flex items-center justify-center">
                        <Input readOnly bordered={false} className="text-xs w-full bg-transparent text-gray-600" />
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
                <div className="flex items-center h-full px-3 w-full">
                    <Form.Item name={[row.name, 'responsibility']} className="m-0 w-full flex items-center justify-center">
                        <Input readOnly bordered={false} className="text-xs w-full bg-transparent text-gray-600" />
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
                    <div className="flex items-center h-full px-3 w-full text-xs text-gray-600">
                        {val ? dayjs(val).format('DD-MMM-YYYY') : '-'}
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
                    <div className="flex items-center h-full px-3 w-full text-xs text-gray-600">
                        {val ? dayjs(val).format('DD-MMM-YYYY') : '-'}
                    </div>
                );
            }
        },
        {
            key: 'actualStart',
            name: 'ACTUAL START DATE',
            width: 170,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex items-center h-full px-3 w-full">
                    <Form.Item name={[row.name, 'actualStart']} className="m-0 w-full flex items-center justify-center">
                        <DatePicker bordered={false} className="text-xs w-full bg-transparent" format="DD-MMM-YYYY" />
                    </Form.Item>
                </div>
            )
        },
        {
            key: 'actualEnd',
            name: 'ACTUAL END DATE',
            width: 170,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex items-center h-full px-3 w-full">
                    <Form.Item name={[row.name, 'actualEnd']} className="m-0 w-full flex items-center justify-center">
                        <DatePicker bordered={false} className="text-xs w-full bg-transparent" format="DD-MMM-YYYY" />
                    </Form.Item>
                </div>
            )
        },
        {
            key: 'delay',
            name: 'DELAY (DAYS)',
            width: 120,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex items-center h-full px-3 w-full">
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

                            return (
                                <Input
                                    readOnly
                                    bordered={false}
                                    value={delay > 0 ? delay : 0}
                                    className={`text-center text-xs w-full bg-transparent ${delay > 0 ? 'text-red-600 font-semibold' : 'text-gray-600'}`}
                                />
                            );
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
                <div className="flex items-center h-full px-3 w-full">
                    <Form.Item name={[row.name, 'remarks']} className="m-0 w-full flex items-center justify-center">
                        <Input bordered={false} className="text-xs w-full bg-transparent" />
                    </Form.Item>
                </div>
            )
        }
    ];

    return (
        <Modal
            title={
                <div className="flex items-center gap-3 pb-4 border-b">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <ClipboardList size={20} />
                    </div>
                    <div>
                        <span className="text-xl font-bold">Initialise Actual Start</span>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">
                            {trackerInfo?.assetRequestId ? `Asset Request ID: ${trackerInfo.assetRequestId}` : 'Define actual milestones'}
                        </p>
                    </div>
                </div>
            }
            open={visible}
            onCancel={onCancel}
            onOk={handleSubmit}
            width="95%"
            style={{ maxWidth: '1200px' }}
            confirmLoading={loading}
            okText="Save Actuals"
            centered
            okButtonProps={{ className: 'bg-indigo-600 hover:bg-indigo-700' }}
            className="custom-modal"
        >
            {trackerInfo && trackerInfo.projectPlan?.milestones?.length ? (
                <Form form={form} layout="vertical" className="mt-6">
                    <Form.List name="milestones">
                        {(fields) => {
                            return (
                                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                                    <DataGrid
                                        columns={columns}
                                        rows={fields}
                                        rowKeyGetter={(row) => row.key}
                                        className="rdg-light mh-development-grid"
                                        style={{ blockSize: 'auto', minHeight: '350px' }}
                                        rowHeight={64}
                                        headerRowHeight={52}
                                        defaultColumnOptions={{ resizable: true, minWidth: 100 }}
                                    />
                                </div>
                            );
                        }}
                    </Form.List>

                    <div className="mt-6">
                        <Form.Item name="overallRemarks" label="Overall Remarks">
                            <TextArea rows={3} className="text-xs" />
                        </Form.Item>
                    </div>
                </Form>
            ) : (
                <div className="py-8 text-center text-gray-400">
                    No plan defined in MH Development Tracker. Please define the plan first.
                </div>
            )}
        </Modal>
    );
};

export default ProjectPlanActualModal;
