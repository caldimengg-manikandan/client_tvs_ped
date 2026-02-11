import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Building, MapPin, Hash, FileText, Edit, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVendorById } from '../../redux/slices/vendorSlice';

const VendorView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { currentItem: vendor, loading, error } = useSelector((state) => state.vendors);

    useEffect(() => {
        if (id) {
            dispatch(fetchVendorById(id));
        }
    }, [dispatch, id]);

    // Handle error redirect or toast
    useEffect(() => {
        if (error) {
            toast.error('Failed to load vendor details');
            // navigate('/vendor-master'); // Optional: redirect on error
        }
    }, [error]);

    const fetchVendorData = () => {
        // Kept empty or just re-dispatch if needed, but useEffect handles it
        dispatch(fetchVendorById(id));
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tvs-blue mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading vendor details...</p>
            </div>
        );
    }

    if (!vendor) {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-600">Vendor not found</p>
                <button
                    onClick={() => navigate('/vendor-master')}
                    className="mt-4 text-tvs-blue hover:underline"
                >
                    Back to Vendor List
                </button>
            </div>
        );
    }

    const details = [
        { label: 'Vendor Code', value: vendor.vendorCode, icon: Hash },
        { label: 'Vendor Name', value: vendor.vendorName, icon: Building },
        { label: 'GSTIN', value: vendor.GSTIN, icon: Hash },
        { label: 'Location', value: vendor.vendorLocation, icon: MapPin },
        { label: 'Email', value: vendor.vendorMailId, icon: Mail },
        { label: 'Remarks', value: vendor.remarks || 'No remarks', icon: FileText },
        { label: 'Created', value: formatDate(vendor.createdAt), icon: Calendar },
        { label: 'Last Updated', value: formatDate(vendor.updatedAt), icon: Calendar },
    ];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-tvs-border overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-tvs-border bg-gray-50">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/vendor-master')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-tvs-dark-gray">
                            Vendor Details: {vendor.vendorCode}
                        </h1>
                        <p className="text-sm text-gray-600">Complete vendor information</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate(`/vendor-master/edit/${vendor._id}`)}
                    className="flex items-center bg-tvs-blue text-white px-5 py-2.5 rounded-lg font-medium shadow-sm hover:bg-opacity-90 transform active:scale-95 transition-all cursor-pointer"
                >
                    <Edit size={18} style={{ marginRight: '0.5rem' }} /> Edit Vendor
                </button>
            </div>

            {/* Details Section */}
            <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Basic Info */}
                    <div>
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                                Vendor Information
                            </h2>
                            <div className="space-y-4">
                                {details.map((item, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <div className="p-2 bg-gray-100 rounded-lg">
                                            <item.icon size={18} className="text-gray-600" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm text-gray-500 mb-1">
                                                {item.label}
                                            </div>
                                            <div className="text-lg font-medium text-gray-900">
                                                {item.value}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Quick Actions */}
                    <div className="space-y-6">
                        {/* Vendor Code Card */}
                        <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                            <h3 className="font-semibold text-gray-900 mb-3">Vendor Code</h3>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-tvs-blue mb-2 font-mono">{vendor.vendorCode}</div>
                                <p className="text-sm text-gray-600">Use this code for purchase orders and transactions</p>
                            </div>
                        </div>

                        {/* GSTIN Card */}
                        <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                            <h3 className="font-semibold text-gray-900 mb-3">GSTIN</h3>
                            <div className="text-center">
                                <div className="text-xl font-bold text-green-700 mb-2 font-mono">{vendor.GSTIN}</div>
                                <p className="text-sm text-gray-600">15-digit GST Identification Number</p>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => window.location.href = `mailto:${vendor.vendorMailId}`}
                                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <Mail size={18} className="mr-2" /> Send Email
                                </button>
                                <button
                                    onClick={() => navigate(`/vendor-master/edit/${vendor._id}`)}
                                    className="w-full flex items-center justify-center px-4 py-3 border border-tvs-border text-tvs-blue rounded-lg hover:bg-blue-50 transition-colors"
                                >
                                    <Edit size={18} className="mr-2" /> Edit Vendor Details
                                </button>
                                <button
                                    onClick={() => navigate('/vendor-master')}
                                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <ArrowLeft size={18} className="mr-2" /> Back to List
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center justify-between text-sm text-gray-600">
                    <div>
                        <span className="font-medium">Vendor ID:</span> {vendor._id}
                    </div>
                    <div className="mt-2 md:mt-0">
                        <span className="font-medium">Last updated:</span> {formatDate(vendor.updatedAt)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VendorView;