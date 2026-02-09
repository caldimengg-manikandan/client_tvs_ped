import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Mail, Search, Filter, Download, RefreshCw, Eye, Building, MapPin, Hash } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVendors, deleteVendor } from '../../redux/slices/vendorSlice';
import { Modal } from 'antd';

const { confirm } = Modal;


const VendorMaster = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

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

    // Filter vendors
    const filteredVendors = vendors.filter(vendor => {
        const matchesSearch =
            vendor.vendorCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vendor.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vendor.GSTIN?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vendor.vendorLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vendor.vendorMailId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vendor.remarks?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesSearch;
    });

    const formatGSTIN = (gstin) => {
        if (!gstin) return '';
        // Format: 22AAAAA0000A1Z5
        return gstin.toUpperCase();
    };

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

            {/* Table */}
            <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="w-12 px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                                <input
                                    type="checkbox"
                                    checked={filteredVendors.length > 0 && selectedRows.length === filteredVendors.length}
                                    onChange={handleSelectAll}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                            </th>
                            <th className="w-16 px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                                S.No
                            </th>
                            <th className="w-32 px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                                Vendor Code
                            </th>
                            <th className="w-48 px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                                Vendor Name
                            </th>
                            <th className="w-40 px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                                GSTIN
                            </th>
                            <th className="w-40 px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                                Location
                            </th>
                            <th className="w-48 px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                                Email
                            </th>
                            <th className="w-48 px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                                Remarks
                            </th>
                            <th className="w-40 px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="9" className="p-8">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-tvs-blue mx-auto"></div>
                                        <p className="mt-2 text-gray-600">Loading vendors...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredVendors.length > 0 ? (
                            filteredVendors.map((vendor) => (
                                <tr
                                    key={vendor._id}
                                    className={`hover:bg-blue-50/50 transition-colors ${selectedRows.includes(vendor._id) ? 'bg-blue-50' : ''}`}
                                >
                                    <td className="px-4 py-4 border-b border-gray-100">
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.includes(vendor._id)}
                                            onChange={() => handleSelectRow(vendor._id)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">
                                        <strong>{vendor.sNo}</strong>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap truncate">
                                        <div className="flex items-center gap-2">
                                            <Hash size={14} className="text-gray-400" />
                                            <strong className="font-mono">{vendor.vendorCode}</strong>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap truncate">
                                        <div className="flex items-center gap-2">
                                            <Building size={14} className="text-gray-400" />
                                            {vendor.vendorName}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap truncate font-mono">
                                        {formatGSTIN(vendor.GSTIN)}
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap truncate">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={14} className="text-gray-400" />
                                            {vendor.vendorLocation}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap truncate">
                                        <a
                                            href={`mailto:${vendor.vendorMailId}`}
                                            className="text-tvs-blue hover:underline flex items-center gap-1"
                                        >
                                            <Mail size={14} /> {vendor.vendorMailId}
                                        </a>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap truncate">
                                        <span className="text-gray-600 italic">
                                            {vendor.remarks || 'No remarks'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleView(vendor)}
                                                className="p-2 text-gray-400 hover:text-tvs-blue hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                                                title="View Details"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(vendor)}
                                                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all cursor-pointer"
                                                title="Edit Vendor"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(vendor._id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                                title="Delete Vendor"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="9" className="p-8">
                                    <div className="text-center text-gray-500 font-medium bg-gray-50 rounded-lg py-8">
                                        {searchTerm ? (
                                            <div>
                                                <p>No vendors found matching your search.</p>
                                                <button
                                                    onClick={() => setSearchTerm('')}
                                                    className="mt-2 text-tvs-blue hover:underline"
                                                >
                                                    Clear search
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <p>No vendors found.</p>
                                                <button
                                                    onClick={handleAddVendor}
                                                    className="mt-2 text-tvs-blue hover:underline"
                                                >
                                                    Add your first vendor
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
                        Showing <span className="font-semibold">{filteredVendors.length}</span> of{' '}
                        <span className="font-semibold">{vendors.length}</span> vendors
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