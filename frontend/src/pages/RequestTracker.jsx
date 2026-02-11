import React, { useState, useEffect } from 'react';
import { Download, UserPlus, X, Check, Search, Filter, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAssetRequests, updateAssetRequest, sendEmailNotification } from '../redux/slices/assetRequestSlice';
import { fetchEmployees } from '../redux/slices/employeeSlice';
import { AgGridReact } from 'ag-grid-react';
import { defaultColDef, defaultGridOptions, createSerialNumberColumn, createBoldColumn } from '../config/agGridConfig';

// AG Grid Modules are registered GLOBALLY in agGridConfig.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const RequestTracker = () => {
    const dispatch = useDispatch();

    // Redux State
    const { items: requests, loading: loadingRequests } = useSelector((state) => state.assetRequests);
    const { items: employees, loading: loadingEmployees } = useSelector((state) => state.employees);

    // Local UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedMembers, setSelectedMembers] = useState([]);

    // Search and Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    useEffect(() => {
        dispatch(fetchAssetRequests());
    }, [dispatch]);

    const handleAssignClick = (request) => {
        // Frontend validation - only allow notification for Rejected status
        if (request.status === 'Active') {
            toast.error('Cannot send notification. Request status is Active.');
            return;
        }

        if (request.status === 'Accepted') {
            toast.error('Cannot send notification. Notifications are only sent for Rejected requests.');
            return;
        }

        if (request.status !== 'Rejected') {
            toast.error('Notifications can only be sent for Rejected requests.');
            return;
        }

        setSelectedRequest(request);
        setSelectedMembers([]);
        setIsModalOpen(true);
        // Fetch employees if not already loaded (or just fetch always to be fresh)
        if (employees.length === 0) {
            dispatch(fetchEmployees());
        }
    };

    const handleConfirmAssign = async () => {
        if (!selectedRequest || selectedMembers.length === 0) {
            toast.warning('Please select at least one employee to notify');
            return;
        }

        // Additional validation - only allow Rejected status
        if (selectedRequest.status === 'Active') {
            toast.error('Cannot send notification. Request status is Active.');
            setIsModalOpen(false);
            return;
        }

        if (selectedRequest.status === 'Accepted') {
            toast.error('Cannot send notification. Notifications are only sent for Rejected requests.');
            setIsModalOpen(false);
            return;
        }

        if (selectedRequest.status !== 'Rejected') {
            toast.error('Notifications can only be sent for Rejected requests.');
            setIsModalOpen(false);
            return;
        }

        const result = await dispatch(sendEmailNotification({
            requestId: selectedRequest.mhRequestId,
            recipients: selectedMembers
        }));

        if (sendEmailNotification.fulfilled.match(result)) {
            toast.success('Email notifications sent successfully');
            setIsModalOpen(false);
            setSelectedMembers([]);
        } else {
            // Display backend validation error
            const errorMessage = result.payload || 'Failed to send email notifications';
            toast.error(errorMessage);
        }
    };

    const handleStatusChange = async (request, newStatus) => {
        // Frontend validation - prevent changes to finalized status
        if (request.status === 'Accepted' || request.status === 'Rejected') {
            toast.error(`Cannot change status. Request is already ${request.status} and locked.`);
            return;
        }

        const formData = {
            ...request,
            status: newStatus
        };
        
        // updateAssetRequest expects { id, formData }
        const result = await dispatch(updateAssetRequest({ id: request._id, formData }));

        if (updateAssetRequest.fulfilled.match(result)) {
            // Send email notification ONLY when request is REJECTED
            if (newStatus === 'Rejected' && request.mailId) {
                const emailResult = await dispatch(sendEmailNotification({
                    requestId: request.mhRequestId,
                    recipients: [request.mailId] // Send to request creator
                }));

                if (sendEmailNotification.fulfilled.match(emailResult)) {
                    toast.success(`Request ${newStatus}. Email notification sent to ${request.userName}.`);
                } else {
                    toast.warning(`Request ${newStatus}, but failed to send email notification.`);
                }
            } else if (newStatus === 'Accepted') {
                // Just show success message, no email for accepted requests
                toast.success(`Request ${newStatus} successfully.`);
            } else {
                toast.success(`Status updated to ${newStatus}.`);
            }
        } else {
            // Display backend validation error
            const errorMessage = result.payload || 'Failed to update status';
            toast.error(errorMessage);
        }
    };

    // Helper to get file URL
    const getFileUrl = (path) => {
        if (!path) return null;
        return `${API_BASE_URL.replace('/api', '')}${path}`;
    };

    // Filter requests with safety check
    const filteredRequests = (requests || []).filter(req => {
        const matchesSearch =
            String(req.mhRequestId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(req.departmentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(req.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(req.handlingPartName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(req.userName || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
        const matchesType = typeFilter === 'all' || req.requestType === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    const columnDefs = React.useMemo(() => [
        createSerialNumberColumn(),
        createBoldColumn('mhRequestId', 'MH ID', { width: 140 }),
        { headerName: 'DEPT', field: 'departmentName', width: 140 },
        { 
            headerName: 'TYPE', 
            field: 'requestType',
            width: 120,
            cellRenderer: (params) => (
                <span className="text-[10px] font-black uppercase bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full border border-gray-100">
                    {params.value}
                </span>
            )
        },
        { headerName: 'PRODUCT MODEL', field: 'productModel', width: 150 },
        { headerName: 'PART NAME', field: 'handlingPartName', width: 180 },
        { headerName: 'HANDLING LOCATION', field: 'materialHandlingLocation', width: 180 },
        createBoldColumn('userName', 'USER NAME', { width: 150 }),
        {
            headerName: 'STATUS',
            field: 'status',
            width: 150,
            cellRenderer: (params) => {
                const req = params.data;
                return (
                    <div className="relative inline-block h-full flex items-center" onClick={e => e.stopPropagation()}>
                        <select
                            value={req.status}
                            onChange={(e) => handleStatusChange(req, e.target.value)}
                            disabled={req.status === 'Accepted' || req.status === 'Rejected'}
                            title={req.status === 'Accepted' || req.status === 'Rejected' ? 'Status is locked and cannot be changed' : 'Change status'}
                            className={`px-3 py-1 pr-8 rounded-full text-[10px] font-black uppercase border outline-none transition-all appearance-none min-w-[110px] shadow-sm ${
                                req.status === 'Accepted' || req.status === 'Rejected'
                                    ? 'cursor-not-allowed opacity-75'
                                    : 'cursor-pointer'
                            } ${req.status === 'Accepted' ? 'bg-green-50 text-green-700 border-green-200' :
                                req.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                                    'bg-blue-50 text-tvs-blue border-blue-200 hover:border-blue-400'
                                }`}
                        >
                            <option value="Active">Active</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            {req.status === 'Accepted' || req.status === 'Rejected' ? (
                                <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            )}
                        </div>
                    </div>
                );
            }
        },
        {
            headerName: 'NOTIFY',
            width: 120,
            sortable: false,
            filter: false,
            cellRenderer: (params) => {
                const req = params.data;
                if (req.status === 'Accepted') {
                    return <span className="text-xs text-gray-400 italic">—</span>;
                }
                return (
                    <button
                        onClick={() => {
                            if (req.status === 'Rejected') {
                                handleAssignClick(req);
                            }
                        }}
                        disabled={req.status === 'Active'}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-xl transition-all text-[10px] font-black uppercase tracking-widest
                            ${req.status === 'Rejected'
                                ? 'bg-tvs-blue/10 text-tvs-blue border-tvs-blue/20 hover:bg-tvs-blue hover:text-white'
                                : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed opacity-50'
                            }`}
                    >
                        <UserPlus size={12} strokeWidth={3} />
                        Notify
                    </button>
                );
            }
        }
    ], [handleStatusChange, handleAssignClick]);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-tvs-border overflow-hidden fade-in">
            <div className="flex justify-between items-center p-6 border-b border-tvs-border bg-gray-50">
                <h1 className="text-xl font-bold text-tvs-dark-gray m-0">MH Request Tracker</h1>
                <div className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                    Total Tracking: {filteredRequests.length}
                </div>
            </div>

            {/* Search and Filters */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            placeholder="Search by ID, department, user..."
                        />
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center whitespace-nowrap">
                            <Filter size={18} className="text-gray-400 mr-2" />
                            <span className="text-sm font-bold text-gray-700 uppercase tracking-tighter">Status:</span>
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-sm"
                        >
                            <option value="all">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center whitespace-nowrap">
                            <span className="text-sm font-bold text-gray-700 uppercase tracking-tighter">Request Type:</span>
                        </div>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-semibold text-sm"
                        >
                            <option value="all">All Types</option>
                            <option value="New Project">New Project</option>
                            <option value="Upgrade">Upgrade</option>
                            <option value="Refresh">Refresh</option>
                            <option value="Capacity">Capacity</option>
                            <option value="Special Improvements">Special Improvements</option>
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
                    loading={loadingRequests}
                />
            </div>

            {/* Assign Member Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden transform transition-all">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold text-tvs-dark-gray">Select Employee</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-white focus:outline-none"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                Select employees to notify about Request <strong className="text-tvs-blue">{selectedRequest?.mhRequestId}</strong>
                            </p>

                            <div className="max-h-[300px] overflow-y-auto border border-gray-200 rounded-lg shadow-inner bg-gray-50/30">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100 text-gray-600 font-semibold border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 w-16 text-center border-r border-gray-200">S.No</th>
                                            <th className="px-4 py-3 border-r border-gray-200">Email</th>
                                            <th className="px-4 py-3 w-16 text-center">Select</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">

                                        {loadingEmployees ? (
                                            <tr>
                                                <td colSpan="3" className="p-4 text-center text-gray-500">Loading employees...</td>
                                            </tr>
                                        ) : employees.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="p-4 text-center text-gray-500">No employees found</td>
                                            </tr>
                                        ) : (
                                            employees.map((emp, index) => {
                                                const email = emp.contactEmail || emp.mailId;
                                                const name = emp.employeeName || emp.fullName;

                                                if (!email) return null;

                                                const isSelected = selectedMembers.includes(email);
                                                return (
                                                    <tr
                                                        key={emp._id || index}
                                                        className={`hover:bg-blue-50 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/30' : ''}`}
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                setSelectedMembers(selectedMembers.filter(m => m !== email));
                                                            } else {
                                                                setSelectedMembers([...selectedMembers, email]);
                                                            }
                                                        }}
                                                    >
                                                        <td className="px-4 py-3 text-center text-gray-500 border-r border-gray-100">{index + 1}</td>
                                                        <td className="px-4 py-3 text-gray-700 font-medium border-r border-gray-100">
                                                            <div>{name}</div>
                                                            <div className="text-xs text-gray-400 font-normal">{email}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected
                                                                ? 'bg-tvs-blue border-tvs-blue text-white'
                                                                : 'bg-white border-gray-300 text-transparent hover:border-tvs-blue'
                                                                }`}>
                                                                <Check size={14} strokeWidth={3} />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmAssign}
                                    className="px-4 py-2 text-sm font-medium !text-white bg-tvs-blue rounded-lg hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    disabled={selectedMembers.length === 0}
                                >
                                    Send Email{selectedMembers.length !== 1 ? 's' : ''}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RequestTracker;
