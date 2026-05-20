import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Modal, Tabs, Input, Button, Skeleton, Alert, Tooltip as AntTooltip } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS, ArcElement, CategoryScale, LinearScale,
    BarElement, Tooltip as ChartTooltip, Legend
} from 'chart.js';
import { Search, Download, RefreshCw, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { defaultColDef } from '../../config/agGridConfig';
import api from '../../api/axiosConfig';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, ChartTooltip, Legend);

/* ── helpers ───────────────────────────────────────────────── */
const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const relativeTime = (d) => {
    if (!d) return '—';
    const diff = Math.floor((Date.now() - new Date(d)) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return `${diff} days ago`;
};

const statusBadge = (status, colour) => {
    const colorMap = {
        'On Track':    { bg: '#DCFCE7', text: '#166534' },
        'Likely Delay':{ bg: '#FEF9C3', text: '#854D0E' },
        'Delayed':     { bg: '#FEE2E2', text: '#991B1B' },
        'Not Started': { bg: '#F1F5F9', text: '#475569' },
    };
    const c = colorMap[status] || { bg: '#F1F5F9', text: '#475569' };
    return (
        <span style={{
            background: c.bg, color: c.text,
            padding: '2px 8px', borderRadius: 12,
            fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em'
        }}>
            {status || '—'}
        </span>
    );
};

/* ── AG Grid column defs ────────────────────────────────────── */
const buildColDefs = (stageColour) => [
    {
        headerName: 'S.No', valueGetter: 'node.rowIndex + 1',
        width: 52, minWidth: 52, flex: 0,
        sortable: false, filter: false, resizable: false, pinned: 'left',
        cellStyle: { textAlign: 'center', color: '#1a1a1a' },
    },
    {
        headerName: 'ITEM NAME', flex: 2, minWidth: 180,
        valueGetter: p => p.data?.productModel || p.data?.materialHandlingEquipment || '—',
        cellStyle: { color: '#1a1a1a', fontWeight: 600 },
    },
    { headerName: 'DEPARTMENT', field: 'departmentName', flex: 1, minWidth: 120, cellStyle: { color: '#1a1a1a' } },
    { headerName: 'REQUEST ID',  field: 'assetRequestId', flex: 1, minWidth: 130, cellStyle: { color: '#1a1a1a' } },
    { headerName: 'VENDOR',      field: 'vendorName',     flex: 1, minWidth: 120, cellStyle: { color: '#1a1a1a' } },
    { headerName: 'REQUEST TYPE', field: 'requestType',   flex: 1, minWidth: 130, cellStyle: { color: '#1a1a1a' } },
    {
        headerName: 'STATUS', field: 'status', flex: 1, minWidth: 120,
        cellRenderer: p => statusBadge(p.value),
        cellStyle: { display: 'flex', alignItems: 'center' },
    },
    {
        headerName: 'TARGET DATE', field: 'implementationTarget', flex: 1, minWidth: 120,
        valueFormatter: p => fmtDate(p.value),
        cellStyle: p => ({
            color: p.value && new Date(p.value) < new Date() ? '#CC1F1F' : '#1a1a1a',
            fontWeight: p.value && new Date(p.value) < new Date() ? 700 : 400,
        }),
    },
    {
        headerName: 'LAST UPDATED', field: 'updatedAt', flex: 1, minWidth: 130,
        valueFormatter: p => relativeTime(p.value),
        cellStyle: { color: '#64748B' },
    },
    {
        headerName: 'REMARKS', field: 'remarks', flex: 2, minWidth: 200,
        cellRenderer: p => p.value ? (
            <AntTooltip title={p.value} placement="topLeft">
                <span style={{ color: '#1a1a1a', cursor: 'default',
                    display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.value}
                </span>
            </AntTooltip>
        ) : <span style={{ color: '#94A3B8' }}>—</span>,
    },
];

/* ── Timeline Card ──────────────────────────────────────────── */
const TimelineCard = ({ item, stageColour }) => {
    const start  = item.createdAt         ? new Date(item.createdAt) : null;
    const target = item.implementationTarget ? new Date(item.implementationTarget) : null;
    const today  = new Date();

    let progress = 0, isOverdue = false;
    const hasNoDates = !start || !target;
    if (start && target) {
        const total   = target - start;
        const elapsed = today - start;
        progress  = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
        isOverdue = today > target;
    }
    const barColor = isOverdue ? '#E24B4A' : progress >= 70 ? '#F59E0B' : '#10B981';

    const priorityLabelMap = {
        'Capacity': { bg: '#FEE2E2', text: '#991B1B', label: 'High' },
        'Special Improvements': { bg: '#FEF9C3', text: '#854D0E', label: 'Urgent' },
    };
    const pInfo = priorityLabelMap[item.requestType] || { bg: '#DBEAFE', text: '#1D4ED8', label: 'Normal' };

    return (
        <div style={{
            background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0',
            borderLeft: `3px solid ${stageColour}`, padding: '14px 16px',
            marginBottom: 10,
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ background: pInfo.bg, color: pInfo.text, padding: '1px 8px', borderRadius: 10, fontSize: 9, fontWeight: 700, textTransform: 'uppercase' }}>
                        {pInfo.label}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#0F172A' }}>
                        {item.productModel || item.materialHandlingEquipment || item.assetRequestId}
                    </span>
                </div>
                {statusBadge(item.status)}
            </div>

            <div style={{ fontSize: 11, color: '#64748B', marginBottom: 8 }}>
                Dept: <b>{item.departmentName}</b>
                {item.vendorName && item.vendorName !== '—' && <> &nbsp;|&nbsp; Vendor: <b>{item.vendorName}</b></>}
                {item.userName && <> &nbsp;|&nbsp; By: <b>{item.userName}</b></>}
            </div>

            {hasNoDates ? (
                <div style={{ fontSize: 11, color: '#94A3B8', fontStyle: 'italic' }}>No timeline set</div>
            ) : (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748B', marginBottom: 4 }}>
                        <span>Start: {fmtDate(item.createdAt)}</span>
                        <span style={{ color: isOverdue ? '#CC1F1F' : undefined, fontWeight: isOverdue ? 700 : undefined }}>
                            Target: {fmtDate(item.implementationTarget)}
                            {isOverdue && ' — OVERDUE'}
                        </span>
                    </div>
                    <div style={{ background: '#F1F5F9', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                        <div style={{ width: `${progress}%`, height: '100%', background: barColor, borderRadius: 6, transition: 'width 0.5s ease' }} />
                    </div>
                    <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 3 }}>{progress}% time elapsed</div>
                </>
            )}

            {item.remarks && (
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 6, fontStyle: 'italic', borderTop: '1px solid #F1F5F9', paddingTop: 6 }}>
                    "{item.remarks}"
                </div>
            )}
        </div>
    );
};

