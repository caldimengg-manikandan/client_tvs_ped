import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Plus, Edit, Trash2, Mail, User, Search, Filter, Download, RefreshCw, Eye, Shield, FileText, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEmployees, deleteEmployee } from '../../redux/slices/employeeSlice';
import { Modal } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import * as XLSX from 'xlsx';
import { defaultColDef as globalDefaultColDef, defaultGridOptions, createSerialNumberColumn, createActionColumn, createStatusColumn, createBoldColumn } from '../../config/agGridConfig';

// AG Grid Modules are registered GLOBALLY in agGridConfig.js

const { confirm } = Modal;


const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '') + '/api';
const DEPT_API = API_BASE_URL + '/departments';

const EmployeeMaster = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const gridRef = useRef();
    const fileInputRef = useRef();

    // Helper Functions for Employee Display
    const getAccessLevelColor = (level) => {
        switch (level?.toLowerCase()) {
            case 'super admin': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'admin': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'manager': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'employee': return 'bg-green-100 text-green-700 border-green-200';
            case 'viewer': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Inactive': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Suspended': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-600 border-gray-200';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const countPermissionCount = (permissions) => {
        if (!permissions) return 0;
        return Object.values(permissions).filter(val => val === true).length;
    };

    // Redux State
    const { items: employees, loading, error } = useSelector((state) => state.employees);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [accessFilter, setAccessFilter] = useState('all');
    const [viewingEmployee, setViewingEmployee] = useState(null);
    const [isViewModalVisible, setIsViewModalVisible] = useState(false);
    const [isImportModalVisible, setIsImportModalVisible] = useState(false);
    const [importData, setImportData] = useState([]);

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
                }
            }
        });
    };



    const handleAddEmployee = () => {
        navigate('/employee-master/add');
    };

    const handleRefresh = () => {
        dispatch(fetchEmployees());
        toast.success('Refreshing data...');
    };


    const handleExport = () => {
        toast.success('Export feature coming soon...');
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                // Validate and transform data
                const transformedData = jsonData.map((row, index) => ({
                    employeeId: row['Employee ID'] || row['employeeId'] || '',
                    employeeName: row['Employee Name'] || row['employeeName'] || '',
                    departmentName: row['Department'] || row['departmentName'] || '',
                    plantLocation: row['Location'] || row['plantLocation'] || '',
                    accessLevel: row['Access Level'] || row['accessLevel'] || 'Employee',
                    mailId: row['Email'] || row['mailId'] || '',
                    status: row['Status'] || row['status'] || 'Active',
                    password: row['Password'] || row['password'] || 'default123',
                    permissions: {
                        dashboard: row['Dashboard'] === 'Yes' || row['Dashboard'] === true || false,
                        assetRequest: row['Asset Request'] === 'Yes' || row['Asset Request'] === true || false,
                        requestTracker: row['Request Tracker'] === 'Yes' || row['Request Tracker'] === true || false,
                        assetSummary: row['Asset Summary'] === 'Yes' || row['Asset Summary'] === true || false,
                        employeeMaster: row['Employee Master'] === 'Yes' || row['Employee Master'] === true || false,
                        vendorMaster: row['Vendor Master'] === 'Yes' || row['Vendor Master'] === true || false,
                        settings: row['Settings'] === 'Yes' || row['Settings'] === true || false,
                        reports: row['Reports'] === 'Yes' || row['Reports'] === true || false
                    }
                }));

                // Validate required fields
                const invalidRows = transformedData.filter(
                    (row, idx) => !row.employeeId || !row.employeeName || !row.mailId
                );

                if (invalidRows.length > 0) {
                    toast.error(`${invalidRows.length} rows have missing required fields (Employee ID, Name, or Email)`);
                    return;
                }

                setImportData(transformedData);
                setIsImportModalVisible(true);
                toast.success(`${transformedData.length} employees ready to import`);
            } catch (error) {
                console.error('Error parsing file:', error);
                toast.error('Error parsing file. Please check the format.');
            }
        };

        reader.readAsArrayBuffer(file);
        event.target.value = ''; // Reset file input
    };

    const handleConfirmImport = async () => {
        try {
            const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '') + '/api';
            const token = localStorage.getItem('token');

            let successCount = 0;
            let errorCount = 0;

            for (const employee of importData) {
                try {
                    const response = await fetch(`${API_BASE_URL}/employees`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(employee)
                    });

                    if (response.ok) {
                        successCount++;
                    } else {
                        errorCount++;
                    }
                } catch (err) {
                    errorCount++;
                }
            }

            setIsImportModalVisible(false);
            setImportData([]);
            dispatch(fetchEmployees());

            if (successCount > 0) {
                toast.success(`Successfully imported ${successCount} employee(s)`);
            }
            if (errorCount > 0) {
                toast.error(`Failed to import ${errorCount} employee(s)`);
            }
        } catch (error) {
            console.error('Import error:', error);
            toast.error('Error importing employees');
        }
    };

    const handleDownloadTemplate = () => {
        const template = [
            {
                'Employee ID': 'EMP001',
                'Employee Name': 'John Doe',
                'Department': 'Engineering',
                'Location': 'Plant A',
                'Access Level': 'Employee',
                'Email': 'john.doe@example.com',
                'Status': 'Active',
                'Password': 'default123',
                'Dashboard': 'Yes',
                'Asset Request': 'Yes',
                'Request Tracker': 'Yes',
                'Asset Summary': 'No',
                'Employee Master': 'No',
                'Vendor Master': 'No',
                'Settings': 'No',
                'Reports': 'No'
            }
        ];

        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Employee Template');
        XLSX.writeFile(wb, 'employee_import_template.xlsx');
        toast.success('Template downloaded successfully');
    };

    // Filter employees with safety check
    const filteredEmployees = (employees || []).filter(emp => {
        const matchesSearch =
            String(emp.employeeId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(emp.employeeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(emp.departmentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(emp.mailId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(emp.plantLocation || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
        const matchesAccess = accessFilter === 'all' || emp.accessLevel === accessFilter;

        return matchesSearch && matchesStatus && matchesAccess;
    });

    const columnDefs = React.useMemo(() => [
        createSerialNumberColumn(),
        createBoldColumn('employeeId', 'EMPLOYEE ID', { width: 140 }),
        createBoldColumn('employeeName', 'EMPLOYEE NAME', { width: 200 }),
        { 
            field: 'departmentName', 
            headerName: 'DEPARTMENT', 
            width: 150 
        },
        { 
            field: 'plantLocation', 
            headerName: 'LOCATION', 
            width: 140 
        },
        {
            field: 'accessLevel',
            headerName: 'ACCESS LEVEL',
            width: 150,
            cellRenderer: (params) => {
                const level = params.value;
                const baseClass = "px-3 py-1 rounded-full text-[10px] font-black uppercase border inline-block";
                let colorClass = "bg-gray-50 text-gray-700 border-gray-200";
                
                switch (level?.toLowerCase()) {
                    case 'super admin': colorClass = "bg-purple-50 text-purple-700 border-purple-200"; break;
                    case 'admin': colorClass = "bg-blue-50 text-blue-700 border-blue-200"; break;
                    case 'manager': colorClass = "bg-indigo-50 text-indigo-700 border-indigo-200"; break;
                    case 'employee': colorClass = "bg-green-50 text-green-700 border-green-200"; break;
                    case 'viewer': colorClass = "bg-gray-50 text-gray-600 border-gray-200"; break;
                }
                
                return <span className={`${baseClass} ${colorClass}`}>{level}</span>;
            }
        },
        { 
            field: 'mailId', 
            headerName: 'EMAIL', 
            width: 220,
            cellRenderer: (params) => (
                <a href={`mailto:${params.value}`} className="text-tvs-blue hover:underline font-medium">
                    {params.value}
                </a>
            )
        },
        createStatusColumn('status', 'STATUS'),
        createActionColumn([
            {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>',
                title: 'View Details',
                className: 'p-2 text-gray-400 hover:text-tvs-blue hover:bg-blue-50 rounded-lg transition-all',
                onClick: (data) => handleView(data)
            },
            {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>',
                title: 'Edit Employee',
                className: 'p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all',
                onClick: (data) => handleEdit(data)
            },
            {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>',
                title: 'Delete Employee',
                className: 'p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all',
                onClick: (data) => handleDelete(data._id)
            }
        ])
    ], []);

    return (
        <div className="bg-gradient-to-br from-white to-gray-50/30 rounded-xl shadow-lg border border-gray-200/60 overflow-hidden fade-in">
            {/* Header */}
            <div className="flex justify-between items-center px-8 py-6 border-b border-gray-200/80 bg-gradient-to-r from-white via-gray-50/50 to-white">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-tvs-blue to-blue-600 rounded-xl shadow-md">
                            <User size={22} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-tvs-dark-gray m-0 tracking-tight">Employee Master</h1>
                            <p className="text-sm text-gray-500 mt-0.5">Manage employee access and permissions</p>
                        </div>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="ml-2 p-2.5 text-gray-400 hover:text-tvs-blue hover:bg-white rounded-xl transition-all shadow-sm border border-gray-200 hover:border-tvs-blue hover:shadow-md"
                        title="Refresh List"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
                <button
                    onClick={handleAddEmployee}
                    className="flex items-center gap-2 bg-gradient-to-r from-tvs-blue to-blue-600 px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus size={20} /> Add Employee
                </button>
            </div>

            {/* Filters */}
            <div className="px-8 py-6 border-b border-gray-200/80 bg-gradient-to-r from-gray-50/50 to-white">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative md:col-span-1">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-tvs-blue focus:border-transparent shadow-sm hover:shadow-md transition-all"
                            placeholder="Search employees..."
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200">
                            <Filter size={16} className="text-gray-500" />
                            <span className="text-sm font-semibold text-gray-600">Status:</span>
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-tvs-blue focus:border-transparent shadow-sm hover:shadow-md transition-all font-medium"
                        >
                            <option value="all">All Status</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                            <option value="Suspended">Suspended</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200">
                            <Shield size={16} className="text-gray-500" />
                            <span className="text-sm font-semibold text-gray-600">Access:</span>
                        </div>
                        <select
                            value={accessFilter}
                            onChange={(e) => setAccessFilter(e.target.value)}
                            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-tvs-blue focus:border-transparent shadow-sm hover:shadow-md transition-all font-medium"
                        >
                            <option value="all">All Levels</option>
                            <option value="Super Admin">Super Admin</option>
                            <option value="Admin">Admin</option>
                            <option value="Manager">Manager</option>
                            <option value="Employee">Employee</option>
                            <option value="Viewer">Viewer</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* AG Grid Table */}
            <div className="px-8 py-6">
                {/* Toolbar with Export */}
                <div className="mb-5 flex items-center justify-between bg-gradient-to-r from-white to-gray-50 px-6 py-4 rounded-xl border border-gray-200/80 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-bold text-gray-700">Showing <span className="text-emerald-700">{filteredEmployees?.length || 0}</span> employees</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDownloadTemplate}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg font-semibold text-sm transform hover:scale-105 active:scale-95"
                        >
                            <Download size={16} />
                            Template
                        </button>
                        <button
                            onClick={handleImportClick}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-semibold text-sm transform hover:scale-105 active:scale-95"
                        >
                            <Upload size={16} />
                            Import Excel
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileUpload}
                            style={{ display: 'none' }}
                        />
                    </div>
                </div>

                {/* Clean Minimalist AG Grid */}
                <div className="ag-theme-alpine w-full h-[620px]">
                    <AgGridReact
                        ref={gridRef}
                        rowData={filteredEmployees}
                        columnDefs={columnDefs}
                        defaultColDef={globalDefaultColDef}
                        {...defaultGridOptions}
                        loading={loading}
                    />
                </div>
            </div>



            {/* Footer */}
            <div className="px-8 py-5 border-t border-gray-200/80 bg-gradient-to-r from-gray-50/50 to-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">Showing</span>
                        <span className="px-2.5 py-1 bg-tvs-blue/10 text-tvs-blue rounded-lg font-bold">{filteredEmployees?.length || 0}</span>
                        <span className="text-gray-600">of</span>
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg font-bold">{employees?.length || 0}</span>
                        <span className="text-gray-600">employees</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                <span className="text-xs font-semibold text-green-700">Active</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                                <span className="text-xs font-semibold text-yellow-700">Inactive</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg border border-red-200">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                                <span className="text-xs font-semibold text-red-700">Suspended</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                            <Shield size={16} className="text-purple-600" />
                            <span className="text-sm font-bold text-purple-700">
                                {(employees || []).reduce((acc, emp) => acc + countPermissionCount(emp.permissions), 0)}
                            </span>
                            <span className="text-xs text-purple-600">permissions</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Import Preview Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <Upload size={20} className="text-emerald-600" />
                        <span className="text-xl font-bold text-gray-900">Import Preview</span>
                    </div>
                }
                open={isImportModalVisible}
                onCancel={() => {
                    setIsImportModalVisible(false);
                    setImportData([]);
                }}
                onOk={handleConfirmImport}
                okText="Confirm Import"
                cancelText="Cancel"
                width={1000}
                centered
                okButtonProps={{
                    className: 'bg-emerald-600 hover:bg-emerald-700'
                }}
            >
                <div className="py-4">
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800 font-semibold">
                            📊 Ready to import <span className="text-blue-900 font-bold">{importData.length}</span> employee(s)
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                            Review the data below and click "Confirm Import" to proceed.
                        </p>
                    </div>

                    <div className="max-h-96 overflow-auto border border-gray-200 rounded-lg">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">#</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">Employee ID</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">Name</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">Email</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">Department</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">Access Level</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {importData.map((emp, index) => (
                                    <tr key={index} className="hover:bg-gray-50 border-b">
                                        <td className="px-3 py-2 text-gray-700">{index + 1}</td>
                                        <td className="px-3 py-2 text-gray-900 font-semibold">{emp.employeeId}</td>
                                        <td className="px-3 py-2 text-gray-900">{emp.employeeName}</td>
                                        <td className="px-3 py-2 text-gray-700">{emp.mailId}</td>
                                        <td className="px-3 py-2 text-gray-700">{emp.departmentName}</td>
                                        <td className="px-3 py-2 text-gray-700">{emp.accessLevel}</td>
                                        <td className="px-3 py-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                emp.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                                {emp.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Modal>

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