import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Edit, Trash2, History, Search, Filter } from 'lucide-react';
import { fetchAssetRequests, deleteAssetRequest } from '../../redux/slices/assetRequestSlice';

import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal';
import { Modal as AntModal, message } from 'antd';

const { confirm } = AntModal;

const CreateAssetRequestList = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useAuth();
    const { items: requests, loading, error } = useSelector((state) => state.assetRequests);


    // Search and Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');

    // History Modal State
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [historyData, setHistoryData] = useState([]);
    const [selectedRequestTitle, setSelectedRequestTitle] = useState('');

    useEffect(() => {
        dispatch(fetchAssetRequests());

    }, [dispatch]);

    const handleEdit = (id) => {
        navigate(`/CreateAssetRequest/edit/${id}`);
    };

    const handleCreateRequest = () => {
        const errorMsg = "Please add the employee information first.";

        // If the user object from useAuth has employee data, they can proceed
        // The backend populates these fields if an employee record exists
        if (user && user.employeeId) {
            navigate('/CreateAssetRequest/add');
        } else {
            message.error(errorMsg, 2.5).then(() => {
                navigate('/employee-master/add');
            });
        }
    };

    const handleDelete = (id) => {
        confirm({
            title: 'Delete Request',
            content: 'Are you sure you want to delete this request?',
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            onOk: () => {
                dispatch(deleteAssetRequest(id));
            }
        });
    };

    const handleHistory = (req) => {
        const historyList = req.history?.map(h => ({
            label: new Date(h.date).toLocaleString(),
            value: `${h.action}: ${h.details || ''}`
        })) || [];
        setHistoryData(historyList.length > 0 ? historyList : [{ label: 'No History', value: '' }]);
        setSelectedRequestTitle(`History: ${req.assetRequestId}`);
        setHistoryModalOpen(true);
    };

    const getStatusClass = (status) => {
        const baseClass = "px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 border";
        switch (status.toLowerCase()) {
            case 'active': return `${baseClass} bg-green-50 text-green-700 border-green-200`;
            case 'new': return `${baseClass} bg-blue-50 text-blue-700 border-blue-200`;
            case 'pending': return `${baseClass} bg-yellow-50 text-yellow-700 border-yellow-200`;
            case 'rejected': return `${baseClass} bg-red-50 text-red-700 border-red-200`;
            default: return baseClass;
        }
    };

    // Filter requests
    const filteredRequests = Array.isArray(requests) ? requests.filter(req => {
        const matchesSearch =
            req.assetRequestId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.requestType?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || req.status === statusFilter;
        const matchesCategory = categoryFilter === 'all' || req.category === categoryFilter;
        const matchesType = typeFilter === 'all' || req.requestType === typeFilter;

        return matchesSearch && matchesStatus && matchesCategory && matchesType;
    }) : [];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-tvs-border overflow-hidden fade-in">
            <div className="flex justify-between items-center p-6 border-b border-tvs-border bg-gray-50">
                <h1 className="text-xl font-bold text-tvs-dark-gray m-0">Asset Requests</h1>
                <button
                    onClick={handleCreateRequest}
                    className="flex items-center bg-tvs-blue px-5 py-2.5 rounded-lg font-medium shadow-sm hover:bg-opacity-90 transform active:scale-95 transition-all cursor-pointer"
                    style={{ color: 'white' }}
                >
                    <Plus size={18} style={{ marginRight: '0.5rem' }} /> Create Request
                </button>
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
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Request ID</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Department</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Location</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Category</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Type</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">PO Price</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Array.isArray(filteredRequests) && filteredRequests.length > 0 ? (
                            filteredRequests.map((req) => (
                                <tr key={req._id} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap"><strong>{req.assetRequestId}</strong></td>
                                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">{req.departmentName}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">{req.location}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">{req.category}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">{req.requestType}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">
                                        <span className="font-medium text-gray-900">
                                            {req.poPrice ? `₹ ${req.poPrice.toLocaleString()}` : '-'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">
                                        <div className="flex gap-2">
                                            <button
                                                className="p-2 text-gray-400 hover:text-tvs-blue hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                                                onClick={() => handleHistory(req)}
                                                title="View History"
                                            >
                                                <History size={18} />
                                            </button>
                                            <button
                                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all cursor-pointer"
                                                onClick={() => handleEdit(req._id)}
                                                title="Edit Request"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                                onClick={() => handleDelete(req._id)}
                                                title="Delete Request"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7">
                                    <div className="p-8 text-center text-gray-500 font-medium bg-gray-50">No active asset requests found.</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={historyModalOpen}
                onClose={() => setHistoryModalOpen(false)}
                title={selectedRequestTitle}
                data={historyData}
            />
        </div>
    );
};

export default CreateAssetRequestList;
