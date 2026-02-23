import React, { useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Button } from 'antd';
import { ClipboardList, Trash2 } from 'lucide-react';
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
        className="h-full w-full flex items-center px-3"
        style={{ backgroundColor: '#253C80' }}
    >
        <span className="font-bold text-white text-[11px] leading-tight tracking-wide whitespace-normal">
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

            // To preserve actualStart and actualEnd which are hidden from the UI
            const currentFormValue = form.getFieldsValue();

            const formattedMilestones = (values.milestones || []).map((m, index) => {
                const planStart = m.planStart || null;
                const planEnd = m.planEnd || null;
                // Get preserved actual values from currentFormValue if they exist
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
                <div className="flex items-center justify-center h-full px-4 w-full">
                    <Form.Item name={[row.name, 'sNo']} className="m-0 w-full flex items-center justify-center">
                        <Input disabled bordered={false} className="text-center text-sm p-0 w-full bg-transparent text-gray-700" />
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
                <div className="flex items-center h-full px-4 w-full">
                    <Form.Item name={[row.name, 'activity']} rules={[{ required: true }]} className="m-0 w-full flex items-center">
                        <Input bordered={false} className="text-sm p-0 w-full text-gray-700" placeholder="Activity Name" />
                    </Form.Item>
                    {/* Preserve existing hidden fields so they stay in form state */}
                    <Form.Item name={[row.name, 'actualStart']} hidden><Input /></Form.Item>
                    <Form.Item name={[row.name, 'actualEnd']} hidden><Input /></Form.Item>
                </div>
            )
        },
        {
            key: 'responsibility',
            name: 'RESPONSIBILITY',
            width: 200,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex items-center h-full px-4 w-full">
                    <Form.Item name={[row.name, 'responsibility']} className="m-0 w-full flex items-center">
                        <Input bordered={false} className="text-sm p-0 w-full text-gray-700" placeholder="Responsibility" />
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
                <div className="flex items-center h-full px-4 w-full">
                    <Form.Item name={[row.name, 'planStart']} className="m-0 w-full flex items-center justify-center">
                        <DatePicker bordered={false} className="w-full text-sm p-0 text-gray-700 flex justify-center" format="DD-MMM-YYYY" placeholder="Select Date" />
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
                <div className="flex items-center h-full px-4 w-full">
                    <Form.Item name={[row.name, 'planEnd']} className="m-0 w-full flex items-center justify-center">
                        <DatePicker bordered={false} className="w-full text-sm p-0 text-gray-700 flex justify-center" format="DD-MMM-YYYY" placeholder="Select Date" />
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
                <div className="flex items-center h-full px-4 w-full">
                    <Form.Item name={[row.name, 'remarks']} className="m-0 w-full flex items-center">
                        <Input bordered={false} className="text-sm p-0 w-full text-gray-700" placeholder="Enter Remarks" />
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
                <div className="flex items-center justify-center h-full w-full">
                    <Button
                        type="text"
                        danger
                        size="small"
                        icon={<Trash2 size={14} />}
                        onClick={() => remove(row.name)}
                    />
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
                        <span className="text-xl font-bold">Project Plan & Milestones</span>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">
                            {assetRequestId ? `Asset Request ID: ${assetRequestId}` : 'Define plan vs actual milestones'}
                        </p>
                    </div>
                </div>
            }
            open={visible}
            onCancel={onCancel}
            onOk={handleSubmit}
            width={1200}
            okText="Save Tracking Data"
            centered
            okButtonProps={{ className: 'bg-indigo-600 hover:bg-indigo-700' }}
            className="custom-modal"
        >
            <Form form={form} layout="vertical" className="mt-6">
                <Form.List name="milestones">
                    {(fields, { remove }) => {
                        const columns = getColumns(remove);
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
                    <Form.Item name="remarks" label="Overall Remarks">
                        <TextArea rows={3} className="text-xs" />
                    </Form.Item>
                </div>
            </Form>
        </Modal>
    );
};

export default ProjectPlanModal;
