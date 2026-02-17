import React, { useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Button } from 'antd';
import { ClipboardList } from 'lucide-react';
import dayjs from 'dayjs';

const { TextArea } = Input;

const DEFAULT_MILESTONES = [
    'RFQ Release',
    'Techno Commercial Evaluation',
    'Vendor Finalization',
    'PO Release',
    'Design Freeze',
    'Manufacturing Completion',
    'Dispatch',
    'Installation & Commissioning',
    'Final Handover'
];

const ProjectPlanModal = ({ visible, onCancel, onSave, trackerId, initialData }) => {
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
                    delayDays: existing.delayDays || null,
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

    const recalculateDelayForRow = (rowIndex) => {
        const milestones = form.getFieldValue('milestones') || [];
        const row = milestones[rowIndex];
        if (!row) return;

        const actualStart = row.actualStart;
        const actualEnd = row.actualEnd;

        if (actualStart && actualEnd && dayjs.isDayjs(actualStart) && dayjs.isDayjs(actualEnd)) {
            const diff = actualEnd.diff(actualStart, 'day');
            const delay = diff > 0 ? diff : 0;
            milestones[rowIndex] = { ...row, delayDays: delay };
        } else {
            milestones[rowIndex] = { ...row, delayDays: null };
        }

        form.setFieldsValue({ milestones });
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const formattedMilestones = (values.milestones || []).map((m) => ({
                sNo: m.sNo,
                activity: m.activity,
                responsibility: m.responsibility,
                planStart: m.planStart ? m.planStart.toISOString() : null,
                planEnd: m.planEnd ? m.planEnd.toISOString() : null,
                actualStart: m.actualStart ? m.actualStart.toISOString() : null,
                actualEnd: m.actualEnd ? m.actualEnd.toISOString() : null,
                delayDays: m.delayDays ?? null,
                remarks: m.remarks
            }));

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
                            Define plan vs actual milestones
                        </p>
                    </div>
                </div>
            }
            open={visible}
            onCancel={onCancel}
            onOk={handleSubmit}
            width="100%"
            okText="Save Plan"
            centered
            okButtonProps={{ className: 'bg-indigo-600 hover:bg-indigo-700' }}
        >
            <Form form={form} layout="vertical" className="mt-6">
                <div className="overflow-x-auto">
                    <Form.List name="milestones">
                        {(fields) => (
                            <table className="min-w-full border border-gray-200 rounded-xl overflow-hidden text-xs">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="border border-gray-200 px-2 py-2 text-left w-12">S.No</th>
                                        <th className="border border-gray-200 px-2 py-2 text-left w-56">Activity</th>
                                        <th className="border border-gray-200 px-2 py-2 text-left w-40">Responsibility</th>
                                        <th className="border border-gray-200 px-2 py-2 text-center w-32">Plan Start</th>
                                        <th className="border border-gray-200 px-2 py-2 text-center w-32">Plan End</th>
                                        <th className="border border-gray-200 px-2 py-2 text-center w-32">Actual Start</th>
                                        <th className="border border-gray-200 px-2 py-2 text-center w-32">Actual End</th>
                                        <th className="border border-gray-200 px-2 py-2 text-center w-28">Delay (Days)</th>
                                        <th className="border border-gray-200 px-2 py-2 text-left w-64">Remarks</th>
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
                                                <Form.Item name={[name, 'responsibility']} className="mb-0">
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
                                                        onChange={() => recalculateDelayForRow(name)}
                                                    />
                                                </Form.Item>
                                            </td>
                                            <td className="border border-gray-200 px-2 py-2 align-top">
                                                <Form.Item name={[name, 'actualEnd']} className="mb-0">
                                                    <DatePicker
                                                        className="w-full text-xs"
                                                        format="DD-MMM-YYYY"
                                                        size="small"
                                                        onChange={() => recalculateDelayForRow(name)}
                                                    />
                                                </Form.Item>
                                            </td>
                                            <td className="border border-gray-200 px-2 py-2 text-center align-top">
                                                <Form.Item name={[name, 'delayDays']} className="mb-0">
                                                    <Input disabled className="text-center text-xs" />
                                                </Form.Item>
                                            </td>
                                            <td className="border border-gray-200 px-2 py-2 align-top">
                                                <Form.Item name={[name, 'remarks']} className="mb-0">
                                                    <TextArea rows={1} className="text-xs" />
                                                </Form.Item>
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
