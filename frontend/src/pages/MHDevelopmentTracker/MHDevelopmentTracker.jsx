import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, Form, Input, Select, DatePicker, Button, Upload } from 'antd';
import { Download, Upload as UploadIcon, Edit, Trash2, Filter, Pin } from 'lucide-react';
import dayjs from 'dayjs';
import { toast } from 'react-hot-toast';
import {
    fetchTrackers,
    updateTracker,
    deleteTracker,
    uploadDrawing,
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

const mapMilestoneIndexToStage = (index, totalLength) => {
    if (index == null || index < 0) return 'Not Started';
    if (index >= totalLength - 1) return 'Completed';
    if (index <= 2) return 'Design';
    if (index === 3) return 'PR/PO';
    if (index === 4 || index === 5) return 'Sample Production';
    if (index === 6 || index === 7) return 'Production Ready';
    return 'Completed';
};

const deriveCurrentStageFromMilestones = (milestones) => {
    if (!Array.isArray(milestones) || milestones.length === 0) return 'Not Started';

    let lastCompletedIndex = -1;
    milestones.forEach((m, index) => {
        if (m.actualEnd) lastCompletedIndex = index;
    });

    if (lastCompletedIndex === -1) {
        const firstStartedIndex = milestones.findIndex(m => m.actualStart);
        if (firstStartedIndex === -1) return 'Not Started';
        return mapMilestoneIndexToStage(firstStartedIndex, milestones.length);
    }

    return mapMilestoneIndexToStage(lastCompletedIndex, milestones.length);
};

const deriveStatusFromMilestones = (milestones) => {
    if (!Array.isArray(milestones) || milestones.length === 0) return 'Not Started';

    const anyProgress = milestones.some(m => m.actualStart || m.actualEnd);
    if (!anyProgress) return 'Not Started';

    const today = dayjs().startOf('day');
    let maxDelay = 0;

    milestones.forEach(m => {
        const planEnd = m.planEnd ? dayjs(m.planEnd).startOf('day') : null;
        const actualEnd = m.actualEnd ? dayjs(m.actualEnd).startOf('day') : null;

        if (planEnd && actualEnd) {
            const diff = actualEnd.diff(planEnd, 'day');
            if (!Number.isNaN(diff) && diff > maxDelay) maxDelay = diff;
        } else if (planEnd && !actualEnd) {
            const diff = today.diff(planEnd, 'day');
            if (!Number.isNaN(diff) && diff > maxDelay) maxDelay = diff;
        }
    });

    if (maxDelay <= 0) return 'On Track';
    if (maxDelay <= 7) return 'Likely Delay';
    return 'Delayed';
};

const computeDerivedTrackerFields = (tracker) => {
    const milestones = tracker?.projectPlan?.milestones;
    if (!Array.isArray(milestones) || milestones.length === 0) {
        return {
            status: tracker.status || 'Not Started',
            currentStage: tracker.currentStage || 'Not Started'
        };
    }
    return {
        status: deriveStatusFromMilestones(milestones),
        currentStage: deriveCurrentStageFromMilestones(milestones)
    };
};

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

    // Freeze column state
    const [freezePopupVisible, setFreezePopupVisible] = useState(false);
    const freezePopupRef = useRef(null);
    const [pendingFrozen, setPendingFrozen] = useState(new Set());
    const [frozenColumns, setFrozenColumns] = useState(new Set());

    useEffect(() => {
        dispatch(fetchTrackers());
        dispatch(fetchAssetRequests());
    }, [dispatch]);

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
                form.setFieldsValue({ location: linkedRequest.location });
            }
        }
        setIsModalVisible(true);
    };

    const handleAssetRequestChange = (mhRequestId) => {
        if (!mhRequestId) {
            form.setFieldsValue({ assetRequestId: null });
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
            form.setFieldsValue({ assetRequestId: mhRequestId });
        }
    };

    const handleDeleteClick = (id) => {
        Modal.confirm({
            title: 'Delete Tracker Record',
            content: 'Are you sure you want to delete this tracker record?',
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: () => { dispatch(deleteTracker(id)); }
        });
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            const trackerData = {
                ...values,
                implementationTarget: values.implementationTarget ? values.implementationTarget.toISOString() : null
            };
            dispatch(updateTracker({ id: editingTracker._id, data: trackerData }));
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
            dispatch(updateTracker({ id: selectedTrackerId, data: { projectPlan: planData } }));
        }
    };

    const handleFileUpload = (trackerId, file) => {
        dispatch(uploadDrawing({ id: trackerId, file }));
        return false;
    };

    const handleDownloadDrawing = (drawingUrl, fileName) => {
        if (!drawingUrl) return;
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
        let normalizedUrl = drawingUrl.replace(/\\/g, '/');
        if (normalizedUrl.startsWith('/')) normalizedUrl = normalizedUrl.slice(1);
        const fullUrl = `${API_BASE_URL.replace(/\/$/, '')}/${normalizedUrl}`;
        const link = document.createElement('a');
        link.href = fullUrl;
        link.download = fileName || normalizedUrl.split('/').pop() || 'drawing.pdf';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const filteredTrackers = useMemo(
        () => (trackers || []).map(tracker => {
            const derived = computeDerivedTrackerFields(tracker);
            return { ...tracker, ...derived };
        }),
        [trackers]
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'On Track': return 'text-green-700 bg-green-50 border-green-200';
            case 'Likely Delay': return 'text-amber-700 bg-amber-50 border-amber-200';
            case 'Delayed': return 'text-red-700 bg-red-50 border-red-200';
            default: return 'text-gray-700 bg-gray-50 border-gray-200';
        }
    };

    const getStageColor = (stage) => {
        switch (stage) {
            case 'Design': return 'text-blue-700 bg-blue-50';
            case 'PR/PO': return 'text-purple-700 bg-purple-50';
            case 'Sample Production': return 'text-indigo-700 bg-indigo-50';
            case 'Production Ready': return 'text-emerald-700 bg-emerald-50';
            case 'Completed': return 'text-green-700 bg-green-50';
            default: return 'text-gray-700 bg-gray-50';
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
            valuesSet.add(value == null ? '' : String(value));
        });
        const values = Array.from(valuesSet).sort((a, b) => a.localeCompare(b));

        const searchValue = filterSearchText[key] || '';
        const rawSelected = columnFilters[key];
        const selectedValues = rawSelected === undefined ? values : rawSelected;
        const visibleValues = values.filter(v => v.toLowerCase().includes(searchValue.toLowerCase()));

        const toggleValue = (value) => {
            setColumnFilters(prev => {
                const base = prev[key] === undefined ? values : prev[key];
                const exists = base.includes(value);
                const next = exists ? base.filter(v => v !== value) : [...base, value];
                const updated = { ...prev };
                if (next.length === values.length) delete updated[key];
                else updated[key] = next;
                return updated;
            });
            setActiveFilterKey(null);
        };

        const handleSelectAll = () => setColumnFilters(prev => { const c = { ...prev }; delete c[key]; return c; });
        const handleClear = () => {
            setColumnFilters(prev => { const c = { ...prev }; delete c[key]; return c; });
            setFilterSearchText(prev => { const c = { ...prev }; delete c[key]; return c; });
        };

        const hasFilter = rawSelected !== undefined;

        return (
            <div
                className="relative h-full w-full flex items-center justify-between px-3 text-xs"
                style={{ backgroundColor: '#253C80' }}
            >
                <div className="flex-1 min-w-0">
                    <span className="font-bold text-white text-[11px] leading-tight tracking-wide">{column.name}</span>
                </div>
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setActiveFilterKey(prev => (prev === key ? null : key)); }}
                    className={`ml-2 p-1 rounded flex-shrink-0 ${hasFilter ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10'}`}
                >
                    <Filter size={11} />
                </button>
                {activeFilterKey === key && (
                    <div className="absolute z-50 top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                        <div className="flex items-center justify-between mb-2">
                            <button type="button" onClick={handleSelectAll} className="text-[10px] font-semibold text-tvs-blue">Select All</button>
                            <button type="button" onClick={handleClear} className="text-[10px] font-semibold text-gray-500">Clear</button>
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
                                    <label key={label} className="flex items-center gap-1.5 text-[10px] text-gray-700 cursor-pointer">
                                        <input type="checkbox" checked={checked} onChange={() => toggleValue(value)} className="w-3 h-3" />
                                        <span className="truncate">{label}</span>
                                    </label>
                                );
                            })}
                            {visibleValues.length === 0 && <div className="text-[10px] text-gray-400">No values</div>}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Uniform plain header for columns without filters
    const PlainHeaderCell = ({ column }) => (
        <div
            className="h-full w-full flex items-center px-3"
            style={{ backgroundColor: '#253C80' }}
        >
            <span className="font-bold text-white text-[11px] leading-tight tracking-wide">
                {column.name}
            </span>
        </div>
    );

    const dataGridColumns = useMemo(() => [
        // 1. S.no
        {
            key: 'serial',
            name: 'S.no',
            width: 60,
            frozen: true,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ rowIdx }) => (
                <span className="font-semibold text-gray-700">{rowIdx + 1}</span>
            )
        },
        // 2. Department Name
        {
            key: 'departmentName',
            name: 'DEPARTMENT NAME',
            width: 200,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => <span className="text-xs text-gray-700">{row.departmentName || '-'}</span>
        },
        // 3. Username
        {
            key: 'userName',
            name: 'USERNAME',
            width: 160,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => <span className="text-xs text-gray-700">{row.userName || '-'}</span>
        },
        // 4. Asset Request ID
        {
            key: 'assetRequestId',
            name: 'ASSET REQUEST ID',
            width: 190,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className="font-semibold text-gray-900">{row.assetRequestId || '-'}</span>
            )
        },
        // 5. Request Type
        {
            key: 'requestType',
            name: 'REQUEST TYPE',
            width: 175,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => <span className="text-xs text-gray-700">{row.requestType || '-'}</span>
        },
        // 6. Product Model
        {
            key: 'productModel',
            name: 'PRODUCT MODEL',
            width: 175,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => <span className="text-xs text-gray-700">{row.productModel || '-'}</span>
        },
        // 7. Material Handling Equipment
        {
            key: 'materialHandlingEquipment',
            name: 'MATERIAL HANDLING EQUIPMENT',
            width: 220,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className="text-xs text-gray-700">{row.materialHandlingEquipment || '-'}</span>
            )
        },
        // 8. Plant Location
        {
            key: 'plantLocation',
            name: 'PLANT LOCATION',
            width: 175,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => <span className="text-xs text-gray-700">{row.plantLocation || '-'}</span>
        },
        // 9. Vendor Selection
        {
            key: 'vendorSelection',
            name: 'VENDOR SELECTION',
            width: 200,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex flex-col gap-1 py-1">
                    {row.vendorCode ? (
                        <span className="text-xs font-bold text-tvs-blue">{row.vendorCode}</span>
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
        // 10. Project Plan
        {
            key: 'projectPlan',
            name: 'PROJECT PLAN',
            width: 160,
            renderHeaderCell: PlainHeaderCell,
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
        // 11. Implementation Target
        {
            key: 'implementationTarget',
            name: 'IMPLEMENTATION TARGET',
            width: 210,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className="text-xs text-gray-700">
                    {row.implementationTarget ? dayjs(row.implementationTarget).format('DD-MMM-YYYY') : '-'}
                </span>
            )
        },
        // 12. Status
        {
            key: 'status',
            name: 'STATUS',
            width: 145,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getStatusColor(row.status)}`}>
                    {row.status}
                </span>
            )
        },
        // 13. Implementation Visibility
        {
            key: 'implementationVisibility',
            name: 'IMPLEMENTATION VISIBILITY',
            width: 225,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => {
                const val = row.implementationVisibility;
                if (!val) return <span className="text-[10px] text-gray-400">-</span>;
                const colorMap = {
                    'High': 'text-green-700 bg-green-50 border-green-200',
                    'Medium': 'text-amber-700 bg-amber-50 border-amber-200',
                    'Low': 'text-red-700 bg-red-50 border-red-200',
                };
                const cls = colorMap[val] || 'text-gray-700 bg-gray-50 border-gray-200';
                return (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${cls}`}>
                        {val}
                    </span>
                );
            }
        },
        // 14. Current Stage
        {
            key: 'currentStage',
            name: 'CURRENT STAGE',
            width: 185,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${getStageColor(row.currentStage)}`}>
                    {row.currentStage || '-'}
                </span>
            )
        },
        // 15. Remarks
        {
            key: 'remarks',
            name: 'REMARKS',
            width: 220,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className="text-xs text-gray-500 truncate">{row.remarks || '-'}</span>
            )
        },
        // 16. Drawing (image / PDF / Word / Excel)
        {
            key: 'drawing',
            name: 'DRAWING / FILE',
            width: 160,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {row.drawingUrl ? (
                        <Button
                            size="small"
                            icon={<Download size={14} />}
                            className="text-tvs-blue text-[10px]"
                            onClick={() => handleDownloadDrawing(row.drawingUrl, row.drawingFileName)}
                        >
                            Download
                        </Button>
                    ) : (
                        <Upload
                            beforeUpload={(file) => handleFileUpload(row._id, file)}
                            showUploadList={false}
                            accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.pdf,.doc,.docx,.xls,.xlsx"
                        >
                            <Button size="small" icon={<UploadIcon size={14} />} className="text-[10px]">
                                Upload
                            </Button>
                        </Upload>
                    )}
                </div>
            )
        },
        // 17. Actions
        {
            key: 'actions',
            name: 'ACTIONS',
            width: 120,
            sortable: false,
            renderHeaderCell: PlainHeaderCell,
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [
        filteredTrackers,
        columnFilters,
        activeFilterKey,
        filterSearchText,
        frozenColumns,
        mhRequests,
        requestsLoading,
    ]);

    // react-data-grid requires frozen columns to be CONTIGUOUS at the START of the array.
    // So we reorder: [serial] → [user-frozen cols] → [remaining cols], each with frozen: true/false.
    const autoFitColumns = useMemo(() => {
        const serial = dataGridColumns.find(c => c.key === 'serial');
        const frozen = dataGridColumns.filter(c => c.key !== 'serial' && frozenColumns.has(c.key));
        const rest = dataGridColumns.filter(c => c.key !== 'serial' && !frozenColumns.has(c.key));
        return [
            { ...serial, frozen: true },
            ...frozen.map(c => ({ ...c, frozen: true })),
            ...rest.map(c => ({ ...c, frozen: false })),
        ];
    }, [dataGridColumns, frozenColumns]);

    // Freeze popup - column options (exclude serial)
    const freezableColumns = dataGridColumns.filter(c => c.key !== 'serial');

    const handleFreezeButtonClick = () => {
        setPendingFrozen(new Set(frozenColumns));
        setFreezePopupVisible(true);
    };

    const handleFreezeApply = () => {
        setFrozenColumns(new Set(pendingFrozen));
        setFreezePopupVisible(false);
    };

    useEffect(() => {
        if (!gridContainerRef.current) return;
        const updateWidth = () => setGridWidth(gridContainerRef.current.clientWidth);
        updateWidth();
        const observer = new ResizeObserver(updateWidth);
        observer.observe(gridContainerRef.current);
        return () => observer.disconnect();
    }, []);

    const gridRows = applyColumnFilters(filteredTrackers);

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                {/* Table toolbar */}
                <div className="px-6 pt-4 pb-2 flex items-center gap-3">
                    {/* Freeze Column Button + Popup */}
                    <div className="relative" ref={freezePopupRef}>
                        <button
                            onClick={handleFreezeButtonClick}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${frozenColumns.size > 0
                                ? 'bg-tvs-blue text-white border-tvs-blue shadow-sm'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-tvs-blue hover:text-tvs-blue'
                                }`}
                        >
                            <Pin size={13} />
                            Freeze Columns
                            {frozenColumns.size > 0 && (
                                <span className="ml-1 bg-white/30 text-white rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                                    {frozenColumns.size}
                                </span>
                            )}
                        </button>

                        {freezePopupVisible && (
                            <div className="absolute z-50 top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Pin size={13} className="text-tvs-blue" />
                                        <span className="text-xs font-bold text-gray-700">Freeze Columns</span>
                                    </div>
                                    <button
                                        onClick={() => setFreezePopupVisible(false)}
                                        className="text-gray-400 hover:text-gray-600 text-xs"
                                    >
                                        ✕
                                    </button>
                                </div>

                                {/* Always-frozen note */}
                                <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg mb-2">
                                    <input type="checkbox" checked readOnly className="w-3 h-3 accent-tvs-blue" />
                                    <span className="text-[11px] text-gray-400 italic">S.no (always frozen)</span>
                                </div>

                                {/* Scrollable column list */}
                                <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                                    {freezableColumns.map(col => (
                                        <label
                                            key={col.key}
                                            className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer group"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={pendingFrozen.has(col.key)}
                                                onChange={() => {
                                                    setPendingFrozen(prev => {
                                                        const next = new Set(prev);
                                                        next.has(col.key) ? next.delete(col.key) : next.add(col.key);
                                                        return next;
                                                    });
                                                }}
                                                className="w-3.5 h-3.5 accent-tvs-blue flex-shrink-0"
                                            />
                                            <span className="text-[11px] text-gray-700 font-medium group-hover:text-tvs-blue transition-colors truncate">
                                                {col.name}
                                            </span>
                                        </label>
                                    ))}
                                </div>

                                {/* Footer actions */}
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                                    <button
                                        onClick={() => setPendingFrozen(new Set())}
                                        className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-[11px] font-semibold text-gray-500 hover:bg-gray-50 transition-all"
                                    >
                                        Clear All
                                    </button>
                                    <button
                                        onClick={handleFreezeApply}
                                        className="flex-1 px-3 py-1.5 rounded-lg bg-tvs-blue text-white text-[11px] font-semibold hover:bg-blue-700 transition-all shadow-sm"
                                    >
                                        Apply
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-6 pb-4">
                    <div ref={gridContainerRef} className="w-full h-[620px] border border-gray-200 rounded-xl overflow-hidden bg-white relative">
                        <div className="h-full">
                            <DataGrid
                                columns={autoFitColumns}
                                rows={gridRows}
                                rowKeyGetter={(row) => row._id || row.assetRequestId}
                                className="rdg-light mh-development-grid"
                                style={{ blockSize: '100%' }}
                                rowHeight={44}
                                headerRowHeight={52}
                                defaultColumnOptions={{ resizable: true, minWidth: 100 }}
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

            {/* Edit Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-3 pb-4 border-b">
                        <div className="p-2 bg-tvs-blue/10 rounded-lg text-tvs-blue">
                            <Edit size={20} />
                        </div>
                        <span className="text-xl font-bold">Update Tracker</span>
                    </div>
                }
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={() => setIsModalVisible(false)}
                okText="Update"
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
                            <Select size="large" placeholder="Select Asset Request" showSearch optionFilterProp="children" onChange={handleAssetRequestChange} loading={requestsLoading} allowClear>
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
                        <Form.Item name="status" label={<span className="text-xs font-bold uppercase text-gray-500">Status (Auto)</span>}>
                            <Input size="large" disabled />
                        </Form.Item>
                        <Form.Item name="currentStage" label={<span className="text-xs font-bold uppercase text-gray-500">Current Stage (Auto)</span>}>
                            <Input size="large" disabled />
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
                onCancel={() => { setVendorPopupVisible(false); setSelectedPlantLocation(null); }}
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
