import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Input, Button, Skeleton, Alert, Tooltip as AntTooltip } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import { Search, Download, X, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { defaultColDef } from '../../config/agGridConfig';
import api from '../../api/axiosConfig';

/* ── helpers ───────────────────────────────────────────────── */
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const statusBadge = (status) => {
    const v = status || '—';
    const colorMap = {
        'On Track':    { bg: '#DCFCE7', text: '#166534' },
        'Likely Delay':{ bg: '#FEF9C3', text: '#854D0E' },
        'Delayed':     { bg: '#FEE2E2', text: '#991B1B' },
        'Not Started': { bg: '#F1F5F9', text: '#475569' },
        'Accepted':    { bg: '#DCFCE7', text: '#166534' },
        'Active':      { bg: '#DBEAFE', text: '#1D4ED8' },
        'Rejected':    { bg: '#FEE2E2', text: '#991B1B' },
        'Pending':     { bg: '#FEF9C3', text: '#854D0E' },
        'Assigned':    { bg: '#EDE9FE', text: '#5B21B6' },
        'Completed':   { bg: '#DCFCE7', text: '#166534' },
        'Inactive':    { bg: '#F1F5F9', text: '#475569' },
    };
    const c = colorMap[v] || { bg: '#F1F5F9', text: '#475569' };
    return (
        <span style={{
            background: c.bg, color: c.text,
            padding: '2px 8px', borderRadius: 12,
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
            {v}
        </span>
    );
};

const priorityCell = p => {
    const v = p.value || 'Normal';
    const colorMap = {
        'High':   { bg: '#FEE2E2', text: '#991B1B' },
        'Urgent': { bg: '#FEF9C3', text: '#854D0E' },
        'Normal': { bg: '#DBEAFE', text: '#1D4ED8' },
    };
    const c = colorMap[v] || colorMap['Normal'];
    return (
        <span style={{
            background: c.bg, color: c.text,
            padding: '2px 8px', borderRadius: 12,
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
        }}>
            {v}
        </span>
    );
};

/* ── Column definitions per modal type ─────────────────────── */
const MH_REQUEST_COLS = [
    { headerName: 'S.No', valueGetter: 'node.rowIndex + 1', width: 52, minWidth: 52, flex: 0, sortable: false, filter: false, resizable: false, pinned: 'left', cellStyle: { textAlign: 'center', color: '#1a1a1a' } },
    { headerName: 'REQUEST ID',   field: 'mhRequestId',   flex: 1, minWidth: 140, cellStyle: { color: '#1a1a1a', fontWeight: 600 } },
    { headerName: 'ASSET / PART', flex: 2, minWidth: 180, valueGetter: p => p.data?.handlingPartName || p.data?.materialHandlingEquipment || p.data?.productModel || '—', cellStyle: { color: '#1a1a1a' } },
    { headerName: 'DEPARTMENT',   field: 'departmentName', flex: 1, minWidth: 130, cellStyle: { color: '#1a1a1a' } },
    { headerName: 'SUBMITTED BY', field: 'userName',       flex: 1, minWidth: 130, cellStyle: { color: '#1a1a1a' } },
    { headerName: 'REQUEST TYPE', field: 'requestType',    flex: 1, minWidth: 140, cellStyle: { color: '#1a1a1a' } },
    { headerName: 'STATUS',       flex: 1, minWidth: 110,  cellRenderer: p => statusBadge(p.data?.workflowStatus || p.data?.status), cellStyle: { display: 'flex', alignItems: 'center' } },
    { headerName: 'PRIORITY',     flex: 1, minWidth: 100,  cellRenderer: priorityCell, valueGetter: p => ['Capacity'].includes(p.data?.requestType) ? 'High' : ['Special Improvements'].includes(p.data?.requestType) ? 'Urgent' : 'Normal', cellStyle: { display: 'flex', alignItems: 'center' } },
    { headerName: 'CREATED AT',   field: 'createdAt',      flex: 1, minWidth: 120, valueFormatter: p => fmtDate(p.value), cellStyle: { color: '#64748B' } },
    { headerName: 'ENGINEER',     flex: 1, minWidth: 130,  valueGetter: p => p.data?.assignedEngineer?.employeeName || p.data?.assignedEngineerName || '—', cellStyle: { color: '#1a1a1a' } },
];

const ASSET_COLS = [
    { headerName: 'S.No', valueGetter: 'node.rowIndex + 1', width: 52, minWidth: 52, flex: 0, sortable: false, filter: false, resizable: false, pinned: 'left', cellStyle: { textAlign: 'center', color: '#1a1a1a' } },
    { headerName: 'ASSET ID',   field: 'assetId',       flex: 1, minWidth: 130, cellStyle: { color: '#1a1a1a', fontWeight: 600 } },
    { headerName: 'ASSET NAME', field: 'assetName',     flex: 2, minWidth: 180, cellStyle: { color: '#1a1a1a' } },
    { headerName: 'LOCATION',   field: 'plantLocation', flex: 1, minWidth: 140, cellStyle: { color: '#1a1a1a' } },
    { headerName: 'STATUS',     field: 'status',        flex: 1, minWidth: 110, cellRenderer: p => statusBadge(p.value), cellStyle: { display: 'flex', alignItems: 'center' } },
    { headerName: 'ADDED ON',   field: 'createdAt',     flex: 1, minWidth: 120, valueFormatter: p => fmtDate(p.value), cellStyle: { color: '#64748B' } },
];

const EMPLOYEE_COLS = [
    { headerName: 'S.No', valueGetter: 'node.rowIndex + 1', width: 52, minWidth: 52, flex: 0, sortable: false, filter: false, resizable: false, pinned: 'left', cellStyle: { textAlign: 'center', color: '#1a1a1a' } },
    { headerName: 'EMP ID',     field: 'employeeId',    flex: 1, minWidth: 120, cellStyle: { color: '#1a1a1a', fontWeight: 600 } },
    { headerName: 'NAME',       field: 'employeeName',  flex: 1, minWidth: 160, cellStyle: { color: '#1a1a1a', fontWeight: 600 } },
    { headerName: 'DEPARTMENT', field: 'departmentName',flex: 1, minWidth: 140, cellStyle: { color: '#1a1a1a' } },
    { headerName: 'ROLE',       valueGetter: p => p.data?.role || p.data?.designation || '—', flex: 1, minWidth: 130, cellStyle: { color: '#1a1a1a' } },
    { headerName: 'EMAIL',      field: 'email',         flex: 1, minWidth: 180, cellStyle: { color: '#1a1a1a' } },
    { headerName: 'PHONE',      valueGetter: p => p.data?.mobileNumber || p.data?.phone || '—', flex: 1, minWidth: 130, cellStyle: { color: '#1a1a1a' } },
    { headerName: 'STATUS',     field: 'status',        flex: 1, minWidth: 100, cellRenderer: p => statusBadge(p.value), cellStyle: { display: 'flex', alignItems: 'center' } },
];

const buildPhaseColDefs = () => [
    { headerName: 'S.No', valueGetter: 'node.rowIndex + 1', width: 52, minWidth: 52, flex: 0, sortable: false, filter: false, resizable: false, pinned: 'left', cellStyle: { textAlign: 'center', color: '#1a1a1a' } },
    { headerName: 'ITEM NAME', flex: 2, minWidth: 180, valueGetter: p => p.data?.productModel || p.data?.materialHandlingEquipment || '—', cellStyle: { color: '#1a1a1a', fontWeight: 600 } },
    { headerName: 'DEPARTMENT', field: 'departmentName', flex: 1, minWidth: 120, cellStyle: { color: '#1a1a1a' } },
    { headerName: 'REQUEST ID',  field: 'assetRequestId', flex: 1, minWidth: 130, cellStyle: { color: '#1a1a1a' } },
    { headerName: 'VENDOR',      field: 'vendorName',     flex: 1, minWidth: 120, cellStyle: { color: '#1a1a1a' } },
    { headerName: 'REQUEST TYPE', field: 'requestType',   flex: 1, minWidth: 130, cellStyle: { color: '#1a1a1a' } },
    { headerName: 'STATUS', field: 'status', flex: 1, minWidth: 120, cellRenderer: p => statusBadge(p.value), cellStyle: { display: 'flex', alignItems: 'center' } },
    { headerName: 'TARGET DATE', field: 'implementationTarget', flex: 1, minWidth: 120, valueFormatter: p => fmtDate(p.value), cellStyle: p => ({ color: p.value && new Date(p.value) < new Date() ? '#CC1F1F' : '#1a1a1a', fontWeight: p.value && new Date(p.value) < new Date() ? 700 : 400 }) },
    { headerName: 'REMARKS', field: 'remarks', flex: 2, minWidth: 200, cellRenderer: p => p.value ? ( <AntTooltip title={p.value} placement="topLeft"> <span style={{ color: '#1a1a1a', cursor: 'default', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}> {p.value} </span> </AntTooltip> ) : <span style={{ color: '#94A3B8' }}>—</span> },
];

const TYPE_CONFIG = {
    'mh-requested': { endpoint: '/asset-request', params: { limit: 500, sort: '-createdAt' }, cols: MH_REQUEST_COLS },
    'mh-approved':  { endpoint: '/asset-request', params: { status: 'Accepted', limit: 500 }, cols: MH_REQUEST_COLS },
    'mh-pending':   { endpoint: '/asset-request', params: { workflowStatus: 'Pending', limit: 500 }, cols: MH_REQUEST_COLS },
    'mh-rejected':  { endpoint: '/asset-request', params: { status: 'Rejected', limit: 500 }, cols: MH_REQUEST_COLS },
    'assets':       { endpoint: '/asset-management', params: { limit: 500 }, cols: ASSET_COLS },
    'employees':    { endpoint: '/employees', params: { limit: 500 }, cols: EMPLOYEE_COLS },
};

/* ── Excel export helper ────────────────────────────────────── */
const exportRows = (gridApi, sheetName) => {
    const rows = [];
    gridApi.forEachNodeAfterFilter(n => { if (n.data) rows.push(n.data); });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
    XLSX.writeFile(wb, `TVS-PED-${sheetName}-${new Date().toISOString().slice(0, 10)}.xlsx`);
};

/* ── Main Inline Panel ──────────────────────────────────────── */
const InlineDetailPanel = ({ activeKpi, onClose }) => {
    const [rows, setRows]       = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(null);
    const [searchText, setSearchText] = useState('');
    const [visibleCount, setVisibleCount] = useState(0);
    const gridRef = useRef(null);

    const { type, title, isPhase, stage, colour } = activeKpi || {};
    
    // Determine configuration based on whether it's a phase or standard KPI
    const cfg = useMemo(() => {
        if (!activeKpi) return null;
        if (isPhase) {
            return {
                endpoint: '/dashboard/phase-items',
                params: { stage },
                cols: buildPhaseColDefs(),
                title: `${stage} Phase`
            };
        } else {
            const config = TYPE_CONFIG[type];
            return config ? { ...config, title } : null;
        }
    }, [activeKpi, isPhase, stage, type, title]);

    const fetchData = useCallback(async () => {
        if (!cfg) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.get(cfg.endpoint, { params: cfg.params });
            const data = Array.isArray(res.data) ? res.data : res.data?.data || res.data?.items || [];
            setRows(data);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [cfg]);

    useEffect(() => {
        if (activeKpi) {
            setSearchText('');
            fetchData();
        }
    }, [activeKpi, fetchData]);

    useEffect(() => {
        if (gridRef.current?.api) {
            gridRef.current.api.setGridOption('quickFilterText', searchText);
        }
    }, [searchText]);

    const tableDefaultColDef = useMemo(() => ({
        ...defaultColDef,
        autoHeight: false,
        wrapText: false,
        floatingFilter: false,
        filter: true,
        cellStyle: {
            color: '#1a1a1a',
            paddingLeft: '12px',
            paddingRight: '12px',
            lineHeight: '1.45',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        },
    }), []);

    const onFilterChanged = useCallback(() => {
        if (gridRef.current?.api) setVisibleCount(gridRef.current.api.getDisplayedRowCount());
    }, []);

    if (!activeKpi) return null;

    return (
        <div className="bg-white rounded-[16px] border border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.08)] mt-2 mb-6 overflow-hidden animate-in slide-in-from-top-4 fade-in duration-300">
            {/* Header / Toolbar */}
            <div className="bg-[#1e293b] text-white px-6 py-4 flex items-center justify-between border-b border-[#0f172a]">
                <div className="flex items-center gap-4">
                    {isPhase && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colour || '#F59E0B' }} />}
                    <h3 className="font-extrabold text-[13px] tracking-[0.1em] uppercase">{cfg?.title || 'Data Detail'}</h3>
                    <div className="text-slate-400 text-[11px] font-bold px-4 border-l border-slate-700 tracking-wider">
                        SHOWING {visibleCount} OF {rows.length} RECORDS
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Search records..." 
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            className="bg-slate-800 text-sm text-white placeholder-slate-400 rounded-lg py-1.5 pl-9 pr-4 border border-slate-700 focus:outline-none focus:border-slate-500 w-64 transition-all"
                        />
                    </div>
                    <button 
                        onClick={() => gridRef.current?.api && exportRows(gridRef.current.api, cfg?.title || 'Export')}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-2 rounded-lg border border-slate-700 transition-colors"
                        title="Export to Excel"
                    >
                        <Download size={16} />
                    </button>
                    <button 
                        onClick={onClose}
                        className="bg-slate-800 hover:bg-red-500/20 hover:border-red-500/50 text-slate-300 hover:text-red-400 px-4 py-1.5 rounded-lg border border-slate-700 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-wider ml-2"
                    >
                        <X size={14} /> Close Table
                    </button>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="p-4">
                    <Alert
                        type="error"
                        message={error}
                        action={<Button size="small" onClick={fetchData}><RefreshCw size={12} className="mr-1 inline" />Retry</Button>}
                    />
                </div>
            )}

            {/* Loading / Data Grid */}
            <div className="p-0">
                {loading ? (
                    <div className="p-6">
                        <Skeleton active paragraph={{ rows: 6 }} />
                    </div>
                ) : (
                    <div className="ag-theme-alpine" style={{ width: '100%' }}>
                        <AgGridReact
                            ref={gridRef}
                            rowData={rows}
                            columnDefs={cfg?.cols || []}
                            defaultColDef={tableDefaultColDef}
                            domLayout="autoHeight"
                            rowHeight={48}
                            headerHeight={46}
                            theme="legacy"
                            pagination={true}
                            paginationPageSize={20}
                            paginationPageSizeSelector={[10, 20, 50, 100]}
                            animateRows={true}
                            enableCellTextSelection={true}
                            suppressCellFocus={true}
                            suppressColumnVirtualisation={true}
                            rowClass="tvs-ag-row"
                            onFilterChanged={onFilterChanged}
                            onGridReady={p => {
                                p.api.sizeColumnsToFit();
                                setVisibleCount(p.api.getDisplayedRowCount());
                            }}
                            onFirstDataRendered={p => {
                                p.api.sizeColumnsToFit();
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default InlineDetailPanel;
