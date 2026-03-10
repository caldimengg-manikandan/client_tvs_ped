import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Switch } from 'antd';
import { Save, Eye, EyeOff, ArrowLeft, AlertCircle, Shield, LayoutDashboard, FilePlus, List, BarChart3, Users, Truck, FileBarChart, Settings, TrendingUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { createEmployee, updateEmployee, fetchEmployeeById, fetchUserByEmployeeId, checkIdAvailability, fetchNextEmployeeId } from '../../redux/slices/employeeSlice';
import axios from '../../api/axiosConfig';
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    };
};

const permissionList = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, description: 'View dashboard overview' },
    { id: 'assetRequest', label: 'Asset Request', icon: <FilePlus size={20} />, description: 'Create and manage requests' },
    { id: 'requestTracker', label: 'Request Tracker', icon: <List size={20} />, description: 'Track request status' },
    { id: 'assetSummary', label: 'Asset Summary', icon: <BarChart3 size={20} />, description: 'View asset analytics' },
    { id: 'employeeMaster', label: 'Employee Master', icon: <Users size={20} />, description: 'Manage employees' },
    { id: 'vendorMaster', label: 'Vendor Master', icon: <Truck size={20} />, description: 'Manage vendors' },
    { id: 'mhDevelopmentTracker', label: 'MH Dev Tracker', icon: <TrendingUp size={20} />, description: 'Track MH development progress' },
    { id: 'reports', label: 'Reports', icon: <FileBarChart size={20} />, description: 'Access system reports' },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} />, description: 'System configuration' }
];

