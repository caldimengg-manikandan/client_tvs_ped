import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Filter } from 'lucide-react';
import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import FreezeToolbar from '../components/FreezeToolbar';
import FrozenRowsDataGrid from '../components/FrozenRowsDataGrid';
import ColumnCustomizer from '../components/ColumnCustomizer';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const AssetSummary = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [columnFilters, setColumnFilters] = useState({});
    const [activeFilterKey, setActiveFilterKey] = useState(null);
    const [filterSearchText, setFilterSearchText] = useState({});
    const [gridWidth, setGridWidth] = useState(0);
    const [frozenKeys, setFrozenKeys] = useState(new Set());
    const [frozenRowCount, setFrozenRowCount] = useState(0);
    const [hiddenKeys, setHiddenKeys] = useState(new Set());
    const [rowHeight, setRowHeight] = useState(44);
    const [headerRowHeight, setHeaderRowHeight] = useState(52);

    const gridContainerRef = useRef(null);

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/asset-request`);
            // Requirement: show records until reached Implementation Status (Accepted or Rejected)
            const summaryAssets = response.data.filter(req =>
                (req.status === 'Accepted' || req.status === 'Rejected') &&
                req.progressStatus === 'Implementation'
            );
            setAssets(summaryAssets);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching assets:', error);
            setLoading(false);
        }
    };
    const baseRows = assets || [];

    const applyColumnFilters = (rows) => {
        if (!columnFilters || Object.keys(columnFilters).length === 0) return rows;

        return rows.filter(row =>
            Object.entries(columnFilters).every(([key, values]) => {
                if (!values || values.length === 0) return true;
                const value = row[key];
                const str = value == null ? '' : String(value);
                return values.includes(str);
            })
        );
    };

    const gridRows = applyColumnFilters(baseRows).map((row, i) => ({ ...row, _serialNo: i + 1 }));

    const PlainHeaderCell = ({ column }) => (
        <div className="h-full w-full flex items-center px-4 text-white">
            <span className="font-bold text-[11px] leading-tight tracking-wide uppercase">{column.name}</span>
        </div>
    );

    const FilterHeaderCell = ({ column }) => {
        const key = column.key;
        const valuesSet = new Set();
        baseRows.forEach(row => {
            const value = row[key];
            const str = value == null ? '' : String(value);
            valuesSet.add(str);
        });
        const values = Array.from(valuesSet).sort((a, b) => a.localeCompare(b));

        const searchValue = filterSearchText[key] || '';
        const rawSelected = columnFilters[key];
        const selectedValues = rawSelected === undefined ? values : rawSelected;

        const visibleValues = values.filter(v =>
            v.toLowerCase().includes(searchValue.toLowerCase())
        );

        const toggleValue = (value) => {
            const strValue = value;
            setColumnFilters(prev => {
                const base = prev[key] === undefined ? values : prev[key];
                const exists = base.includes(strValue);
                const next = exists ? base.filter(v => v !== strValue) : [...base, strValue];
                const updated = { ...prev };

                if (next.length === values.length) {
                    delete updated[key];
                } else {
                    updated[key] = next;
                }

                return updated;
            });
        };

        const handleSelectAll = () => {
            setColumnFilters(prev => {
                const clone = { ...prev };
                delete clone[key];
                return clone;
            });
        };

        const handleClear = () => {
            setColumnFilters(prev => {
                const clone = { ...prev };
                delete clone[key];
                return clone;
            });
            setFilterSearchText(prev => {
                const clone = { ...prev };
                delete clone[key];
                return clone;
            });
        };

        const hasFilter = rawSelected !== undefined;

        return (
            <div className="relative h-full w-full flex items-center justify-between px-4 text-xs gap-1 text-white">
                <div className="flex-1 min-w-0">
                    <span className="font-bold text-[11px] leading-tight tracking-wide uppercase truncate">{column.name}</span>
                </div>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveFilterKey(prev => (prev === key ? null : key));
                    }}
                    className={`ml-1 p-1 rounded shrink-0 transition-colors ${hasFilter ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10'}`}
                >
                    <Filter size={11} />
                </button>
                {activeFilterKey === key && (
                    <div className="absolute z-50 top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                        <div className="flex items-center justify-between mb-2">
                            <button
                                type="button"
                                onClick={handleSelectAll}
                                className="text-[10px] font-semibold text-tvs-blue"
                            >
                                Select All
                            </button>
                            <button
                                type="button"
                                onClick={handleClear}
                                className="text-[10px] font-semibold text-gray-500"
                            >
                                Clear
                            </button>
                        </div>
                        <div className="mb-2">
                            <input
                                type="text"
                                value={searchValue}
                                onChange={(e) => setFilterSearchText(prev => ({ ...prev, [key]: e.target.value }))}
                                placeholder="Search..."
                                className="w-full border border-gray-200 rounded px-1.5 py-1 text-[10px] outline-none focus:ring-1 focus:ring-tvs-blue"
                            />
                        </div>
                        <div className="max-h-40 overflow-auto space-y-1">
                            {visibleValues.map(value => {
                                const label = value || '(Blank)';
                                const checked = selectedValues.includes(value);
                                return (
                                    <label
                                        key={label}
                                        className="flex items-center gap-1.5 text-[10px] text-gray-700 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleValue(value)}
                                            className="w-3 h-3"
                                        />
                                        <span className="truncate">{label}</span>
                                    </label>
                                );
                            })}
                            {visibleValues.length === 0 && (
                                <div className="text-[10px] text-gray-400">No values</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const dataGridColumns = [
        {
            key: 'serial',
            name: 'S.NO',
            width: 80,
            frozen: true,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <span className="font-semibold text-gray-700">{row._serialNo}</span>
            )
        },
        {
            key: 'mhId',
            name: 'MH ID',
            width: 150,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => {
                const value = row.allocationAssetId || row.mhRequestId || '-';
                return (
                    <span className="font-semibold text-gray-900">{value}</span>
                );
            }
        },
        {
            key: 'handlingPartName',
            name: 'PART NAME',
            width: 200,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span>{row.handlingPartName || '-'}</span>
            )
        },
        {
            key: 'vendorName',
            name: 'VENDOR NAME',
            width: 200,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => {
                const vendor = row.assignedVendor;
                const value = (typeof vendor === 'object' && vendor !== null)
                    ? vendor.vendorName
                    : (vendor || '-');
                return <span>{value}</span>;
            }
        },
        {
            key: 'poPrice',
            name: 'PO PRICE',
            width: 150,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => {
                const value = row.poPrice;
                if (!value) return <span>-</span>;
                const formatted = `₹ ${Number(value).toLocaleString()}`;
                return <span>{formatted}</span>;
            }
        },
        {
            key: 'departmentName',
            name: 'DEPARTMENT',
            width: 180,
            renderHeaderCell: FilterHeaderCell
        },
        {
            key: 'location',
            name: 'PLANT LOCATION',
            width: 160,
            renderHeaderCell: FilterHeaderCell
        },
        {
            key: 'handlingLocation',
            name: 'HANDLING LOCATION',
            width: 200,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => {
                const value = row.assetLocation || row.materialHandlingLocation || '-';
                return <span>{value}</span>;
            }
        }
    ];

    const freezeColumnList = dataGridColumns
        .filter(col => col.key !== 'serial')
        .map(col => ({ key: col.key, name: col.name }));

    const autoFitColumns = React.useMemo(() => {
        const withFreeze = dataGridColumns
            .filter(col => !hiddenKeys.has(col.key))
            .map(col => ({
                ...col,
                frozen: col.key === 'serial' || frozenKeys.has(col.key),
            }));

        if (!gridWidth) return withFreeze;

        const totalDefinedWidth = withFreeze.reduce((sum, column) => {
            return sum + (column.width || 0);
        }, 0);

        if (!totalDefinedWidth) return withFreeze;

        const scale = Math.max(gridWidth / totalDefinedWidth, 1);

        return withFreeze.map((column) => {
            if (!column.width) return column;
            const scaledWidth = Math.max(
                Math.floor(column.width * scale),
                column.width,
                80
            );

            return {
                ...column,
                width: scaledWidth
            };
        });
    }, [dataGridColumns, gridWidth, frozenKeys, hiddenKeys]);

    useEffect(() => {
        if (!gridContainerRef.current) return;

        const updateWidth = () => {
            setGridWidth(gridContainerRef.current.clientWidth);
        };

        updateWidth();

        const observer = new ResizeObserver(updateWidth);
        observer.observe(gridContainerRef.current);

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <div className="flex-1 flex flex-col h-full w-full bg-transparent fade-in">
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="px-6 py-4">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <ColumnCustomizer
                            columns={dataGridColumns}
                            hiddenKeys={hiddenKeys}
                            onChange={setHiddenKeys}
                            gridClass="asset-summary-grid"
                            onDensity={({ rowH, headerH }) => {
                                setRowHeight(rowH);
                                setHeaderRowHeight(headerH);
                            }}
                        />
                        <FreezeToolbar
                            columns={freezeColumnList}
                            frozenKeys={frozenKeys}
                            onApply={setFrozenKeys}
                            frozenRowCount={frozenRowCount}
                            setFrozenRowCount={setFrozenRowCount}
                            maxRows={Math.min(gridRows.length, 50)}
                        />
                    </div>
                </div>

                <div className="flex-1 flex flex-col px-4 pb-4 md:px-6 md:pb-6 overflow-hidden">
                    <div ref={gridContainerRef} className="flex-1 w-full border border-gray-200 rounded-xl overflow-hidden bg-white relative min-h-[400px]">
                        <div className="h-full w-full absolute inset-0">
                            <FrozenRowsDataGrid
                                columns={autoFitColumns}
                                rows={gridRows}
                                rowKeyGetter={(row) => row._id || row.mhRequestId || row.allocationAssetId}
                                className="rdg-light asset-summary-grid"
                                style={{ blockSize: '100%', width: '100%' }}
                                rowHeight={rowHeight}
                                headerRowHeight={headerRowHeight}
                                frozenRowCount={frozenRowCount}
                                defaultColumnOptions={{
                                    resizable: true
                                }}
                                loading={loading}
                            />
                            {loading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/60 pointer-events-none">
                                    <div className="w-8 h-8 border-4 border-tvs-blue/20 border-t-tvs-blue rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssetSummary;
