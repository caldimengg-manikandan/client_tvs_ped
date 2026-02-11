import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Mail, Search, Filter, Download, RefreshCw, Eye, Building, MapPin, Hash } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVendors, deleteVendor } from '../../redux/slices/vendorSlice';
import { Modal } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import { defaultColDef, defaultGridOptions, createSerialNumberColumn, createActionColumn, createBoldColumn } from '../../config/agGridConfig';

// AG Grid Modules are registered GLOBALLY in agGridConfig.js

const { confirm } = Modal;


const VendorMaster = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const gridRef = React.useRef();

    // Redux State
    const { items: vendors, loading, error } = useSelector((state) => state.vendors);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRows, setSelectedRows] = useState([]);

    useEffect(() => {
        dispatch(fetchVendors());
    }, [dispatch]);

    // Handle Redux Error
    useEffect(() => {
        if (error) {
            toast.error(typeof error === 'string' ? error : 'An error occurred');
        }
    }, [error]);

    const handleEdit = (vendor) => {
        navigate(`/vendor-master/edit/${vendor._id}`);
    };

    const handleView = (vendor) => {
        navigate(`/vendor-master/view/${vendor._id}`);
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
                    setSelectedRows(prev => prev.filter(rowId => rowId !== id));
                }
            }
        });
    };

    const handleBulkDelete = async () => {
        if (selectedRows.length === 0) {
            toast.error('Please select at least one vendor to delete');
            return;
        }

        confirm({
            title: 'Bulk Delete',
            content: `Are you sure you want to delete ${selectedRows.length} vendor(s)?`,
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            onOk: async () => {
                // Dispatch delete for all selected rows
                const deletePromises = selectedRows.map(id => dispatch(deleteVendor(id)));
                await Promise.all(deletePromises);

                toast.success(`${selectedRows.length} vendor(s) deleted/processed`);
                setSelectedRows([]);
            }
        });
    };

    const handleAddVendor = () => {
        navigate('/vendor-master/add');
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedRows(filteredVendors.map(vendor => vendor._id));
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

    // Filter vendors with safety check
    const filteredVendors = (vendors || []).filter(vendor => {
        const matchesSearch =
            String(vendor.vendorCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(vendor.vendorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(vendor.GSTIN || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(vendor.vendorLocation || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(vendor.vendorMailId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(vendor.remarks || '').toLowerCase().includes(searchTerm.toLowerCase());

        return matchesSearch;
    });

    const columnDefs = React.useMemo(() => [
        createSerialNumberColumn(),
        createBoldColumn('vendorCode', 'VENDOR CODE', { width: 140 }),
        createBoldColumn('vendorName', 'VENDOR NAME', { width: 220 }),
        { 
            headerName: 'GSTIN', 
            field: 'GSTIN', 
            width: 160,
            valueFormatter: (params) => params.value ? params.value.toUpperCase() : '',
            cellStyle: { fontFamily: 'monospace' }
        },
        { headerName: 'LOCATION', field: 'vendorLocation', width: 160 },
        { 
            headerName: 'EMAIL', 
            field: 'vendorMailId', 
            width: 220,
            cellRenderer: (params) => (
                <a href={`mailto:${params.value}`} className="text-tvs-blue hover:underline">
                    {params.value}
                </a>
            )
        },
        { 
            headerName: 'REMARKS', 
            field: 'remarks', 
            width: 200,
            valueGetter: (params) => params.value || 'No remarks',
            cellStyle: { color: '#6b7280', fontStyle: 'italic' }
        },
        createActionColumn([
            {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/></svg>',
                title: 'View Details',
                className: 'p-2 text-gray-400 hover:text-tvs-blue hover:bg-blue-50 rounded-lg transition-all',
                onClick: (data) => handleView(data)
            },
            {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>',
                title: 'Edit Vendor',
                className: 'p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all',
                onClick: (data) => handleEdit(data)
            },
            {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>',
                title: 'Delete Vendor',
                className: 'p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all',
                onClick: (data) => handleDelete(data._id)
            }
        ])
    ], []);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-tvs-border overflow-hidden fade-in">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-tvs-border bg-gray-50">
                <h1 className="text-xl font-bold text-tvs-dark-gray m-0">Vendor Master</h1>
                <button
                    onClick={handleAddVendor}
                    className="flex items-center bg-tvs-blue px-5 py-2.5 rounded-lg font-medium shadow-sm hover:bg-opacity-90 transform active:scale-95 transition-all cursor-pointer"
                    style={{ color: 'white' }}
                >
                    <Plus size={18} style={{ marginRight: '0.5rem' }} /> Add Vendor
                </button>
            </div>

            {/* Filters */}
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
                            placeholder="Search by code, name, GSTIN, location..."
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2 md:col-span-2">
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

            <div className="ag-theme-alpine w-full h-[600px]">
                <AgGridReact
                    ref={gridRef}
                    rowData={filteredVendors}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    {...defaultGridOptions}
                    loading={loading}
                    onSelectionChanged={(event) => {
                        const selectedNodes = event.api.getSelectedNodes();
                        const selectedIds = selectedNodes.map(node => node.data._id);
                        setSelectedRows(selectedIds);
                    }}
                />
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="text-sm text-gray-600">
                        Showing <span className="font-semibold">{filteredVendors?.length || 0}</span> of{' '}
                        <span className="font-semibold">{vendors?.length || 0}</span> vendors
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
        </div>
    );
};

export default VendorMaster;