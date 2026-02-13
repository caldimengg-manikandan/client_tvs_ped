import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AgGridReact } from 'ag-grid-react';
import { Modal, Form, Input, Select, DatePicker, Button, Upload, message } from 'antd';
import { 
    Plus, Search, Download, Upload as UploadIcon, Eye, Edit, Trash2, 
    FileText, Calendar, MapPin, Package, TrendingUp, AlertCircle,
    CheckCircle, Clock, XCircle, Users
} from 'lucide-react';
import dayjs from 'dayjs';
import { toast } from 'react-hot-toast';
import {
    fetchTrackers,
    createTracker,
    updateTracker,
    deleteTracker,
    uploadDrawing,
    fetchVendorsForSelection,
    clearError,
    clearSuccess
} from '../../redux/slices/mhDevelopmentTrackerSlice';
import { createSerialNumberColumn, createBoldColumn, createActionColumn, defaultColDef, defaultGridOptions } from '../../config/agGridConfig';
import VendorSelectionPopup from './VendorSelectionPopup';
import ProjectPlanModal from './ProjectPlanModal';

const { Option } = Select;
const { TextArea } = Input;

const MHDevelopmentTracker = () => {
    const dispatch = useDispatch();
    const { trackers, loading, error, success } = useSelector(state => state.mhDevelopmentTracker);
    const [form] = Form.useForm();
    const gridRef = useRef();

    // State management
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingTracker, setEditingTracker] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [vendorPopupVisible, setVendorPopupVisible] = useState(false);
    const [selectedTrackerId, setSelectedTrackerId] = useState(null);
    const [selectedPlantLocation, setSelectedPlantLocation] = useState(null);
    const [projectPlanVisible, setProjectPlanVisible] = useState(false);
    const [fileList, setFileList] = useState([]);

    // Fetch trackers on mount
    useEffect(() => {
        dispatch(fetchTrackers());
    }, [dispatch]);

    // Handle success/error messages
    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(clearError());
        }
        if (success) {
            toast.success('Operation completed successfully');
            dispatch(clearSuccess());
            setIsModalVisible(false);
            setVendorPopupVisible(false);
            setProjectPlanVisible(false);
            form.resetFields();
            setEditingTracker(null);
            setFileList([]);
        }
    }, [error, success, dispatch, form]);

    // Handlers
    const handleAddClick = () => {
        setEditingTracker(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleEditClick = (data) => {
        setEditingTracker(data);
        form.setFieldsValue({
            departmentName: data.departmentName,
            userName: data.userName,
            assetRequestId: data.assetRequestId,
            requestType: data.requestType,
            productModel: data.productModel,
            plantLocation: data.plantLocation,
            implementationTarget: data.implementationTarget ? dayjs(data.implementationTarget) : null,
            status: data.status,
            currentStage: data.currentStage,
            remarks: data.remarks
        });
        setIsModalVisible(true);
    };

    const handleDeleteClick = (id) => {
        Modal.confirm({
            title: 'Delete Tracker Record',
            content: 'Are you sure you want to delete this tracker record?',
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: () => {
                dispatch(deleteTracker(id));
            }
        });
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            
            const trackerData = {
                ...values,
                implementationTarget: values.implementationTarget ? values.implementationTarget.toISOString() : null
            };

            if (editingTracker) {
                dispatch(updateTracker({ id: editingTracker._id, data: trackerData }));
            } else {
                dispatch(createTracker(trackerData));
            }
        } catch (err) {
            console.error('Validation failed:', err);
        }
    };

    const handleVendorSelect = (trackerId, plantLocation) => {
        setSelectedTrackerId(trackerId);
        setSelectedPlantLocation(plantLocation);
        setVendorPopupVisible(true);
    };

    const handleProjectPlan = (trackerId) => {
        setSelectedTrackerId(trackerId);
        setProjectPlanVisible(true);
    };

    const handleProjectPlanSave = (planData) => {
        if (selectedTrackerId) {
            dispatch(updateTracker({
                id: selectedTrackerId,
                data: { projectPlan: planData }
            }));
        }
    };

    const handleFileUpload = (trackerId, file) => {
        dispatch(uploadDrawing({ id: trackerId, file }));
        return false; // Prevent default upload behavior
    };

    const handleDownloadDrawing = (drawingUrl, fileName) => {
        const link = document.createElement('a');
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        link.href = `${API_BASE_URL}/${drawingUrl}`;
        link.download = fileName;
        link.click();
    };

    // Filter trackers
    const filteredTrackers = useMemo(() => {
        if (!trackers) return [];
        return trackers.filter(tracker =>
            tracker.departmentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tracker.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tracker.assetRequestId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tracker.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tracker.productModel?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [trackers, searchTerm]);

    // Status color helper
    const getStatusColor = (status) => {
        switch (status) {
            case 'On Track':
                return 'text-green-700 bg-green-50 border-green-200';
            case 'Likely Delay':
                return 'text-amber-700 bg-amber-50 border-amber-200';
            case 'Delayed':
                return 'text-red-700 bg-red-50 border-red-200';
            default:
                return 'text-gray-700 bg-gray-50 border-gray-200';
        }
    };

    // Stage color helper
    const getStageColor = (stage) => {
        switch (stage) {
            case 'Design':
                return 'text-blue-700 bg-blue-50';
            case 'PR/PO':
                return 'text-purple-700 bg-purple-50';
            case 'Sample Production':
                return 'text-indigo-700 bg-indigo-50';
            case 'Production Ready':
                return 'text-emerald-700 bg-emerald-50';
            case 'Completed':
                return 'text-green-700 bg-green-50';
            default:
                return 'text-gray-700 bg-gray-50';
        }
    };

    // Column Definitions
    const columnDefs = useMemo(() => [
        createSerialNumberColumn(),
        { field: 'departmentName', headerName: 'DEPT NAME', width: 140 },
        { field: 'userName', headerName: 'USER NAME', width: 140 },
        createBoldColumn('assetRequestId', 'ASSET REQ ID', { width: 160 }),
        { field: 'requestType', headerName: 'REQ TYPE', width: 140 },
        { field: 'productModel', headerName: 'PRODUCT MODEL', width: 160 },
        { field: 'plantLocation', headerName: 'PLANT LOCATION', width: 160 },
        { 
            field: 'vendorSelection', 
            headerName: 'VENDOR SELECTION', 
            width: 200,
            cellRenderer: (params) => (
                <div className="flex flex-col gap-1 py-1">
                    {params.data.vendorCode ? (
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-tvs-blue">{params.data.vendorCode}</span>
                            <span className="text-[10px] text-gray-500 truncate">{params.data.vendorName}</span>
                        </div>
                    ) : (
                        <Button 
                            size="small" 
                            type="primary" 
                            className="bg-tvs-blue text-[10px] h-6"
                            onClick={() => handleVendorSelect(params.data._id, params.data.plantLocation)}
                        >
                            Select Vendor
                        </Button>
                    )}
                </div>
            )
        },
        {
            field: 'projectPlan',
            headerName: 'PROJECT PLAN',
            width: 140,
            cellRenderer: (params) => (
                <Button 
                    size="small" 
                    icon={<Edit size={12} />}
                    className="flex items-center gap-1 text-[10px]"
                    onClick={() => handleProjectPlan(params.data._id)}
                >
                    Create/Edit
                </Button>
            )
        },
        { 
            field: 'implementationTarget', 
            headerName: 'IMP. TARGET', 
            width: 140,
            valueFormatter: (params) => params.value ? dayjs(params.value).format('DD-MMM-YYYY') : '-'
        },
        { 
            field: 'status', 
            headerName: 'STATUS', 
            width: 140,
            cellRenderer: (params) => (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(params.value)}`}>
                    {params.value}
                </span>
            )
        },
        { 
            field: 'implementationVisibility', 
            headerName: 'IMP. VISIBILITY', 
            width: 150,
            cellRenderer: (params) => (
                <div className="w-full flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] font-bold">
                        <span>Progress</span>
                        <span>{params.value || 0}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-tvs-blue transition-all duration-300" 
                            style={{ width: `${params.value || 0}%` }}
                        />
                    </div>
                </div>
            )
        },
        { 
            field: 'currentStage', 
            headerName: 'CURRENT STAGE', 
            width: 160,
            cellRenderer: (params) => (
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${getStageColor(params.value)}`}>
                    {params.value}
                </span>
            )
        },
        { field: 'remarks', headerName: 'REMARKS', width: 200 },
        { 
            field: 'drawing', 
            headerName: 'DRAWING', 
            width: 140,
            cellRenderer: (params) => (
                <div className="flex items-center gap-2">
                    {params.data.drawingUrl ? (
                        <Button 
                            size="small" 
                            icon={<Download size={14} />} 
                            className="text-tvs-blue"
                            onClick={() => handleDownloadDrawing(params.data.drawingUrl, params.data.drawingFileName)}
                        />
                    ) : (
                        <Upload
                            beforeUpload={(file) => handleFileUpload(params.data._id, file)}
                            showUploadList={false}
                        >
                            <Button size="small" icon={<UploadIcon size={14} />}>Upload</Button>
                        </Upload>
                    )}
                </div>
            )
        },
        createActionColumn([
            {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>',
                title: 'Edit Tracker',
                className: 'p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all',
                onClick: (data) => handleEditClick(data)
            },
            {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>',
                title: 'Delete Tracker',
                className: 'p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all',
                onClick: (data) => handleDeleteClick(data._id)
            }
        ])
    ], []);

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 lg:p-8">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-tvs-blue rounded-2xl shadow-lg shadow-tvs-blue/20 flex items-center justify-center">
                        <TrendingUp size={28} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">MH Development Tracker</h1>
                        <p className="text-gray-500 font-medium">Monitor MH requests from initiation to implementation</p>
                    </div>
                </div>
                <button
                    onClick={handleAddClick}
                    className="flex items-center gap-2 bg-gradient-to-r from-tvs-blue to-blue-600 px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus size={20} /> Add Tracker
                </button>
            </div>

            {/* Content Section */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                {/* Search & Stats */}
                <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/30">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search size={18} className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-tvs-blue/20 focus:border-tvs-blue shadow-sm hover:shadow-md transition-all bg-white"
                                placeholder="Search by ID, Vendor, Model..."
                            />
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm">
                            <span className="text-sm text-gray-500">Total Requests:</span>
                            <span className="text-sm font-bold text-tvs-blue">{filteredTrackers.length}</span>
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className="px-8 py-6">
                    <div className="ag-theme-alpine w-full h-[600px]">
                        <AgGridReact
                            ref={gridRef}
                            rowData={filteredTrackers}
                            columnDefs={columnDefs}
                            defaultColDef={defaultColDef}
                            {...defaultGridOptions}
                            loading={loading}
                        />
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Modal
                title={
                    <div className="flex items-center gap-3 pb-4 border-b">
                        <div className="p-2 bg-tvs-blue/10 rounded-lg text-tvs-blue">
                            <Plus size={20} />
                        </div>
                        <span className="text-xl font-bold">{editingTracker ? 'Update Tracker' : 'Add New Tracker'}</span>
                    </div>
                }
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={() => setIsModalVisible(false)}
                okText={editingTracker ? "Update" : "Create"}
                width={800}
                centered
                className="custom-modal"
            >
                <Form form={form} layout="vertical" className="mt-6">
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="departmentName" label={<span className="text-xs font-bold uppercase text-gray-500">Department Name</span>} rules={[{ required: true }]}>
                            <Input size="large" placeholder="E.g. Production" />
                        </Form.Item>
                        <Form.Item name="userName" label={<span className="text-xs font-bold uppercase text-gray-500">User Name</span>} rules={[{ required: true }]}>
                            <Input size="large" placeholder="E.g. John Doe" />
                        </Form.Item>
                        <Form.Item name="assetRequestId" label={<span className="text-xs font-bold uppercase text-gray-500">Asset Request ID</span>} rules={[{ required: true }]}>
                            <Input size="large" placeholder="E.g. REQ-001" />
                        </Form.Item>
                        <Form.Item name="requestType" label={<span className="text-xs font-bold uppercase text-gray-500">Request Type</span>} rules={[{ required: true }]}>
                            <Select size="large" placeholder="Select type">
                                <Option value="New MH">New MH</Option>
                                <Option value="Modification">Modification</Option>
                                <Option value="Replacement">Replacement</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="productModel" label={<span className="text-xs font-bold uppercase text-gray-500">Product Model</span>} rules={[{ required: true }]}>
                            <Input size="large" placeholder="E.g. Model X" />
                        </Form.Item>
                        <Form.Item name="plantLocation" label={<span className="text-xs font-bold uppercase text-gray-500">Plant Location</span>} rules={[{ required: true }]}>
                            <Input size="large" placeholder="E.g. Chennai" />
                        </Form.Item>
                        <Form.Item name="implementationTarget" label={<span className="text-xs font-bold uppercase text-gray-500">Implementation Target</span>}>
                            <DatePicker size="large" className="w-full" format="DD-MMM-YYYY" />
                        </Form.Item>
                        <Form.Item name="status" label={<span className="text-xs font-bold uppercase text-gray-500">Status</span>} initialValue="Not Started">
                            <Select size="large">
                                <Option value="On Track">On Track</Option>
                                <Option value="Likely Delay">Likely Delay</Option>
                                <Option value="Delayed">Delayed</Option>
                                <Option value="Not Started">Not Started</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="currentStage" label={<span className="text-xs font-bold uppercase text-gray-500">Current Stage</span>} initialValue="Not Started">
                            <Select size="large">
                                <Option value="Design">Design</Option>
                                <Option value="PR/PO">PR/PO</Option>
                                <Option value="Sample Production">Sample Production</Option>
                                <Option value="Production Ready">Production Ready</Option>
                                <Option value="Completed">Completed</Option>
                                <Option value="Not Started">Not Started</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="remarks" label={<span className="text-xs font-bold uppercase text-gray-500">Remarks</span>} className="col-span-2">
                            <TextArea rows={3} placeholder="Add any special instructions or milestones..." />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>

            {/* Vendor Selection Popup */}
            <VendorSelectionPopup 
                visible={vendorPopupVisible}
                onCancel={() => {
                    setVendorPopupVisible(false);
                    setSelectedPlantLocation(null);
                }}
                trackerId={selectedTrackerId}
                plantLocation={selectedPlantLocation}
            />

            {/* Project Plan Modal */}
            <ProjectPlanModal
                visible={projectPlanVisible}
                onCancel={() => setProjectPlanVisible(false)}
                onSave={handleProjectPlanSave}
                trackerId={selectedTrackerId}
                initialData={trackers.find(t => t._id === selectedTrackerId)?.projectPlan}
            />
        </div>
    );
};

export default MHDevelopmentTracker;

