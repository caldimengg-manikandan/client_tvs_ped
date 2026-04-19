import React, { useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { DataGrid } from 'react-data-grid';
import { RDG_COL_DEFAULTS, RDG_STYLE } from '../config/rdgConfig';

/* ─────────────────────────────────────────────────────────────────────────
   GRID THEME CSS — constant at module level (never changes at runtime).
   Injected via React createPortal so it's guaranteed to be in <head>
   on every mount, hot-reload, and navigation. No stale DOM issues.
──────────────────────────────────────────────────────────────────────── */
const GRID_THEME_CSS = `
    /* ═══════════════════════════════════════════════════════
       CalTIMS Data Grid — Premium Theme  v6
       Navy header · white body · always-on scrollbars
    ═══════════════════════════════════════════════════════ */

    /* ── 1. Grid root ─────────────────────────────────── */
    .rdg {
        --rdg-header-background-color    : #253C80;
        --rdg-row-hover-background-color : #EEF3FF;
        --rdg-background-color           : #ffffff;
        --rdg-border-color               : #E8EDF8;
        --rdg-hdr-from : #2d4a9a;
        --rdg-hdr-to   : #1e3070;
        border-radius : 0 !important;
        border        : none !important;
        font-family   : 'Inter', 'DM Sans', system-ui, sans-serif;

        /* ALWAYS show both scrollbars */
        overflow-x : scroll !important;
        overflow-y : scroll !important;

        /* Firefox scrollbar */
        scrollbar-width : thin;
        scrollbar-color : rgba(37,60,128,0.55) #dde5f7;
    }

    /* ── 2. Webkit scrollbars (Chrome · Edge · Safari) ── */
    /* -webkit-appearance:none prevents macOS overlay      */
    /* (invisible) scrollbar mode — forces classic style   */
    .rdg::-webkit-scrollbar {
        -webkit-appearance : none;
        width  : 10px;
        height : 12px;
    }
    .rdg::-webkit-scrollbar-track {
        background    : #dde5f7;
        border-radius : 10px;
    }
    .rdg::-webkit-scrollbar-thumb {
        background    : rgba(37,60,128,0.60);
        border-radius : 10px;
        border        : 2px solid #dde5f7;
    }
    .rdg::-webkit-scrollbar-thumb:hover {
        background : rgba(37,60,128,0.88);
    }
    .rdg::-webkit-scrollbar-corner { background : #dde5f7; }

    /* ── 3. Header row ────────────────────────────────── */
    .rdg .rdg-header-row { background: var(--rdg-hdr-from) !important; }
    .rdg .rdg-header-row .rdg-cell {
        background     : linear-gradient(180deg,var(--rdg-hdr-from) 0%,var(--rdg-hdr-to) 100%) !important;
        color          : #ffffff !important;
        font-weight    : 800 !important;
        font-size      : 11px !important;
        text-transform : uppercase !important;
        letter-spacing : 0.06em !important;
        border-right   : 1px solid rgba(255,255,255,0.1) !important;
        border-bottom  : 2px solid rgba(255,255,255,0.07) !important;
        display        : flex !important;
        align-items    : center !important;
        padding        : 0 14px !important;
        white-space    : nowrap !important;
        user-select    : none !important;
        overflow       : visible !important;
    }
    .rdg .rdg-header-row .rdg-cell:last-child { border-right: none !important; }
    .rdg .rdg-header-row .rdg-cell:hover {
        background: linear-gradient(180deg,#3655b3 0%,var(--rdg-hdr-from) 100%) !important;
    }
    .rdg .rdg-header-row .rdg-cell.rdg-cell-frozen {
        background: linear-gradient(180deg,var(--rdg-hdr-from) 0%,var(--rdg-hdr-to) 100%) !important;
        z-index: 10 !important;
    }
    .rdg .rdg-header-row .rdg-cell *,
    .rdg .rdg-header-row .rdg-cell button,
    .rdg .rdg-header-row .rdg-cell svg { color: #ffffff !important; }
    .rdg .rdg-header-row .rdg-cell button svg       { opacity: 0.65; transition: opacity 0.15s; }
    .rdg .rdg-header-row .rdg-cell:hover button svg { opacity: 1; }

    /* ── 4. Body rows ─────────────────────────────────── */
    .rdg .rdg-row {
        border-bottom : 1px solid #EEF1F9 !important;
        transition    : background-color 0.1s ease !important;
        outline       : none !important;
    }
    .rdg .rdg-row:focus      { outline: none !important; }
    .rdg .rdg-row:last-child { border-bottom: none !important; }
    .rdg .rdg-row:hover      { background-color: #EEF3FF !important; }
    .rdg .rdg-row:nth-child(even)       { background-color: #F7F9FF !important; }
    .rdg .rdg-row:nth-child(even):hover { background-color: #EEF3FF !important; }

    /* ── 5. Body cells ────────────────────────────────── */
    .rdg .rdg-row .rdg-cell {
        border-right  : 1px solid #EEF1F9 !important;
        border-bottom : none !important;
        font-size     : 13px !important;
        color         : #1a2b52 !important;
        padding       : 0 14px !important;
        display       : flex !important;
        align-items   : center !important;
        outline       : none !important;
        overflow      : hidden !important;
        white-space   : nowrap !important;
        text-overflow : ellipsis !important;
        line-height   : 1.45 !important;
    }
    .rdg .rdg-row .rdg-cell:last-child { border-right: none !important; }

    /* ── 6. Pinned summary (frozen) rows ─────────────── */
    .rdg .rdg-summary-row {
        background : linear-gradient(90deg,#fffcf0 0%,#fffbe8 100%) !important;
        z-index    : 5 !important;
    }
    .rdg .rdg-summary-row .rdg-cell {
        background  : transparent !important;
        font-weight : 600 !important;
        color       : #78350f !important;
        border-right: 1px solid rgba(245,158,11,0.18) !important;
    }
    .rdg .rdg-summary-row:last-of-type .rdg-cell {
        border-bottom : 2px solid #F59E0B !important;
        box-shadow    : 0 5px 12px rgba(245,158,11,0.10) !important;
    }

    /* ── 7. Frozen columns ────────────────────────────── */
    .rdg .rdg-cell-frozen-last {
        border-right : 2px solid rgba(20,184,166,0.45) !important;
        box-shadow   : 4px 0 14px rgba(0,0,0,0.05) !important;
    }
    .rdg .rdg-cell-frozen:not(.rdg-header-row .rdg-cell):not(.rdg-summary-row .rdg-cell) {
        background-color : #F5F8FF !important;
    }

    /* ── 8. Selected row ──────────────────────────────── */
    .rdg .rdg-row[aria-selected="true"]      { background-color: #E5EDFF !important; }
    .rdg .rdg-row[aria-selected="true"]:hover { background-color: #D8E5FF !important; }
`;

/**
 * FrozenRowsDataGrid
 *
 * Drop-in replacement for DataGrid that adds proper row-freezing via
 * react-data-grid's native `topSummaryRows` prop.
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
    // Merge caller's options with global defaults — caller values WIN
    const mergedColumnOptions = { ...RDG_COL_DEFAULTS, ...(defaultColumnOptions || {}) };

    const containerRef = useRef(null);

    // Split rows: frozen rows → topSummaryRows (always pinned), rest → normal rows
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

    // Wire renderSummaryCell to renderCell so frozen rows look identical to normal rows
    const enrichedColumns = useMemo(() => {
        const processed = columns.map(col => ({
            ...col,
            renderSummaryCell: col.renderSummaryCell ?? col.renderCell ?? (({ row }) => row[col.key]),
        }));
        // react-data-grid requires frozen columns to be contiguous at the start
        const frozen    = processed.filter(c => c.frozen);
        const nonFrozen = processed.filter(c => !c.frozen);
        return [...frozen, ...nonFrozen];
    }, [columns]);

    return (
        <>
            {/* Inject grid theme CSS via React portal — runs on every mount/render,
                bypasses all HMR/hot-reload caching issues with useEffect or IIFEs */}
            {createPortal(
                <style id="__rdg_theme_v6">{GRID_THEME_CSS}</style>,
                document.head
            )}

            <div ref={containerRef} style={{ position: 'relative', height: '100%', width: '100%' }}>
                <DataGrid
                    columns={enrichedColumns}
                    rows={dataRows}
                    topSummaryRows={topSummaryRows}
                    rowKeyGetter={rowKeyGetter}
                    className={className}
                    style={{ ...RDG_STYLE, ...style }}
                    rowHeight={rowHeight}
                    headerRowHeight={headerRowHeight}
                    defaultColumnOptions={mergedColumnOptions}
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
        </>
    );
};

export default FrozenRowsDataGrid;