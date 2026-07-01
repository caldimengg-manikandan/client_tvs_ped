import React, { useState } from 'react';
import { DatePicker, Select, Tooltip, Dropdown, Popover } from 'antd';
import { RefreshCw, Download, FileText, Sheet, Film, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import { exportDashboardPDF, exportDashboardExcel, exportDashboardPPTX } from './exportUtils';
import DashboardCalendar from './DashboardCalendar';
import { CalendarDays } from 'lucide-react';

const { RangePicker } = DatePicker;

const DATE_PRESETS = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Quarter', value: 'quarter' },
    { label: 'Custom', value: 'custom' },
];

const DEPARTMENTS = ['Assembly', 'Machining', 'Paint Shop', 'Logistics'];
const REQUEST_TYPES = ['New Project', 'Upgrade', 'Capacity', 'Replacement'];
const PLANT_LOCATIONS = ['Plant A', 'Plant B', 'Plant C'];

const DashboardHeader = ({ secondsAgo, refreshing, onRefresh, onDateRangeChange, dateRange, filters, onFilterChange, dashboardData }) => {
    const [preset, setPreset] = useState('month');
    const [showCustom, setShowCustom] = useState(false);
    const [exportLoading, setExportLoading] = useState(null);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    const applyPreset = (val) => {
        setPreset(val);
        if (val === 'custom') { setShowCustom(true); return; }
        setShowCustom(false);
        const now = dayjs();
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

    const filterContent = (
        <div className="flex flex-col gap-3 w-56 p-1">
            <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Department</label>
                <Select
                    allowClear
                    placeholder="All Departments"
                    value={filters?.department}
                    onChange={(val) => onFilterChange('department', val)}
                    options={DEPARTMENTS.map(d => ({ value: d, label: d }))}
                    className="w-full"
                    size="small"
                />
            </div>
            <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Request Type</label>
                <Select
                    allowClear
                    placeholder="All Types"
                    value={filters?.requestType}
                    onChange={(val) => onFilterChange('requestType', val)}
                    options={REQUEST_TYPES.map(t => ({ value: t, label: t }))}
                    className="w-full"
                    size="small"
                />
            </div>
            <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Plant Location</label>
                <Select
                    allowClear
                    placeholder="All Plants"
                    value={filters?.plantLocation}
                    onChange={(val) => onFilterChange('plantLocation', val)}
                    options={PLANT_LOCATIONS.map(p => ({ value: p, label: p }))}
                    className="w-full"
                    size="small"
                />
            </div>
        </div>
    );

    return (
        <div id="dashboard-header" className="bg-white rounded-2xl border border-border px-5 py-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-sm">
            {/* Left: live indicator */}
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setIsCalendarOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-blue-50 hover:border-blue-200 transition-colors rounded-full text-sm font-semibold text-slate-700"
                >
                    <CalendarDays size={18} className="text-blue-500" />
                    Request & Delivery Calendar
                </button>
                <DashboardCalendar open={isCalendarOpen} onClose={() => setIsCalendarOpen(false)} />
            </div>

            {/* Right: filters + actions */}
            <div className="flex items-center gap-3 flex-wrap">
                {/* Advanced Filters */}
                <Popover content={filterContent} title="Advanced Filters" trigger="click" placement="bottomRight">
                    <button className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 border border-slate-200/80 rounded-full text-[13px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors">
                        <Filter size={14} />
                        Filter
                        {(filters?.department || filters?.requestType || filters?.plantLocation) && (
                            <span className="w-2 h-2 rounded-full bg-[#C81E1E] ml-1"></span>
                        )}
                    </button>
                </Popover>

                {/* Date preset */}
                <Select
                    value={preset}
                    onChange={applyPreset}
                    size="middle"
                    style={{ width: 140 }}
                    options={DATE_PRESETS.map(p => ({ value: p.value, label: p.label }))}
                />
                {/* Custom range picker */}
                {showCustom && (
                    <RangePicker
                        size="middle"
                        onChange={handleCustomRange}
                        className="rounded-lg"
                    />
                )}

                {/* Refresh */}
                <Tooltip title="Refresh data">
                    <button
                        onClick={onRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 border border-slate-200/80 rounded-full text-[13px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
                    >
                        <motion.span animate={refreshing ? { rotate: 360 } : { rotate: 0 }} transition={refreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}>
                            <RefreshCw size={14} />
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
                    <button className="flex items-center gap-2 px-4 py-1.5 bg-[#C81E1E] text-white border border-[#C81E1E] rounded-full text-[13px] font-semibold hover:bg-[#A41515] transition-colors shadow-sm">
                        <Download size={14} />
                        {exportLoading ? 'Exporting…' : 'Export'}
                    </button>
                </Dropdown>
            </div>
        </div>
    );
};

export default DashboardHeader;
