import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { Plus, Edit, Trash2, Eye, Shield, User, Filter, Upload, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEmployees, deleteEmployee } from '../../redux/slices/employeeSlice';
import { Modal } from 'antd';
import 'react-data-grid/lib/styles.css';
import * as XLSX from 'xlsx';
import FreezeToolbar from '../../components/FreezeToolbar';
import FrozenRowsDataGrid from '../../components/FrozenRowsDataGrid';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';

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



    // Redux State
    const { items: employees, loading, error, totalItems, totalPages, currentPage: serverPage } = useSelector((state) => state.employees);

    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [accessFilter, setAccessFilter] = useState('all');
    const [columnFilters, setColumnFilters] = useState({});
    const [activeFilterKey, setActiveFilterKey] = useState(null);
    const [filterSearchText, setFilterSearchText] = useState({});
    const [viewingEmployee, setViewingEmployee] = useState(null);
    const [isViewModalVisible, setIsViewModalVisible] = useState(false);
    const [isImportModalVisible, setIsImportModalVisible] = useState(false);
    const [importData, setImportData] = useState([]);
    const [importFile, setImportFile] = useState(null);

    const [departments, setDepartments] = useState([]);
    const [showDeptModal, setShowDeptModal] = useState(false);
    const [newDeptName, setNewDeptName] = useState('');
    const [gridWidth, setGridWidth] = useState(0);
    const [frozenKeys, setFrozenKeys] = useState(new Set());
    const [frozenRowCount, setFrozenRowCount] = useState(0);

    const gridContainerRef = useRef(null);


    useEffect(() => {
        dispatch(fetchEmployees({ page, limit, search }));
    }, [dispatch, page, limit, search]);

    useEffect(() => {
        if (error) {
            toast.error(typeof error === 'string' ? error : 'An error occurred');
        }
    }, [error]);

    useEffect(() => {
        if (!gridContainerRef.current) return;
        const updateWidth = () => setGridWidth(gridContainerRef.current.clientWidth);
        updateWidth();
        const observer = new ResizeObserver(updateWidth);
        observer.observe(gridContainerRef.current);
        return () => observer.disconnect();
    }, []);

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

                // For preview: Validate and transform data
                const previewRows = jsonData.map((row) => ({
                    employeeId: row['Employee ID'] || row['employeeId'] || '',
                    employeeName: row['Employee Name'] || row['employeeName'] || '',
                    departmentName: row['Department'] || row['departmentName'] || '',
                    plantLocation: row['Location'] || row['plantLocation'] || '',
                    accessLevel: row['Access Level'] || row['accessLevel'] || 'Employee',
                    mailId: row['Email'] || row['mailId'] || '',
                    status: row['Status'] || row['status'] || 'Active'
                }));

                setImportData(previewRows);
                setImportFile(file); // Store the file for actual upload
                setIsImportModalVisible(true);
                toast.success(`${previewRows.length} employees previewed`);
            } catch (error) {
                console.error('Error parsing file:', error);
                toast.error('Error parsing file. Please check the format.');
            }
        };

        reader.readAsArrayBuffer(file);
        event.target.value = ''; // Reset file input
    };

    const handleConfirmImport = async () => {
        if (!importFile) return;

        const loadingToast = toast.loading('Importing employees...');
        try {
            const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '') + '/api';
            const token = localStorage.getItem('token');

            const formData = new FormData();
            formData.append('file', importFile);

            const response = await fetch(`${API_BASE_URL}/employees/bulk-upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                    // Content-Type is handled automatically by browser for FormData
                },
                body: formData
            });

            const result = await response.json();

            if (response.ok && result.success) {
                toast.success(result.message || 'Import successful!', { id: loadingToast });
                if (result.summary) {
                    const { successCount, errorCount } = result.summary;
                    toast(`Success: ${successCount}, Failed: ${errorCount}`, { icon: '📊' });
                }
                setIsImportModalVisible(false);
                setImportFile(null);
                setImportData([]);
                dispatch(fetchEmployees());
            } else {
                toast.error(result.message || 'Import failed', { id: loadingToast });
            }
        } catch (error) {
            console.error('Import error:', error);
            toast.error('Error connecting to server', { id: loadingToast });
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

    const handleSearch = useCallback((val) => {
        setSearch(val);
        setPage(1); // Reset to first page on new search
    }, []);

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

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

    const gridRows = useMemo(() => applyColumnFilters(employees || []).map((row, i) => ({ ...row, _serialNo: (page - 1) * limit + i + 1 })), [employees, page, limit, columnFilters]);

    const PlainHeaderCell = ({ column }) => (
        <div className="h-full w-full flex items-center px-4 text-white" style={{ backgroundColor: '#253C80' }}>
            <span className="font-bold text-[11px] leading-tight tracking-wide uppercase">{column.name}</span>
        </div>
    );

    const FilterHeaderCell = ({ column }) => {
        const key = column.key;
        const valuesSet = new Set();
        employees.forEach(row => { // Use 'employees' directly as filtering is server-side
            const value = row[key];
            const str = value == null ? '' : String(value);
            valuesSet.add(str);
        });
        const values = Array.from(valuesSet).sort((a, b) => a.localeCompare(b));

        const searchValue = filterSearchText[key] || '';
        const rawSelected = columnFilters[key];
        const selectedValues = rawSelected === undefined ? [] : rawSelected;

        const visibleValues = values.filter(v =>
            v.toLowerCase().includes(searchValue.toLowerCase())
        );

        const toggleValue = (value) => {
            const strValue = value;
            setColumnFilters(prev => {
                const base = prev[key] === undefined ? [] : prev[key];
                const exists = base.includes(strValue);
                const next = exists ? base.filter(v => v !== strValue) : [...base, strValue];
                const updated = { ...prev };

                if (next.length === 0) {
                    delete updated[key];
                } else {
                    updated[key] = next;
                }

                return updated;
            });
            setActiveFilterKey(null);
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
            <div className="relative h-full w-full flex items-center justify-between px-4 text-xs gap-1 text-white" style={{ backgroundColor: '#253C80' }}>
                <div className="flex-1 min-w-0">
                    <span className="font-bold text-[11px] leading-tight tracking-wide uppercase truncate">{column.name}</span>
                </div>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveFilterKey(prev => (prev === key ? null : key));
                    }}
                    className={`ml-1 p-1 rounded shrink-0 transition-colors ${hasFilter ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10'}`}
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
                                className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs text-gray-900 bg-white outline-none focus:ring-1 focus:ring-tvs-blue"
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
            name: 'S.NO',
            width: 80,
            frozen: true,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <span className="font-semibold text-gray-700">{row._serialNo}</span>
            )
        },
        {
            key: 'employeeId',
            name: 'EMPLOYEE ID',
            width: 140,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className="font-semibold text-gray-900">{row.employeeId}</span>
            )
        },
        {
            key: 'employeeName',
            name: 'EMPLOYEE NAME',
            width: 200,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className="font-semibold text-gray-900">{row.employeeName}</span>
            )
        },
        {
            key: 'departmentName',
            name: 'DEPARTMENT',
            width: 150,
            renderHeaderCell: FilterHeaderCell
        },
        {
            key: 'plantLocation',
            name: 'LOCATION',
            width: 140,
            renderHeaderCell: FilterHeaderCell
        },
        {
            key: 'accessLevel',
            name: 'ACCESS LEVEL',
            width: 150,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border inline-block ${getAccessLevelColor(row.accessLevel)}`}>
                    {row.accessLevel}
                </span>
            )
        },
        {
            key: 'mailId',
            name: 'EMAIL',
            width: 220,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <a href={`mailto:${row.mailId}`} className="text-tvs-blue hover:underline font-medium">
                    {row.mailId}
                </a>
            )
        },
        {
            key: 'status',
            name: 'STATUS',
            width: 130,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border inline-block ${getStatusColor(row.status)}`}>
                    {row.status}
                </span>
            )
        },
        {
            key: 'actions',
            name: 'ACTIONS',
            width: 150,
            sortable: false,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => handleView(row)}
                        className="p-1.5 text-gray-400 hover:text-tvs-blue hover:bg-blue-50 rounded-lg transition-all"
                        title="View Details"
                    >
                        <Eye size={16} />
                    </button>
                    <button
                        onClick={() => handleEdit(row)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                        title="Edit Employee"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={() => handleDelete(row._id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Employee"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

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

    const freezeColumnList = dataGridColumns
        .filter(col => col.key !== 'serial')
        .map(col => ({ key: col.key, name: col.name }));

    const autoFitColumns = useMemo(() => {
        const withFreeze = dataGridColumns.map(col => ({
            ...col,
            frozen: col.key === 'serial' || frozenKeys.has(col.key),
        }));
        if (!gridWidth) return withFreeze;
        const totalDefinedWidth = withFreeze.reduce((sum, column) => sum + (column.width || 0), 0);
        if (!totalDefinedWidth) return withFreeze;
        const scale = Math.max(gridWidth / totalDefinedWidth, 1);
        return withFreeze.map((column) => {
            if (!column.width) return column;
            const scaledWidth = Math.max(Math.floor(column.width * scale), column.width, 80);
            return { ...column, width: scaledWidth };
        });
    }, [dataGridColumns, gridWidth, frozenKeys]);


    const frozenRows = gridRows.slice(0, frozenRowCount);

    return (
        <div className="flex-1 flex flex-col h-full w-full bg-transparent fade-in">
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                {/* AG Grid Table */}
                <div className="px-6 py-4 flex flex-col gap-4">
                    {/* Toolbar with Export */}
                    <div className="flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r from-white to-gray-50 px-6 py-4 rounded-xl border border-gray-200/80 shadow-sm gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <SearchBar 
                            onSearch={handleSearch} 
                            placeholder="Search by name, ID, email..." 
                            className="w-full sm:w-72"
                        />
                    </div>
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                            <button
                                onClick={handleDownloadTemplate}
                                className="flex items-center justify-center p-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg font-semibold transform hover:scale-105 active:scale-95"
                                title="Download Template"
                            >
                                <Download size={20} />
                            </button>
                            <button
                                onClick={handleAddEmployee}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-tvs-blue to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg font-semibold text-sm transform hover:scale-105 active:scale-95"
                            >
                                <Plus size={16} />
                                Add Employee
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

                    {/* Freeze Toolbar */}
                    <FreezeToolbar
                        columns={freezeColumnList}
                        frozenKeys={frozenKeys}
                        onApply={setFrozenKeys}
                        frozenRowCount={frozenRowCount}
                        setFrozenRowCount={setFrozenRowCount}
                        maxRows={Math.min(gridRows.length, 50)}
                    />
                </div>

                <div className="flex-1 flex flex-col px-4 pb-4 md:px-6 md:pb-6 overflow-hidden">
                    <div ref={gridContainerRef} className="flex-1 w-full border border-gray-200 rounded-xl overflow-hidden bg-white relative min-h-[400px]">
                        <div className="h-full w-full absolute inset-0">
                            <FrozenRowsDataGrid
                                columns={autoFitColumns}
                                rows={gridRows}
                                rowKeyGetter={(row) => row._id || row.employeeId}
                                className="rdg-light employee-master-grid"
                                style={{ blockSize: '100%', width: '100%' }}
                                rowHeight={44}
                                headerRowHeight={52}
                                frozenRowCount={frozenRowCount}
                                defaultColumnOptions={{
                                    resizable: true
                                }}
                                loading={loading}
                            />
                        </div>
                    </div>
                </div>
            </div>
            {/* Footer */}
            <div className="px-8 py-5 border-t border-gray-200/80 bg-gradient-to-r from-gray-50/50 to-white mt-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <Pagination 
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        totalItems={totalItems}
                        itemsPerPage={limit}
                        loading={loading}
                    />
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
                width="95%"
                style={{ maxWidth: '1000px' }}
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
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${emp.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
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
                width="95%"
                style={{ maxWidth: '800px' }}
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