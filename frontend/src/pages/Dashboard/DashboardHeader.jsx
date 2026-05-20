import React, { useState } from 'react';
import { DatePicker, Select, Button, Tooltip, Dropdown } from 'antd';
import { RefreshCw, Download, FileText, Sheet, Film } from 'lucide-react';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import { exportDashboardPDF, exportDashboardExcel, exportDashboardPPTX } from './exportUtils';

const { RangePicker } = DatePicker;

const DATE_PRESETS = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Quarter', value: 'quarter' },
    { label: 'Custom', value: 'custom' },
];

const DashboardHeader = ({ secondsAgo, refreshing, onRefresh, onDateRangeChange, dateRange, dashboardData }) => {
    const [preset, setPreset] = useState('month');
    const [showCustom, setShowCustom] = useState(false);
    const [exportLoading, setExportLoading] = useState(null);

    const now = dayjs();
    const dateStr = now.format('dddd, D MMMM YYYY');

    const applyPreset = (val) => {
        setPreset(val);
        if (val === 'custom') { setShowCustom(true); return; }
        setShowCustom(false);
        if (val === 'today') {
            onDateRangeChange(now.format('YYYY-MM-DD'), now.format('YYYY-MM-DD'));
        } else if (val === 'week') {
            onDateRangeChange(now.startOf('week').format('YYYY-MM-DD'), now.endOf('week').format('YYYY-MM-DD'));
        } else if (val === 'month') {
            onDateRangeChange(now.startOf('month').format('YYYY-MM-DD'), now.endOf('month').format('YYYY-MM-DD'));
        } else if (val === 'quarter') {
            onDateRangeChange(now.startOf('quarter').format('YYYY-MM-DD'), now.endOf('quarter').format('YYYY-MM-DD'));
        }
    };

    const handleCustomRange = (dates) => {
        if (dates && dates[0] && dates[1]) {
            onDateRangeChange(dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD'));
        }
    };

    const handleExport = async (type) => {
        setExportLoading(type);
        try {
            if (type === 'pdf') await exportDashboardPDF(dashboardData);
            else if (type === 'excel') await exportDashboardExcel(dashboardData);
            else if (type === 'pptx') await exportDashboardPPTX(dashboardData);
        } catch (e) {
            console.error('Export error', e);
        } finally {
            setExportLoading(null);
        }
    };

    const exportItems = [
        { key: 'pdf', label: <span className="flex items-center gap-2"><FileText size={14} /> Export as PDF</span> },
        { key: 'excel', label: <span className="flex items-center gap-2"><Sheet size={14} /> Export as Excel</span> },
        { key: 'pptx', label: <span className="flex items-center gap-2"><Film size={14} /> Export as PowerPoint</span> },
    ];

    return (
        <div id="dashboard-header" className="bg-white rounded-2xl border border-border px-5 py-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-sm">
            {/* Left: title + live indicator */}
            <div className="flex items-center gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold text-txt-1 font-outfit m-0">
                            PLANT ENGINEERING -MATERIAL HANDLING ASSESTS DASHBOARD
                        </h1>
                        {/* Live pulsing dot */}
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                        </span>
                    </div>
                    <p className="text-xs text-txt-3 mt-0.5 m-0">{dateStr}</p>
                </div>
                {/* Last updated */}
                <div className="hidden lg:flex items-center gap-1.5 text-xs text-txt-3 bg-surface px-2.5 py-1 rounded-full border border-border">
                    <span>Updated {secondsAgo < 5 ? 'just now' : `${secondsAgo}s ago`}</span>
                </div>
            </div>

            {/* Right: filters + actions */}
            <div className="flex items-center gap-2 flex-wrap">
                {/* Date preset */}
                <Select
                    value={preset}
                    onChange={applyPreset}
                    size="small"
                    className="w-32"
                    options={DATE_PRESETS.map(p => ({ value: p.value, label: p.label }))}
                />
                {/* Custom range picker */}
                {showCustom && (
                    <RangePicker
                        size="small"
                        onChange={handleCustomRange}
                        className="rounded-lg"
                    />
                )}

                {/* Refresh */}
                <Tooltip title="Refresh data">
                    <button
                        onClick={onRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-semibold text-txt-2 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        <motion.span animate={refreshing ? { rotate: 360 } : { rotate: 0 }} transition={refreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}>
                            <RefreshCw size={13} />
                        </motion.span>
                        {refreshing ? 'Refreshing…' : 'Refresh'}
                    </button>
                </Tooltip>

                {/* Export */}
                <Dropdown
                    menu={{
                        items: exportItems,
                        onClick: ({ key }) => handleExport(key)
                    }}
                    placement="bottomRight"
                >
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-tvs-primary text-white border-none rounded-lg text-xs font-semibold hover:bg-navy-700 transition-colors">
                        <Download size={13} />
                        {exportLoading ? 'Exporting…' : 'Export'}
                    </button>
                </Dropdown>
            </div>
        </div>
    );
};

export default DashboardHeader;
