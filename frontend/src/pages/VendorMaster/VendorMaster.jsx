import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Plus, Edit, Trash2, Mail, Filter as FilterIcon, Download, Eye, Building, MapPin, Upload, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVendors, deleteVendor } from '../../redux/slices/vendorSlice';
import { Modal } from 'antd';
import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import FreezeToolbar from '../../components/FreezeToolbar';
import FrozenRowsDataGrid from '../../components/FrozenRowsDataGrid';
import SearchBar from '../../components/SearchBar';
import Pagination from '../../components/Pagination';
import * as XLSX from 'xlsx';
import { createActionColumn } from '../../config/agGridConfig';

const { confirm } = Modal;

const VendorMaster = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const fileInputRef = useRef();

    const { items: vendors, loading, error, totalItems, totalPages, currentPage } = useSelector((state) => state.vendors);

    const [page, setPage] = useState(1);
    const [limit] = useState(7);
    const [search, setSearch] = useState('');
    const [editingVendor, setEditingVendor] = useState(null);
    const [viewingVendor, setViewingVendor] = useState(null);
    const [isViewModalVisible, setIsViewModalVisible] = useState(false);
    const [isImportModalVisible, setIsImportModalVisible] = useState(false);
    const [importData, setImportData] = useState([]);
    const [columnFilters, setColumnFilters] = useState({});
    const [activeFilterKey, setActiveFilterKey] = useState(null);
    const [filterSearchText, setFilterSearchText] = useState({});
    const [gridWidth, setGridWidth] = useState(0);
    const [frozenKeys, setFrozenKeys] = useState(new Set());
    const [frozenRowCount, setFrozenRowCount] = useState(0);
    const gridContainerRef = useRef(null);

    useEffect(() => {
        dispatch(fetchVendors({ page, limit, search }));
    }, [dispatch, page, limit, search]);

    useEffect(() => {
        if (error) {
            toast.error(typeof error === 'string' ? error : 'An error occurred');
        }
    }, [error]);

    const handleEdit = (vendor) => {
        navigate(`/vendor-master/edit/${vendor._id}`);
    };

    const handleView = (vendor) => {
        setViewingVendor(vendor);
        setIsViewModalVisible(true);
    };

    const handleDelete = (id) => {
        confirm({
            title: 'Delete Vendor',
            content: 'Are you sure you want to delete this vendor?',
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            onOk: async () => {
                const result = await dispatch(deleteVendor(id));
                if (deleteVendor.fulfilled.match(result)) {
                    toast.success('Vendor deleted successfully');
                }
            }
        });
    };

    const handleAddVendor = () => {
        navigate('/vendor-master/add');
    };

    const handleSearch = useCallback((val) => {
        setSearch(val);
        setPage(1);
    }, []);

    const handlePageChange = (newPage) => {
        setPage(newPage);
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
                    vendorCode: row['Vendor Code'] || row['vendorCode'] || '',
                    vendorName: row['Vendor Name'] || row['vendorName'] || '',
                    GSTIN: row['GSTIN'] || row['gstin'] || '',
                    vendorLocation: row['Vendor Location'] || row['vendorLocation'] || '',
                    vendorMailId: row['Vendor Mail ID'] || row['vendorMailId'] || '',
                    remarks: row['Remarks'] || row['remarks'] || ''
                }));

                // Validate required fields
                const invalidRows = transformedData.filter(
                    (row, idx) => !row.vendorCode || !row.vendorName
                );

                if (invalidRows.length > 0) {
                    toast.error(`${invalidRows.length} rows have missing required fields (Vendor Code or Name)`);
                    return;
                }

                setImportData(transformedData);
                setIsImportModalVisible(true);
                toast.success(`${transformedData.length} vendors ready to import`);
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

            for (const vendor of importData) {
                try {
                    const response = await fetch(`${API_BASE_URL}/vendors`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(vendor)
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
            dispatch(fetchVendors());

            if (successCount > 0) {
                toast.success(`Successfully imported ${successCount} vendor(s)`);
            }
            if (errorCount > 0) {
                toast.error(`Failed to import ${errorCount} vendor(s)`);
            }
        } catch (error) {
            console.error('Import error:', error);
            toast.error('Error importing vendors');
        }
    };

    const handleDownloadTemplate = () => {
        const template = [
            {
                'Vendor Code': 'VEN001',
                'Vendor Name': 'ABC Suppliers Ltd',
                'GSTIN': '29ABCDE1234F1Z5',
                'Vendor Location': 'Bangalore',
                'Vendor Mail ID': 'contact@abcsuppliers.com',
                'Remarks': 'Preferred vendor'
            }
        ];

        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Vendor Template');
        XLSX.writeFile(wb, 'vendor_import_template.xlsx');
        toast.success('Template downloaded successfully');
    };

    const filteredVendors = vendors || [];

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

    const PlainHeaderCell = ({ column }) => (
        <div className="h-full w-full flex items-center px-4 text-white" style={{ backgroundColor: '#253C80' }}>
            <span className="font-bold text-[11px] leading-tight tracking-wide uppercase">{column.name}</span>
        </div>
    );

    const FilterHeaderCell = ({ column }) => {
        const key = column.key;
        const valuesSet = new Set();
        filteredVendors.forEach(row => {
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
                    <FilterIcon size={11} />
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

    const gridRows = useMemo(() => (vendors || []).map((row, i) => ({ ...row, _serialNo: (page - 1) * limit + i + 1 })), [vendors, page, limit]);

    const dataGridColumns = [
        {
            key: 'serial',
            name: 'S.NO',
            width: 80,
            frozen: true,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <span className="font-semibold text-gray-700">{((page - 1) * limit) + row._serialNo}</span>
            )
        },
        {
            key: 'vendorCode',
            name: 'VENDOR CODE',
            width: 160,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className="font-semibold text-gray-900">{row.vendorCode}</span>
            )
        },
        {
            key: 'vendorName',
            name: 'VENDOR NAME',
            width: 220,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className="font-semibold text-gray-900">{row.vendorName}</span>
            )
        },
        {
            key: 'GSTIN',
            name: 'GSTIN',
            width: 200,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className="font-mono font-semibold">
                    {row.GSTIN ? row.GSTIN.toUpperCase() : ''}
                </span>
            )
        },
        {
            key: 'vendorLocation',
            name: 'LOCATION',
            width: 180,
            renderHeaderCell: FilterHeaderCell
        },
        {
            key: 'vendorMailId',
            name: 'EMAIL',
            width: 240,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <a
                    href={`mailto:${row.vendorMailId}`}
                    className="text-tvs-blue hover:underline font-medium"
                >
                    {row.vendorMailId}
                </a>
            )
        },
        {
            key: 'remarks',
            name: 'REMARKS',
            width: 260,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className="text-gray-500 italic">
                    {row.remarks || 'No remarks'}
                </span>
            )
        },
        {
            key: 'actions',
            name: 'ACTIONS',
            width: 200,
            sortable: false,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => handleView(row)}
                        className="p-2 text-gray-400 hover:text-tvs-blue hover:bg-blue-50 rounded-lg transition-all"
                        title="View Details"
                    >
                        <Eye size={16} />
                    </button>
                    <button
                        onClick={() => handleEdit(row)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                        title="Edit Vendor"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={() => handleDelete(row._id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Vendor"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    const freezeColumnList = dataGridColumns
        .filter(col => col.key !== 'serial' && col.key !== 'actions')
        .map(col => ({ key: col.key, name: col.name }));

    const autoFitColumns = React.useMemo(() => {
        const withFreeze = dataGridColumns.map(col => ({
            ...col,
            frozen: col.key === 'serial' || frozenKeys.has(col.key),
        }));

        if (!gridWidth) return withFreeze;

        const totalDefinedWidth = withFreeze.reduce((sum, column) => {
            return sum + (column.width || 0);
        }, 0);

        if (!totalDefinedWidth) return withFreeze;

        const scale = Math.max(gridWidth / totalDefinedWidth, 1);

        return withFreeze.map((column) => {
            if (!column.width) return column;
            const scaledWidth = Math.max(Math.floor(column.width * scale), column.width, 80);

            return {
                ...column,
                width: scaledWidth
            };
        });
    }, [dataGridColumns, gridWidth, frozenKeys]);

    return (
        <div className="flex-1 flex flex-col h-full w-full bg-transparent fade-in">
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                {/* Toolbar with Export */}
                <div className="px-6 pt-4 pb-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <SearchBar 
                            onSearch={handleSearch} 
                            placeholder="Search by name, code, GSTIN..." 
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
                            onClick={handleAddVendor}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-tvs-blue to-blue-600 text-white rounded-xl hover:from-tvs-blue hover:to-blue-700 transition-all shadow-md hover:shadow-lg font-semibold text-sm transform hover:scale-105 active:scale-95"
                        >
                            <Plus size={18} /> Add Vendor
                        </button>
                        <button
                            onClick={handleImportClick}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-semibold text-sm transform hover:scale-105 active:scale-95"
                        >
                            <Upload size={18} />
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
                <div className="px-6 py-4">
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
                    <div
                        ref={gridContainerRef}
                        className="flex-1 w-full border border-gray-200 rounded-xl overflow-hidden bg-white relative min-h-[400px] shadow-sm"
                    >
                        <div className="h-full w-full absolute inset-0">
                            <FrozenRowsDataGrid
                                columns={autoFitColumns}
                                rows={gridRows}
                                rowKeyGetter={(row) => row._id || row.vendorCode}
                                className="rdg-light vendor-master-grid"
                                style={{ blockSize: '100%', width: '100%' }}
                                rowHeight={48}
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
                            📊 Ready to import <span className="text-blue-900 font-bold">{importData.length}</span> vendor(s)
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
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">Vendor Code</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">Vendor Name</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">GSTIN</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">Location</th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 border-b">Email</th>
                                </tr>
                            </thead>
                            <tbody>
                                {importData.map((vendor, index) => (
                                    <tr key={index} className="hover:bg-gray-50 border-b">
                                        <td className="px-3 py-2 text-gray-700">{index + 1}</td>
                                        <td className="px-3 py-2 text-gray-900 font-semibold">{vendor.vendorCode}</td>
                                        <td className="px-3 py-2 text-gray-900">{vendor.vendorName}</td>
                                        <td className="px-3 py-2 text-gray-700 font-mono">{vendor.GSTIN}</td>
                                        <td className="px-3 py-2 text-gray-700">{vendor.vendorLocation}</td>
                                        <td className="px-3 py-2 text-gray-700">{vendor.vendorMailId}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Modal>

            {/* View Vendor Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <Building size={20} className="text-tvs-blue" />
                        <span className="text-xl font-bold text-tvs-dark-gray">Vendor Details</span>
                    </div>
                }
                open={isViewModalVisible}
                onCancel={() => {
                    setIsViewModalVisible(false);
                    setViewingVendor(null);
                }}
                footer={null}
                width="95%"
                style={{ maxWidth: '800px' }}
                centered
            >
                {viewingVendor && (
                    <div className="py-6">
                        <div className="bg-white rounded-lg border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-100 flex items-center gap-2">
                                <FileText size={18} className="text-gray-400" />
                                Vendor Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-6">
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vendor Code</p>
                                    <p className="text-base font-bold text-gray-900">{viewingVendor.vendorCode}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vendor Name</p>
                                    <p className="text-base font-bold text-gray-900">{viewingVendor.vendorName}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">GSTIN</p>
                                    <p className="text-base font-bold text-gray-900 font-mono">{viewingVendor.GSTIN || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Location</p>
                                    <p className="text-base font-bold text-gray-900">{viewingVendor.vendorLocation || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Address</p>
                                    <p className="text-base font-bold text-gray-900 truncate" title={viewingVendor.vendorMailId}>{viewingVendor.vendorMailId || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Remarks</p>
                                    <p className="text-base font-bold text-gray-900">{viewingVendor.remarks || 'No remarks'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div >
    );
};

export default VendorMaster;
