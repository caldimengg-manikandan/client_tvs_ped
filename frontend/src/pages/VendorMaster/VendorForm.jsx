import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, X, ArrowLeft, AlertCircle, Building, MapPin, Hash, Mail, FileText, CheckCircle, XCircle, Gauge } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { createVendor, updateVendor, fetchVendorById, fetchNextVendorId } from '../../redux/slices/vendorSlice';

const VendorForm = ({ mode = 'add' }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { loading, currentItem } = useSelector((state) => state.vendors);

    const [formData, setFormData] = useState({
        vendorCode: '',
        vendorName: '',
        GSTIN: '',
        vendorLocation: '',
        vendorMailId: '',
        vendorCapacity: 10,
        remarks: ''
    });

    const [errors, setErrors] = useState({});
    const [gstinValid, setGstinValid] = useState(null);

    useEffect(() => {
        if (mode === 'edit' && id) {
            dispatch(fetchVendorById(id));
        }
    }, [dispatch, id, mode]);

    // Update formData when currentItem changes in edit mode
    useEffect(() => {
        if (mode === 'edit' && currentItem && currentItem._id === id) {
            setFormData({
                vendorCode: currentItem.vendorCode,
                vendorName: currentItem.vendorName,
                GSTIN: currentItem.GSTIN,
                vendorLocation: currentItem.vendorLocation,
                vendorMailId: currentItem.vendorMailId,
                vendorCapacity: currentItem.vendorCapacity || 10,
                remarks: currentItem.remarks || ''
            });
            validateGSTIN(currentItem.GSTIN);
        }
    }, [currentItem, mode, id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newValue = name === 'vendorCode' || name === 'GSTIN' ? value.toUpperCase() : value;

        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        // Validate GSTIN on change
        if (name === 'GSTIN') {
            validateGSTIN(newValue);
        }
    };

    const validateGSTIN = (gstin) => {
        if (!gstin.trim()) {
            setGstinValid(null);
            return;
        }

        // GSTIN validation regex: 2 digits, 5 letters, 4 digits, 1 letter, 1 digit/Z, 1 letter, 1 digit/letter
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        const isValid = gstinRegex.test(gstin.toUpperCase());
        setGstinValid(isValid);

        if (!isValid && gstin.length >= 15) {
            setErrors(prev => ({
                ...prev,
                GSTIN: 'Invalid GSTIN format. Format: 22AAAAA0000A1Z5'
            }));
        } else if (errors.GSTIN) {
            setErrors(prev => ({ ...prev, GSTIN: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.vendorCode.trim()) newErrors.vendorCode = 'Vendor Code is required';
        if (!formData.vendorName.trim()) newErrors.vendorName = 'Vendor Name is required';
        if (!formData.GSTIN.trim()) newErrors.GSTIN = 'GSTIN is required';
        if (!formData.vendorLocation.trim()) newErrors.vendorLocation = 'Vendor Location is required';
        if (!formData.vendorMailId.trim()) newErrors.vendorMailId = 'Email is required';

        if (formData.vendorMailId && !/\S+@\S+\.\S+/.test(formData.vendorMailId)) {
            newErrors.vendorMailId = 'Please enter a valid email';
        }

        if (formData.GSTIN && gstinValid === false) {
            newErrors.GSTIN = 'Invalid GSTIN format';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const payload = {
            vendorCode: formData.vendorCode,
            vendorName: formData.vendorName,
            GSTIN: formData.GSTIN.toUpperCase(),
            vendorLocation: formData.vendorLocation,
            vendorMailId: formData.vendorMailId.toLowerCase(),
            vendorCapacity: Number(formData.vendorCapacity) || 10,
            remarks: formData.remarks
        };

        const action = mode === 'edit'
            ? updateVendor({ id, vendorData: payload })
            : createVendor(payload);

        const result = await dispatch(action);

        if (createVendor.fulfilled.match(result) || updateVendor.fulfilled.match(result)) {
            toast.success(`Vendor ${mode === 'edit' ? 'updated' : 'added'} successfully!`);
            navigate('/vendor-master');
        } else {
            const serverError = result.payload;
            if (serverError && typeof serverError === 'string') {
                toast.error(serverError);
                if (serverError.includes('Vendor Code already exists')) {
                    setErrors(prev => ({ ...prev, vendorCode: 'Vendor Code already exists' }));
                } else if (serverError.includes('GSTIN already registered')) {
                    setErrors(prev => ({ ...prev, GSTIN: 'GSTIN already registered' }));
                } else if (serverError.includes('Email already registered')) {
                    setErrors(prev => ({ ...prev, vendorMailId: 'Email already registered' }));
                }
            } else {
                toast.error(`Failed to ${mode === 'edit' ? 'update' : 'add'} vendor`);
            }
        }
    };

    if (loading && mode === 'edit' && !currentItem) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tvs-blue mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading vendor data...</p>
            </div>
        );
    }

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
                    <h1 className="text-xl font-bold text-tvs-dark-gray m-0">
                        {mode === 'add' ? 'Add New Vendor' : `Edit Vendor: ${formData.vendorCode}`}
                    </h1>
                </div>
                {mode === 'edit' && (
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center bg-tvs-blue !text-white px-5 py-2.5 rounded-lg font-medium shadow-sm hover:bg-opacity-90 transform active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                        <Save size={18} style={{ marginRight: '0.5rem' }} />
                        {loading ? 'Saving...' : 'Update Vendor'}
                    </button>
                )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
                {/* Basic Information Section */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                        Vendor Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Vendor Code */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Vendor Code *
                            </label>
                            <div className="flex items-center gap-2">
                                <Hash size={18} className="text-gray-400" />
                                <input
                                    type="text"
                                    name="vendorCode"
                                    value={formData.vendorCode}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.vendorCode ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter Vendor Code"
                                    required
                                />
                            </div>
                            {errors.vendorCode && (
                                <p className="text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle size={14} /> {errors.vendorCode}
                                </p>
                            )}
                            <p className="text-xs text-gray-500">
                                Unique code for the vendor
                            </p>
                        </div>

                        {/* Vendor Name */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Vendor Name *
                            </label>
                            <div className="flex items-center gap-2">
                                <Building size={18} className="text-gray-400" />
                                <input
                                    type="text"
                                    name="vendorName"
                                    value={formData.vendorName}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.vendorName ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter vendor name"
                                    required
                                />
                            </div>
                            {errors.vendorName && (
                                <p className="text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle size={14} /> {errors.vendorName}
                                </p>
                            )}
                        </div>

                        {/* GSTIN */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                GSTIN *
                            </label>
                            <div className="flex items-center gap-2">
                                <Hash size={18} className="text-gray-400" />
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        name="GSTIN"
                                        value={formData.GSTIN}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${errors.GSTIN ? 'border-red-300' :
                                            gstinValid === true ? 'border-green-300' :
                                                gstinValid === false ? 'border-red-300' :
                                                    'border-gray-300'
                                            }`}
                                        placeholder="22AAAAA0000A1Z5"
                                        maxLength="15"
                                        required
                                    />
                                    {gstinValid === true && (
                                        <CheckCircle size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" />
                                    )}
                                    {gstinValid === false && formData.GSTIN.length >= 15 && (
                                        <XCircle size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500" />
                                    )}
                                </div>
                            </div>
                            {errors.GSTIN && (
                                <p className="text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle size={14} /> {errors.GSTIN}
                                </p>
                            )}
                            <p className="text-xs text-gray-500">
                                15-digit GSTIN number
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Vendor Location *
                            </label>
                            <div className="flex items-center gap-2">
                                <MapPin size={18} className="text-gray-400" />
                                <input
                                    type="text"
                                    name="vendorLocation"
                                    value={formData.vendorLocation}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.vendorLocation ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter vendor location"
                                    required
                                />
                            </div>
                            {errors.vendorLocation && (
                                <p className="text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle size={14} /> {errors.vendorLocation}
                                </p>
                            )}
                        </div>

                        {/* Vendor Email */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Email *
                            </label>
                            <div className="flex items-center gap-2">
                                <Mail size={18} className="text-gray-400" />
                                <input
                                    type="email"
                                    name="vendorMailId"
                                    value={formData.vendorMailId}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.vendorMailId ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    placeholder="vendor@example.com"
                                    required
                                />
                            </div>
                            {errors.vendorMailId && (
                                <p className="text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle size={14} /> {errors.vendorMailId}
                                </p>
                            )}
                        </div>

                        {/* Vendor Capacity */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Vendor Capacity
                            </label>
                            <div className="flex items-center gap-2">
                                <Gauge size={18} className="text-gray-400" />
                                <input
                                    type="number"
                                    name="vendorCapacity"
                                    value={formData.vendorCapacity}
                                    onChange={handleChange}
                                    min="1"
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="10"
                                />
                            </div>
                            <p className="text-xs text-gray-500">
                                Max number of projects vendor can handle
                            </p>
                        </div>

                        {/* Remarks */}
                        <div className="md:col-span-2 lg:col-span-1 space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Remarks
                            </label>
                            <div className="flex items-start gap-2">
                                <FileText size={18} className="text-gray-400 mt-3" />
                                <textarea
                                    name="remarks"
                                    value={formData.remarks}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Additional notes or comments about the vendor..."
                                />
                            </div>
                            <p className="text-xs text-gray-500">
                                Optional: Add any additional information about the vendor
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Actions - Only for Add mode */}
                {mode === 'add' && (
                    <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/vendor-master')}
                            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center bg-tvs-blue !text-white px-5 py-2.5 rounded-lg font-medium shadow-sm hover:bg-opacity-90 transform active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                        >
                            <Save size={18} style={{ marginRight: '0.5rem' }} />
                            {loading ? 'Saving...' : 'Save Vendor'}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default VendorForm;
