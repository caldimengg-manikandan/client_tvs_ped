import React, { useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Button, Tooltip } from 'antd';
import { ClipboardList, Trash2, Calendar, User, FileText, MessageSquare } from 'lucide-react';
import dayjs from 'dayjs';
import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';

const { TextArea } = Input;

const DEFAULT_MILESTONES = [
    'Design Proposal',
    'Design Approval',
    'PR Release',
    'PO Release',
    'Sample Production & Receipt',
    'Trial Run',
    'Sample approval and Sign off',
    'Bulk Clearance',
    'Handover and Sign off'
];

const PlainHeaderCell = ({ column }) => (
    <div
        className="h-full w-full flex items-center px-4"
        style={{ backgroundColor: '#253C80' }}
    >
        <span className="font-bold text-white text-[11px] leading-tight tracking-[0.08em] uppercase whitespace-normal">
            {column.name}
        </span>
    </div>
);

const ProjectPlanModal = ({ visible, onCancel, onSave, trackerId, initialData, assetRequestId }) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (visible) {
            const existingMilestones = initialData?.milestones || [];

            const normalizedMilestones = DEFAULT_MILESTONES.map((label, index) => {
                const existing = existingMilestones[index] || {};
                return {
                    sNo: index + 1,
                    activity: existing.activity || label,
                    responsibility: existing.responsibility || '',
                    planStart: existing.planStart ? dayjs(existing.planStart) : null,
                    planEnd: existing.planEnd ? dayjs(existing.planEnd) : null,
                    actualStart: existing.actualStart ? dayjs(existing.actualStart) : null,
                    actualEnd: existing.actualEnd ? dayjs(existing.actualEnd) : null,
                    remarks: existing.remarks || ''
                };
            });

            form.setFieldsValue({
                milestones: normalizedMilestones,
                remarks: initialData?.remarks || ''
            });
        } else {
            form.resetFields();
        }
    }, [visible, initialData, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();

            const currentFormValue = form.getFieldsValue();

            const formattedMilestones = (values.milestones || []).map((m, index) => {
                const originalM = currentFormValue.milestones?.[index] || {};
                const actualStart = m.actualStart || originalM.actualStart || null;
                const actualEnd = m.actualEnd || originalM.actualEnd || null;

                let delayInDays = 0;
                if (m.planEnd && m.actualEnd) {
                    const diff = dayjs(m.actualEnd).startOf('day').diff(
                        dayjs(m.planEnd).startOf('day'),
                        'day'
                    );
                    if (!Number.isNaN(diff) && diff > 0) {
                        delayInDays = diff;
                    }
                }

                return {
                    sNo: m.sNo,
                    activity: m.activity,
                    responsibility: m.responsibility,
                    planStart: m.planStart ? (dayjs.isDayjs(m.planStart) ? m.planStart.toISOString() : m.planStart) : null,
                    planEnd: m.planEnd ? (dayjs.isDayjs(m.planEnd) ? m.planEnd.toISOString() : m.planEnd) : null,
                    actualStart: m.actualStart ? (dayjs.isDayjs(m.actualStart) ? m.actualStart.toISOString() : m.actualStart) : null,
                    actualEnd: m.actualEnd ? (dayjs.isDayjs(m.actualEnd) ? m.actualEnd.toISOString() : m.actualEnd) : null,
                    delayInDays,
                    remarks: m.remarks || ''
                };
            });

            onSave({
                milestones: formattedMilestones,
                remarks: values.remarks || ''
            });
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const getColumns = (remove) => [
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
            name: 'LIST OF ACTIVITIES',
            width: 280,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex items-center h-full px-4 w-full border-r border-gray-100 group">
                    <div className="mr-3 text-indigo-400 opacity-50 group-hover:opacity-100 transition-opacity">
                        <FileText size={14} />
                    </div>
                    <Form.Item name={[row.name, 'activity']} rules={[{ required: true }]} className="m-0 w-full">
                        <Input bordered={false} className="text-[13px] font-semibold w-full bg-transparent text-gray-800 p-0 focus:bg-indigo-50/50 rounded transition-all" placeholder="Activity Name" />
                    </Form.Item>
                    <Form.Item name={[row.name, 'actualStart']} hidden><Input /></Form.Item>
                    <Form.Item name={[row.name, 'actualEnd']} hidden><Input /></Form.Item>
                </div>
            )
        },
        {
            key: 'responsibility',
            name: 'RESPONSIBILITY',
            width: 180,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex items-center h-full px-4 w-full border-r border-gray-100 group">
                    <div className="mr-2 text-gray-400 opacity-40 group-hover:opacity-100 transition-opacity">
                        <User size={13} />
                    </div>
                    <Form.Item name={[row.name, 'responsibility']} className="m-0 w-full">
                        <Input bordered={false} className="text-[12px] w-full bg-transparent text-gray-600 p-0 italic focus:bg-gray-50 rounded transition-all" placeholder="Enter Responsibility" />
                    </Form.Item>
                </div>
            )
        },
        {
            key: 'planStart',
            name: 'PLAN : START DATE',
            width: 170,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex items-center h-full px-4 w-full border-r border-gray-100 bg-blue-50/10 group-hover:bg-blue-50/30 transition-colors">
                    <Form.Item name={[row.name, 'planStart']} className="m-0 w-full">
                        <DatePicker 
                            bordered={false} 
                            popupClassName="premium-datepicker-popup"
                            className="w-full text-[12px] font-bold text-tvs-blue hover:scale-[1.02] transform transition-all duration-200" 
                            format="DD-MMM-YYYY" 
                            placeholder="Select Date"
                            suffixIcon={<Calendar size={14} className="text-tvs-blue/40" />}
                        />
                    </Form.Item>
                </div>
            )
        },
        {
            key: 'planEnd',
            name: 'PLAN : END DATE',
            width: 170,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex items-center h-full px-4 w-full border-r border-gray-100 bg-indigo-50/10 group-hover:bg-indigo-50/30 transition-colors">
                    <Form.Item name={[row.name, 'planEnd']} className="m-0 w-full">
                        <DatePicker 
                            bordered={false} 
                            popupClassName="premium-datepicker-popup"
                            className="w-full text-[12px] font-bold text-indigo-700 hover:scale-[1.02] transform transition-all duration-200" 
                            format="DD-MMM-YYYY" 
                            placeholder="Select Date"
                            suffixIcon={<Calendar size={14} className="text-indigo-400/40" />}
                        />
                    </Form.Item>
                </div>
            )
        },
        {
            key: 'remarks',
            name: 'REMARKS',
            width: 230,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex items-center h-full px-4 w-full border-r border-gray-100 group">
                    <div className="mr-2 text-gray-400 opacity-40 group-hover:opacity-100 transition-opacity">
                        <MessageSquare size={13} />
                    </div>
                    <Form.Item name={[row.name, 'remarks']} className="m-0 w-full">
                        <Input bordered={false} className="text-[12px] w-full bg-transparent text-gray-700 p-0 focus:bg-gray-50 rounded transition-all" placeholder="Enter Remarks" />
                    </Form.Item>
                </div>
            )
        },
        {
            key: 'action',
            name: 'ACTION',
            width: 80,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex items-center justify-center h-full w-full bg-red-50/5 hover:bg-red-50 transition-colors">
                    <Tooltip title="Remove row">
                        <Button
                            type="text"
                            danger
                            className="flex items-center justify-center hover:scale-110 transition-transform"
                            icon={<Trash2 size={16} />}
                            onClick={() => remove(row.name)}
                        />
                    </Tooltip>
                </div>
            )
        }
    ];

    return (
        <Modal
            title={
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
                            <ClipboardList size={22} />
                        </div>
                        <div>
                            <span className="text-xl font-bold text-gray-800">Project Plan & Milestones</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider border border-indigo-100">
                                    {assetRequestId ? `ID: ${assetRequestId}` : 'Define Plan'}
                                </span>
                                <span className="text-[10px] text-gray-400 font-medium">Standardize project execution timelines</span>
                            </div>
                        </div>
                    </div>
                </div>
            }
            open={visible}
            onCancel={onCancel}
            onOk={handleSubmit}
            width="95%"
            style={{ maxWidth: '1200px' }}
            okText="Save Tracking Data"
            centered
            okButtonProps={{ 
                className: 'bg-indigo-600 hover:bg-indigo-700 h-10 px-8 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all border-none' 
            }}
            cancelButtonProps={{
                className: 'h-10 px-8 rounded-xl font-bold border-gray-200 hover:border-indigo-400'
            }}
            className="custom-modal-premium"
        >
            <Form form={form} layout="vertical" className="mt-6">
                <Form.List name="milestones">
                    {(fields, { remove }) => {
                        const columns = getColumns(remove);
                        return (
                            <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-100">
                                <DataGrid
                                    columns={columns}
                                    rows={fields}
                                    rowKeyGetter={(row) => row.key}
                                    className="rdg-light mh-development-grid"
                                    style={{ blockSize: 'auto', minHeight: '400px' }}
                                    rowHeight={60}
                                    headerRowHeight={52}
                                    defaultColumnOptions={{ resizable: true, minWidth: 100 }}
                                />
                            </div>
                        );
                    }}
                </Form.List>

                <div className="mt-8 p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                    <Form.Item 
                        name="remarks" 
                        label={<span className="text-gray-600 font-bold text-xs uppercase tracking-wider flex items-center gap-2"><MessageSquare size={14} className="text-indigo-400" /> Overall Remarks</span>}
                    >
                        <TextArea 
                            rows={3} 
                            placeholder="Enter any additional notes or project context..."
                            className="text-sm rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 shadow-sm transition-all p-4" 
                        />
                    </Form.Item>
                </div>
            </Form>

            <style>{`
                .custom-modal-premium .ant-modal-content {
                    border-radius: 24px;
                    padding: 24px;
                }
                .custom-modal-premium .ant-modal-header {
                    margin-bottom: 0;
                }
                .mh-development-grid {
                    --rdg-border-color: #f1f5f9;
                    --rdg-row-hover-background-color: #f8fafc;
                    --rdg-header-background-color: #253C80;
                    border: none;
                }
                .mh-development-grid .rdg-header-row .rdg-cell {
                    border-right: 1px solid rgba(255,255,255,0.1);
                }
                .mh-development-grid .rdg-row:hover .rdg-cell {
                    background-color: var(--rdg-row-hover-background-color);
                }
                .ant-picker-panel-container {
                    border-radius: 16px !important;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
                }
            `}</style>
        </Modal>
    );
};

export default ProjectPlanModal;
