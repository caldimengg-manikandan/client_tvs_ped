import React, { useState, useEffect } from 'react';
import { Download, UserPlus, X, Check, Search, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAssetRequests, updateAssetRequest, sendEmailNotification } from '../redux/slices/assetRequestSlice';
import { fetchEmployees } from '../redux/slices/employeeSlice';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
        setSelectedRequest(request);
        setSelectedMembers([]);
        setIsModalOpen(true);
        // Fetch employees if not already loaded (or just fetch always to be fresh)
        if (employees.length === 0) {
            dispatch(fetchEmployees());
        }
    };

    const handleConfirmAssign = async () => {
        if (!selectedRequest || selectedMembers.length === 0) return;

        const result = await dispatch(sendEmailNotification({
            requestId: selectedRequest.assetRequestId,
            recipients: selectedMembers
        }));

        if (sendEmailNotification.fulfilled.match(result)) {
            toast.success('Email notifications sent successfully');
            setIsModalOpen(false);
        } else {
            toast.error(result.payload || 'Failed to send email notifications');
        }
    };

    const handleStatusChange = async (request, newStatus) => {
        const formData = {
            ...request,
            status: newStatus
        };
        // updateAssetRequest expects { id, formData }
        const result = await dispatch(updateAssetRequest({ id: request._id, formData }));

        if (updateAssetRequest.fulfilled.match(result)) {
            // State updates automatically via reducer
        } else {
            toast.error(result.payload || 'Failed to update status');
        }
    };

    // Helper to get file URL
    const getFileUrl = (path) => {
        if (!path) return null;
        return `${API_BASE_URL.replace('/api', '')}${path}`;
    };

    // Filter requests
    const filteredRequests = requests.filter(req => {
        const matchesSearch =
            req.assetRequestId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.handlingPartName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.userName?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
        const matchesCategory = categoryFilter === 'all' || req.category === categoryFilter;
        const matchesType = typeFilter === 'all' || req.requestType === typeFilter;

        return matchesSearch && matchesStatus && matchesCategory && matchesType;
    });

    return (
        <div className="bg-white rounded-lg shadow-sm border border-tvs-border overflow-hidden fade-in">
            <div className="flex justify-between items-center p-6 border-b border-tvs-border bg-gray-50">
                <h1 className="text-xl font-bold text-tvs-dark-gray m-0">Request Tracker</h1>
                <div className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                    Total Requests: {filteredRequests.length}
                </div>
            </div>

            {/* Search and Filters */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Search by ID, department, user..."
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
                            <option value="Active">Active</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                    </div>

                    <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-700">Category:</span>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Categories</option>
                            <option value="New Project">New Project</option>
                            <option value="Current Product Support">Current Product Support</option>
                        </select>
                    </div>

                    <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-gray-700">Type:</span>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Types</option>
                            <option value="New">New</option>
                            <option value="Modify">Modify</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">S.No</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Request ID</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Department</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Type</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Category</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Part Name</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Asset Location</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">User Name</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 text-center">Select Employee</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loadingRequests ? (
                            <tr>
                                <td colSpan="11" className="p-8 text-center text-gray-500 font-medium bg-gray-50">Loading requests...</td>
                            </tr>
                        ) : requests.length === 0 ? (
                            <tr>
                                <td colSpan="11" className="p-8 text-center text-gray-500 font-medium bg-gray-50">No requests found</td>
                            </tr>
                        ) : (
                            filteredRequests.map((req, index) => (
                                <tr key={req._id} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">{index + 1}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap"><strong>{req.assetRequestId}</strong></td>
                                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">{req.departmentName}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">{req.requestType}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">{req.category}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">
                                        <span className="font-medium">{req.handlingPartName}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">{req.assetNeededLocation}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">{req.userName}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">
                                        <div className="relative inline-block">
                                            <select
                                                value={req.status}
                                                onChange={(e) => handleStatusChange(req, e.target.value)}
                                                className={`px-3 py-1.5 pr-8 rounded-full text-xs font-semibold border outline-none cursor-pointer transition-colors appearance-none min-w-[110px] ${req.status === 'Accepted' ? 'bg-green-50 text-green-700 border-green-200 focus:border-green-400' :
                                                    req.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-200 focus:border-red-400' :
                                                        'bg-yellow-50 text-yellow-700 border-yellow-200 focus:border-yellow-400'
                                                    }`}
                                            >
                                                <option value="Active" disabled>Active</option>
                                                <option value="Accepted">Accepted</option>
                                                <option
                                                    value="Rejected"
                                                    disabled={req.progressStatus === 'Implementation' && req.allocationAssetId}
                                                    title={req.progressStatus === 'Implementation' && req.allocationAssetId ? "Cannot reject request after Asset ID is allocated and Implementation has started." : ""}
                                                >
                                                    Rejected
                                                </option>
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                                <svg className={`w-3 h-3 ${req.status === 'Accepted' ? 'text-green-700' :
                                                    req.status === 'Rejected' ? 'text-red-700' :
                                                        'text-yellow-700'
                                                    }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap text-center">
                                        <button
                                            onClick={() => req.status === 'Accepted' && handleAssignClick(req)}
                                            disabled={req.status !== 'Accepted'}
                                            className={`inline-flex items-center gap-1.5 px-4 py-1.5 border rounded-lg transition-all text-xs font-semibold uppercase tracking-wide
                                                ${req.status === 'Accepted'
                                                    ? 'bg-blue-50 text-tvs-blue border-blue-200 hover:bg-tvs-blue hover:!text-white hover:shadow-sm'
                                                    : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                }`}
                                            title={req.status !== 'Accepted' ? "Status must be 'Accepted' to select employee" : "Select employees to notify"}
                                        >
                                            <UserPlus size={14} />
                                            Select
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
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
                                Select employees to notify about Request <strong className="text-tvs-blue">{selectedRequest?.assetRequestId}</strong>
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
