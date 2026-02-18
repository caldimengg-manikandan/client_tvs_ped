import React, { useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Button } from 'antd';
import { ClipboardList, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';

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
            const formattedMilestones = (values.milestones || []).map(m => {
                const planStart = m.planStart || null;
                const planEnd = m.planEnd || null;
                const actualStart = m.actualStart || null;
                const actualEnd = m.actualEnd || null;

                let delayDays = 0;
                if (planEnd && actualEnd) {
                    const diff = dayjs(actualEnd).startOf('day').diff(
                        dayjs(planEnd).startOf('day'),
                        'day'
                    );
                    if (!Number.isNaN(diff) && diff > 0) {
                        delayDays = diff;
                    }
                }

                return {
                    sNo: m.sNo,
                    activity: m.activity,
                    responsibility: m.responsibility,
                    planStart: planStart ? planStart.toISOString() : null,
                    planEnd: planEnd ? planEnd.toISOString() : null,
                    actualStart: actualStart ? actualStart.toISOString() : null,
                    actualEnd: actualEnd ? actualEnd.toISOString() : null,
                    delayDays,
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
            width="100%"
            okText="Save Tracking Data"
            centered
            okButtonProps={{ className: 'bg-indigo-600 hover:bg-indigo-700' }}
        >
            <Form form={form} layout="vertical" className="mt-6">
                <div className="overflow-x-auto">
                    <Form.List name="milestones">
                        {(fields, { remove }) => (
                            <table className="min-w-full border border-gray-200 rounded-xl overflow-hidden text-xs">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th
                                            rowSpan={2}
                                            className="border border-gray-200 px-2 py-2 text-left w-12"
                                        >
                                            S.No
                                        </th>
                                        <th
                                            rowSpan={2}
                                            className="border border-gray-200 px-2 py-2 text-left w-56"
                                        >
                                            List of Activities
                                        </th>
                                        <th
                                            rowSpan={2}
                                            className="border border-gray-200 px-2 py-2 text-left w-40"
                                        >
                                            Responsibility
                                        </th>
                                        <th
                                            colSpan={2}
                                            className="border border-gray-200 px-2 py-2 text-center w-64"
                                        >
                                            Plan
                                        </th>
                                        <th
                                            colSpan={2}
                                            className="border border-gray-200 px-2 py-2 text-center w-64"
                                        >
                                            Actual
                                        </th>
                                        <th
                                            rowSpan={2}
                                            className="border border-gray-200 px-2 py-2 text-center w-24"
                                        >
                                            Delay (Days)
                                        </th>
                                        <th
                                            rowSpan={2}
                                            className="border border-gray-200 px-2 py-2 text-left w-40"
                                        >
                                            Remarks
                                        </th>
                                        <th
                                            rowSpan={2}
                                            className="border border-gray-200 px-2 py-2 text-center w-16"
                                        >
                                            Action
                                        </th>
                                    </tr>
                                    <tr>
                                        <th className="border border-gray-200 px-2 py-2 text-center w-32">
                                            Start Date
                                        </th>
                                        <th className="border border-gray-200 px-2 py-2 text-center w-32">
                                            End Date
                                        </th>
                                        <th className="border border-gray-200 px-2 py-2 text-center w-32">
                                            Start Date
                                        </th>
                                        <th className="border border-gray-200 px-2 py-2 text-center w-32">
                                            End Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fields.map(({ key, name }) => (
                                        <tr key={key} className="odd:bg-white even:bg-gray-50">
                                            <td className="border border-gray-200 px-2 py-2 text-center align-top">
                                                <Form.Item name={[name, 'sNo']} className="mb-0">
                                                    <Input disabled className="text-center text-xs" />
                                                </Form.Item>
                                            </td>
                                            <td className="border border-gray-200 px-2 py-2 align-top">
                                                <Form.Item
                                                    name={[name, 'activity']}
                                                    rules={[{ required: true }]}
                                                    className="mb-0"
                                                >
                                                    <Input className="text-xs" />
                                                </Form.Item>
                                            </td>
                                            <td className="border border-gray-200 px-2 py-2 align-top">
                                                <Form.Item
                                                    name={[name, 'responsibility']}
                                                    className="mb-0"
                                                >
                                                    <Input className="text-xs" />
                                                </Form.Item>
                                            </td>
                                            <td className="border border-gray-200 px-2 py-2 align-top">
                                                <Form.Item name={[name, 'planStart']} className="mb-0">
                                                    <DatePicker
                                                        className="w-full text-xs"
                                                        format="DD-MMM-YYYY"
                                                        size="small"
                                                    />
                                                </Form.Item>
                                            </td>
                                            <td className="border border-gray-200 px-2 py-2 align-top">
                                                <Form.Item name={[name, 'planEnd']} className="mb-0">
                                                    <DatePicker
                                                        className="w-full text-xs"
                                                        format="DD-MMM-YYYY"
                                                        size="small"
                                                    />
                                                </Form.Item>
                                            </td>
                                            <td className="border border-gray-200 px-2 py-2 align-top">
                                                <Form.Item name={[name, 'actualStart']} className="mb-0">
                                                    <DatePicker
                                                        className="w-full text-xs"
                                                        format="DD-MMM-YYYY"
                                                        size="small"
                                                    />
                                                </Form.Item>
                                            </td>
                                            <td className="border border-gray-200 px-2 py-2 align-top">
                                                <Form.Item name={[name, 'actualEnd']} className="mb-0">
                                                    <DatePicker
                                                        className="w-full text-xs"
                                                        format="DD-MMM-YYYY"
                                                        size="small"
                                                    />
                                                </Form.Item>
                                            </td>
                                            <td className="border border-gray-200 px-2 py-2 align-top text-center">
                                                <Form.Item
                                                    noStyle
                                                    shouldUpdate={(prev, curr) =>
                                                        prev.milestones?.[name]?.planEnd !==
                                                            curr.milestones?.[name]?.planEnd ||
                                                        prev.milestones?.[name]?.actualEnd !==
                                                            curr.milestones?.[name]?.actualEnd
                                                    }
                                                >
                                                    {({ getFieldValue }) => {
                                                        const planEnd = getFieldValue([
                                                            'milestones',
                                                            name,
                                                            'planEnd'
                                                        ]);
                                                        const actualEnd = getFieldValue([
                                                            'milestones',
                                                            name,
                                                            'actualEnd'
                                                        ]);
                                                        let delayLabel = '-';
                                                        if (planEnd && actualEnd) {
                                                            const diff = actualEnd.diff(
                                                                planEnd,
                                                                'day'
                                                            );
                                                            if (!Number.isNaN(diff) && diff > 0) {
                                                                delayLabel = `${diff}`;
                                                            } else {
                                                                delayLabel = '0';
                                                            }
                                                        }
                                                        return (
                                                            <span className="text-xs font-semibold">
                                                                {delayLabel}
                                                            </span>
                                                        );
                                                    }}
                                                </Form.Item>
                                            </td>
                                            <td className="border border-gray-200 px-2 py-2 align-top">
                                                <Form.Item
                                                    name={[name, 'remarks']}
                                                    className="mb-0"
                                                >
                                                    <Input className="text-xs" />
                                                </Form.Item>
                                            </td>
                                            <td className="border border-gray-200 px-2 py-2 text-center align-top">
                                                <Button
                                                    type="text"
                                                    danger
                                                    size="small"
                                                    icon={<Trash2 size={14} />}
                                                    onClick={() => remove(name)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </Form.List>
                </div>

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