/* ── Charts helpers ─────────────────────────────────────────── */
const DOUGHNUT_OPTS = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, padding: 8 } } },
};
const BAR_OPTS = (horizontal = false) => ({
    responsive: true, maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' : 'x',
    plugins: { legend: { display: false } },
    scales: {
        x: { ticks: { font: { size: 10 } } },
        y: { ticks: { font: { size: 10 } } },
    },
});

const SummaryCharts = ({ items, stageColour }) => {
    const buildDoughnut = (groupFn, colourSet) => {
        const map = {};
        items.forEach(item => { const k = groupFn(item) || 'Unknown'; map[k] = (map[k] || 0) + 1; });
        const labels = Object.keys(map);
        return { labels, datasets: [{ data: Object.values(map), backgroundColor: colourSet || labels.map((_, i) => `hsl(${i * 55}, 65%, 55%)`), borderWidth: 1 }] };
    };
    const buildBar = (groupFn) => {
        const map = {};
        items.forEach(item => { const k = groupFn(item) || 'Unknown'; map[k] = (map[k] || 0) + 1; });
        const labels = Object.keys(map).sort((a, b) => map[b] - map[a]);
        return {
            labels,
            datasets: [{ data: labels.map(l => map[l]), backgroundColor: stageColour + 'CC', borderColor: stageColour, borderWidth: 1.5 }],
        };
    };

    const deptData  = buildDoughnut(i => i.departmentName);
    const statusData = buildDoughnut(i => i.status, ['#DCFCE7', '#FEF9C3', '#FEE2E2', '#F1F5F9'].slice(0, 4));
    const typeData  = buildBar(i => i.requestType);

    const today = new Date();
    const tlMap = { 'On Track': 0, 'Overdue': 0, 'No Date': 0 };
    items.forEach(item => {
        if (!item.implementationTarget) { tlMap['No Date']++; }
        else if (new Date(item.implementationTarget) < today) { tlMap['Overdue']++; }
        else { tlMap['On Track']++; }
    });
    const tlData = {
        labels: Object.keys(tlMap),
        datasets: [{ data: Object.values(tlMap), backgroundColor: ['#10B981CC', '#E24B4ACC', '#94A3B8CC'], borderColor: ['#10B981', '#E24B4A', '#94A3B8'], borderWidth: 1.5 }],
    };

    const chartStyle = { height: 200 };
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, padding: '4px 0' }}>
            <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Department Breakdown
                </div>
                <div style={chartStyle}><Doughnut data={deptData} options={DOUGHNUT_OPTS} /></div>
            </div>
            <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Status Split
                </div>
                <div style={chartStyle}><Doughnut data={statusData} options={DOUGHNUT_OPTS} /></div>
            </div>
            <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Request Type Breakdown
                </div>
                <div style={chartStyle}><Bar data={typeData} options={BAR_OPTS(true)} /></div>
            </div>
            <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Timeline Health
                </div>
                <div style={chartStyle}><Bar data={tlData} options={BAR_OPTS(false)} /></div>
            </div>
        </div>
    );
};

