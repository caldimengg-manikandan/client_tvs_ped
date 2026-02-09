import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Mail, User, Search, Filter, Download, RefreshCw, Eye, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEmployees, deleteEmployee } from '../../redux/slices/employeeSlice';
import { Modal } from 'antd';

const { confirm } = Modal;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const DEPT_API = API_BASE_URL + '/departments';

const EmployeeMaster = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Redux State
    const { items: employees, loading, error } = useSelector((state) => state.employees);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [accessFilter, setAccessFilter] = useState('all');
    const [selectedRows, setSelectedRows] = useState([]);
    const [viewingEmployee, setViewingEmployee] = useState(null);
    const [isViewModalVisible, setIsViewModalVisible] = useState(false);

    const [departments, setDepartments] = useState([]);
    const [showDeptModal, setShowDeptModal] = useState(false);
    const [newDeptName, setNewDeptName] = useState('');

    useEffect(() => {
        dispatch(fetchEmployees());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            toast.error(typeof error === 'string' ? error : 'An error occurred');
        }
    }, [error]);

    const handleEdit = (employee) => {
        navigate(`/employee-master/edit/${employee._id}`);
    };

    const handleView = (employee) => {
        setViewingEmployee(employee);
        setIsViewModalVisible(true);
    };

    const handleDelete = (id) => {
        confirm({
            title: 'Delete Employee',
            content: 'Are you sure you want to delete this employee?',
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            onOk: async () => {
                const result = await dispatch(deleteEmployee(id));
                if (deleteEmployee.fulfilled.match(result)) {
                    toast.success('Employee deleted successfully');
                    setSelectedRows(prev => prev.filter(rowId => rowId !== id));
                }
            }
        });
    };

    const handleBulkDelete = async () => {
        if (selectedRows.length === 0) {
            toast.error('Please select at least one employee to delete');
            return;
        }

        confirm({
            title: 'Bulk Delete',
            content: `Are you sure you want to delete ${selectedRows.length} employee(s)?`,
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            onOk: async () => {
                // Dispatch delete for all selected rows
                const deletePromises = selectedRows.map(id => dispatch(deleteEmployee(id)));
                await Promise.all(deletePromises);

                toast.success(`${selectedRows.length} employee(s) deleted/processed`);
                setSelectedRows([]);
            }
        });
    };

    const handleAddEmployee = () => {
        navigate('/employee-master/add');
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedRows(filteredEmployees.map(emp => emp._id));
        } else {
            setSelectedRows([]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedRows(prev =>
            prev.includes(id)
                ? prev.filter(rowId => rowId !== id)
                : [...prev, id]
        );
    };

    const handleExport = () => {
        toast.success('Export feature coming soon...');
    };

    // Filter employees
    const filteredEmployees = employees.filter(emp => {
        const matchesSearch =
            emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.mailId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.plantLocation?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
        const matchesAccess = accessFilter === 'all' || emp.accessLevel === accessFilter;

        return matchesSearch && matchesStatus && matchesAccess;
    });

    const getStatusClass = (status) => {
        const baseClass = "px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 border";
        switch (status?.toLowerCase()) {
            case 'active': return `${baseClass} bg-green-50 text-green-700 border-green-200`;
            case 'inactive': return `${baseClass} bg-yellow-50 text-yellow-700 border-yellow-200`;
            case 'suspended': return `${baseClass} bg-red-50 text-red-700 border-red-200`;
            default: return `${baseClass} bg-gray-50 text-gray-700 border-gray-200`;
        }
    };

    const getAccessLevelClass = (level) => {
        const baseClass = "px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 border";
        switch (level?.toLowerCase()) {
            case 'super admin': return `${baseClass} bg-purple-50 text-purple-700 border-purple-200`;
            case 'admin': return `${baseClass} bg-blue-50 text-blue-700 border-blue-200`;
            case 'manager': return `${baseClass} bg-indigo-50 text-indigo-700 border-indigo-200`;
            case 'employee': return `${baseClass} bg-green-50 text-green-700 border-green-200`;
            case 'viewer': return `${baseClass} bg-gray-50 text-gray-700 border-gray-200`;
            default: return `${baseClass} bg-gray-50 text-gray-700 border-gray-200`;
        }
    };

    const countPermissionCount = (permissions) => {
        if (!permissions) return 0;
        return Object.values(permissions).filter(Boolean).length;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'inactive': return 'bg-yellow-100 text-yellow-800';
            case 'suspended': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getAccessLevelColor = (level) => {
        switch (level?.toLowerCase()) {
            case 'super admin': return 'bg-purple-100 text-purple-800';
            case 'admin': return 'bg-blue-100 text-blue-800';
            case 'manager': return 'bg-indigo-100 text-indigo-800';
            case 'employee': return 'bg-green-100 text-green-800';
            case 'viewer': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-tvs-border overflow-hidden fade-in">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-tvs-border bg-gray-50">
                <h1 className="text-xl font-bold text-tvs-dark-gray m-0">Employee Master and Access</h1>
                <button
                    onClick={handleAddEmployee}
                    className="flex items-center bg-tvs-blue px-5 py-2.5 rounded-lg font-medium shadow-sm hover:bg-opacity-90 transform active:scale-95 transition-all cursor-pointer"
                    style={{ color: 'white' }}
                >
                    <Plus size={18} style={{ marginRight: '0.5rem' }} /> Add Employee
                </button>
            </div>

            {/* Filters */}
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
                            placeholder="Search by ID, name, department, or email..."
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
                            <option value="Inactive">Inactive</option>
                            <option value="Suspended">Suspended</option>
                        </select>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <Shield size={18} className="text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-700">Access:</span>
                        </div>
                        <select
                            value={accessFilter}
                            onChange={(e) => setAccessFilter(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Access Levels</option>
                            <option value="Super Admin">Super Admin</option>
                            <option value="Admin">Admin</option>
                            <option value="Manager">Manager</option>
                            <option value="Employee">Employee</option>
                            <option value="Viewer">Viewer</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        {selectedRows.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                disabled={loading}
                                className="px-4 py-2.5 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                            >
                                Delete Selected ({selectedRows.length})
                            </button>
                        )}

                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="w-12 px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                                <input
                                    type="checkbox"
                                    checked={filteredEmployees.length > 0 && selectedRows.length === filteredEmployees.length}
                                    onChange={handleSelectAll}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                            </th>
                            <th className="w-16 px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                                S.No
                            </th>
                            <th className="w-32 px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                                Employee ID
                            </th>
                            <th className="w-48 px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                                Employee Name
                            </th>
                            <th className="w-40 px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                                Department
                            </th>
                            <th className="w-32 px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                                Location
                            </th>
                            <th className="w-32 px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                                Access Level
                            </th>
                            <th className="w-48 px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                                Email
                            </th>
                            <th className="w-32 px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                                Permissions
                            </th>
                            <th className="w-24 px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                                Status
                            </th>
                            <th className="w-40 px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="11" className="p-8">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                        <p className="mt-2 text-gray-600">Loading employees...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredEmployees.length > 0 ? (
                            filteredEmployees.map((emp) => (
                                <tr
                                    key={emp._id}
                                    className={`hover:bg-blue-50/50 transition-colors ${selectedRows.includes(emp._id) ? 'bg-blue-50' : ''}`}
                                >
                                    <td className="px-4 py-4 border-b border-gray-100">
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.includes(emp._id)}
                                            onChange={() => handleSelectRow(emp._id)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">
                                        <strong>{emp.sNo}</strong>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap truncate">
                                        <strong>{emp.employeeId}</strong>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap truncate">
                                        {emp.employeeName}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap truncate">
                                        {emp.departmentName}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap truncate">
                                        {emp.plantLocation}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">
                                        <span className={getAccessLevelClass(emp.accessLevel)}>
                                            {emp.accessLevel}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap truncate">
                                        <a
                                            href={`mailto:${emp.mailId}`}
                                            className="text-tvs-blue hover:underline flex items-center gap-1"
                                        >
                                            <Mail size={14} /> {emp.mailId}
                                        </a>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <Shield size={14} className="text-gray-400" />
                                            <span className="font-medium">
                                                {countPermissionCount(emp.permissions)}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                /8 permissions
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">
                                        <span className={getStatusClass(emp.status)}>
                                            {emp.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleView(emp)}
                                                className="p-2 text-gray-400 hover:text-tvs-blue hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(emp)}
                                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all cursor-pointer"
                                                title="Edit Employee"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(emp._id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                                title="Delete Employee"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="11" className="p-8">
                                    <div className="text-center text-gray-500 font-medium bg-gray-50 rounded-lg py-8">
                                        {searchTerm || statusFilter !== 'all' || accessFilter !== 'all' ? (
                                            <div>
                                                <p>No employees found matching your criteria.</p>
                                                <button
                                                    onClick={() => {
                                                        setSearchTerm('');
                                                        setStatusFilter('all');
                                                        setAccessFilter('all');
                                                    }}
                                                    className="mt-2 text-tvs-blue hover:underline"
                                                >
                                                    Clear filters
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <p>No employees found.</p>
                                                <button
                                                    onClick={handleAddEmployee}
                                                    className="mt-2 text-tvs-blue hover:underline"
                                                >
                                                    Add your first employee
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="text-sm text-gray-600">
                        Showing <span className="font-semibold">{filteredEmployees.length}</span> of{' '}
                        <span className="font-semibold">{employees.length}</span> employees
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="text-sm text-gray-600">Active</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <span className="text-sm text-gray-600">Inactive</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span className="text-sm text-gray-600">Suspended</span>
                            </div>
                        </div>

                        <div className="text-sm text-gray-600">
                            Total permissions granted: <span className="font-semibold">
                                {employees.reduce((acc, emp) => acc + countPermissionCount(emp.permissions), 0)}
                            </span>
                        </div>
                    </div>

                    <div className="text-sm text-gray-600">
                        {selectedRows.length > 0 && (
                            <span className="font-semibold text-tvs-blue">
                                {selectedRows.length} selected
                            </span>
                        )}
                    </div>
                </div>
            </div>


            {/* View Employee Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <User size={20} className="text-tvs-blue" />
                        <span className="text-xl font-bold text-tvs-dark-gray">Employee Details</span>
                    </div>
                }
                open={isViewModalVisible}
                onCancel={() => {
                    setIsViewModalVisible(false);
                    setViewingEmployee(null);
                }}
                footer={null}
                width={800}
                centered
            >
                {viewingEmployee && (
                    <div className="py-6">
                        <div className="bg-white rounded-lg border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                                <Shield size={18} className="text-gray-400" />
                                Basic Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Employee ID</p>
                                    <p className="text-base font-bold text-gray-900">{viewingEmployee.employeeId}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Full Name</p>
                                    <p className="text-base font-bold text-gray-900">{viewingEmployee.employeeName}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Address</p>
                                    <p className="text-base font-bold text-gray-900 truncate" title={viewingEmployee.mailId}>{viewingEmployee.mailId}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Department</p>
                                    <p className="text-base font-bold text-gray-900">{viewingEmployee.departmentName || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Plant Location</p>
                                    <p className="text-base font-bold text-gray-900">{viewingEmployee.plantLocation || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Access Level</p>
                                    <div>
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getAccessLevelColor(viewingEmployee.accessLevel)}`}>
                                            {viewingEmployee.accessLevel}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</p>
                                    <div>
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(viewingEmployee.status)}`}>
                                            {viewingEmployee.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Created On</p>
                                    <p className="text-base font-bold text-gray-900">{formatDate(viewingEmployee.createdAt)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Last Updated</p>
                                    <p className="text-base font-bold text-gray-900">{formatDate(viewingEmployee.updatedAt)}</p>
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 mt-10 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                                <Shield size={18} className="text-gray-400" />
                                Permissions Summary
                            </h3>
                            <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between border border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-tvs-blue">
                                        <Shield size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">System Access Modules</p>
                                        <p className="text-xs text-gray-500">Current active permissions for this user</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-bold text-tvs-blue">
                                        {countPermissionCount(viewingEmployee.permissions)}
                                    </span>
                                    <span className="text-sm font-medium text-gray-400 ml-1">/ 8 granted</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div >
    );
};

export default EmployeeMaster;