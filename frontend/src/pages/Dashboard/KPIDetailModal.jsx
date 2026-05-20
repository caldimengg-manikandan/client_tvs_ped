import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Modal, Input, Button, Skeleton, Alert } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { defaultColDef } from '../../config/agGridConfig';
import api from '../../api/axiosConfig';

/* ── helpers ───────────────────────────────────────────────── */
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const statusCell = p => {
    const v = p.value || '—';
    const colorMap = {
        'Accepted': { bg: '#DCFCE7', text: '#166534' },
        'Active':   { bg: '#DBEAFE', text: '#1D4ED8' },
        'Rejected': { bg: '#FEE2E2', text: '#991B1B' },
        'Pending':  { bg: '#FEF9C3', text: '#854D0E' },
        'Assigned': { bg: '#EDE9FE', text: '#5B21B6' },
        'Completed':{ bg: '#DCFCE7', text: '#166534' },
        'Inactive': { bg: '#F1F5F9', text: '#475569' },
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
    { headerName: 'STATUS',       flex: 1, minWidth: 110,  cellRenderer: statusCell,   valueGetter: p => p.data?.workflowStatus || p.data?.status, cellStyle: { display: 'flex', alignItems: 'center' } },
    { headerName: 'PRIORITY',     flex: 1, minWidth: 100,  cellRenderer: priorityCell, valueGetter: p => ['Capacity'].includes(p.data?.requestType) ? 'High' : ['Special Improvements'].includes(p.data?.requestType) ? 'Urgent' : 'Normal', cellStyle: { display: 'flex', alignItems: 'center' } },
    { headerName: 'CREATED AT',   field: 'createdAt',      flex: 1, minWidth: 120, valueFormatter: p => fmtDate(p.value), cellStyle: { color: '#64748B' } },
    { headerName: 'ENGINEER',     flex: 1, minWidth: 130,  valueGetter: p => p.data?.assignedEngineer?.employeeName || p.data?.assignedEngineerName || '—', cellStyle: { color: '#1a1a1a' } },
];

const ASSET_COLS = [
    { headerName: 'S.No', valueGetter: 'node.rowIndex + 1', width: 52, minWidth: 52, flex: 0, sortable: false, filter: false, resizable: false, pinned: 'left', cellStyle: { textAlign: 'center', color: '#1a1a1a' } },
    { headerName: 'ASSET ID',   field: 'assetId',       flex: 1, minWidth: 130, cellStyle: { color: '#1a1a1a', fontWeight: 600 } },
    { headerName: 'ASSET NAME', field: 'assetName',     flex: 2, minWidth: 180, cellStyle: { color: '#1a1a1a' } },
    { headerName: 'LOCATION',   field: 'plantLocation', flex: 1, minWidth: 140, cellStyle: { color: '#1a1a1a' } },
    { headerName: 'STATUS',     field: 'status',        flex: 1, minWidth: 110, cellRenderer: statusCell, cellStyle: { display: 'flex', alignItems: 'center' } },
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
    { headerName: 'STATUS',     field: 'status',        flex: 1, minWidth: 100, cellRenderer: statusCell, cellStyle: { display: 'flex', alignItems: 'center' } },
];

/* ── endpoint + col config ──────────────────────────────────── */
const TYPE_CONFIG = {
    'mh-requested': { endpoint: '/asset-request',                        params: { limit: 500, sort: '-createdAt' }, cols: MH_REQUEST_COLS },
    'mh-approved':  { endpoint: '/asset-request',                        params: { status: 'Accepted', limit: 500 }, cols: MH_REQUEST_COLS },
    'mh-pending':   { endpoint: '/asset-request',                        params: { workflowStatus: 'Pending', limit: 500 }, cols: MH_REQUEST_COLS },
    'mh-rejected':  { endpoint: '/asset-request',                        params: { status: 'Rejected', limit: 500 }, cols: MH_REQUEST_COLS },
    'assets':       { endpoint: '/asset-management',                     params: { limit: 500 }, cols: ASSET_COLS },
    'employees':    { endpoint: '/employees',                            params: { limit: 500 }, cols: EMPLOYEE_COLS },
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

/* ── Main Modal ─────────────────────────────────────────────── */
const KPIDetailModal = ({ visible, onClose, type, title }) => {
    const [rows, setRows]       = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState(null);
    const [searchText, setSearchText] = useState('');
    const [visibleCount, setVisibleCount] = useState(0);
    const gridRef = useRef(null);

    const cfg = TYPE_CONFIG[type] || null;

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
    }, [type]);

    useEffect(() => {
        if (visible && type) {
            setSearchText('');
            fetchData();
        }
    }, [visible, type, fetchData]);

    useEffect(() => {
        if (gridRef.current?.api) {
            gridRef.current.api.setGridOption('quickFilterText', searchText);
        }
    }, [searchText]);

    const modalDefaultColDef = useMemo(() => ({
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

    const colDefs = useMemo(() => cfg?.cols || [], [cfg]);

    const onFilterChanged = useCallback(() => {
        if (gridRef.current?.api) setVisibleCount(gridRef.current.api.getDisplayedRowCount());
    }, []);

    return (
        <Modal
            open={visible}
            onCancel={onClose}
            width="88vw"
            style={{ top: 20 }}
            footer={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#64748B' }}>
                        <b>{visibleCount}</b> of <b>{rows.length}</b> records shown
                    </span>
                    <Button onClick={onClose}>Close</Button>
                </div>
            }
            title={
                <span style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>{title}</span>
            }
        >
            {/* Toolbar */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <Input.Search
                    placeholder="Search all columns…"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    style={{ width: 260 }}
                    size="small"
                    allowClear
                />
                <Button
                    size="small"
                    icon={<Download size={13} />}
                    onClick={() => gridRef.current?.api && exportRows(gridRef.current.api, title)}
                >
                    Export to Excel
                </Button>
            </div>

            {error && (
                <Alert
                    type="error"
                    message={error}
                    action={<Button size="small" onClick={fetchData}>Retry</Button>}
                    style={{ marginBottom: 12 }}
                />
            )}

            {loading ? (
                <Skeleton active paragraph={{ rows: 8 }} />
            ) : (
                <div style={{ maxHeight: 'calc(65vh - 60px)', overflowY: 'auto' }}>
                    <div className="ag-theme-alpine" style={{ width: '100%' }}>
                        <AgGridReact
                            ref={gridRef}
                            rowData={rows}
                            columnDefs={colDefs}
                            defaultColDef={modalDefaultColDef}
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
                            onGridReady={p => p.api.sizeColumnsToFit()}
                            onFirstDataRendered={p => {
                                p.api.sizeColumnsToFit();
                                setVisibleCount(p.api.getDisplayedRowCount());
                            }}
                        />
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default KPIDetailModal;
