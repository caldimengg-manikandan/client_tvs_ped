import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit2, Check, ExternalLink, Search, Filter, Warehouse } from 'lucide-react';
import { message, Select } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVendors } from '../redux/slices/vendorSlice';
import { fetchAssetRequests, updateAssetRequest } from '../redux/slices/assetRequestSlice';
import { AgGridReact } from 'ag-grid-react';
import { defaultColDef, defaultGridOptions, createSerialNumberColumn, createActionColumn } from '../config/agGridConfig';

// AG Grid Modules are registered GLOBALLY in agGridConfig.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const AssetProgressTracker = () => {
    const dispatch = useDispatch();
    const { items: requests, loading } = useSelector((state) => state.assetRequests);
    const { items: vendors } = useSelector((state) => state.vendors);

    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    // Search and Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [progressFilter, setProgressFilter] = useState('all');

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

        const term = (searchTerm || '').toLowerCase();
        const matchesSearch =
            String(req.mhRequestId || '').toLowerCase().includes(term) ||
            String(req.departmentName || '').toLowerCase().includes(term) ||
            String(req.location || '').toLowerCase().includes(term) ||
            String(req.allocationAssetId || '').toLowerCase().includes(term);

        const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
        const matchesProgress = progressFilter === 'all' || req.progressStatus === progressFilter;

        return matchesSearch && matchesStatus && matchesProgress;
    });

    const columnDefs = React.useMemo(() => [
        createSerialNumberColumn(),
        { 
            headerName: 'MH REQUEST ID', 
            field: 'mhRequestId', 
            width: 140,
            cellClass: 'ag-cell-bold'
        },
        { headerName: 'PLANT LOCATION', field: 'location', width: 140 },
        { headerName: 'DEPARTMENT', field: 'departmentName', width: 160 },
        
        // Progress Switches
        ...(['designReceiptFromVendor', 'designApproval', 'production', 'implementation'].map(field => ({
            headerName: field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
            field,
            width: 130,
            cellRenderer: (params) => {
                const { editingId, editForm, isSwitchDisabled, handleSwitchChange } = params.context;
                const isEditing = editingId === params.data._id;
                const data = isEditing ? editForm : params.data;
                const checked = !!data[field];
                const disabled = !isEditing || isSwitchDisabled(field, params.data);

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

        // Vendor Column
        {
            headerName: 'VENDOR',
            field: 'assignedVendor',
            width: 200,
            cellRenderer: (params) => {
                const { editingId, editForm, vendors, setEditForm } = params.context;
                const isEditing = editingId === params.data._id;
                
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
                                disabled={!editForm.production || params.data.production}
                                options={vendors.map(v => ({ value: v._id, label: `${v.vendorName} (${v.vendorCode})` }))}
                            />
                        </div>
                    );
                }

                return (
                    <div className="flex items-center gap-2 h-full">
                        {params.value ? (
                            <>
                                <Warehouse size={14} className="text-gray-400" />
                                <span className="text-sm font-medium text-gray-700 truncate">
                                    {params.value.vendorName || 'Assigned'}
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
            headerName: 'STATUS',
            field: 'status',
            width: 120,
            cellRenderer: (params) => {
                const status = params.value;
                let colorClass = 'bg-gray-100 text-gray-700 border-gray-200';
                if (status === 'Accepted') colorClass = 'bg-green-50 text-green-700 border-green-200';
                else if (status === 'Rejected') colorClass = 'bg-red-50 text-red-700 border-red-200';
                
                return <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border inline-block ${colorClass}`}>{status}</span>;
            }
        },
        {
            headerName: 'PROGRESS',
            field: 'progressStatus',
            width: 140,
            cellRenderer: (params) => {
                return <span className="px-2 py-1 rounded-full text-[10px] font-black uppercase bg-gray-100 text-gray-500 border border-gray-200 inline-block">{params.value}</span>;
            }
        },
        { headerName: 'ASSET ID', field: 'allocationAssetId', width: 140, cellStyle: { fontFamily: 'monospace' } },
        {
            headerName: 'REMARKS',
            field: 'remark',
            width: 180,
            cellRenderer: (params) => {
                const { editingId, editForm, setEditForm } = params.context;
                const isEditing = editingId === params.data._id;
                
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
                return params.value || '-';
            }
        },
        {
            headerName: 'ACTION',
            width: 100,
            pinned: 'right',
            cellRenderer: (params) => {
                const { editingId, handleSave, handleEditClick, handleCancelEdit } = params.context;
                const isEditing = editingId === params.data._id;
                const isRejected = params.data.status === 'Rejected';

                if (isEditing) {
                    return (
                        <div className="flex gap-1 items-center h-full">
                            <button
                                onClick={() => handleSave(params.data)}
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
                            onClick={() => !isRejected && handleEditClick(params.data)}
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
    ], [vendors]);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-tvs-border overflow-hidden fade-in">
            <div className="flex justify-between items-center p-6 border-b border-tvs-border bg-gray-50">
                <div>
                    <h1 className="text-xl font-bold text-tvs-dark-gray m-0 mb-1">MH Progress Summary</h1>
                    <p className="text-sm text-gray-500">Track design and production milestones for MH requests</p>
                </div>
                <div className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                    Total Assets: {filteredRequests.length}
                </div>
            </div>

            {/* Search and Filters */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Search by ID, department, location..."
                        />
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <Filter size={18} className="text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-700">Status:</span>
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Status</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>

                    <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-700">Progress:</span>
                        <select
                            value={progressFilter}
                            onChange={(e) => setProgressFilter(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Progress</option>
                            <option value="Initial">Initial</option>
                            <option value="Design">Design</option>
                            <option value="Design Approved">Design Approved</option>
                            <option value="Production">Production</option>
                            <option value="Implementation">Implementation</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="ag-theme-alpine w-full h-[600px]">
                <AgGridReact
                    rowData={filteredRequests}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    {...defaultGridOptions}
                    loading={loading}
                    context={{
                        editingId,
                        editForm,
                        vendors,
                        setEditForm,
                        handleSwitchChange,
                        isSwitchDisabled,
                        handleSave,
                        handleEditClick,
                        handleCancelEdit
                    }}
                />
            </div>
        </div>
    );
};

export default AssetProgressTracker;
