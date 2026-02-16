import React, { useState, useEffect } from 'react';
import { Download, UserPlus, X, Check, ArrowRight, Paperclip, Package } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAssetRequests, updateAssetRequest, sendEmailNotification } from '../redux/slices/assetRequestSlice';
import { fetchEmployees } from '../redux/slices/employeeSlice';
import { AgGridReact } from 'ag-grid-react';
import { defaultColDef, defaultGridOptions, createSerialNumberColumn, createBoldColumn } from '../config/agGridConfig';
import CustomCheckboxFilter from '../components/AgGridCustom/CustomCheckboxFilter';
import CustomHeader from '../components/AgGridCustom/CustomHeader';

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

    // Helper to download file
    const downloadFile = (path, filename) => {
        const url = getFileUrl(path);
        if (url) {
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            toast.error('File not found or URL is invalid.');
        }
    };

    // Placeholder for handleAccept and handleReject
    const handleAccept = async (id) => {
        const request = requests.find(req => req._id === id);
        if (request) {
            await handleStatusChange(request, 'Accepted');
        }
    };

    const handleReject = async (id) => {
        const request = requests.find(req => req._id === id);
        if (request) {
            await handleStatusChange(request, 'Rejected');
        }
    };

    const handleAllocateAsset = (request) => {
        toast.info(`Allocate asset for request ${request.mhRequestId}`);
        // Implement allocation logic here
    };

    // Use all requests without filtering
    const filteredRequests = requests || [];

    const columnDefs = React.useMemo(() => [
        createSerialNumberColumn(),
        {
            headerName: 'MH ID',
            field: 'mhRequestId',
            width: 150,
            pinned: 'left',
            cellClass: 'ag-cell-bold',
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'DEPT',
            field: 'departmentName',
            width: 140,
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'STATUS',
            field: 'status',
            width: 140,
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter,
            cellRenderer: (params) => {
                const statusColors = {
                    'Active': 'bg-blue-50 text-tvs-blue border-blue-200',
                    'Accepted': 'bg-green-50 text-green-700 border-green-200',
                    'Rejected': 'bg-red-50 text-red-700 border-red-200'
                };
                return (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border inline-block ${statusColors[params.value] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                        {params.value}
                    </span>
                );
            }
        },
        {
            headerName: 'LOCATION',
            field: 'location',
            width: 140,
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'PRODUCT',
            field: 'productModel',
            width: 180,
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'PART',
            field: 'handlingPartName',
            width: 180,
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'HANDLING LOC',
            field: 'materialHandlingLocation',
            width: 180,
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'FLOW',
            width: 170,
            valueGetter: (params) => `${params.data.from} → ${params.data.to}`,
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter,
            cellRenderer: (params) => (
                <div className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">{params.data.from}</span>
                    <ArrowRight size={14} className="text-gray-400" />
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded font-medium">{params.data.to}</span>
                </div>
            )
        },
        {
            headerName: 'PROBLEM',
            field: 'problemStatement',
            width: 230,
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'USER',
            field: 'userName',
            width: 150,
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'ATTACHMENTS',
            width: 100,
            cellRenderer: (params) => {
                const hasDrawing = params.data.drawingFile?.filename;
                return hasDrawing ? (
                    <button
                        onClick={() => downloadFile(params.data.drawingFile.path, params.data.drawingFile.filename)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                    >
                        <Paperclip size={14} />
                        <Download size={14} />
                    </button>
                ) : (
                    <span className="text-gray-400 text-xs">No file</span>
                );
            }
        },
        {
            headerName: 'ASSET ID',
            field: 'allocationAssetId',
            width: 140,
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter,
            cellRenderer: (params) => {
                return params.value ? (
                    <span className="px-2.5 py-1 bg-tvs-blue text-white rounded-lg font-bold text-xs inline-block">
                        {params.value}
                    </span>
                ) : (
                    <span className="text-gray-400 text-xs">Not Allocated</span>
                );
            }
        },
        {
            headerName: 'ACTIONS',
            width: 120,
            pinned: 'right',
            sortable: false,
            filter: false,
            cellRenderer: (params) => {
                const isPending = params.data.status === 'Active'; // Assuming 'Active' is the new 'Pending'
                const isRejected = params.data.status === 'Rejected';

                return (
                    <div className="flex gap-2">
                        {isPending && (
                            <>
                                <button
                                    onClick={() => handleAccept(params.data._id)}
                                    className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 border border-green-200"
                                    title="Accept Request"
                                >
                                    <Check size={16} />
                                </button>
                                <button
                                    onClick={() => handleReject(params.data._id)}
                                    className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200"
                                    title="Reject Request"
                                >
                                    <X size={16} />
                                </button>
                            </>
                        )}
                        {!isPending && !isRejected && (
                            <button
                                onClick={() => handleAllocateAsset(params.data)}
                                className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200 text-xs font-medium"
                            >
                                <Package size={14} />
                                Allocate
                            </button>
                        )}
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

            <div className="ag-theme-alpine w-full h-[600px]">
                <AgGridReact
                    theme="legacy"
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
