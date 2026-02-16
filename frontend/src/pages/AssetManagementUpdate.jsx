import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { AgGridReact } from 'ag-grid-react';
import { Plus, Edit2, Trash2, Upload, FileText, X, Download } from 'lucide-react';
import { defaultColDef, defaultGridOptions, createSerialNumberColumn, createActionColumn } from '../config/agGridConfig';
import CustomCheckboxFilter from '../components/AgGridCustom/CustomCheckboxFilter';
import CustomHeader from '../components/AgGridCustom/CustomHeader';
import { useAuth } from '../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const AssetManagementUpdate = () => {
    const { user } = useAuth();
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [currentAsset, setCurrentAsset] = useState(null);
    const [vendors, setVendors] = useState([]);
    const [departments, setDepartments] = useState([]);

    const gridRef = useRef();

    // Form state
    const [formData, setFormData] = useState({
        vendorCode: '',
        vendorName: '',
        departmentName: '',
        plantLocation: '',
        assetLocation: '',
        assetName: ''
    });
    const [signOffDocument, setSignOffDocument] = useState(null);
    const [drawing, setDrawing] = useState(null);

    useEffect(() => {
        fetchAssets();
        fetchVendors();
        fetchDepartments();

        // Auto-fetch department from logged-in user if available
        if (user && user.departmentName) {
            setFormData(prev => ({ ...prev, departmentName: user.departmentName }));
        }
    }, []);

    const fetchAssets = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/asset-management`);
            setAssets(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching assets:', error);
            setLoading(false);
        }
    };

    const fetchVendors = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/asset-management/vendors/list`);
            setVendors(response.data);
        } catch (error) {
            console.error('Error fetching vendors:', error);
        }
    };

    const fetchDepartments = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/asset-management/departments/list`);
            setDepartments(response.data);
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const handleVendorChange = (vendorCode) => {
        const selectedVendor = vendors.find(v => v.vendorCode === vendorCode);
        if (selectedVendor) {
            setFormData(prev => ({
                ...prev,
                vendorCode: selectedVendor.vendorCode,
                vendorName: selectedVendor.vendorName,
                plantLocation: selectedVendor.location
            }));
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e, fileType) => {
        const file = e.target.files[0];
        if (fileType === 'signOffDocument') {
            setSignOffDocument(file);
        } else if (fileType === 'drawing') {
            setDrawing(file);
        }
    };

    const openAddModal = () => {
        setEditMode(false);
        setCurrentAsset(null);
        setFormData({
            vendorCode: '',
            vendorName: '',
            departmentName: user?.departmentName || '',
            plantLocation: '',
            assetLocation: '',
            assetName: ''
        });
        setSignOffDocument(null);
        setDrawing(null);
        setShowModal(true);
    };

    const openEditModal = (asset) => {
        setEditMode(true);
        setCurrentAsset(asset);
        setFormData({
            vendorCode: asset.vendorCode,
            vendorName: asset.vendorName,
            departmentName: asset.departmentName,
            plantLocation: asset.plantLocation,
            assetLocation: asset.assetLocation,
            assetName: asset.assetName
        });
        setSignOffDocument(null);
        setDrawing(null);
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formDataToSend = new FormData();
        Object.keys(formData).forEach(key => {
            formDataToSend.append(key, formData[key]);
        });

        if (signOffDocument) {
            formDataToSend.append('signOffDocument', signOffDocument);
        }
        if (drawing) {
            formDataToSend.append('drawing', drawing);
        }

        try {
            if (editMode) {
                await axios.put(`${API_BASE_URL}/api/asset-management/${currentAsset._id}`, formDataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                await axios.post(`${API_BASE_URL}/api/asset-management`, formDataToSend, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }

            fetchAssets();
            setShowModal(false);
        } catch (error) {
            console.error('Error saving asset:', error);
            alert(error.response?.data?.message || 'Error saving asset');
        }
    };

    const handleDelete = async (asset) => {
        if (!window.confirm(`Are you sure you want to delete ${asset.assetName}?`)) return;

        try {
            await axios.delete(`${API_BASE_URL}/api/asset-management/${asset._id}`);
            fetchAssets();
        } catch (error) {
            console.error('Error deleting asset:', error);
            alert('Error deleting asset');
        }
    };

    const handleDeleteFile = async (asset, fileType) => {
        if (!window.confirm(`Delete this ${fileType === 'signOffDocument' ? 'sign-off document' : 'drawing'}?`)) return;

        try {
            await axios.delete(`${API_BASE_URL}/api/asset-management/${asset._id}/file/${fileType}`);
            fetchAssets();
        } catch (error) {
            console.error('Error deleting file:', error);
            alert('Error deleting file');
        }
    };

    const downloadFile = (filePath, filename) => {
        window.open(`${API_BASE_URL}/${filePath}`, '_blank');
    };



    // File Renderer Component
    const FileRenderer = ({ data, fileType }) => {
        const file = data[fileType];
        const displayName = fileType === 'signOffDocument' ? 'Sign-off' : 'Drawing';

        if (!file || !file.filename) {
            return <span className="text-gray-400 text-xs">No file</span>;
        }

        return (
            <div className="flex items-center gap-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        downloadFile(file.path, file.filename);
                    }}
                    className="p-1 rounded hover:bg-blue-100 transition-colors"
                    title={`Download ${displayName}`}
                >
                    <Download size={14} className="text-blue-600" />
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(data, fileType);
                    }}
                    className="p-1 rounded hover:bg-red-100 transition-colors"
                    title={`Delete ${displayName}`}
                >
                    <Trash2 size={14} className="text-red-600" />
                </button>
                <span className="text-xs text-gray-600 truncate max-w-[100px]" title={file.filename}>
                    {file.filename}
                </span>
            </div>
        );
    };

    // Column Definitions
    const columnDefs = useMemo(() => [
        createSerialNumberColumn(),
        {
            headerName: 'ASSET ID',
            field: 'assetId',
            width: 120,
            cellClass: 'ag-cell-bold',
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'VENDOR NAME',
            field: 'vendorName',
            width: 180,
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'DEPARTMENT',
            field: 'departmentName',
            width: 150,
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'PLANT LOCATION',
            field: 'plantLocation',
            width: 150,
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'ASSET LOCATION',
            field: 'assetLocation',
            width: 150,
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'ASSET NAME',
            field: 'assetName',
            width: 180,
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'SIGN-OFF DOC',
            width: 180,
            sortable: false,
            filter: false,
            cellRenderer: (params) => {
                if (!params.data) return null;
                return <FileRenderer data={params.data} fileType="signOffDocument" />;
            }
        },
        {
            headerName: 'DRAWING',
            width: 180,
            sortable: false,
            filter: false,
            cellRenderer: (params) => {
                if (!params.data) return null;
                return <FileRenderer data={params.data} fileType="drawing" />;
            }
        },
        createActionColumn([
            {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
                title: 'Edit',
                className: 'p-1.5 rounded-lg hover:bg-blue-100 transition-colors text-blue-600',
                onClick: openEditModal
            },
            {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
                title: 'Delete',
                className: 'p-1.5 rounded-lg hover:bg-red-100 transition-colors text-red-600',
                onClick: handleDelete
            }
        ])
    ], []);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-tvs-border overflow-hidden fade-in">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-tvs-border bg-gray-50">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-bold text-gray-700">Total Assets: <span className="text-emerald-700">{assets.length}</span></span>
                    </div>
                </div>
                <div>
                    <button
                        onClick={openAddModal}
                        className="flex items-center gap-2 px-4 py-2.5 bg-tvs-blue text-white rounded-lg hover:bg-opacity-90 transition-all shadow-sm font-semibold"
                    >
                        <Plus size={18} />
                        Add Asset
                    </button>
                </div>
            </div>

            {/* AG Grid */}
            <div className="ag-theme-alpine w-full h-[600px]">
                <AgGridReact
                    ref={gridRef}
                    theme="legacy"
                    rowData={assets}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    {...defaultGridOptions}
                    loading={loading}
                />
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-modal">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editMode ? 'Edit Asset' : 'Add New Asset'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Vendor Selection */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Vendor <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.vendorCode}
                                        onChange={(e) => handleVendorChange(e.target.value)}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select Vendor</option>
                                        {vendors.map(vendor => (
                                            <option key={vendor.vendorCode} value={vendor.vendorCode}>
                                                {vendor.vendorName} ({vendor.vendorCode})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Department */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Department <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="departmentName"
                                        value={formData.departmentName}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                        required
                                        disabled={user?.departmentName} // Auto-filled, read-only
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(dept => (
                                            <option key={dept} value={dept}>{dept}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Plant Location (Auto-filled from Vendor) */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Plant Location <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="plantLocation"
                                        value={formData.plantLocation}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-gray-50"
                                        readOnly
                                        required
                                    />
                                </div>

                                {/* Asset Location */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Asset Location <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="assetLocation"
                                        value={formData.assetLocation}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter asset location"
                                        required
                                    />
                                </div>

                                {/* Asset Name */}
                                <div className="col-span-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Asset Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="assetName"
                                        value={formData.assetName}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter asset name"
                                        required
                                    />
                                </div>

                                {/* Sign-off Document */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Sign-off Document
                                        <span className="text-xs text-gray-500 ml-2">(PDF, Word)</span>
                                    </label>
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={(e) => handleFileChange(e, 'signOffDocument')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {editMode && currentAsset?.signOffDocument && (
                                        <div className="mt-2 text-xs text-gray-600">
                                            Current: {currentAsset.signOffDocument.filename}
                                        </div>
                                    )}
                                </div>

                                {/* Drawing */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Drawing
                                        <span className="text-xs text-gray-500 ml-2">(PNG, JPG, PDF, Word)</span>
                                    </label>
                                    <input
                                        type="file"
                                        accept=".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx"
                                        onChange={(e) => handleFileChange(e, 'drawing')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {editMode && currentAsset?.drawing && (
                                        <div className="mt-2 text-xs text-gray-600">
                                            Current: {currentAsset.drawing.filename}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-tvs-blue text-white rounded-lg hover:bg-opacity-90 transition-colors font-semibold shadow-sm"
                                >
                                    {editMode ? 'Update' : 'Create'} Asset
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssetManagementUpdate;
