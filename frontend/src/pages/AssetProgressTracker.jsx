import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Edit2, Check, ExternalLink, Search, Filter, Warehouse } from 'lucide-react';
import { message, Select } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVendors } from '../redux/slices/vendorSlice';
import { fetchAssetRequests, updateAssetRequest } from '../redux/slices/assetRequestSlice';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

    // Filter requests
    const filteredRequests = requests.filter(req => {
        // Condition: Don't show Rejected status unless it reached Implementation
        if (req.status === 'Rejected' && req.progressStatus !== 'Implementation') {
            return false;
        }

        const term = searchTerm.toLowerCase();
        const matchesSearch =
            (req.assetRequestId?.toLowerCase() || '').includes(term) ||
            (req.departmentName?.toLowerCase() || '').includes(term) ||
            (req.location?.toLowerCase() || '').includes(term) ||
            (req.allocationAssetId?.toLowerCase() || '').includes(term);

        const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
        const matchesProgress = progressFilter === 'all' || req.progressStatus === progressFilter;

        return matchesSearch && matchesStatus && matchesProgress;
    });

    return (
        <div className="bg-white rounded-lg shadow-sm border border-tvs-border overflow-hidden fade-in">
            <div className="flex justify-between items-center p-6 border-b border-tvs-border bg-gray-50">
                <div>
                    <h1 className="text-xl font-bold text-tvs-dark-gray m-0 mb-1">Asset Progress Summary</h1>
                    <p className="text-sm text-gray-500">Track design and production milestones</p>
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

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">S.No</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Asset Request ID</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Plant Location</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Department Name</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 w-24">Design Receipt from Vendor</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 w-24">Design Approval</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 w-24">Production</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 w-24">Implementation</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Vendor</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Progress Status</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Allocate Asset ID</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Remarks</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 w-20">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="13" className="p-8 text-center text-gray-500 font-medium bg-gray-50">Loading requests...</td>
                            </tr>
                        ) : requests.length === 0 ? (
                            <tr>
                                <td colSpan="13" className="p-8 text-center text-gray-500 font-medium bg-gray-50">No requests found</td>
                            </tr>
                        ) : (
                            filteredRequests.map((req, index) => {
                                const isEditing = editingId === req._id;
                                const data = isEditing ? editForm : req;

                                return (
                                    <tr key={req._id} className={`hover:bg-blue-50/50 transition-colors ${isEditing ? 'bg-blue-50/30' : ''}`}>
                                        <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">{index + 1}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap"><strong>{req.assetRequestId}</strong></td>
                                        <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">{req.location}</td>
                                        <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">{req.departmentName}</td>

                                        {/* Boolean Switches */}
                                        {['designReceiptFromVendor', 'designApproval', 'production', 'implementation'].map(field => (
                                            <td key={field} className="px-4 py-3 text-center border-b border-gray-100">
                                                <div className="flex justify-center">
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="sr-only peer"
                                                            checked={!!data[field]}
                                                            onChange={() => handleSwitchChange(field)}
                                                            disabled={!isEditing || isSwitchDisabled(field, req)}
                                                        />
                                                        <div className={`w-9 h-5 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-100 dark:peer-focus:ring-blue-800 
                                                            ${!isEditing || isSwitchDisabled(field, req) ? 'cursor-not-allowed opacity-60' : ''}
                                                            peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] 
                                                            after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 
                                                            after:border after:rounded-full after:h-4 after:w-4 after:transition-all 
                                                            ${data[field] ? 'bg-tvs-blue peer-checked:bg-tvs-blue' : 'bg-gray-200'}`}>
                                                        </div>
                                                    </label>
                                                </div>
                                            </td>
                                        ))}

                                        {/* Vendor Column */}
                                        <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100 min-w-[200px]">
                                            {isEditing ? (
                                                <div className="space-y-1">
                                                    <Select
                                                        showSearch
                                                        style={{ width: '100%', fontSize: '12px' }}
                                                        placeholder="-- Select Vendor --"
                                                        optionFilterProp="children"
                                                        value={editForm.assignedVendor || undefined}
                                                        onChange={(val) => setEditForm(prev => ({ ...prev, assignedVendor: val }))}
                                                        disabled={!editForm.production || req.production}
                                                        className="text-xs custom-select"
                                                        filterOption={(input, option) =>
                                                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                                        }
                                                        options={vendors.map(v => ({
                                                            value: v._id,
                                                            label: `${v.vendorName} (${v.vendorCode})`
                                                        }))}
                                                    />
                                                    {editForm.production && !editForm.assignedVendor && !req.production && (
                                                        <p className="text-[10px] text-red-500 font-medium">Vendor required for Production</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    {req.assignedVendor ? (
                                                        <>
                                                            <Warehouse size={14} className="text-gray-400" />
                                                            <span className="text-sm font-medium text-gray-700 truncate max-w-[140px]" title={req.assignedVendor.vendorName}>
                                                                {req.assignedVendor.vendorName || 'Assigned'}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">Not Assigned</span>
                                                    )}
                                                </div>
                                            )}
                                        </td>

                                        <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${req.status === 'Accepted' ? 'bg-green-50 text-green-700 border-green-200' :
                                                req.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                                    'bg-gray-100 text-gray-700 border-gray-200'
                                                }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">
                                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                                                {req.progressStatus}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap font-mono">{req.allocationAssetId || '-'}</td>

                                        <td className="px-4 py-3 text-sm text-gray-700 border-b border-gray-100 min-w-[150px]">
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={editForm.remark}
                                                    onChange={(e) => setEditForm({ ...editForm, remark: e.target.value })}
                                                    className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-tvs-blue"
                                                    placeholder="Enter remarks..."
                                                />
                                            ) : (
                                                <span className="text-gray-600 truncate block max-w-[150px]" title={req.remark}>{req.remark}</span>
                                            )}
                                        </td>

                                        <td className="px-4 py-3 text-center border-b border-gray-100">
                                            {isEditing ? (
                                                <button
                                                    onClick={() => handleSave(req)}
                                                    className="inline-flex items-center justify-center p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 border border-green-200 transition-colors"
                                                    title="Save Changes"
                                                >
                                                    <Check size={16} />
                                                    <span className="ml-1 text-xs font-medium">Save</span>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => req.status !== 'Rejected' && handleEditClick(req)}
                                                    disabled={req.status === 'Rejected'}
                                                    className={`inline-flex items-center justify-center p-1.5 rounded-lg border transition-all ${req.status === 'Rejected'
                                                        ? 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed opacity-60'
                                                        : 'bg-gray-50 text-gray-600 hover:bg-white hover:text-tvs-blue hover:shadow-sm border-transparent hover:border-gray-200'
                                                        }`}
                                                    title={req.status === 'Rejected' ? 'Cannot edit rejected requests' : 'Edit Progress'}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AssetProgressTracker;
