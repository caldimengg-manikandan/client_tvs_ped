import React, { useEffect } from 'react';
import { Modal, Form, Input, DatePicker, Button, Space, Divider } from 'antd';
import { Plus, Trash2, Calendar, ClipboardList, Target } from 'lucide-react';
import dayjs from 'dayjs';

const { TextArea } = Input;

const ProjectPlanModal = ({ visible, onCancel, onSave, trackerId, initialData }) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (visible && initialData) {
            form.setFieldsValue({
                milestones: initialData.milestones?.map(m => ({
                    ...m,
                    targetDate: m.targetDate ? dayjs(m.targetDate) : null
                })) || [],
                timelines: initialData.timelines?.map(t => ({
                    ...t,
                    startDate: t.startDate ? dayjs(t.startDate) : null,
                    endDate: t.endDate ? dayjs(t.endDate) : null
                })) || [],
                details: initialData.details || ''
            });
        } else if (visible) {
            form.resetFields();
        }
    }, [visible, initialData, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            const formattedData = {
                ...values,
                milestones: values.milestones?.map(m => ({
                    ...m,
                    targetDate: m.targetDate ? m.targetDate.toISOString() : null
                })) || [],
                timelines: values.timelines?.map(t => ({
                    ...t,
                    startDate: t.startDate ? t.startDate.toISOString() : null,
                    endDate: t.endDate ? t.endDate.toISOString() : null
                })) || []
            };
            onSave(formattedData);
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
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">Define timelines and key project stages</p>
                    </div>
                </div>
            }
            open={visible}
            onCancel={onCancel}
            onOk={handleSubmit}
            width={700}
            okText="Save Plan"
            centered
            okButtonProps={{ className: 'bg-indigo-600 hover:bg-indigo-700' }}
        >
            <Form form={form} layout="vertical" className="mt-6 max-h-[60vh] overflow-y-auto px-2">
                {/* Milestones Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                            <Target size={16} className="text-indigo-600" />
                            KEY MILESTONES
                        </h3>
                    </div>
                    <Form.List name="milestones">
                        {(fields, { add, remove }) => (
                            <div className="space-y-3">
                                {fields.map(({ key, name, ...restField }) => (
                                    <div key={key} className="flex items-start gap-3 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                        <div className="flex-1 grid grid-cols-2 gap-3">
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'name']}
                                                rules={[{ required: true, message: 'Required' }]}
                                                className="mb-0"
                                            >
                                                <Input placeholder="Milestone Name (e.g. Design Approval)" />
                                            </Form.Item>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'targetDate']}
                                                rules={[{ required: true, message: 'Required' }]}
                                                className="mb-0"
                                            >
                                                <DatePicker className="w-full" placeholder="Target Date" />
                                            </Form.Item>
                                        </div>
                                        <Button 
                                            type="text" 
                                            danger 
                                            icon={<Trash2 size={16} />} 
                                            onClick={() => remove(name)}
                                            className="mt-1"
                                        />
                                    </div>
                                ))}
                                <Button 
                                    type="dashed" 
                                    onClick={() => add()} 
                                    block 
                                    icon={<Plus size={16} />}
                                    className="h-10 rounded-xl"
                                >
                                    Add Milestone
                                </Button>
                            </div>
                        )}
                    </Form.List>
                </div>

                <Divider />

                {/* Additional Details Section */}
                <div>
                    <h3 className="text-sm font-black text-gray-800 flex items-center gap-2 mb-4">
                        <ClipboardList size={16} className="text-indigo-600" />
                        PLANNING DETAILS
                    </h3>
                    <Form.Item name="details">
                        <TextArea 
                            rows={4} 
                            placeholder="Describe the detailed project sequence, dependencies, and requirements..." 
                            className="rounded-xl border-gray-200"
                        />
                    </Form.Item>
                </div>
            </Form>
        </Modal>
    );
};

export default ProjectPlanModal;
