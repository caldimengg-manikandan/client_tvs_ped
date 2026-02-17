import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, Form, Input, Select, DatePicker, Button, Upload, message } from 'antd';
import {
    Plus, Download, Upload as UploadIcon, Eye, Edit, Trash2,
    FileText, Calendar, MapPin, Package, TrendingUp, AlertCircle,
    CheckCircle, Clock, XCircle, Users, Filter
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
import { fetchAssetRequests } from '../../redux/slices/assetRequestSlice';
import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import VendorSelectionPopup from './VendorSelectionPopup';
import ProjectPlanModal from './ProjectPlanModal';

const { Option } = Select;
const { TextArea } = Input;

const MHDevelopmentTracker = () => {
    const dispatch = useDispatch();
    const { trackers, loading, error, success } = useSelector(state => state.mhDevelopmentTracker);
    const { items: mhRequests, loading: requestsLoading } = useSelector(state => state.assetRequests);
    const [form] = Form.useForm();

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingTracker, setEditingTracker] = useState(null);
    const [vendorPopupVisible, setVendorPopupVisible] = useState(false);
    const [selectedTrackerId, setSelectedTrackerId] = useState(null);
    const [selectedPlantLocation, setSelectedPlantLocation] = useState(null);
    const [projectPlanVisible, setProjectPlanVisible] = useState(false);
    const [fileList, setFileList] = useState([]);
    const [columnFilters, setColumnFilters] = useState({});
    const [activeFilterKey, setActiveFilterKey] = useState(null);
    const [filterSearchText, setFilterSearchText] = useState({});
    const [gridWidth, setGridWidth] = useState(0);
    const gridContainerRef = useRef(null);

    useEffect(() => {
        dispatch(fetchTrackers());
        dispatch(fetchAssetRequests());
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
        if (mhRequests && mhRequests.length > 0 && data.assetRequestId) {
            const linkedRequest = mhRequests.find(req => req.mhRequestId === data.assetRequestId);
            if (linkedRequest) {
                form.setFieldsValue({
                    location: linkedRequest.location
                });
            }
        }
        setIsModalVisible(true);
    };

    const handleAssetRequestChange = (mhRequestId) => {
        if (!mhRequestId) {
            form.setFieldsValue({
                assetRequestId: null
            });
            return;
        }
        const selectedRequest = (mhRequests || []).find(req => req.mhRequestId === mhRequestId);
        if (selectedRequest) {
            form.setFieldsValue({
                assetRequestId: selectedRequest.mhRequestId,
                departmentName: selectedRequest.departmentName,
                userName: selectedRequest.userName,
                requestType: selectedRequest.requestType,
                productModel: selectedRequest.productModel,
                plantLocation: selectedRequest.plantLocation,
                location: selectedRequest.location
            });
        } else {
            form.setFieldsValue({
                assetRequestId: mhRequestId
            });
        }
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
        if (!drawingUrl) return;

        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

        // Normalize slashes (replace backslashes with forward slashes)
        let normalizedUrl = drawingUrl.replace(/\\/g, '/');

        // Remove leading slash if present to avoid double slashes when joining
        if (normalizedUrl.startsWith('/')) {
            normalizedUrl = normalizedUrl.slice(1);
        }

        // Construct full URL
        const fullUrl = `${API_BASE_URL.replace(/\/$/, '')}/${normalizedUrl}`;

        console.log('Downloading file from:', fullUrl);

        // Use window.open for better compatibility, or fetch blob if needed
        const link = document.createElement('a');
        link.href = fullUrl;
        link.download = fileName || normalizedUrl.split('/').pop() || 'drawing.pdf';
        link.target = '_blank'; // Open in new tab if download fails
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredTrackers = useMemo(() => trackers || [], [trackers]);

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

    const FilterHeaderCell = ({ column }) => {
        const key = column.key;
        const valuesSet = new Set();
        filteredTrackers.forEach(row => {
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
            <div className="relative h-full flex items-center justify-between px-2 text-xs">
                <div className="flex-1 min-w-0">
                    <span className="font-semibold text-white truncate">{column.name}</span>
                </div>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveFilterKey(prev => (prev === key ? null : key));
                    }}
                    className={`ml-1 p-0.5 rounded ${hasFilter ? 'bg-tvs-blue text-white' : 'text-gray-400 hover:bg-gray-100'}`}
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

    const gridRows = applyColumnFilters(filteredTrackers);

    const dataGridColumns = [
        {
            key: 'serial',
            name: '#',
            width: 70,
            frozen: true,
            renderCell: ({ rowIdx }) => (
                <span className="font-semibold text-gray-700">{rowIdx + 1}</span>
            )
        },
        {
            key: 'assetRequestId',
            name: 'ASSET REQ ID',
            width: 160,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className="font-semibold text-gray-900">{row.assetRequestId}</span>
            )
        },
        {
            key: 'requestType',
            name: 'REQ TYPE',
            width: 150,
            renderHeaderCell: FilterHeaderCell
        },
        {
            key: 'productModel',
            name: 'PRODUCT MODEL',
            width: 200,
            renderHeaderCell: FilterHeaderCell
        },
        {
            key: 'plantLocation',
            name: 'PLANT LOCATION',
            width: 170,
            renderHeaderCell: FilterHeaderCell
        },
        {
            key: 'vendorSelection',
            name: 'VENDOR SELECTION',
            width: 220,
            renderCell: ({ row }) => (
                <div className="flex flex-col gap-1 py-1">
                    {row.vendorCode ? (
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-tvs-blue">{row.vendorCode}</span>
                            <span className="text-[10px] text-gray-500 truncate">{row.vendorName}</span>
                        </div>
                    ) : (
                        <Button
                            size="small"
                            type="primary"
                            className="bg-tvs-blue text-[10px] h-6"
                            onClick={() => handleVendorSelect(row._id, row.plantLocation)}
                        >
                            Select Vendor
                        </Button>
                    )}
                </div>
            )
        },
        {
            key: 'projectPlan',
            name: 'PROJECT PLAN',
            width: 160,
            renderCell: ({ row }) => (
                <Button
                    size="small"
                    icon={<Edit size={12} />}
                    className="flex items-center gap-1 text-[10px]"
                    onClick={() => handleProjectPlan(row._id)}
                >
                    Create/Edit
                </Button>
            )
        },
        {
            key: 'implementationTarget',
            name: 'IMP. TARGET',
            width: 160,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span>
                    {row.implementationTarget ? dayjs(row.implementationTarget).format('DD-MMM-YYYY') : '-'}
                </span>
            )
        },
        {
            key: 'status',
            name: 'STATUS',
            width: 120,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(row.status)}`}>
                    {row.status}
                </span>
            )
        },
        {
            key: 'implementationVisibility',
            name: 'IMP. VISIBILITY',
            width: 220,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <div className="w-full flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] font-bold">
                        <span>Progress</span>
                        <span>{row.implementationVisibility || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                            className="bg-tvs-blue h-1.5 rounded-full transition-all"
                            style={{ width: `${row.implementationVisibility || 0}%` }}
                        />
                    </div>
                </div>
            )
        },
        {
            key: 'currentStage',
            name: 'CURRENT STAGE',
            width: 180,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${getStageColor(row.currentStage)}`}>
                    {row.currentStage}
                </span>
            )
        },
        {
            key: 'remarks',
            name: 'REMARKS',
            width: 220,
            renderHeaderCell: FilterHeaderCell
        },
        {
            key: 'drawing',
            name: 'DRAWING',
            width: 120,
            renderCell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {row.drawingUrl ? (
                        <Button
                            size="small"
                            icon={<Download size={14} />}
                            className="text-tvs-blue"
                            onClick={() => handleDownloadDrawing(row.drawingUrl, row.drawingFileName)}
                        />
                    ) : (
                        <Upload
                            beforeUpload={(file) => handleFileUpload(row._id, file)}
                            showUploadList={false}
                        >
                            <Button size="small" icon={<UploadIcon size={14} />}>Upload</Button>
                        </Upload>
                    )}
                </div>
            )
        },
        {
            key: 'actions',
            name: 'ACTIONS',
            width: 160,
            sortable: false,
            renderCell: ({ row }) => (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => handleEditClick(row)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit Tracker"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={() => handleDeleteClick(row._id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Tracker"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    const autoFitColumns = useMemo(() => {
        if (!gridWidth) return dataGridColumns;

        const totalDefinedWidth = dataGridColumns.reduce((sum, column) => {
            return sum + (column.width || 0);
        }, 0);

        if (!totalDefinedWidth) return dataGridColumns;

        const scale = gridWidth / totalDefinedWidth;

        return dataGridColumns.map((column) => {
            if (!column.width) return column;
            const scaledWidth = Math.max(Math.floor(column.width * scale), 120);

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
        <div className="min-h-screen bg-gray-50/50 p-4 lg:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
        
                </div>
                <button
                    onClick={handleAddClick}
                    className="flex items-center gap-2 bg-gradient-to-r from-tvs-blue to-blue-600 px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all"
                >
                    <Plus size={20} /> Add Tracker
                </button>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="px-6 py-4">
                    <div ref={gridContainerRef} className="w-full h-[620px] border border-gray-200 rounded-xl overflow-hidden bg-white relative">
                        <div className="h-full">
                            <DataGrid
                                columns={autoFitColumns}
                                rows={gridRows}
                                rowKeyGetter={(row) => row._id || row.assetRequestId}
                                className="rdg-light mh-development-grid"
                                style={{ blockSize: '100%' }}
                                rowHeight={60}
                                headerRowHeight={52}
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
                        <Form.Item
                            name="assetRequestId"
                            label={<span className="text-xs font-bold uppercase text-gray-500">Asset Request ID</span>}
                            rules={[{ required: true }]}
                        >
                            <Select
                                size="large"
                                placeholder="Select Asset Request"
                                showSearch
                                optionFilterProp="children"
                                onChange={handleAssetRequestChange}
                                loading={requestsLoading}
                                allowClear
                            >
                                {(mhRequests || []).map(request => (
                                    <Option key={request._id} value={request.mhRequestId}>
                                        {request.mhRequestId} - {request.departmentName} - {request.productModel}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item name="requestType" label={<span className="text-xs font-bold uppercase text-gray-500">Request Type</span>} rules={[{ required: true }]}>
                            <Select size="large" placeholder="Select type">
                                <Option value="New MH">New MH</Option>
                                <Option value="Modification">Modification</Option>
                                <Option value="Replacement">Replacement</Option>
                                <Option value="New Project">New Project</Option>
                                <Option value="Upgrade">Upgrade</Option>
                                <Option value="Refresh">Refresh</Option>
                                <Option value="Capacity">Capacity</Option>
                                <Option value="Special Improvements">Special Improvements</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="productModel" label={<span className="text-xs font-bold uppercase text-gray-500">Product Model</span>} rules={[{ required: true }]}>
                            <Input size="large" placeholder="E.g. Model X" />
                        </Form.Item>
                        <Form.Item name="plantLocation" label={<span className="text-xs font-bold uppercase text-gray-500">Plant Location</span>} rules={[{ required: true }]}>
                            <Input size="large" placeholder="E.g. Chennai" />
                        </Form.Item>
                        <Form.Item name="location" label={<span className="text-xs font-bold uppercase text-gray-500">Location</span>}>
                            <Input size="large" placeholder="Auto-filled from Request Tracker" disabled />
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
                assetRequestId={trackers.find(t => t._id === selectedTrackerId)?.assetRequestId}
            />
        </div>
    );
};

export default MHDevelopmentTracker;

