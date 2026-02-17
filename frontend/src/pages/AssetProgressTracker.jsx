import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Edit2, Check, ExternalLink, Warehouse, Filter } from 'lucide-react';
import { message, Select } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVendors } from '../redux/slices/vendorSlice';
import { fetchAssetRequests, updateAssetRequest } from '../redux/slices/assetRequestSlice';
import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const AssetProgressTracker = () => {
    const dispatch = useDispatch();
    const { items: requests, loading } = useSelector((state) => state.assetRequests);
    const { items: vendors } = useSelector((state) => state.vendors);

    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [columnFilters, setColumnFilters] = useState({});
    const [activeFilterKey, setActiveFilterKey] = useState(null);
    const [filterSearchText, setFilterSearchText] = useState({});
    const [gridWidth, setGridWidth] = useState(0);

    const gridContainerRef = useRef(null);

    useEffect(() => {
        dispatch(fetchAssetRequests());
        dispatch(fetchVendors());
    }, [dispatch]);

    const handleEditClick = (request) => {
        setEditingId(request._id);
        setEditForm({
            designReceiptFromVendor: request.designReceiptFromVendor,
            designApproval: request.designApproval,
            production: request.production,
            implementation: request.implementation,
            remark: request.remark || '',
            assignedVendor: request.assignedVendor?._id || request.assignedVendor || ''
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleSwitchChange = (field) => {
        setEditForm(prev => {
            const newState = { ...prev, [field]: !prev[field] };

            // Logic to enforce sequential progress (as per requirements)
            // If turning OFF a field, turn off subsequent fields
            if (!newState[field]) {
                if (field === 'designReceiptFromVendor') {
                    newState.designApproval = false;
                    newState.production = false;
                    newState.implementation = false;
                } else if (field === 'designApproval') {
                    newState.production = false;
                    newState.implementation = false;
                } else if (field === 'production') {
                    newState.implementation = false;
                }
            }

            return newState;
        });
    };

    const handleSave = async (originalRequest) => {
        // Validation: Vendor must be selected if Production is enabled
        if (editForm.production && !editForm.assignedVendor) {
            message.error('Please select a vendor before allowing Production.');
            return;
        }

        try {
            const formPayload = new FormData();
            const payload = { ...originalRequest, ...editForm };

            Object.keys(payload).forEach(key => {
                if (key === 'assignedVendor' && typeof payload[key] === 'object' && payload[key] !== null) {
                    formPayload.append(key, payload[key]._id);
                } else if (key !== 'file' && key !== 'drawingFile' && key !== 'history' && payload[key] !== undefined) {
                    formPayload.append(key, payload[key] === null ? 'null' : payload[key]);
                }
            });

            if (originalRequest.drawingFile && !editForm.drawingFile) {
                formPayload.append('drawingFile', originalRequest.drawingFile);
            }

            const result = await dispatch(updateAssetRequest({ id: originalRequest._id, formData: formPayload }));

            if (updateAssetRequest.fulfilled.match(result)) {
                message.success('Progress updated successfully');
                setEditingId(null);
            } else {
                message.error(result.payload || 'Failed to update request');
            }
        } catch (error) {
            console.error('Error updating request:', error);
            message.error('Failed to update request');
        }
    };

    const isSwitchDisabled = (field, originalRequest) => {
        // --- Requirement: "they cant revoke the previous Progress Status when it stored in the database" ---
        if (originalRequest && originalRequest[field] === true) {
            return true;
        }

        const { designReceiptFromVendor, designApproval, production, implementation } = editForm;

        switch (field) {
            case 'designReceiptFromVendor':
                return designApproval;
            case 'designApproval':
                return !designReceiptFromVendor || production;
            case 'production':
                return !designApproval || implementation;
            case 'implementation':
                return !production;
            default:
                return false;
        }
    };

    // Filter requests with safety check
    const filteredRequests = (requests || []).filter(req => {
        // Condition: Don't show Rejected status unless it reached Implementation
        if (req.status === 'Rejected' && req.progressStatus !== 'Implementation') {
            return false;
        }

        return true;
    });

    const baseRows = filteredRequests;

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

    const gridRows = applyColumnFilters(baseRows);

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
            <div className="relative h-full flex items-center justify-between px-2 text-xs gap-1 text-white">
                <div className="flex-1 min-w-0">
                    <span className="font-semibold truncate">{column.name}</span>
                </div>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveFilterKey(prev => (prev === key ? null : key));
                    }}
                    className={`ml-1 p-0.5 rounded shrink-0 ${hasFilter ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/10'}`}
                >
                    <Filter size={10} />
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
            name: '#',
            width: 70,
            frozen: true,
            renderCell: ({ rowIdx }) => (
                <span className="font-semibold text-gray-700">{rowIdx + 1}</span>
            )
        },
        {
            key: 'mhRequestId',
            name: 'MH REQUEST ID',
            width: 140,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className="font-semibold text-gray-900">{row.mhRequestId}</span>
            )
        },
        {
            key: 'location',
            name: 'PLANT LOCATION',
            width: 140,
            renderHeaderCell: FilterHeaderCell
        },
        {
            key: 'departmentName',
            name: 'DEPARTMENT',
            width: 160,
            renderHeaderCell: FilterHeaderCell
        },
        ...(['designReceiptFromVendor', 'designApproval', 'production', 'implementation'].map(field => ({
            key: field,
            name: field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
            width: 130,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => {
                const isEditing = editingId === row._id;
                const data = isEditing ? editForm : row;
                const checked = !!data[field];
                const disabled = !isEditing || isSwitchDisabled(field, row);

                return (
                    <div className="flex justify-center items-center h-full">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={checked}
                                onChange={() => handleSwitchChange(field)}
                                disabled={disabled}
                            />
                            <div className={`w-9 h-5 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-100 
                                ${disabled ? 'cursor-not-allowed opacity-60' : ''}
                                peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] 
                                after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 
                                after:border after:rounded-full after:h-4 after:w-4 after:transition-all 
                                ${checked ? 'bg-tvs-blue peer-checked:bg-tvs-blue' : 'bg-gray-200'}`}>
                            </div>
                        </label>
                    </div>
                );
            }
        }))),
        {
            key: 'assignedVendor',
            name: 'VENDOR',
            width: 200,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => {
                const isEditing = editingId === row._id;

                if (isEditing) {
                    return (
                        <div className="flex flex-col justify-center h-full py-1">
                            <Select
                                showSearch
                                style={{ width: '100%' }}
                                size="small"
                                placeholder="-- Select Vendor --"
                                value={editForm.assignedVendor || undefined}
                                onChange={(val) => setEditForm(prev => ({ ...prev, assignedVendor: val }))}
                                disabled={!editForm.production || row.production}
                                options={vendors.map(v => ({ value: v._id, label: `${v.vendorName} (${v.vendorCode})` }))}
                            />
                        </div>
                    );
                }

                return (
                    <div className="flex items-center gap-2 h-full">
                        {row.assignedVendor ? (
                            <>
                                <Warehouse size={14} className="text-gray-400" />
                                <span className="text-sm font-medium text-gray-700 truncate">
                                    {row.assignedVendor.vendorName || 'Assigned'}
                                </span>
                            </>
                        ) : (
                            <span className="text-xs text-gray-400 italic">Not Assigned</span>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'status',
            name: 'STATUS',
            width: 120,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => {
                const status = row.status;
                let colorClass = 'bg-gray-100 text-gray-700 border-gray-200';
                if (status === 'Accepted') colorClass = 'bg-green-50 text-green-700 border-green-200';
                else if (status === 'Rejected') colorClass = 'bg-red-50 text-red-700 border-red-200';

                return <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border inline-block ${colorClass}`}>{status}</span>;
            }
        },
        {
            key: 'progressStatus',
            name: 'PROGRESS',
            width: 140,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => {
                return <span className="px-2 py-1 rounded-full text-[10px] font-black uppercase bg-gray-100 text-gray-500 border border-gray-200 inline-block">{row.progressStatus}</span>;
            }
        },
        {
            key: 'allocationAssetId',
            name: 'ASSET ID',
            width: 140,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className="font-mono">{row.allocationAssetId}</span>
            )
        },
        {
            key: 'remark',
            name: 'REMARKS',
            width: 180,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => {
                const isEditing = editingId === row._id;

                if (isEditing) {
                    return (
                        <input
                            type="text"
                            value={editForm.remark}
                            onChange={(e) => setEditForm({ ...editForm, remark: e.target.value })}
                            className="w-full h-8 text-xs border border-gray-300 rounded px-2 focus:outline-none focus:border-tvs-blue"
                            placeholder="Enter remarks..."
                        />
                    );
                }
                return row.remark || '-';
            }
        },
        {
            key: 'action',
            name: 'ACTION',
            width: 100,
            renderCell: ({ row }) => {
                const isEditing = editingId === row._id;
                const isRejected = row.status === 'Rejected';

                if (isEditing) {
                    return (
                        <div className="flex gap-1 items-center h-full">
                            <button
                                onClick={() => handleSave(row)}
                                className="p-1 px-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 border border-green-200"
                                title="Save"
                            >
                                <Check size={14} />
                            </button>
                            <button
                                onClick={() => handleCancelEdit()}
                                className="p-1 px-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200"
                                title="Cancel"
                            >
                                <span className="text-[10px] font-bold">X</span>
                            </button>
                        </div>
                    );
                }

                return (
                    <div className="flex justify-center items-center h-full">
                        <button
                            onClick={() => !isRejected && handleEditClick(row)}
                            disabled={isRejected}
                            className={`p-1.5 rounded-lg border transition-all ${isRejected
                                ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed opacity-60'
                                : 'bg-gray-50 text-gray-600 hover:bg-white hover:text-tvs-blue hover:shadow-sm border-transparent hover:border-gray-200'
                                }`}
                            title={isRejected ? 'Cannot edit rejected' : 'Edit Progress'}
                        >
                            <Edit2 size={16} />
                        </button>
                    </div>
                );
            }
        }
    ];

    const autoFitColumns = React.useMemo(() => {
        if (!gridWidth) return dataGridColumns;

        const totalDefinedWidth = dataGridColumns.reduce((sum, column) => {
            return sum + (column.width || 0);
        }, 0);

        if (!totalDefinedWidth) return dataGridColumns;

        const scale = Math.max(gridWidth / totalDefinedWidth, 1);

        return dataGridColumns.map((column) => {
            if (!column.width) return column;
            const scaledWidth = Math.max(Math.floor(column.width * scale), column.width, 80);

            return {
                ...column,
                width: scaledWidth
            };
        });
    }, [dataGridColumns, gridWidth]);

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
        <div className="bg-white rounded-lg shadow-sm border border-tvs-border overflow-hidden fade-in">
            <div ref={gridContainerRef} className="w-full h-[600px] border border-gray-200 rounded-xl overflow-hidden bg-white relative">
                <div className="h-full">
                    <DataGrid
                        columns={autoFitColumns}
                        rows={gridRows}
                        rowKeyGetter={(row) => row._id || row.mhRequestId}
                        className="rdg-light asset-progress-grid"
                        style={{ blockSize: '100%', width: '100%' }}
                        rowHeight={52}
                        headerRowHeight={48}
                        defaultColumnOptions={{
                            resizable: true
                        }}
                    />
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/60 pointer-events-none">
                            <div className="w-8 h-8 border-4 border-tvs-blue/20 border-t-tvs-blue rounded-full animate-spin" />
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                .asset-progress-grid.rdg-light {
                    width: 100%;
                    height: 100%;
                    border: none;
                }
                .asset-progress-grid .rdg-row .rdg-cell {
                    border-inline: none;
                    padding-block: 12px;
                    padding-inline: 16px;
                    font-size: 13px;
                }
                .asset-progress-grid .rdg-row:not(.rdg-row-selected) .rdg-cell {
                    border-bottom: 1px solid #f1f5f9;
                }
                .asset-progress-grid .rdg-row:hover .rdg-cell {
                    background-color: #f8fafc;
                }
                .asset-progress-grid .rdg-header-row .rdg-cell {
                    padding-block: 14px;
                    padding-inline: 16px;
                    font-weight: 700;
                    border-inline: none;
                    border-bottom: 2px solid #e2e8f0;
                    position: relative;
                    font-size: 12px;
                    background-color: #253C80;
                    color: #ffffff;
                }
            `}</style>
        </div>
    );
};

export default AssetProgressTracker;
