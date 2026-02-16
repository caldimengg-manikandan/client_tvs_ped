import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Plus, Edit, Trash2, Mail, Filter, Download, Eye, Building, MapPin, Upload, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVendors, deleteVendor } from '../../redux/slices/vendorSlice';
import { Modal } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import * as XLSX from 'xlsx';
import { defaultColDef as globalDefaultColDef, defaultGridOptions, createSerialNumberColumn, createActionColumn, createBoldColumn } from '../../config/agGridConfig';
import CustomCheckboxFilter from '../../components/AgGridCustom/CustomCheckboxFilter';
import CustomHeader from '../../components/AgGridCustom/CustomHeader';

// AG Grid Modules are registered GLOBALLY in agGridConfig.js

const { confirm } = Modal;

const VendorMaster = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const gridRef = useRef();
    const fileInputRef = useRef();

    // Redux State
    const { items: vendors, loading, error } = useSelector((state) => state.vendors);

    const [viewingVendor, setViewingVendor] = useState(null);
    const [isViewModalVisible, setIsViewModalVisible] = useState(false);
    const [isImportModalVisible, setIsImportModalVisible] = useState(false);
    const [importData, setImportData] = useState([]);

    useEffect(() => {
        dispatch(fetchVendors());
    }, [dispatch]);

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

    // Use all vendors directly (filtering handled by AG Grid)
    const filteredVendors = vendors || [];

    const columnDefs = useMemo(() => [
        createSerialNumberColumn(),
        {
            ...createBoldColumn('vendorCode', 'VENDOR CODE', { width: 140 }),
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            ...createBoldColumn('vendorName', 'VENDOR NAME', { width: 220 }),
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'GSTIN',
            field: 'GSTIN',
            width: 160,
            valueFormatter: (params) => params.value ? params.value.toUpperCase() : '',
            cellStyle: { fontFamily: 'monospace', fontWeight: '600' },
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'LOCATION',
            field: 'vendorLocation',
            width: 160,
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'EMAIL',
            field: 'vendorMailId',
            width: 220,
            cellRenderer: (params) => (
                <a href={`mailto:${params.value}`} className="text-tvs-blue hover:underline font-medium">
                    {params.value}
                </a>
            ),
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'REMARKS',
            field: 'remarks',
            width: 200,
            valueGetter: (params) => params.value || 'No remarks',
            cellStyle: { color: '#6b7280', fontStyle: 'italic' },
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
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
        <div className="bg-gradient-to-br from-white to-gray-50/30 rounded-xl shadow-lg border border-gray-200/60 overflow-hidden fade-in">



            {/* AG Grid Table */}
            <div className="px-8 py-6">
                {/* Toolbar with Export */}
                <div className="mb-5 flex items-center justify-between bg-gradient-to-r from-white to-gray-50 px-6 py-4 rounded-xl border border-gray-200/80 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-bold text-gray-700">Showing <span className="text-emerald-700">{filteredVendors?.length || 0}</span> vendors</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDownloadTemplate}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg font-semibold text-sm transform hover:scale-105 active:scale-95"
                        >
                            <Download size={18} />
                            Template
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

                {/* Clean Minimalist AG Grid */}
                <div className="ag-theme-alpine w-full h-[620px]">
                    <AgGridReact
                        ref={gridRef}
                        theme="legacy"
                        rowData={filteredVendors}
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
                        <span className="px-2.5 py-1 bg-tvs-blue/10 text-tvs-blue rounded-lg font-bold">{filteredVendors?.length || 0}</span>
                        <span className="text-gray-600">of</span>
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg font-bold">{vendors?.length || 0}</span>
                        <span className="text-gray-600">vendors</span>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <Building size={16} className="text-blue-600" />
                        <span className="text-sm font-bold text-blue-700">
                            {vendors?.length || 0}
                        </span>
                        <span className="text-xs text-blue-600">total vendors</span>
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
                width={800}
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