const EmployeeForm = ({ mode = 'add' }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { loading, currentItem } = useSelector((state) => state.employees);

    const [formData, setFormData] = useState({
        employeeId: '',
        employeeName: '',
        departmentName: '',
        plantLocation: '',
        accessLevel: 'Employee',
        mailId: '',
        password: '',
        confirmPassword: '',
        status: 'Active'
    });

    // Permissions state
    const [permissions, setPermissions] = useState({
        dashboard: true,
        assetRequest: false,
        requestTracker: false,
        assetSummary: false,
        employeeMaster: false,
        vendorMaster: false,
        mhDevelopmentTracker: false,
        reports: false,
        settings: false
    });

    // Error state
    const [errors, setErrors] = useState({});

    // State for password toggle and debounce
    const [updatePassword, setUpdatePassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Debounce check ID
    // We use a ref to keep the debounce function stable across renders
    const debouncedCheckId = React.useRef(
        debounce(async (id) => {
            if (!id) return;
            const result = await dispatch(checkIdAvailability(id));
            if (checkIdAvailability.fulfilled.match(result)) {
                if (result.payload.exists) {
                    setErrors(prev => ({ ...prev, employeeId: 'Employee ID already exists' }));
                } else {
                    setErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.employeeId;
                        return newErrors;
                    });
                }
            }
        }, 500)
    ).current;

    useEffect(() => {
        if (mode === 'edit' && id) {
            dispatch(fetchEmployeeById(id));
        } else if (mode === 'add') {
            dispatch(fetchNextEmployeeId()).then(action => {
                if (fetchNextEmployeeId.fulfilled.match(action)) {
                    setFormData(prev => ({ ...prev, employeeId: action.payload }));
                }
            });
        }
    }, [dispatch, id, mode]);

    useEffect(() => {
        if (mode === 'edit' && currentItem) {

            const loadUserData = async () => {
                try {
                    // Dispatch Redux action to fetch user details
                    await dispatch(fetchUserByEmployeeId(currentItem.employeeId));
                    // We don't need to check result or set dummy password here anymore
                    // Password fields will remain empty and hidden until toggle is switched

                    setFormData({
                        employeeId: currentItem.employeeId,
                        employeeName: currentItem.employeeName,
                        departmentName: currentItem.departmentName,
                        plantLocation: currentItem.plantLocation,
                        accessLevel: currentItem.accessLevel,
                        mailId: currentItem.mailId,
                        password: '', // Kept empty
                        confirmPassword: '',
                        status: currentItem.status
                    });
                } catch (err) {
                    console.error("Error loading user data:", err);
                    setFormData({
                        employeeId: currentItem.employeeId,
                        employeeName: currentItem.employeeName,
                        departmentName: currentItem.departmentName,
                        plantLocation: currentItem.plantLocation,
                        accessLevel: currentItem.accessLevel,
                        mailId: currentItem.mailId,
                        password: '',
                        confirmPassword: '',
                        status: currentItem.status
                    });
                }
            };

            loadUserData();

            if (currentItem.permissions) {
                setPermissions(currentItem.permissions);
            }
        }
    }, [currentItem, mode, dispatch]);


    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        // Debounce check for employeeId
        if (name === 'employeeId') {
            debouncedCheckId(value);
        }
    };

    const handlePermissionToggle = (permissionId) => {
        setPermissions(prev => ({
            ...prev,
            [permissionId]: !prev[permissionId]
        }));
    };

    const handleGrantAllPermissions = () => {
        const allTrue = {};
        permissionList.forEach(p => allTrue[p.id] = true);
        setPermissions(allTrue);
    };

    const handleRevokeAllPermissions = () => {
        const allFalse = {};
        permissionList.forEach(p => allFalse[p.id] = false);
        setPermissions(allFalse);
    };

    const validateForm = () => {
        const newErrors = {};
        const isEditMode = !!id;
        if (!formData.employeeId || !formData.employeeId.trim()) newErrors.employeeId = 'Employee ID is required';
        if (!formData.employeeName || !formData.employeeName.trim()) newErrors.employeeName = 'Full Name is required';
        if (!formData.departmentName || !formData.departmentName.trim()) newErrors.departmentName = 'Department Name is required';
        if (!formData.plantLocation || !formData.plantLocation.trim()) newErrors.plantLocation = 'Plant Location is required';
        if (!formData.mailId || !formData.mailId.trim()) newErrors.mailId = 'Email is required';

        if (formData.mailId && !/\S+@\S+\.\S+/.test(formData.mailId)) {
            newErrors.mailId = 'Please enter a valid email';
        }

        if (mode === 'add') {
            if (!formData.password) newErrors.password = 'Password is required';
            if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm Password is required';
        } else if (mode === 'edit' && updatePassword) {
            if (!formData.password) newErrors.password = 'Password is required';
            if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm Password is required';
        }

        if (formData.password && formData.password !== '********') {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(formData.password)) {
                newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
            }

            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = 'Passwords do not match';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!validateForm()) {
            toast.error("Please check the form for errors");
            return;
        }

        const payload = {
            employeeId: formData.employeeId,
            employeeName: formData.employeeName,
            departmentName: formData.departmentName,
            plantLocation: formData.plantLocation,
            accessLevel: formData.accessLevel,
            mailId: formData.mailId,
            status: formData.status,
            permissions: permissions
        };

        // Only include password if provided and changed from dummy value
        if (formData.password && formData.password !== '********') {
            payload.password = formData.password;
        }

        const action = mode === 'edit'
            ? updateEmployee({ id, employeeData: payload })
            : createEmployee(payload);

        const result = await dispatch(action);

        if (createEmployee.fulfilled.match(result) || updateEmployee.fulfilled.match(result)) {
            toast.success(`Employee ${mode === 'edit' ? 'updated' : 'added'} successfully!`);
            navigate('/employee-master');
        } else {
            const serverError = result.payload;
            if (serverError && typeof serverError === 'string') {
                toast.error(serverError);

                if (serverError.includes('Employee ID already exists')) {
                    setErrors(prev => ({ ...prev, employeeId: 'Employee ID already exists' }));
                } else if (serverError.includes('Email already registered')) {
                    setErrors(prev => ({ ...prev, mailId: 'Email already registered' }));
                }
            } else {
                toast.error(`Failed to ${mode === 'edit' ? 'update' : 'add'} employee`);
            }
        }
    };

    if (loading && mode === 'edit' && !currentItem) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tvs-blue mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading employee data...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-tvs-border overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-tvs-border bg-gray-50">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/employee-master')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-tvs-dark-gray m-0">
                        {mode === 'add' ? 'Add New Employee' : `Edit Employee: ${formData.employeeId}`}
                    </h1>
                </div>

            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
                {/* Basic Information Section */}
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                        Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Employee ID - Manual Input */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Employee ID *
                            </label>
                            <input
                                type="text"
                                name="employeeId"
                                value={formData.employeeId}
                                onChange={handleChange}
                                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.employeeId ? 'border-red-300' : 'border-gray-300'}`}
                                placeholder="Enter Employee ID (e.g. EMP001)"
                                required
                            />
                            {errors.employeeId && (
                                <p className="text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle size={14} /> {errors.employeeId}
                                </p>
                            )}
                        </div>

                        {/* Full Name */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                name="employeeName"
                                value={formData.employeeName}
                                onChange={handleChange}
                                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.employeeName ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="John Doe"
                                required
                            />
                            {errors.employeeName && (
                                <p className="text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle size={14} /> {errors.employeeName}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Email *
                            </label>
                            <input
                                type="email"
                                name="mailId"
                                value={formData.mailId}
                                onChange={handleChange}
                                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.mailId ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="john.doe@example.com"
                                required
                            />
                            {errors.mailId && (
                                <p className="text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle size={14} /> {errors.mailId}
                                </p>
                            )}
                        </div>

                        {/* Department */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Department Name *
                            </label>
                            <input
                                type="text"
                                name="departmentName"
                                value={formData.departmentName}
                                onChange={handleChange}
                                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.departmentName ? 'border-red-300' : 'border-gray-300'}`}
                                placeholder="Enter Department (e.g. Engineering)"
                                required
                            />
                            {errors.departmentName && (
                                <p className="text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle size={14} /> {errors.departmentName}
                                </p>
                            )}
                        </div>

                        {/* Location */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Plant Location *
                            </label>
                            <input
                                type="text"
                                name="plantLocation"
                                value={formData.plantLocation}
                                onChange={handleChange}
                                className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.plantLocation ? 'border-red-300' : 'border-gray-300'}`}
                                placeholder="Enter Plant Location"
                            />
                            {errors.plantLocation && (
                                <p className="text-sm text-red-600 flex items-center gap-1">
                                    <AlertCircle size={14} /> {errors.plantLocation}
                                </p>
                            )}
                        </div>

                        {/* Access Level */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Access Level
                            </label>
                            <select
                                name="accessLevel"
                                value={formData.accessLevel}
                                onChange={handleChange}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="Employee">Employee</option>
                                <option value="Viewer">Viewer</option>
                                <option value="Manager">Manager</option>
                                <option value="Admin">Admin</option>
                                <option value="Super Admin">Super Admin</option>
                            </select>
                        </div>

                        {/* Password Section */}
                        {mode === 'edit' && (
                            <div className="md:col-span-2 lg:col-span-3">
                                <label className="flex items-center space-x-2 cursor-pointer mb-2">
                                    <Switch
                                        checked={updatePassword}
                                        onChange={(checked) => setUpdatePassword(checked)}
                                    />
                                    <span className="text-sm font-medium text-gray-700">Change Password</span>
                                </label>
                            </div>
                        )}

                        {(mode === 'add' || (mode === 'edit' && updatePassword)) && (
                            <>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Password *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className={`w-full px-3 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Enter password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-sm text-red-600 flex items-center gap-1">
                                            <AlertCircle size={14} /> {errors.password}
                                        </p>
                                    )}
                                    <p className="text-xs text-gray-500">
                                        Min 8 chars with uppercase, lowercase, number & special character
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Confirm Password *
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className={`w-full px-3 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'}`}
                                            placeholder="Re-enter password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showConfirmPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && (
                                        <p className="text-sm text-red-600 flex items-center gap-1">
                                            <AlertCircle size={14} /> {errors.confirmPassword}
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Status */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Status
                            </label>
                            <div className="flex gap-4">
                                {['Active', 'Inactive', 'Suspended'].map(status => (
                                    <label key={status} className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="status"
                                            value={status}
                                            checked={formData.status === status}
                                            onChange={handleChange}
                                            className="text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="ml-2">{status}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Permissions Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">System Permissions</h3>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleGrantAllPermissions}
                                className="text-sm px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                            >
                                Grant All
                            </button>
                            <button
                                type="button"
                                onClick={handleRevokeAllPermissions}
                                className="text-sm px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Revoke All
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {permissionList.map((permission) => (
                            <div
                                key={permission.id}
                                className={`p-3 border rounded-lg flex items-center justify-between cursor-pointer transition-all ${permissions[permission.id]
                                    ? 'border-green-500 bg-green-50'
                                    : 'border-gray-300 hover:border-gray-400'
                                    }`}
                                onClick={() => handlePermissionToggle(permission.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xl">{permission.icon}</span>
                                    <div>
                                        <div className="font-medium text-gray-900">{permission.label}</div>
                                        <div className="text-xs text-gray-500">{permission.description}</div>
                                    </div>
                                </div>
                                <div className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${permissions[permission.id] ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'
                                    }`}>
                                    <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Permission Summary */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Shield size={16} className="text-gray-500" />
                                <span className="text-sm font-medium text-gray-700">
                                    Permissions Summary:
                                </span>
                            </div>
                            <span className="font-semibold text-tvs-blue">
                                {Object.values(permissions).filter(Boolean).length} of {permissionList.length} permissions granted
                            </span>
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/employee-master')}
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
                        {loading ? 'Saving...' : (mode === 'edit' ? 'Update Employee' : 'Save Employee')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EmployeeForm;