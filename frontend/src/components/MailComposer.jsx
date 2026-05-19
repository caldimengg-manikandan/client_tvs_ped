import React, { useState, useEffect, useRef } from 'react';
import {
    Modal, Button, Input, Select, Form, message, Spin, Divider, Tag
} from 'antd';
import { Mail, Send, Save, X, Users, UserCheck } from 'lucide-react';
import api from '../api/axiosConfig';

const { TextArea } = Input;

/**
 * MailComposer
 *
 * Props:
 *  - visible       {boolean}   Whether the modal is open
 *  - onClose       {function}  Called when the modal is dismissed
 *  - requestData   {object}    The MH request object returned from POST /api/asset-request
 *  - onSent        {function}  Called after a successful send
 *  - senderName    {string}    Logged-in user's display name
 *  - senderDept    {string}    Logged-in user's department
 */
const MailComposer = ({
    visible,
    onClose,
    requestData,
    onSent,
    senderName = '',
    senderDept = ''
}) => {
    const [form] = Form.useForm();
    const [sending, setSending] = useState(false);
    const [loadingApprovers, setLoadingApprovers] = useState(false);
    const [loadingEngineers, setLoadingEngineers] = useState(false);
    const [approvers, setApprovers] = useState([]);
    const [engineers, setEngineers] = useState([]);
    const [selectedEngineer, setSelectedEngineer] = useState(null);
    const [bodyText, setBodyText] = useState('');
    const [charCount, setCharCount] = useState(0);
    const [cancelConfirm, setCancelConfirm] = useState(false);

    // ── Helpers ──────────────────────────────────────────────────────────────
    const formatDate = (d) => {
        if (!d) return '';
        return new Date(d).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    const buildBodyTemplate = (approverName, engineerName) => {
        if (!requestData) return '';
        const engineerLine = engineerName
            ? `Assigned PED Engineer : ${engineerName}`
            : 'Assigned PED Engineer : (To be assigned)';

        return `Dear ${approverName || '[Approver Name]'},

This is to inform you that a new Material Handling (MH) request has been submitted and requires your approval.

── Request Details ────────────────────────
Request ID     : ${requestData.mhRequestId || '—'}
Submitted By   : ${senderName} (${requestData.userName || '—'})
Department     : ${requestData.departmentName || '—'}
Date Submitted : ${formatDate(requestData.createdAt || new Date())}

── Asset / Work Details ───────────────────
Handling Part  : ${requestData.handlingPartName || '—'}
Equipment Type : ${requestData.materialHandlingEquipment || '—'}
Handling Loc.  : ${requestData.materialHandlingLocation || '—'}
Flow           : ${requestData.from || '—'} → ${requestData.to || '—'}
Volume/Day     : ${requestData.volumePerDay || '—'}
Problem        : ${requestData.problemStatement || '—'}
Plant Location : ${requestData.plantLocation || '—'}
Request Type   : ${requestData.requestType || '—'}

── Engineer Assignment ────────────────────
${engineerLine}

── Action Required ────────────────────────
Please review and approve/reject this request at your earliest convenience.

── Portal Access ──────────────────────────
You can view and manage this request in the TVS-PED Portal:
${window.location.origin}/mh-requests

Regards,
${senderName}
${senderDept}, TVS-PED`;
    };

    // ── Fetch approvers ───────────────────────────────────────────────────
    useEffect(() => {
        if (!visible) return;
        setLoadingApprovers(true);
        setSelectedEngineer(null);

        const dept = requestData?.departmentName;
        const url = dept
            ? `/employees/approvers?department=${encodeURIComponent(dept)}`
            : '/employees/approvers';

        api.get(url)
            .then(res => {
                const list = res.data?.data || [];
                setApprovers(list);

                const primary = list.length > 0 ? list[0] : null;
                form.setFieldsValue({
                    to: primary?.mailId || '',
                    subject: `MH Request ${requestData?.mhRequestId || ''} — ${requestData?.handlingPartName || ''} | ${requestData?.departmentName || ''}`
                });
                setBodyText(buildBodyTemplate(primary?.employeeName, null));

                // Fallback: no dept match, try all approvers
                if (list.length === 0 && dept) {
                    api.get('/employees/approvers').then(r2 => {
                        const all = r2.data?.data || [];
                        setApprovers(all);
                        if (all.length > 0) {
                            form.setFieldsValue({ to: all[0].mailId });
                            setBodyText(buildBodyTemplate(all[0].employeeName, null));
                        }
                    }).catch(() => {});
                }
            })
            .catch(() => message.warning('Could not fetch approvers'))
            .finally(() => setLoadingApprovers(false));
    }, [visible, requestData?._id]);

    // ── Fetch PED engineers ───────────────────────────────────────────────
    useEffect(() => {
        if (!visible) return;
        setLoadingEngineers(true);
        api.get('/employees/ped-engineers')
            .then(res => setEngineers(res.data?.data || []))
            .catch(() => {})
            .finally(() => setLoadingEngineers(false));
    }, [visible]);

    // ── Char count ────────────────────────────────────────────────────────
    useEffect(() => { setCharCount(bodyText.length); }, [bodyText]);

    // ── Engineer selection → update body template ─────────────────────────
    const handleEngineerChange = (val) => {
        setSelectedEngineer(val);
        const eng = engineers.find(e => e._id === val);
        const engName = eng ? `${eng.employeeName} (${eng.employeeId})` : null;
        const currentTo = form.getFieldValue('to');
        const approverName = approvers.find(a => a.mailId === currentTo)?.employeeName || '';
        setBodyText(buildBodyTemplate(approverName, engName));
    };

    // ── Send email (+ save assignment) ───────────────────────────────────
    const handleSend = async () => {
        try { await form.validateFields(); } catch { return; }

        const values = form.getFieldsValue();
        setSending(true);
        try {
            // 1. If an engineer was selected, save the assignment first
            if (selectedEngineer && requestData?._id) {
                await api.patch(`/asset-request/${requestData._id}/assign-engineer`, {
                    engineerId: selectedEngineer
                }).catch(() => {}); // non-blocking — don't abort send if this fails
            }

            // 2. Send the email to the approver
            await api.post('/email/send', {
                to: values.to,
                cc: values.cc || '',
                subject: values.subject,
                body: bodyText.replace(/\n/g, '<br>'),
                requestId: requestData?.mhRequestId
            });

            // 3. Log it
            if (requestData?._id) {
                await api.post(`/asset-request/${requestData._id}/email-log`, {
                    to: values.to,
                    cc: values.cc || '',
                    subject: values.subject,
                    body: bodyText,
                    status: 'Delivered'
                });
            }

            message.success('Email sent to approver!');
            if (onSent) onSent(requestData);
            onClose();
        } catch (err) {
            message.error(err.response?.data?.message || 'Failed to send email');
            if (requestData?._id) {
                await api.post(`/asset-request/${requestData._id}/email-log`, {
                    to: values.to,
                    cc: values.cc || '',
                    subject: values.subject,
                    body: bodyText,
                    status: 'Failed'
                }).catch(() => {});
            }
        } finally {
            setSending(false);
        }
    };

    const handleSaveDraft = () => {
        if (!requestData?.mhRequestId) return;
        const values = form.getFieldsValue();
        localStorage.setItem(`mh_draft_${requestData.mhRequestId}`, JSON.stringify({ ...values, body: bodyText, savedAt: new Date().toISOString() }));
        message.success('Draft saved locally');
    };

    const handleCancel = () => {
        if (bodyText.trim() && !cancelConfirm) { setCancelConfirm(true); return; }
        setCancelConfirm(false);
        onClose();
    };

    const selectedEngineerObj = engineers.find(e => e._id === selectedEngineer);

    return (
        <Modal
            open={visible}
            onCancel={handleCancel}
            footer={null}
            width="min(90vw, 1060px)"
            centered
            destroyOnClose
            closeIcon={
                <div className="bg-gray-100 p-1.5 rounded-full hover:bg-red-50 hover:text-red-500 transition-all">
                    <X size={16} />
                </div>
            }
            styles={{ body: { padding: 0 } }}
        >
            {/* ── Header ── */}
            <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-tvs-primary to-blue-700 rounded-t-lg">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <Mail size={18} className="text-white" />
                </div>
                <div>
                    <h2 className="text-white font-bold text-base m-0">Send MH Request Notification</h2>
                    <p className="text-blue-200 text-xs m-0">
                        Request ID: <span className="font-bold text-white">{requestData?.mhRequestId}</span>
                        {' — '}{requestData?.handlingPartName}
                    </p>
                </div>
            </div>

            {/* ── Discard confirmation ── */}
            {cancelConfirm && (
                <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between">
                    <span className="text-amber-800 text-sm font-medium">Discard this email? Changes will be lost.</span>
                    <div className="flex gap-2">
                        <Button size="small" onClick={() => setCancelConfirm(false)}>Keep editing</Button>
                        <Button size="small" danger onClick={() => { setCancelConfirm(false); onClose(); }}>Discard</Button>
                    </div>
                </div>
            )}

            <div className="flex" style={{ minHeight: 540 }}>
                {/* ── LEFT: Mail metadata ── */}
                <div className="flex flex-col gap-4 p-5 border-r border-gray-100" style={{ width: 310, flexShrink: 0 }}>
                    <Form form={form} layout="vertical" size="middle">
                        {/* To */}
                        <Form.Item
                            label={<span className="text-xs font-bold text-gray-500 uppercase tracking-wide">To</span>}
                            name="to"
                            rules={[{ required: true, message: 'Recipient required' }]}
                            className="mb-3"
                        >
                            <Input prefix={<Mail size={13} className="text-gray-400" />} placeholder="approver@tvs.com" className="rounded-xl text-sm" />
                        </Form.Item>

                        {loadingApprovers ? (
                            <div className="text-xs text-gray-400 flex items-center gap-1 mb-3 -mt-2"><Spin size="small" /> Resolving approver…</div>
                        ) : approvers.length > 0 ? (
                            <div className="text-xs text-emerald-600 mb-3 -mt-2 flex items-center gap-1"><Users size={11} /> Approver auto-filled from Employee Master</div>
                        ) : (
                            <div className="text-xs text-amber-600 mb-3 -mt-2">No approver found — enter manually</div>
                        )}

                        {/* CC */}
                        <Form.Item
                            label={<span className="text-xs font-bold text-gray-500 uppercase tracking-wide">CC</span>}
                            name="cc" className="mb-3"
                        >
                            <Input placeholder="Optional CC addresses" className="rounded-xl text-sm" />
                        </Form.Item>

                        {/* Subject */}
                        <Form.Item
                            label={<span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Subject</span>}
                            name="subject"
                            rules={[{ required: true, message: 'Subject required' }]}
                            className="mb-3"
                        >
                            <Input className="rounded-xl text-sm" placeholder="Email subject" />
                        </Form.Item>

                        {/* Priority */}
                        <Form.Item
                            label={<span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Priority</span>}
                            name="priority" initialValue="Normal" className="mb-0"
                        >
                            <Select className="rounded-xl" options={[
                                { value: 'Normal', label: '🟢 Normal' },
                                { value: 'High',   label: '🟡 High' },
                                { value: 'Urgent', label: '🔴 Urgent' },
                            ]} />
                        </Form.Item>
                    </Form>

                    {/* Request summary chip */}
                    <div className="mt-auto">
                        <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 border border-gray-100">
                            <p className="font-bold text-gray-700 mb-1">{requestData?.mhRequestId}</p>
                            <p>{requestData?.departmentName} · {requestData?.plantLocation}</p>
                            <p className="truncate">{requestData?.handlingPartName}</p>
                        </div>
                    </div>
                </div>

                {/* ── RIGHT: Email body + engineer selector ── */}
                <div className="flex flex-col flex-1 p-5">

                    {/* ── Engineer selector — lives above the email body ── */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3">
                        <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2 flex items-center gap-1">
                            <UserCheck size={12} /> Assign PED Engineer
                            <span className="text-blue-400 font-normal normal-case tracking-normal ml-1">
                                — selection will appear in the email body below
                            </span>
                        </p>
                        <Select
                            placeholder={loadingEngineers ? 'Loading engineers…' : 'Select engineer to assign'}
                            loading={loadingEngineers}
                            value={selectedEngineer}
                            onChange={handleEngineerChange}
                            className="w-full rounded-xl"
                            showSearch
                            optionFilterProp="label"
                            allowClear
                            onClear={() => {
                                setSelectedEngineer(null);
                                const currentTo = form.getFieldValue('to');
                                const approverName = approvers.find(a => a.mailId === currentTo)?.employeeName || '';
                                setBodyText(buildBodyTemplate(approverName, null));
                            }}
                            options={engineers.map(e => ({
                                value: e._id,
                                label: `${e.employeeName} (${e.employeeId})`,
                                title: `${e.departmentName} • ${e.mailId}`
                            }))}
                            notFoundContent={loadingEngineers ? <Spin size="small" /> : 'No PED Engineers found in Employee Master'}
                        />
                        {selectedEngineerObj && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-blue-700">
                                <Tag color="blue" className="m-0">{selectedEngineerObj.employeeName}</Tag>
                                <span className="text-gray-400">{selectedEngineerObj.mailId}</span>
                                <span className="text-emerald-600 font-semibold ml-auto">✓ Will be assigned on Send</span>
                            </div>
                        )}
                    </div>

                    {/* ── Email body ── */}
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Email Body</span>
                        <span className="text-xs text-gray-400">{charCount.toLocaleString()} characters</span>
                    </div>

                    <TextArea
                        value={bodyText}
                        onChange={e => setBodyText(e.target.value)}
                        autoSize={{ minRows: 16, maxRows: 24 }}
                        className="flex-1 font-mono text-[13px] text-gray-700 rounded-xl border-gray-200 resize-none bg-gray-50 hover:bg-white focus:bg-white transition-colors"
                        placeholder="Email body will be auto-filled from the request details…"
                        style={{ lineHeight: '1.7' }}
                    />
                    <p className="text-xs text-gray-400 mt-1.5">
                        💡 Edit the body freely before sending. The assigned engineer name is embedded in the "Engineer Assignment" section above.
                    </p>

                    {/* ── Action buttons ── */}
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                        <Button onClick={handleSaveDraft} icon={<Save size={14} />} className="rounded-xl text-sm font-semibold h-10 px-5">
                            Save Draft
                        </Button>
                        <div className="flex gap-2">
                            <Button onClick={handleCancel} className="rounded-xl text-sm h-10 px-5">Cancel</Button>
                            <Button
                                type="primary"
                                loading={sending}
                                onClick={handleSend}
                                icon={<Send size={14} />}
                                className="rounded-xl text-sm font-bold h-10 px-6 bg-tvs-primary hover:bg-blue-700 border-none shadow-md"
                            >
                                {selectedEngineer ? 'Assign & Send Email' : 'Send Email'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default MailComposer;
