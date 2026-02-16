import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit2, Check, ExternalLink, Warehouse } from 'lucide-react';
import { message, Select } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVendors } from '../redux/slices/vendorSlice';
import { fetchAssetRequests, updateAssetRequest } from '../redux/slices/assetRequestSlice';
import { AgGridReact } from 'ag-grid-react';
import { defaultColDef, defaultGridOptions, createSerialNumberColumn, createActionColumn } from '../config/agGridConfig';
import CustomCheckboxFilter from '../components/AgGridCustom/CustomCheckboxFilter';
import CustomHeader from '../components/AgGridCustom/CustomHeader';

// AG Grid Modules are registered GLOBALLY in agGridConfig.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const AssetProgressTracker = () => {
    const dispatch = useDispatch();
    const { items: requests, loading } = useSelector((state) => state.assetRequests);
    const { items: vendors } = useSelector((state) => state.vendors);

    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    // Search and Filter State


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

    const columnDefs = React.useMemo(() => [
        createSerialNumberColumn(),
        {
            headerName: 'MH REQUEST ID',
            field: 'mhRequestId',
            width: 140,
            cellClass: 'ag-cell-bold',
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'PLANT LOCATION',
            field: 'location',
            width: 140,
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'DEPARTMENT',
            field: 'departmentName',
            width: 160,
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },

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
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter,
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
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter,
            cellRenderer: (params) => {
                return <span className="px-2 py-1 rounded-full text-[10px] font-black uppercase bg-gray-100 text-gray-500 border border-gray-200 inline-block">{params.value}</span>;
            }
        },
        {
            headerName: 'ASSET ID',
            field: 'allocationAssetId',
            width: 140,
            cellStyle: { fontFamily: 'monospace' },
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
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




            <div className="ag-theme-alpine w-full h-[600px]">
                <AgGridReact
                    theme="legacy"
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
