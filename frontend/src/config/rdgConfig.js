/**
 * rdgConfig.js — Global react-data-grid Configuration
 * =====================================================
 * Single source of truth for ALL DataGrid / FrozenRowsDataGrid instances.
 *
 * Usage in any page:
 *   import { RDG_COL_DEFAULTS, RDG_HEIGHTS, buildAutoFitColumns } from '../../config/rdgConfig';
 *
 *   defaultColumnOptions={RDG_COL_DEFAULTS}
 *   rowHeight={RDG_HEIGHTS.row}
 *   headerRowHeight={RDG_HEIGHTS.header}
 *
 * RULES:
 *   - DO NOT modify per-file. Change here → all grids update.
 *   - DO NOT alter API calls, Redux slices, or business logic.
 *   - Layout/scroll/visibility is controlled by CSS (.rdg-scroll-outer / .rdg-scroll-panel).
 */

// ─────────────────────────────────────────────────────────────
// DEFAULT COLUMN OPTIONS (applied to EVERY column in all grids)
// ─────────────────────────────────────────────────────────────
export const RDG_COL_DEFAULTS = {
    resizable: true,   // User can drag column edges to resize
    minWidth: 120,     // Guaranteed minimum — prevents columns from collapsing
};

// ─────────────────────────────────────────────────────────────
// DEFAULT ROW / HEADER HEIGHTS
// ─────────────────────────────────────────────────────────────
export const RDG_HEIGHTS = {
    row: 52,       // Standard row height (px)
    header: 48,    // Standard header height (px)
    compact: {     // Compact density (see ColumnCustomizer onDensity)
        row: 36,
        header: 40,
    },
    comfortable: { // Comfortable density
        row: 64,
        header: 56,
    },
};

// ─────────────────────────────────────────────────────────────
// AUTO-FIT COLUMN WIDTH LOGIC
// ─────────────────────────────────────────────────────────────
/**
 * buildAutoFitColumns
 *
 * Scales column widths proportionally to fill the available container width.
 * Columns will never shrink below their defined width or RDG_COL_DEFAULTS.minWidth.
 * When the container is wider than total column widths, columns expand to fill.
 *
 * @param {Array}  columns     - Column definitions (must have { key, width?, frozen? })
 * @param {number} gridWidth   - Measured clientWidth of the grid container (px)
 * @param {Set}    frozenKeys  - Set of column keys that should be frozen
 * @param {Set}    hiddenKeys  - Set of column keys that should be hidden
 * @returns {Array} Processed column array ready for DataGrid
 */
export function buildAutoFitColumns(columns, gridWidth, frozenKeys = new Set(), hiddenKeys = new Set()) {
    // 1. Filter out hidden columns; apply frozen state
    const visible = columns
        .filter(col => !hiddenKeys.has(col.key))
        .map(col => ({
            ...col,
            frozen: col.frozen || frozenKeys.has(col.key),
        }));

    // 2. No grid width yet — return as-is (avoids layout thrash on first render)
    if (!gridWidth) return visible;

    const totalDefined = visible.reduce((sum, col) => sum + (col.width || 0), 0);
    if (!totalDefined) return visible;

    // 3. Smart scale: fill container exactly when possible, but never squeeze
    //    a column below READABLE_MIN (keeps header text legible).
    //    When even READABLE_MIN * colCount exceeds gridWidth, columns overflow
    //    naturally and the horizontal scrollbar takes over.
    const READABLE_MIN = 80; // px — minimum before text becomes illegible

    const rawScale    = gridWidth / totalDefined;           // exact fit
    const minScale    = READABLE_MIN / (totalDefined / visible.length); // never go below readable floor
    const scale       = Math.max(rawScale, minScale);       // never below readable floor

    return visible.map(col => {
        if (!col.width) return col;
        const scaled = Math.floor(col.width * scale);
        return {
            ...col,
            width: Math.max(scaled, READABLE_MIN, RDG_COL_DEFAULTS.minWidth),
        };
    });
}

// ─────────────────────────────────────────────────────────────
// GRID CONTAINER CSS CLASS NAMES (standardised)
// ─────────────────────────────────────────────────────────────
export const RDG_WRAPPER_CLASS = 'rdg-scroll-outer';
export const RDG_PANEL_CLASS   = 'rdg-scroll-panel';

/** Full style attribute for DataGrid — fills its containing panel */
export const RDG_STYLE = { blockSize: '100%', width: '100%' };

// ─────────────────────────────────────────────────────────────
// DEFAULT EXPORT (convenience)
// ─────────────────────────────────────────────────────────────
export default {
    RDG_COL_DEFAULTS,
    RDG_HEIGHTS,
    RDG_WRAPPER_CLASS,
    RDG_PANEL_CLASS,
    RDG_STYLE,
    buildAutoFitColumns,
};
