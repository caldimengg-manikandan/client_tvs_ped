import React from 'react';

/**
 * AG GRID GLOBAL CONFIGURATION
 * 
 * This file defines the MANDATORY standard configuration for ALL data tables
 * across the entire application. No exceptions.
 */

// ============================================================================
// DEFAULT COLUMN DEFINITION (Applied to ALL columns)
// ============================================================================
export const defaultColDef = {
    sortable: true,              // ✅ MANDATORY: All columns sortable
    filter: true,                // ✅ MANDATORY: All columns filterable
    resizable: true,             // ✅ MANDATORY: All columns resizable
    floatingFilter: false,       // Hide floating filters for cleaner UI
    suppressHeaderMenuButton: true, // Updated for v31+ compatibility
    minWidth: 80,                // Efficient minimum column width
    flex: 0,                     // Auto-sizing disabled by default
    cellStyle: {
        paddingLeft: '16px',
        paddingRight: '16px',
        lineHeight: '1.5'
    },
    headerClass: 'tvs-ag-header' // Custom class for header styling
};

// ============================================================================
// DEFAULT GRID OPTIONS (Applied to ALL grids)
// ============================================================================
export const defaultGridOptions = {
    // Pagination
    pagination: true,            // ✅ MANDATORY: Pagination enabled
    paginationPageSize: 20,      // Default page size
    paginationPageSizeSelector: [10, 20, 50, 100], // Page size options

    // Selection - Configuration
    rowSelection: 'multiple',

    // Theme - Use legacy to support existing CSS file themes
    theme: 'legacy',

    // Appearance
    rowHeight: 56,               // ✅ PREMIUM: More spacious row height for better readability
    headerHeight: 54,            // ✅ PREMIUM: Taller, clearer header

    // Behavior
    animateRows: true,           // Smooth row animations
    enableCellTextSelection: true, // Allow text selection
    ensureDomOrder: true,        // Maintain DOM order
    suppressCellFocus: true,    // Remove blue outline on click for cleaner UI

    // Performance
    suppressColumnVirtualisation: false, // Enable column virtualization
    suppressRowVirtualisation: false,    // Enable row virtualization

    // Styling
    rowClass: 'tvs-ag-row hover:bg-gray-50/50 transition-colors',

    // Loading
    overlayLoadingTemplate: '<div class="ag-overlay-loading-center">Loading data...</div>',
    overlayNoRowsTemplate: '<div class="ag-overlay-no-rows-center">No data found</div>',
};

// ============================================================================
// GRID THEME CONFIGURATION
// ============================================================================
export const getGridTheme = () => {
    return 'ag-theme-alpine'; // Standard AG Grid theme
};

// ============================================================================
// COMMON GRID CONTAINER STYLES
// ============================================================================
export const gridContainerClass = 'ag-theme-alpine w-full h-[600px]';

// ============================================================================
// UTILITY: Create Action Column Renderer
// ============================================================================
export const createActionColumn = (actions) => {
    return {
        headerName: 'ACTIONS',
        field: 'actions',
        width: 150,
        sortable: false,
        filter: false,
        resizable: false,
        pinned: 'right',
        cellRenderer: (params) => {
            if (!params.data) return null;
            return React.createElement('div', { className: "flex gap-2 h-full items-center justify-center" },
                actions.map((action, idx) =>
                    React.createElement('button', {
                        key: idx,
                        className: action.className || 'p-1.5 rounded-lg hover:bg-gray-100 transition-colors',
                        title: action.title || '',
                        onClick: (e) => {
                            e.stopPropagation();
                            action.onClick(params.data);
                        },
                        dangerouslySetInnerHTML: { __html: action.icon || '' }
                    })
                )
            );
        }
    };
};

// ============================================================================
// UTILITY: Create Serial Number Column
// ============================================================================
export const createSerialNumberColumn = () => {
    return {
        headerName: 'S.NO',
        valueGetter: 'node.rowIndex + 1',
        width: 60,
        sortable: false,
        filter: false,
        resizable: false,
        pinned: 'left',
        cellClass: 'ag-cell-bold',
        cellStyle: {
            textAlign: 'center'
        },
        headerClass: 'tvs-ag-header-center'
    };
};

// ============================================================================
// UTILITY: Create Bold Column (ID, Names, etc.)
// ============================================================================
export const createBoldColumn = (field, headerName, options = {}) => {
    return {
        headerName,
        field,
        cellClass: 'ag-cell-bold',
        ...options
    };
};

// ============================================================================
// UTILITY: Create Status Column with Color Coding
// ============================================================================
export const createStatusColumn = (field = 'status', headerName = 'STATUS') => {
    return {
        headerName,
        field,
        width: 130,
        cellRenderer: (params) => {
            const status = params.value;
            if (!status) return null;

            let bgColor, textColor, borderColor;

            switch (status) {
                case 'Active':
                    bgColor = 'bg-blue-50';
                    textColor = 'text-blue-700';
                    borderColor = 'border-blue-200';
                    break;
                case 'Accepted':
                    bgColor = 'bg-green-50';
                    textColor = 'text-green-700';
                    borderColor = 'border-green-200';
                    break;
                case 'Rejected':
                    bgColor = 'bg-red-50';
                    textColor = 'text-red-700';
                    borderColor = 'border-red-200';
                    break;
                case 'Pending':
                    bgColor = 'bg-yellow-50';
                    textColor = 'text-yellow-700';
                    borderColor = 'border-yellow-200';
                    break;
                case 'Completed':
                    bgColor = 'bg-emerald-50';
                    textColor = 'text-emerald-700';
                    borderColor = 'border-emerald-200';
                    break;
                default:
                    bgColor = 'bg-gray-50';
                    textColor = 'text-gray-700';
                    borderColor = 'border-gray-200';
            }

            return React.createElement('span', {
                className: `px-3 py-1 rounded-full text-[10px] font-black uppercase ${bgColor} ${textColor} border ${borderColor} inline-block`
            }, status);
        }
    };
};

// ============================================================================
// UTILITY: Create Date Column with Formatting
// ============================================================================
export const createDateColumn = (field, headerName) => {
    return {
        headerName,
        field,
        width: 130,
        valueFormatter: (params) => {
            if (!params.value) return '—';
            const date = new Date(params.value);
            return date.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    };
};

// ============================================================================
// EXPORT STATEMENT
// ============================================================================
export default {
    defaultColDef,
    defaultGridOptions,
    getGridTheme,
    gridContainerClass,
    createActionColumn,
    createSerialNumberColumn,
    createStatusColumn,
    createDateColumn
};
