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
    const count = Math.min(frozenRowCount, allRows.length);

    // Split rows
    const topSummaryRows = count > 0 ? allRows.slice(0, count) : undefined;
    const dataRows = count > 0 ? allRows.slice(count) : allRows;

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

    // Apply amber frozen-row styling via CSS after render
    useEffect(() => {
        if (!containerRef.current || count === 0) return;
        const style = document.getElementById('__frz_style__');
        if (!style) {
            const s = document.createElement('style');
            s.id = '__frz_style__';
            s.textContent = `
                /* Base Grid Variable Overrides */
                .rdg {
                    --rdg-header-background-color: #253C80 !important;
                    --rdg-row-hover-background-color: #f8fafc !important;
                    --rdg-background-color: #ffffff !important;
                    border-radius: 8px;
                    overflow: hidden;
                }

                /* Standardized Header Styling — Universal & Sticky Fix */
                .rdg .rdg-header-row .rdg-cell {
                    background-color: #253C80 !important;
                    color: #ffffff !important;
                    font-weight: 700 !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.025em !important;
                    border-bottom: 2px solid #1e293b !important;
                    display: flex !important;
                    align-items: center !important;
                }

                /* Target sticky frozen headers specifically to prevent transparency/gaps */
                .rdg .rdg-header-row .rdg-cell.rdg-cell-frozen {
                    background-color: #253C80 !important;
                    z-index: 10 !important;
                    opacity: 1 !important;
                }

                /* Ensure all content inside headers is white */
                .rdg .rdg-header-row .rdg-cell * {
                    color: #ffffff !important;
                }

                /* Frozen (summary) rows — amber tint */
                .rdg .rdg-summary-row {
                    background: #fffbeb !important;
                    z-index: 5 !important;
                }
                .rdg .rdg-summary-row .rdg-cell {
                    background: #fffbeb !important;
                    font-weight: 500 !important;
                }
                /* Last frozen row gets a gold bottom border separator */
                .rdg .rdg-summary-row:last-of-type .rdg-cell {
                    border-bottom: 2px solid #f59e0b !important;
                    box-shadow: 0 3px 8px rgba(245,158,11,0.15);
                }

                /* Frozen Columns — Premium Visuals */
                .rdg .rdg-cell-frozen-last {
                    border-right: 2px solid #f59e0b !important;
                    box-shadow: 4px 0 8px rgba(0,0,0,0.05);
                }
                
                /* Light highlight for frozen columns (except headers) */
                .rdg .rdg-cell-frozen:not(.rdg-header-row .rdg-cell):not(.rdg-summary-row .rdg-cell) {
                    background-color: #fcfdfe !important;
                }
            `;
            document.head.appendChild(s);
        }
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