/* ── Main Modal ─────────────────────────────────────────────── */
const PhaseDetailModal = ({ visible, onClose, stage, stageColour }) => {
    const [items, setItems]         = useState([]);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState(null);
    const [searchText, setSearchText] = useState('');
    const gridRef = useRef(null);

    const fetchItems = useCallback(async () => {
        if (!stage) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/dashboard/phase-items', { params: { stage } });
            setItems(res.data?.items || []);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Failed to load items');
        } finally {
            setLoading(false);
        }
    }, [stage]);

    useEffect(() => {
        if (visible && stage) {
            setSearchText('');
            fetchItems();
        }
    }, [visible, stage, fetchItems]);

    // Quick filter on search change
    useEffect(() => {
        if (gridRef.current?.api) {
            gridRef.current.api.setGridOption('quickFilterText', searchText);
        }
    }, [searchText]);

    /* ── Summary stats ── */
    const today = new Date();
    const overdue  = items.filter(i => i.implementationTarget && new Date(i.implementationTarget) < today).length;
    const onTrack  = items.filter(i => i.implementationTarget && new Date(i.implementationTarget) >= today).length;
    const noDate   = items.filter(i => !i.implementationTarget).length;

    /* ── Grid setup ── */
    const colDefs = useMemo(() => buildColDefs(stageColour), [stageColour]);
    const modalDefaultColDef = useMemo(() => ({
        ...defaultColDef,
        autoHeight: false,
        wrapText: false,
        floatingFilter: false,
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

    /* ── Excel export ── */
    const exportToExcel = () => {
        const rows = [];
        gridRef.current?.api?.forEachNodeAfterFilter(node => { if (node.data) rows.push(node.data); });
        const exportData = rows.map(r => ({
            'Request ID':    r.assetRequestId,
            'Item Name':     r.productModel || r.materialHandlingEquipment || '—',
            'Department':    r.departmentName,
            'Request Type':  r.requestType,
            'Vendor':        r.vendorName,
            'Status':        r.status,
            'Stage':         r.currentStage,
            'Target Date':   fmtDate(r.implementationTarget),
            'Last Updated':  fmtDate(r.updatedAt),
            'Remarks':       r.remarks || '',
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, stage);
        XLSX.writeFile(wb, `TVS-PED-${stage}-Items-${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    /* ── Rendered items count label ── */
    const [visibleCount, setVisibleCount] = useState(0);
    const onFilterChanged = useCallback(() => {
        if (gridRef.current?.api) {
            setVisibleCount(gridRef.current.api.getDisplayedRowCount());
        }
    }, []);

    /* ── Tab content ── */
    const tabItems = [
        {
            key: 'table',
            label: 'All Items',
            children: (
                <div>
                    {/* Toolbar */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <Input.Search
                            placeholder="Search all columns…"
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            style={{ width: 260 }}
                            size="small"
                            allowClear
                        />
                        <Button size="small" icon={<Download size={13} />} onClick={exportToExcel}>
                            Export to Excel
                        </Button>
                        <span style={{ fontSize: 11, color: '#64748B', marginLeft: 'auto' }}>
                            Showing <b>{visibleCount}</b> of <b>{items.length}</b> items
                        </span>
                    </div>
                    {/* Grid */}
                    <div style={{ maxHeight: 'calc(62vh - 120px)', overflowY: 'auto' }}>
                        <div className="ag-theme-alpine" style={{ width: '100%' }}>
                            <AgGridReact
                                ref={gridRef}
                                rowData={items}
                                columnDefs={colDefs}
                                defaultColDef={modalDefaultColDef}
                                domLayout="autoHeight"
                                rowHeight={48}
                                headerHeight={46}
                                theme="legacy"
                                pagination={true}
                                paginationPageSize={20}
                                paginationPageSizeSelector={[10, 20, 50]}
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
                </div>
            ),
        },
        {
            key: 'timeline',
            label: 'Timeline View',
            children: (
                <div style={{ maxHeight: 'calc(70vh - 80px)', overflowY: 'auto', paddingRight: 4 }}>
                    {items.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>
                            No items to display
                        </div>
                    ) : (
                        items.map(item => (
                            <TimelineCard key={item._id} item={item} stageColour={stageColour} />
                        ))
                    )}
                </div>
            ),
        },
        {
            key: 'summary',
            label: 'Summary & Stats',
            children: items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>No data to chart</div>
            ) : (
                <SummaryCharts items={items} stageColour={stageColour || '#CC1F1F'} />
            ),
        },
    ];

    return (
        <Modal
            open={visible}
            onCancel={onClose}
            width="92vw"
            style={{ top: 20 }}
            footer={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#64748B' }}>
                        {items.length} total items in <b>{stage}</b> phase
                    </span>
                    <Button onClick={onClose}>Close</Button>
                </div>
            }
            title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: 32 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: stageColour, display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontSize: 17, fontWeight: 700, color: '#0F172A' }}>{stage} Phase</span>
                        <span style={{ fontSize: 12, color: '#64748B' }}>— {items.length} items</span>
                    </div>
                    <div style={{ display: 'flex', gap: 18, marginRight: 8 }}>
                        <span style={{ fontSize: 11, color: '#CC1F1F', fontWeight: 700 }}>
                            🔴 {overdue} Overdue
                        </span>
                        <span style={{ fontSize: 11, color: '#10B981', fontWeight: 700 }}>
                            🟢 {onTrack} On Track
                        </span>
                        <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>
                            ⚪ {noDate} No Date
                        </span>
                        <Button
                            size="small"
                            icon={<RefreshCw size={12} />}
                            onClick={fetchItems}
                            loading={loading}
                            style={{ marginLeft: 8 }}
                        >
                            Refresh
                        </Button>
                    </div>
                </div>
            }
        >
            {error && (
                <Alert
                    type="error"
                    message={error}
                    action={<Button size="small" onClick={fetchItems}>Retry</Button>}
                    style={{ marginBottom: 12 }}
                />
            )}
            {loading ? (
                <div>
                    <Skeleton active paragraph={{ rows: 6 }} />
                </div>
            ) : (
                <Tabs defaultActiveKey="table" items={tabItems} size="small" />
            )}
        </Modal>
    );
};

export default PhaseDetailModal;
