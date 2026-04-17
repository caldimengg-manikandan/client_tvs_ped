import React, { useRef, useEffect, useMemo } from 'react';
import { DataGrid } from 'react-data-grid';

/**
 * FrozenRowsDataGrid
 *
 * Drop-in replacement for DataGrid that adds proper row-freezing via
 * react-data-grid's native `topSummaryRows` prop.
 *
 * How it works:
 *   - rows with index < frozenRowCount → placed in `topSummaryRows` (always
 *     pinned below the header, never virtualized away, highlighted amber)
 *   - remaining rows → placed in normal `rows` (scrollable)
 *   - `renderSummaryCell` is auto-wired to each column's `renderCell` so the
 *     frozen rows look identical to normal rows
 *   - The `serial` column uses `row._serialNo` (pre-computed by caller) so
 *     numbering is always correct across both sections
 *
 * Required: each row object must have a `_serialNo` field (1-based index
 * in the full dataset). The serial column renderer must use `row._serialNo`.
 *
 * Props mirror DataGrid's props plus:
 *   frozenRowCount  — how many top rows to pin (default 0)
 *   loading         — show spinner overlay when true
 */
const FrozenRowsDataGrid = ({
    columns,
    rows: allRows = [],
    rowKeyGetter,
    className = '',
    style = {},
    rowHeight = 52,
    headerRowHeight = 48,
    frozenRowCount = 0,
    defaultColumnOptions,
    loading = false,
    ...props
}) => {
    const containerRef = useRef(null);
    // Split rows based on frozenRowCount (which can be a number or an object {start, end})
    const { topSummaryRows, dataRows } = useMemo(() => {
        let start = 1;
        let end = 0;

        if (typeof frozenRowCount === 'number') {
            end = Math.min(frozenRowCount, allRows.length);
        } else if (frozenRowCount && typeof frozenRowCount === 'object') {
            start = Math.max(1, Number(frozenRowCount.start) || 1);
            end = Math.min(Number(frozenRowCount.end) || 0, allRows.length);
        }

        const count = end >= start ? (end - start + 1) : 0;

        if (count <= 0) {
            return { topSummaryRows: undefined, dataRows: allRows };
        }

        const frozen = allRows.slice(start - 1, end);
        const scrollable = allRows.filter((_, idx) => (idx < start - 1 || idx >= end));

        return { topSummaryRows: frozen, dataRows: scrollable };
    }, [allRows, frozenRowCount]);

    const count = topSummaryRows ? topSummaryRows.length : 0;

    // Wire renderSummaryCell = renderCell and handle Column Reordering
    const enrichedColumns = useMemo(() => {
        const processed = columns.map(col => ({
            ...col,
            // renderSummaryCell receives { column, row } — same signature as renderCell.
            // If neither is provided, we default to rendering the raw value of row[col.key]
            renderSummaryCell: col.renderSummaryCell ?? col.renderCell ?? (({ row }) => row[col.key]),
        }));

        // react-data-grid requires frozen columns to be contiguous at the start of the array.
        // We automatically reorder them here so the caller doesn't have to worry about sync issues.
        const frozen = processed.filter(c => c.frozen);
        const nonFrozen = processed.filter(c => !c.frozen);
        return [...frozen, ...nonFrozen];
    }, [columns]);

    // Inject premium grid CSS once on mount (always, not gated on frozen count)
    useEffect(() => {
        if (document.getElementById('__frz_style__')) return;
        const s = document.createElement('style');
        s.id = '__frz_style__';
        s.textContent = `
            /* ═══════════════════════════════════════════════════
               PREMIUM DATA GRID — WORLD-CLASS DESIGN SYSTEM
               Color: TVS Navy #253C80 header, clean white body
            ═══════════════════════════════════════════════════ */

            /* Grid root */
            .rdg {
                --rdg-header-background-color: #253C80;
                --rdg-row-hover-background-color: #EEF3FF;
                --rdg-background-color: #ffffff;
                --rdg-border-color: #E8EDF8;
                border-radius: 0 !important;
                border: none !important;
                overflow: hidden;
                font-family: 'Inter', 'DM Sans', system-ui, sans-serif;
            }

            /* ── Header row: premium navy-blue gradient (default — overridden per-grid by ColumnCustomizer) ── */
            .rdg {
                --rdg-hdr-from: #2d4a9a;
                --rdg-hdr-to:   #1e3070;
            }
            .rdg .rdg-header-row {
                background: var(--rdg-hdr-from) !important;
            }
            .rdg .rdg-header-row .rdg-cell {
                background: linear-gradient(180deg, var(--rdg-hdr-from) 0%, var(--rdg-hdr-to) 100%) !important;
                color: #ffffff !important;
                font-weight: 800 !important;
                font-size: 11px !important;
                text-transform: uppercase !important;
                letter-spacing: 0.06em !important;
                border-right: 1px solid rgba(255,255,255,0.1) !important;
                border-bottom: 2px solid rgba(255,255,255,0.07) !important;
                display: flex !important;
                align-items: center !important;
                padding: 0 14px !important;
                white-space: nowrap !important;
                user-select: none !important;
            }
            .rdg .rdg-header-row .rdg-cell:last-child {
                border-right: none !important;
            }
            .rdg .rdg-header-row .rdg-cell:hover {
                background: linear-gradient(180deg, #3655b3 0%, var(--rdg-hdr-from) 100%) !important;
            }

            /* Frozen header cells */
            .rdg .rdg-header-row .rdg-cell.rdg-cell-frozen {
                background: linear-gradient(180deg, var(--rdg-hdr-from) 0%, var(--rdg-hdr-to) 100%) !important;
                z-index: 10 !important;
            }

            /* All content inside headers must stay white */
            .rdg .rdg-header-row .rdg-cell *,
            .rdg .rdg-header-row .rdg-cell button,
            .rdg .rdg-header-row .rdg-cell svg {
                color: #ffffff !important;
            }
            .rdg .rdg-header-row .rdg-cell button svg {
                opacity: 0.65;
                transition: opacity 0.15s;
            }
            .rdg .rdg-header-row .rdg-cell:hover button svg {
                opacity: 1;
            }

            /* ── Body rows ── */
            .rdg .rdg-row {
                border-bottom: 1px solid #EEF1F9 !important;
                transition: background-color 0.1s ease !important;
                outline: none !important;
            }
            .rdg .rdg-row:focus {
                outline: none !important;
            }
            .rdg .rdg-row:last-child {
                border-bottom: none !important;
            }
            .rdg .rdg-row:hover {
                background-color: #EEF3FF !important;
            }

            /* ── Alternating stripe (zebra) ── */
            .rdg .rdg-row:nth-child(even) {
                background-color: #F7F9FF !important;
            }
            .rdg .rdg-row:nth-child(even):hover {
                background-color: #EEF3FF !important;
            }

            /* ── Body cells ── */
            .rdg .rdg-row .rdg-cell {
                border-right: 1px solid #EEF1F9 !important;
                border-bottom: none !important;
                font-size: 13px !important;
                color: #1a2b52 !important;
                padding: 0 14px !important;
                display: flex !important;
                align-items: center !important;
                outline: none !important;
            }
            .rdg .rdg-row .rdg-cell:last-child {
                border-right: none !important;
            }

            /* ── Frozen summary rows (pinned rows) — amber tint ── */
            .rdg .rdg-summary-row {
                background: linear-gradient(90deg, #fffcf0 0%, #fffbe8 100%) !important;
                z-index: 5 !important;
            }
            .rdg .rdg-summary-row .rdg-cell {
                background: transparent !important;
                font-weight: 600 !important;
                color: #78350f !important;
                border-right: 1px solid rgba(245,158,11,0.18) !important;
            }
            .rdg .rdg-summary-row:last-of-type .rdg-cell {
                border-bottom: 2px solid #F59E0B !important;
                box-shadow: 0 5px 12px rgba(245,158,11,0.10) !important;
            }

            /* ── Frozen columns — teal right-border accent ── */
            .rdg .rdg-cell-frozen-last {
                border-right: 2px solid rgba(20,184,166,0.45) !important;
                box-shadow: 4px 0 14px rgba(0,0,0,0.05) !important;
            }
            .rdg .rdg-cell-frozen:not(.rdg-header-row .rdg-cell):not(.rdg-summary-row .rdg-cell) {
                background-color: #F5F8FF !important;
            }

            /* ── Selected row ── */
            .rdg .rdg-row[aria-selected="true"] {
                background-color: #E5EDFF !important;
            }
            .rdg .rdg-row[aria-selected="true"]:hover {
                background-color: #D8E5FF !important;
            }

            /* ── Thin custom scrollbar ── */
            .rdg ::-webkit-scrollbar { width: 5px; height: 5px; }
            .rdg ::-webkit-scrollbar-track { background: transparent; }
            .rdg ::-webkit-scrollbar-thumb {
                background: rgba(37,60,128,0.18);
                border-radius: 99px;
            }
            .rdg ::-webkit-scrollbar-thumb:hover {
                background: rgba(37,60,128,0.35);
            }
        `;
        document.head.appendChild(s);
    }, []);

    // Apply amber frozen-row styling via CSS after render (kept for frozen row count tracking)
    useEffect(() => {
        if (!containerRef.current || count === 0) return;

    }, [count]);



    return (
        <div ref={containerRef} style={{ position: 'relative', height: '100%', width: '100%' }}>
            <DataGrid
                columns={enrichedColumns}
                rows={dataRows}
                topSummaryRows={topSummaryRows}
                rowKeyGetter={rowKeyGetter}
                className={className}
                style={{ blockSize: '100%', width: '100%', ...style }}
                rowHeight={rowHeight}
                headerRowHeight={headerRowHeight}
                defaultColumnOptions={defaultColumnOptions}
                {...props}
            />
            {loading && (
                <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.6)',
                    zIndex: 20,
                    pointerEvents: 'none',
                }}>
                    <div className="w-8 h-8 border-4 border-tvs-blue/20 border-t-tvs-blue rounded-full animate-spin" />
                </div>
            )}
        </div>
    );
};

export default FrozenRowsDataGrid;