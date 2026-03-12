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

    // Style injection removed to rely on global index.css

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
