import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Plus, Star, Download, Upload, Eye, Edit, Trash2, Calendar, TrendingUp, Filter as FilterIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVendorScores, createVendorScore, updateVendorScore, deleteVendorScore, fetchVendorPerformance } from '../../redux/slices/vendorScoringSlice';
import { fetchVendors } from '../../redux/slices/vendorSlice';
import { Modal, Select, InputNumber, Form, DatePicker } from 'antd';
import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import * as XLSX from 'xlsx';
import { Line, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import dayjs from 'dayjs';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const { confirm } = Modal;
const { Option } = Select;

const VendorScoring = () => {
    const dispatch = useDispatch();
    const fileInputRef = useRef();
    const [form] = Form.useForm();

    const { items: scores, loading, error } = useSelector((state) => state.vendorScoring);
    const { items: vendors } = useSelector((state) => state.vendors);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isPerformanceModalVisible, setIsPerformanceModalVisible] = useState(false);
    const [editingScore, setEditingScore] = useState(null);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [performanceData, setPerformanceData] = useState(null);
    const [tempScores, setTempScores] = useState({ qsr: 1, cost: 1, delivery: 1 });
    const [columnFilters, setColumnFilters] = useState({});
    const [activeFilterKey, setActiveFilterKey] = useState(null);
    const [filterSearchText, setFilterSearchText] = useState({});
    const [gridWidth, setGridWidth] = useState(0);
    const gridContainerRef = useRef(null);

    useEffect(() => {
        dispatch(fetchVendorScores());
        dispatch(fetchVendors());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            toast.error(error);
        }
    }, [error]);

    const calculateQCD = (qsr, cost, delivery) => {
        return parseFloat(((qsr * 0.4) + (cost * 0.3) + (delivery * 0.3)).toFixed(2));
    };

    // Handle vendor selection - auto-fill vendor details
    const handleVendorSelect = (vendorId) => {
        const vendor = vendors.find(v => v._id === vendorId);
        if (vendor) {
            setSelectedVendor(vendor);
            form.setFieldsValue({
                vendorId,
                vendorCode: vendor.vendorCode,
                vendorName: vendor.vendorName,
                location: vendor.vendorLocation
            });
        }
    };

    const handleAddClick = () => {
        setEditingScore(null);
        setSelectedVendor(null);
        setTempScores({ qsr: 1, cost: 1, delivery: 1 });
        form.resetFields();
        // Set default to current month/year
        form.setFieldsValue({
            scoringMonth: new Date().getMonth() + 1,
            scoringYear: new Date().getFullYear(),
            qsrScore: 1,
            costScore: 1,
            deliveryScore: 1,
            completionRate: 0,
            delayRate: 0
        });
        setIsModalVisible(true);
    };

    const handleEditClick = (score) => {
        setEditingScore(score);
        setSelectedVendor(null); // Vendor details are read-only in edit mode
        setTempScores({
            qsr: score.qsrScore,
            cost: score.costScore,
            delivery: score.deliveryScore
        });
        form.setFieldsValue({
            vendorId: score.vendorId,
            vendorCode: score.vendorCode,
            vendorName: score.vendorName,
            location: score.location,
            scoringMonth: score.scoringMonth,
            scoringYear: score.scoringYear,
            qsrScore: score.qsrScore,
            costScore: score.costScore,
            deliveryScore: score.deliveryScore,
            completionRate: score.completionRate || 0,
            delayRate: score.delayRate || 0,
            remarks: score.remarks || ''
        });
        setIsModalVisible(true);
    };

    const handleViewPerformance = async (score) => {
        try {
            console.log('Fetching performance for score:', score);
            console.log('Vendor ID raw:', score.vendorId);
            console.log('Vendor ID type:', typeof score.vendorId);

            if (!score.vendorId) {
                toast.error('Vendor ID is missing. Please recreate this score entry.');
                return;
            }

            // Extract vendorId string - handle all possible formats
            let vendorIdString = score.vendorId;

            // If it's an object with _id property
            if (typeof vendorIdString === 'object' && vendorIdString !== null) {
                if (vendorIdString._id) {
                    vendorIdString = vendorIdString._id;
                } else if (vendorIdString.$oid) {
                    vendorIdString = vendorIdString.$oid;
                } else {
                    vendorIdString = vendorIdString.toString();
                }
            }

            // Convert to string if it has toString method
            if (vendorIdString && typeof vendorIdString.toString === 'function' && typeof vendorIdString !== 'string') {
                vendorIdString = vendorIdString.toString();
            }

            console.log('Vendor ID String (final):', vendorIdString);
            console.log('Vendor ID String type:', typeof vendorIdString);

            const result = await dispatch(fetchVendorPerformance({
                vendorId: vendorIdString,
                year: new Date().getFullYear()
            }));

            console.log('Performance result:', result);

            if (fetchVendorPerformance.fulfilled.match(result)) {
                setPerformanceData(result.payload.data);
                setIsPerformanceModalVisible(true);
            } else {
                toast.error(result.payload || 'Failed to load performance data');
            }
        } catch (error) {
            console.error('Performance fetch error:', error);
            toast.error('Failed to load performance data');
        }
    };

    const handleDeleteClick = (id) => {
        confirm({
            title: 'Delete Vendor Score',
            content: 'Are you sure you want to delete this vendor score?',
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            onOk: async () => {
                const result = await dispatch(deleteVendorScore(id));
                if (deleteVendorScore.fulfilled.match(result)) {
                    toast.success('Vendor score deleted successfully');
                }
            }
        });
    };

    const handleModalOk = async () => {
        try {
            console.log('Form submission started...');
            const values = await form.validateFields();
            console.log('Form values:', values);

            if (editingScore) {
                const updateData = {
                    vendorId: editingScore.vendorId,
                    vendorCode: editingScore.vendorCode,
                    vendorName: editingScore.vendorName,
                    location: editingScore.location,
                    scoringMonth: editingScore.scoringMonth,
                    scoringYear: editingScore.scoringYear,
                    qsrScore: values.qsrScore,
                    costScore: values.costScore,
                    deliveryScore: values.deliveryScore,
                    completionRate: values.completionRate,
                    delayRate: values.delayRate,
                    remarks: values.remarks
                };

                console.log('Updating score:', editingScore._id, updateData);
                const result = await dispatch(updateVendorScore({
                    id: editingScore._id,
                    scoreData: updateData
                }));

                console.log('Update result:', result);
                if (updateVendorScore.fulfilled.match(result)) {
                    toast.success('Vendor score updated successfully');
                    setIsModalVisible(false);
                    dispatch(fetchVendorScores()); // Refresh list
                } else {
                    toast.error(result.payload || 'Failed to update vendor score');
                }
            } else {
                // Create new
                console.log('Creating new score with values:', values);
                const result = await dispatch(createVendorScore(values));
                console.log('Create result:', result);

                if (createVendorScore.fulfilled.match(result)) {
                    toast.success('Vendor score created successfully');
                    setIsModalVisible(false);
                    dispatch(fetchVendorScores()); // Refresh list
                } else {
                    const errorMsg = result.payload || result.error?.message || 'Failed to create vendor score';
                    console.error('Create failed:', errorMsg);
                    toast.error(errorMsg);
                }
            }
        } catch (err) {
            console.error('Form validation or submission error:', err);
            if (err.errorFields) {
                toast.error('Please fill in all required fields');
            } else {
                toast.error(err.message || 'An error occurred');
            }
        }
    };

    const handleScoreChange = (field, value) => {
        setTempScores(prev => ({ ...prev, [field]: value || 0 }));
    };

    const handleDownloadTemplate = () => {
        const template = [
            {
                'Vendor Code': 'VEND001',
                'Scoring Month': 1,
                'Scoring Year': 2026,
                'QSR Score': 4,
                'Cost Score': 3,
                'Delivery Score': 5,
                'Completion Rate': 95,
                'Delay Rate': 5,
                'Remarks': 'Good performance'
            }
        ];

        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Vendor Scoring Template');
        XLSX.writeFile(wb, 'vendor_scoring_template.xlsx');
        toast.success('Template downloaded successfully');
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

                // Transform data
                const transformedData = jsonData.map(row => ({
                    vendorCode: row['Vendor Code'] || row['vendorCode'],
                    scoringMonth: Number(row['Scoring Month'] || row['scoringMonth']),
                    scoringYear: Number(row['Scoring Year'] || row['scoringYear']),
                    qsrScore: Number(row['QSR Score'] || row['qsrScore']),
                    costScore: Number(row['Cost Score'] || row['costScore']),
                    deliveryScore: Number(row['Delivery Score'] || row['deliveryScore']),
                    completionRate: Number(row['Completion Rate'] || row['completionRate'] || 0),
                    delayRate: Number(row['Delay Rate'] || row['delayRate'] || 0),
                    remarks: row['Remarks'] || row['remarks'] || ''
                }));

                console.log('Importing scores:', transformedData);
                toast.success(`${transformedData.length} scores ready to import`);

                // TODO: Implement bulk import
                // dispatch(bulkImportVendorScores(transformedData));
            } catch (error) {
                console.error('Error parsing file:', error);
                toast.error('Error parsing file. Please check the format.');
            }
        };

        reader.readAsArrayBuffer(file);
        event.target.value = '';
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
        (scores || []).forEach(row => {
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
                    <FilterIcon size={10} />
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

    const gridRows = applyColumnFilters(scores || []);

    const dataGridColumns = [
        {
            key: 'serial',
            name: '#',
            width: 80,
            frozen: true,
            renderCell: ({ rowIdx }) => (
                <span className="font-semibold text-gray-700">{rowIdx + 1}</span>
            )
        },
        {
            key: 'vendorCode',
            name: 'VENDOR CODE',
            width: 160,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className="font-semibold text-gray-900">{row.vendorCode}</span>
            )
        },
        {
            key: 'vendorName',
            name: 'VENDOR NAME',
            width: 220,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className="font-semibold text-gray-900">{row.vendorName}</span>
            )
        },
        {
            key: 'location',
            name: 'LOCATION',
            width: 180,
            renderHeaderCell: FilterHeaderCell
        },
        {
            key: 'qsrScore',
            name: 'QSR (40%)',
            width: 140,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex items-center gap-1 font-bold text-gray-700">
                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                    {row.qsrScore}
                </div>
            )
        },
        {
            key: 'costScore',
            name: 'COST (30%)',
            width: 140,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex items-center gap-1 font-bold text-gray-700">
                    <Star size={14} className="text-blue-500 fill-blue-500" />
                    {row.costScore}
                </div>
            )
        },
        {
            key: 'deliveryScore',
            name: 'ONTIME DELIVERY (30%)',
            width: 200,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex items-center gap-1 font-bold text-gray-700">
                    <Star size={14} className="text-green-500 fill-green-500" />
                    {row.deliveryScore}
                </div>
            )
        },
        {
            key: 'qcdScore',
            name: 'QCD SCORE',
            width: 160,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <div className="bg-tvs-blue/10 text-tvs-blue font-black px-3 py-1 rounded-lg border border-tvs-blue/20 text-center">
                    {row.qcdScore}
                </div>
            )
        },
        {
            key: 'actions',
            name: 'ACTIONS',
            width: 220,
            sortable: false,
            renderCell: ({ row }) => (
                <div className="flex items-center justify-center gap-2">
                    <button
                        onClick={() => handleViewPerformance(row)}
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all"
                        title="View Performance"
                    >
                        <Eye size={16} />
                    </button>
                    <button
                        onClick={() => handleEditClick(row)}
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                        title="Edit Scores"
                    >
                        <Edit size={16} />
                    </button>
                    <button
                        onClick={() => handleDeleteClick(row._id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Delete Score"
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



    // Chart data for performance modal
    const getMonthlyChartData = () => {
        if (!performanceData?.monthlyPerformance) return null;

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const data = performanceData.monthlyPerformance;

        return {
            labels: data.map(d => months[d.scoringMonth - 1]),
            datasets: [
                {
                    label: 'QCD Score',
                    data: data.map(d => d.qcdScore),
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Completion Rate',
                    data: data.map(d => d.completionRate),
                    borderColor: 'rgb(16, 185, 129)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        };
    };

    const getYearlyChartData = () => {
        if (!performanceData?.yearlyPerformance) return null;

        const data = performanceData.yearlyPerformance;

        return {
            labels: data.map(d => d._id),
            datasets: [
                {
                    label: 'Average QCD Score',
                    data: data.map(d => d.avgQcdScore.toFixed(2)),
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                }
            ]
        };
    };

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
        <div className="bg-gradient-to-br from-white to-gray-50/30 rounded-xl shadow-lg border border-gray-200/60 overflow-hidden fade-in">

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
            />

            {/* AG Grid Table */}
            <div className="px-8 py-6">
                <div className="mb-5 flex items-center justify-between bg-gradient-to-r from-white to-gray-50 px-6 py-4 rounded-xl border border-gray-200/80 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-bold text-gray-700">Showing <span className="text-emerald-700">{scores?.length || 0}</span> scores</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleAddClick}
                            className="flex items-center gap-2 bg-gradient-to-r from-tvs-blue to-blue-600 px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all"
                        >
                            <Plus size={20} /> Add Score
                        </button>
                        <button
                            onClick={handleDownloadTemplate}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl font-semibold transform hover:scale-105 active:scale-95"
                        >
                            <Download size={20} />
                            Template
                        </button>
                        <button
                            onClick={handleImportClick}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl font-semibold transform hover:scale-105 active:scale-95"
                        >
                            <Upload size={20} />
                            Import Excel
                        </button>
                    </div>
                </div>

                <div
                    ref={gridContainerRef}
                    className="w-full h-[620px] border border-gray-200 rounded-xl overflow-hidden bg-white relative"
                >
                    <div className="h-full">
                        <DataGrid
                            columns={autoFitColumns}
                            rows={gridRows}
                            rowKeyGetter={(row) => row._id}
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

            {/* Footer */}
            <div className="px-8 py-5 border-t border-gray-200/80 bg-gradient-to-r from-gray-50/50 to-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">Showing</span>
                        <span className="px-2.5 py-1 bg-tvs-blue/10 text-tvs-blue rounded-lg font-bold">{scores?.length || 0}</span>
                        <span className="text-gray-600">of</span>
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg font-bold">{scores?.length || 0}</span>
                        <span className="text-gray-600">vendor scores</span>
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <Star size={20} className="text-tvs-blue" />
                        <span className="text-xl font-bold text-gray-900">{editingScore ? 'Update Vendor Score' : 'Add Vendor Score'}</span>
                    </div>
                }
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={() => setIsModalVisible(false)}
                okText={editingScore ? "Update Score" : "Create Score"}
                cancelText="Cancel"
                width={800}
                centered
                okButtonProps={{ className: 'bg-tvs-blue hover:bg-tvs-blue/90' }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    className="mt-6"
                >
                    {/* Vendor Selection (only for new scores) */}
                    {!editingScore && (
                        <Form.Item
                            name="vendorId"
                            label={<span className="text-xs font-bold text-gray-600 uppercase">Select Vendor</span>}
                            rules={[{ required: true, message: 'Please select a vendor' }]}
                        >
                            <Select
                                showSearch
                                placeholder="Select vendor from Vendor Master"
                                optionFilterProp="children"
                                onChange={handleVendorSelect}
                                className="w-full"
                                size="large"
                            >
                                {vendors?.map(vendor => (
                                    <Option key={vendor._id} value={vendor._id}>
                                        {vendor.vendorCode} - {vendor.vendorName}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    )}

                    {/* Auto-filled Vendor Details (Read-only) */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <Form.Item
                            name="vendorCode"
                            label={<span className="text-xs font-bold text-gray-600 uppercase">Vendor Code</span>}
                        >
                            <input
                                className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg font-semibold text-gray-700"
                                disabled
                            />
                        </Form.Item>
                        <Form.Item
                            name="vendorName"
                            label={<span className="text-xs font-bold text-gray-600 uppercase">Vendor Name</span>}
                        >
                            <input
                                className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg font-semibold text-gray-700"
                                disabled
                            />
                        </Form.Item>
                        <Form.Item
                            name="location"
                            label={<span className="text-xs font-bold text-gray-600 uppercase">Location</span>}
                        >
                            <input
                                className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg font-semibold text-gray-700"
                                disabled
                            />
                        </Form.Item>
                    </div>

                    {/* Scoring Period */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <Form.Item
                            name="scoringMonth"
                            label={<span className="text-xs font-bold text-gray-600 uppercase">Scoring Month</span>}
                            rules={[{ required: true, message: 'Required' }]}
                        >
                            <Select size="large" disabled={!!editingScore}>
                                {['January', 'February', 'March', 'April', 'May', 'June',
                                    'July', 'August', 'September', 'October', 'November', 'December'].map((month, idx) => (
                                        <Option key={idx + 1} value={idx + 1}>{month}</Option>
                                    ))}
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="scoringYear"
                            label={<span className="text-xs font-bold text-gray-600 uppercase">Scoring Year</span>}
                            rules={[{ required: true, message: 'Required' }]}
                        >
                            <InputNumber
                                className="w-full"
                                size="large"
                                min={2020}
                                max={2100}
                                disabled={!!editingScore}
                            />
                        </Form.Item>
                    </div>

                    {/* Performance Scores */}
                    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-4">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Star size={16} className="text-yellow-500" />
                            PERFORMANCE METRICS (1-5 SCALE)
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            <Form.Item
                                name="qsrScore"
                                label={<span className="text-xs font-bold text-gray-500 uppercase">QSR (40%)</span>}
                                rules={[{ required: true, type: 'number', min: 1, max: 5 }]}
                            >
                                <InputNumber
                                    className="w-full"
                                    size="large"
                                    min={1}
                                    max={5}
                                    onChange={(v) => handleScoreChange('qsr', v)}
                                />
                            </Form.Item>
                            <Form.Item
                                name="costScore"
                                label={<span className="text-xs font-bold text-gray-500 uppercase">Cost (30%)</span>}
                                rules={[{ required: true, type: 'number', min: 1, max: 5 }]}
                            >
                                <InputNumber
                                    className="w-full"
                                    size="large"
                                    min={1}
                                    max={5}
                                    onChange={(v) => handleScoreChange('cost', v)}
                                />
                            </Form.Item>
                            <Form.Item
                                name="deliveryScore"
                                label={<span className="text-xs font-bold text-gray-500 uppercase">Delivery (30%)</span>}
                                rules={[{ required: true, type: 'number', min: 1, max: 5 }]}
                            >
                                <InputNumber
                                    className="w-full"
                                    size="large"
                                    min={1}
                                    max={5}
                                    onChange={(v) => handleScoreChange('delivery', v)}
                                />
                            </Form.Item>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-200 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-gray-400 uppercase">Calculated QCD Score</span>
                                <div className="text-3xl font-black text-tvs-blue mt-1">
                                    {calculateQCD(tempScores.qsr, tempScores.cost, tempScores.delivery)}
                                </div>
                            </div>
                        </div>
                    </div>
                </Form>
            </Modal>

            {/* Enhanced Performance Analytics Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
                            <TrendingUp size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900">Performance Analytics</h2>
                            <p className="text-sm text-gray-500 font-normal">Comprehensive vendor performance insights</p>
                        </div>
                    </div>
                }
                open={isPerformanceModalVisible}
                onCancel={() => setIsPerformanceModalVisible(false)}
                footer={null}
                width={1200}
                centered
                className="performance-modal"
            >
                {performanceData && (
                    <div className="py-6">
                        {/* Vendor Header Card */}
                        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 rounded-2xl border-2 border-indigo-100 mb-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 mb-2">{performanceData.vendor.vendorName}</h3>
                                    <div className="flex items-center gap-4 text-sm">
                                        <span className="px-3 py-1 bg-white rounded-full font-bold text-indigo-600 border border-indigo-200">
                                            {performanceData.vendor.vendorCode}
                                        </span>
                                        <span className="text-gray-600 flex items-center gap-1">
                                            <Calendar size={14} />
                                            {performanceData.vendor.vendorLocation}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-gray-500 uppercase mb-1">Performance Rating</div>
                                    <div className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                        {performanceData.overallStats.avgOverallScore}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {performanceData.overallStats.avgOverallScore >= 4.5 ? '⭐ Excellent' :
                                            performanceData.overallStats.avgOverallScore >= 4.0 ? '🌟 Very Good' :
                                                performanceData.overallStats.avgOverallScore >= 3.5 ? '✨ Good' :
                                                    performanceData.overallStats.avgOverallScore >= 3.0 ? '📊 Average' : '⚠️ Needs Improvement'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Live Production Insights (NEW) */}
                        {performanceData.liveInsight && (
                            <div className="bg-gray-900 rounded-2xl p-6 mb-6 overflow-hidden relative shadow-xl">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Zap size={120} className="text-white" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="px-2 py-0.5 bg-amber-500 text-white text-[10px] font-black uppercase rounded shadow-sm">Live Strategy</div>
                                        <h4 className="text-lg font-black text-white uppercase tracking-tight">Production Execution Intelligence</h4>
                                    </div>
                                    <div className="grid grid-cols-4 gap-6">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">On-Track Rate</span>
                                            <div className="flex items-end gap-2">
                                                <span className="text-3xl font-black text-white">{performanceData.liveInsight.onTrackRate}%</span>
                                                <div className={`mb-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-${performanceData.liveInsight.statusColor}-500/20 text-${performanceData.liveInsight.statusColor}-400`}>
                                                    {performanceData.liveInsight.reliabilityIndex} Reliability
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col border-l border-gray-800 pl-6">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Jobs Completed</span>
                                            <div className="flex items-end gap-2">
                                                <span className="text-3xl font-black text-white">{performanceData.liveInsight.completedProjects}</span>
                                                <span className="text-xs text-gray-500 mb-1">of {performanceData.liveInsight.totalActiveProjects} total</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col border-l border-gray-800 pl-6">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Execution Efficiency</span>
                                            <div className="w-full bg-gray-800 h-2 rounded-full mt-3 overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000"
                                                    style={{ width: `${performanceData.liveInsight.completionRate}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-[10px] text-gray-500 mt-1 font-bold">{performanceData.liveInsight.completionRate}% Efficiency Index</span>
                                        </div>
                                        <div className="flex items-center justify-end">
                                            <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
                                                <div className="flex flex-col text-right">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase">Live Pulse</span>
                                                    <span className="text-xs font-black text-emerald-400 uppercase">Synchronized</span>
                                                </div>
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Score Breakdown */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-white p-5 rounded-xl border-2 border-gray-200">
                                <div className="text-xs font-bold text-gray-500 uppercase mb-3">QSR Score (40%)</div>
                                <div className="flex items-end justify-between">
                                    <div className="text-3xl font-black text-indigo-600">
                                        {performanceData.overallStats.avgQSR || 'N/A'}
                                    </div>
                                    <div className="h-2 flex-1 mx-4 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                                            style={{ width: `${(performanceData.overallStats.avgQSR / 5) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-xl border-2 border-gray-200">
                                <div className="text-xs font-bold text-gray-500 uppercase mb-3">Cost Score (30%)</div>
                                <div className="flex items-end justify-between">
                                    <div className="text-3xl font-black text-emerald-600">
                                        {performanceData.overallStats.avgCost || 'N/A'}
                                    </div>
                                    <div className="h-2 flex-1 mx-4 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
                                            style={{ width: `${(performanceData.overallStats.avgCost / 5) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-5 rounded-xl border-2 border-gray-200">
                                <div className="text-xs font-bold text-gray-500 uppercase mb-3">Delivery Score (30%)</div>
                                <div className="flex items-end justify-between">
                                    <div className="text-3xl font-black text-purple-600">
                                        {performanceData.overallStats.avgDelivery || 'N/A'}
                                    </div>
                                    <div className="h-2 flex-1 mx-4 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
                                            style={{ width: `${(performanceData.overallStats.avgDelivery / 5) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Monthly Performance Chart */}
                        {performanceData.monthlyPerformance && performanceData.monthlyPerformance.length > 0 && (
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
                                        Monthly Performance Trend ({performanceData.currentYear})
                                    </h4>
                                    <span className="text-xs text-gray-500">{performanceData.monthlyPerformance.length} months tracked</span>
                                </div>
                                <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm">
                                    <Line
                                        data={{
                                            labels: performanceData.monthlyPerformance.map(m => {
                                                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                                return monthNames[m.month - 1];
                                            }),
                                            datasets: [
                                                {
                                                    label: 'QCD Score',
                                                    data: performanceData.monthlyPerformance.map(m => m.avgScore),
                                                    borderColor: 'rgb(99, 102, 241)',
                                                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                                    tension: 0.4,
                                                    fill: true,
                                                    pointRadius: 6,
                                                    pointHoverRadius: 8,
                                                    pointBackgroundColor: 'rgb(99, 102, 241)',
                                                    pointBorderColor: '#fff',
                                                    pointBorderWidth: 2,
                                                },
                                                {
                                                    label: 'QSR',
                                                    data: performanceData.monthlyPerformance.map(m => m.avgQSR),
                                                    borderColor: 'rgb(16, 185, 129)',
                                                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                                                    tension: 0.4,
                                                    pointRadius: 4,
                                                    pointHoverRadius: 6,
                                                    borderDash: [5, 5],
                                                },
                                                {
                                                    label: 'Cost',
                                                    data: performanceData.monthlyPerformance.map(m => m.avgCost),
                                                    borderColor: 'rgb(168, 85, 247)',
                                                    backgroundColor: 'rgba(168, 85, 247, 0.05)',
                                                    tension: 0.4,
                                                    pointRadius: 4,
                                                    pointHoverRadius: 6,
                                                    borderDash: [5, 5],
                                                },
                                                {
                                                    label: 'Delivery',
                                                    data: performanceData.monthlyPerformance.map(m => m.avgDelivery),
                                                    borderColor: 'rgb(245, 158, 11)',
                                                    backgroundColor: 'rgba(245, 158, 11, 0.05)',
                                                    tension: 0.4,
                                                    pointRadius: 4,
                                                    pointHoverRadius: 6,
                                                    borderDash: [5, 5],
                                                }
                                            ]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: true,
                                            aspectRatio: 2.5,
                                            plugins: {
                                                legend: {
                                                    position: 'top',
                                                    labels: {
                                                        usePointStyle: true,
                                                        padding: 15,
                                                        font: { size: 12, weight: 'bold' }
                                                    }
                                                },
                                                tooltip: {
                                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                    padding: 12,
                                                    titleFont: { size: 14, weight: 'bold' },
                                                    bodyFont: { size: 13 },
                                                    borderColor: 'rgba(255, 255, 255, 0.2)',
                                                    borderWidth: 1,
                                                }
                                            },
                                            scales: {
                                                y: {
                                                    beginAtZero: true,
                                                    max: 5,
                                                    ticks: {
                                                        font: { size: 11, weight: 'bold' },
                                                        color: '#6B7280'
                                                    },
                                                    grid: {
                                                        color: 'rgba(0, 0, 0, 0.05)'
                                                    }
                                                },
                                                x: {
                                                    ticks: {
                                                        font: { size: 11, weight: 'bold' },
                                                        color: '#6B7280'
                                                    },
                                                    grid: {
                                                        display: false
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Yearly Performance Chart */}
                        {performanceData.yearlyPerformance && performanceData.yearlyPerformance.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <div className="w-1 h-6 bg-gradient-to-b from-emerald-500 to-teal-500 rounded-full"></div>
                                        Yearly Average Performance Comparison
                                    </h4>
                                    <span className="text-xs text-gray-500">{performanceData.yearlyPerformance.length} years tracked</span>
                                </div>
                                <div className="bg-white p-6 rounded-xl border-2 border-gray-200 shadow-sm">
                                    <Bar
                                        data={{
                                            labels: performanceData.yearlyPerformance.map(y => y.year),
                                            datasets: [
                                                {
                                                    label: 'Average QCD Score',
                                                    data: performanceData.yearlyPerformance.map(y => y.avgScore),
                                                    backgroundColor: performanceData.yearlyPerformance.map((y, i) =>
                                                        `rgba(${99 + i * 20}, ${102 + i * 15}, 241, ${0.7 + i * 0.1})`
                                                    ),
                                                    borderColor: performanceData.yearlyPerformance.map(() => 'rgb(99, 102, 241)'),
                                                    borderWidth: 2,
                                                    borderRadius: 8,
                                                    barThickness: 60,
                                                }
                                            ]
                                        }}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: true,
                                            aspectRatio: 3,
                                            plugins: {
                                                legend: {
                                                    display: false
                                                },
                                                tooltip: {
                                                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                                    padding: 12,
                                                    titleFont: { size: 14, weight: 'bold' },
                                                    bodyFont: { size: 13 },
                                                    callbacks: {
                                                        afterBody: (context) => {
                                                            const yearData = performanceData.yearlyPerformance[context[0].dataIndex];
                                                            return [
                                                                '',
                                                                `Total Scores: ${yearData.totalScores}`,
                                                                `QSR: ${yearData.avgQSR}`,
                                                                `Cost: ${yearData.avgCost}`,
                                                                `Delivery: ${yearData.avgDelivery}`
                                                            ];
                                                        }
                                                    }
                                                }
                                            },
                                            scales: {
                                                y: {
                                                    beginAtZero: true,
                                                    max: 5,
                                                    ticks: {
                                                        font: { size: 11, weight: 'bold' },
                                                        color: '#6B7280'
                                                    },
                                                    grid: {
                                                        color: 'rgba(0, 0, 0, 0.05)'
                                                    }
                                                },
                                                x: {
                                                    ticks: {
                                                        font: { size: 12, weight: 'bold' },
                                                        color: '#374151'
                                                    },
                                                    grid: {
                                                        display: false
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* No Data Message */}
                        {(!performanceData.monthlyPerformance || performanceData.monthlyPerformance.length === 0) && (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                                <BarChart size={48} className="mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-600 font-semibold">No performance data available</p>
                                <p className="text-sm text-gray-500 mt-2">Add more vendor scores to see analytics</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default VendorScoring;
