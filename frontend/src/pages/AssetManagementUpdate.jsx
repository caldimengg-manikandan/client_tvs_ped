import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Upload, FileText, X, Download, Filter } from 'lucide-react';
import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
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
    const [columnFilters, setColumnFilters] = useState({});
    const [activeFilterKey, setActiveFilterKey] = useState(null);
    const [filterSearchText, setFilterSearchText] = useState({});
    const [gridWidth, setGridWidth] = useState(0);

    const gridContainerRef = useRef(null);

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

    const baseRows = assets || [];

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

    const gridRows = applyColumnFilters(baseRows);

    const FilterHeaderCell = ({ column }) => {
        const key = column.key;
        const valuesSet = new Set();
        baseRows.forEach(row => {
            const value = row[key];
            const str = value == null ? '' : String(value);
            valuesSet.add(str);
        });
        const values = Array.from(valuesSet).sort((a, b) => a.localeCompare(b));

        const searchValue = filterSearchText[key] || '';
        const rawSelected = columnFilters[key];
        const selectedValues = rawSelected === undefined ? values : rawSelected;

        const visibleValues = values.filter(v =>
            v.toLowerCase().includes(searchValue.toLowerCase())
        );

        const toggleValue = (value) => {
            const strValue = value;
            setColumnFilters(prev => {
                const base = prev[key] === undefined ? values : prev[key];
                const exists = base.includes(strValue);
                const next = exists ? base.filter(v => v !== strValue) : [...base, strValue];
                const updated = { ...prev };

                if (next.length === values.length) {
                    delete updated[key];
                } else {
                    updated[key] = next;
                }

                return updated;
            });
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
            <div className="relative h-full flex items-center justify-between px-2 text-xs gap-1 text-white">
                <div className="flex-1 min-w-0">
                    <span className="font-semibold truncate">{column.name}</span>
                </div>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveFilterKey(prev => (prev === key ? null : key));
                    }}
                    className={`ml-1 p-0.5 rounded shrink-0 ${hasFilter ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/10'}`}
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
                                className="w-full border border-gray-200 rounded px-1.5 py-1 text-[10px] outline-none focus:ring-1 focus:ring-tvs-blue"
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
            name: 'Sno',
            width: 70,
            frozen: true,
            renderCell: ({ rowIdx }) => (
                <span className="font-semibold text-gray-700">{rowIdx + 1}</span>
            )
        },
        {
            key: 'assetId',
            name: 'ASSET ID',
            width: 120,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className="font-semibold text-gray-900">{row.assetId}</span>
            )
        },
        {
            key: 'vendorName',
            name: 'VENDOR NAME',
            width: 180,
            renderHeaderCell: FilterHeaderCell
        },
        {
            key: 'departmentName',
            name: 'DEPARTMENT',
            width: 150,
            renderHeaderCell: FilterHeaderCell
        },
        {
            key: 'plantLocation',
            name: 'PLANT LOCATION',
            width: 150,
            renderHeaderCell: FilterHeaderCell
        },
        {
            key: 'assetLocation',
            name: 'ASSET LOCATION',
            width: 150,
            renderHeaderCell: FilterHeaderCell
        },
        {
            key: 'assetName',
            name: 'ASSET NAME',
            width: 180,
            renderHeaderCell: FilterHeaderCell
        },
        {
            key: 'signOffDocument',
            name: 'SIGN-OFF DOC',
            width: 180,
            renderCell: ({ row }) => (
                <FileRenderer data={row} fileType="signOffDocument" />
            )
        },
        {
            key: 'drawing',
            name: 'DRAWING',
            width: 180,
            renderCell: ({ row }) => (
                <FileRenderer data={row} fileType="drawing" />
            )
        },
        {
            key: 'actions',
            name: 'ACTIONS',
            width: 120,
            renderCell: ({ row }) => (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => openEditModal(row)}
                        className="p-1.5 rounded-lg hover:bg-blue-100 transition-colors text-blue-600"
                        title="Edit"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => handleDelete(row)}
                        className="p-1.5 rounded-lg hover:bg-red-100 transition-colors text-red-600"
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    const autoFitColumns = React.useMemo(() => {
        if (!gridWidth) return dataGridColumns;

        const totalDefinedWidth = dataGridColumns.reduce((sum, column) => {
            return sum + (column.width || 0);
        }, 0);

        if (!totalDefinedWidth) return dataGridColumns;

        const scale = Math.max(gridWidth / totalDefinedWidth, 1);

        return dataGridColumns.map((column) => {
            if (!column.width) return column;
            const scaledWidth = Math.max(Math.floor(column.width * scale), column.width, 80);

            return {
                ...column,
                width: scaledWidth
            };
        });
    }, [dataGridColumns, gridWidth]);

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

            <div ref={gridContainerRef} className="w-full h-[600px] border border-gray-200 rounded-xl overflow-hidden bg-white relative">
                <div className="h-full">
                    <DataGrid
                        columns={autoFitColumns}
                        rows={gridRows}
                        rowKeyGetter={(row) => row._id || row.assetId}
                        className="rdg-light asset-management-grid"
                        style={{ blockSize: '100%', width: '100%' }}
                        rowHeight={52}
                        headerRowHeight={48}
                        defaultColumnOptions={{
                            resizable: true
                        }}
                    />
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/60 pointer-events-none">
                            <div className="w-8 h-8 border-4 border-tvs-blue/20 border-t-tvs-blue rounded-full animate-spin" />
                        </div>
                    )}
                </div>
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
            <style>{`
                .asset-management-grid.rdg-light {
                    width: 100%;
                    height: 100%;
                    border: none;
                }
                .asset-management-grid .rdg-row .rdg-cell {
                    border-inline: none;
                    padding-block: 12px;
                    padding-inline: 16px;
                    font-size: 13px;
                }
                .asset-management-grid .rdg-row:not(.rdg-row-selected) .rdg-cell {
                    border-bottom: 1px solid #f1f5f9;
                }
                .asset-management-grid .rdg-row:hover .rdg-cell {
                    background-color: #f8fafc;
                }
                .asset-management-grid .rdg-header-row .rdg-cell {
                    padding-block: 14px;
                    padding-inline: 16px;
                    font-weight: 700;
                    border-inline: none;
                    border-bottom: 2px solid #e2e8f0;
                    position: relative;
                    font-size: 12px;
                    background-color: #253C80;
                    color: #ffffff;
                }
            `}</style>
        </div>
    );
};

export default AssetManagementUpdate;
