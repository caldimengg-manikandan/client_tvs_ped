import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Download, AlertCircle, Edit3, Upload, Filter as FilterIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVendorLoading, updateVendorLoading, bulkImportVendorLoading } from '../../redux/slices/vendorLoadingSlice';
import { fetchVendorScores, updateVendorScore } from '../../redux/slices/vendorScoringSlice';
import { Modal, Form, InputNumber } from 'antd';
import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import FreezeToolbar from '../../components/FreezeToolbar';
import FrozenRowsDataGrid from '../../components/FrozenRowsDataGrid';
import ColumnCustomizer from '../../components/ColumnCustomizer';
import * as XLSX from 'xlsx';
import api from '../../api/axiosConfig';

const VendorLoadingChart = () => {
    const dispatch = useDispatch();
    const [form] = Form.useForm();

    const { items: loadingData, loading, error } = useSelector((state) => state.vendorLoading);
    const { items: scores } = useSelector((state) => state.vendorScoring);

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [isProjectModalVisible, setIsProjectModalVisible] = useState(false);
    const [projectModalVendor, setProjectModalVendor] = useState(null);
    const [projectRows, setProjectRows] = useState([]);
    const [columnFilters, setColumnFilters] = useState({});
    const [activeFilterKey, setActiveFilterKey] = useState(null);
    const [filterSearchText, setFilterSearchText] = useState({});
    const [gridWidth, setGridWidth] = useState(0);
    const [frozenKeys, setFrozenKeys] = useState(new Set());
    const [frozenRowCount, setFrozenRowCount] = useState(0);
    const [hiddenKeys, setHiddenKeys] = useState(new Set());
    const [rowHeight, setRowHeight] = useState(48);
    const [headerRowHeight, setHeaderRowHeight] = useState(52);
    const [popupGridWidth, setPopupGridWidth] = useState(0);
    const [isQcdModalVisible, setIsQcdModalVisible] = useState(false);
    const [qcdVendor, setQcdVendor] = useState(null);
    const [qcdRows, setQcdRows] = useState([]);
    const [editingRowId, setEditingRowId] = useState(null);
    const gridContainerRef = useRef(null);
    const popupGridContainerRef = useRef(null);

    useEffect(() => {
        dispatch(fetchVendorLoading());
        dispatch(fetchVendorScores());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            toast.error(error);
        }
    }, [error]);

    const handleEditClick = (entry) => {
        if (!entry.loadingId) {
            toast.error('No loading data found for this vendor. Please import loading data first.');
            return;
        }
        setEditingEntry(entry);
        form.setFieldsValue({
            completedProjects: entry.completedProjects,
            designStageProjects: entry.designStageProjects,
            trialStageProjects: entry.trialStageProjects,
            bulkProjects: entry.bulkProjects,
            vendorCapacity: entry.vendorCapacity
        });
        setIsModalVisible(true);
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            const result = await dispatch(updateVendorLoading({ id: editingEntry.loadingId, loadingData: values }));
            if (updateVendorLoading.fulfilled.match(result)) {
                toast.success('Vendor workload updated');
                setIsModalVisible(false);
                dispatch(fetchVendorLoading());
            }
        } catch (err) {
            console.error('Validation failed:', err);
        }
    };

    const calculateQcdScore = (qsr, cost, delivery) => {
        const q = Number(qsr) || 0;
        const c = Number(cost) || 0;
        const d = Number(delivery) || 0;
        return parseFloat(((q * 0.4) + (c * 0.3) + (d * 0.3)).toFixed(2));
    };

    const handleQcdEditClick = (vendorRow) => {
        const vendorScores = (scores || []).filter((score) => score.vendorCode === vendorRow.vendorCode);
        if (!vendorScores.length) {
            toast.error('No QCD scores found for this vendor');
            return;
        }
        const rows = vendorScores.map((score, index) => ({
            id: score._id,
            sno: index + 1,
            vendorId: score.vendorId,
            vendorCode: score.vendorCode,
            vendorName: score.vendorName,
            location: score.location,
            scoringMonth: score.scoringMonth,
            scoringYear: score.scoringYear,
            completionRate: score.completionRate || 0,
            delayRate: score.delayRate || 0,
            remarks: score.remarks || '',
            qsrScore: score.qsrScore,
            costScore: score.costScore,
            deliveryScore: score.deliveryScore,
            qcdScore: score.qcdScore ?? calculateQcdScore(score.qsrScore, score.costScore, score.deliveryScore)
        }));
        setQcdRows(rows);
        setQcdVendor(vendorRow);
        setIsQcdModalVisible(true);
    };

    const handleQcdFieldChange = (id, field, value) => {
        setQcdRows(prevRows =>
            prevRows.map(row => {
                if (row.id !== id) return row;

                if (field === 'scoringYear') {
                    const numericYear = Number(value);
                    const year = Number.isNaN(numericYear) ? new Date().getFullYear() : numericYear;
                    return {
                        ...row,
                        scoringYear: year
                    };
                }

                const numeric = Number(value);
                const clamped = Number.isNaN(numeric) ? 1 : Math.min(Math.max(numeric, 1), 5);
                const nextQ = field === 'qsrScore' ? clamped : row.qsrScore;
                const nextC = field === 'costScore' ? clamped : row.costScore;
                const nextD = field === 'deliveryScore' ? clamped : row.deliveryScore;
                return {
                    ...row,
                    [field]: clamped,
                    qcdScore: calculateQcdScore(nextQ, nextC, nextD)
                };
            })
        );
    };

    const handleQcdRowEdit = (row) => {
        setEditingRowId(row.id);
    };

    const handleQcdRowSave = async (row) => {
        const targetRow = qcdRows.find(r => r.id === row.id);
        if (!targetRow) return;

        const year = Number(targetRow.scoringYear) || new Date().getFullYear();
        const month = Number(targetRow.scoringMonth) || (new Date().getMonth() + 1);
        const payload = {
            vendorId: targetRow.vendorId,
            vendorCode: targetRow.vendorCode,
            vendorName: targetRow.vendorName,
            location: targetRow.location,
            scoringMonth: month,
            scoringYear: year,
            qsrScore: targetRow.qsrScore,
            costScore: targetRow.costScore,
            deliveryScore: targetRow.deliveryScore,
            completionRate: targetRow.completionRate || 0,
            delayRate: targetRow.delayRate || 0,
            remarks: targetRow.remarks || ''
        };

        const loadingToast = toast.loading('Updating QCD score...');
        try {
            const result = await dispatch(updateVendorScore({
                id: targetRow.id,
                scoreData: payload
            }));
            if (!updateVendorScore.fulfilled.match(result)) {
                throw new Error(result.payload || 'Failed to update score');
            }
            toast.success('QCD Score got Updated', { id: loadingToast });
            setEditingRowId(null);
            dispatch(fetchVendorScores());
            dispatch(fetchVendorLoading());
        } catch (error) {
            console.error('QCD row update failed:', error);
            toast.error(error.message || 'Failed to update QCD score', { id: loadingToast });
        }
    };

    const handleExport = () => {
        if (!loadingData || loadingData.length === 0) {
            toast.error('No data to export');
            return;
        }

        const exportData = loadingData.map((row, index) => ({
            'S.NO': index + 1,
            'VENDOR CODE': row.vendorCode,
            'VENDOR NAME': row.vendorName,
            'LOCATION': row.location,
            'COMPLETED': row.completedProjects,
            'DESIGN': row.designStageProjects,
            'TRIAL': row.trialStageProjects,
            'BULK': row.bulkProjects,
            'TOTAL': row.totalProjects,
            'CAPACITY': row.vendorCapacity,
            'LOADING %': row.currentLoading + '%',
            'QCD SCORE': row.qcdScore
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Vendor Loading');
        XLSX.writeFile(wb, `Vendor_Loading_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success('Loading chart exported successfully');
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    toast.error('No data found in the file');
                    return;
                }

                const loadingToast = toast.loading('Importing loading data...');
                const result = await dispatch(bulkImportVendorLoading(data));

                if (bulkImportVendorLoading.fulfilled.match(result)) {
                    toast.success(`Successfully imported ${result.payload.successCount} entries`, { id: loadingToast });
                    dispatch(fetchVendorLoading());
                } else {
                    toast.error(result.payload || 'Import failed', { id: loadingToast });
                }
            } catch (err) {
                console.error('Import error:', err);
                toast.error('Failed to parse file');
            }
            e.target.value = null;
        };
        reader.readAsBinaryString(file);
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
        (loadingData || []).forEach(row => {
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
            <div className="relative h-full w-full flex items-center justify-between px-4 text-xs gap-1 text-white">
                <div className="flex-1 min-w-0">
                    <span className="font-bold text-[11px] leading-tight tracking-wide uppercase truncate">{column.name}</span>
                </div>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveFilterKey(prev => (prev === key ? null : key));
                    }}
                    className={`ml-1 p-1 rounded shrink-0 transition-colors ${hasFilter ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10'}`}
                >
                    <FilterIcon size={11} />
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

    const PlainHeaderCell = ({ column }) => (
        <div className="h-full w-full flex items-center px-4 text-white">
            <span className="font-bold text-[11px] leading-tight tracking-wide uppercase">{column.name}</span>
        </div>
    );

    const ActionHeaderCell = ({ column }) => {
        return (
            <div className="h-full w-full flex items-center justify-center px-2 text-white">
                <span className="font-bold text-[11px] leading-tight tracking-wide uppercase truncate">{column.name}</span>
            </div>
        );
    };

    const gridRows = applyColumnFilters(loadingData || []).map((row, i) => ({ ...row, _serialNo: i + 1 }));

    const handleTotalProjectsClick = async (row) => {
        setProjectModalVendor(row);
        setIsProjectModalVisible(true);
        setProjectRows([]);
        try {
            const response = await api.get(`/mh-development-tracker/vendor-projects?vendorCode=${encodeURIComponent(row.vendorCode)}`);
            if (response.data && response.data.data && response.data.data.length > 0) {
                setProjectRows(response.data.data);
            } else {
                // No projects found for this vendor
                setProjectRows([]);
            }
        } catch (err) {
            console.error('Failed to fetch vendor projects:', err);
            // Fallback to placeholder rows
            const count = Number(row.totalProjects) || 0;
            const rows = Array.from({ length: count }, (_, index) => ({
                id: index + 1,
                project: `Project ${index + 1}`,
                status: ''
            }));
            setProjectRows(rows);
        }
    };

    const dataGridColumns = [
        {
            key: 'serial',
            name: 'S.NO',
            width: 80,
            frozen: true,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <span className="font-semibold text-gray-700">{row._serialNo}</span>
            )
        },
        {
            key: 'vendorCode',
            name: 'VENDOR CODE',
            width: 140,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className="font-semibold text-gray-900">{row.vendorCode}</span>
            )
        },
        {
            key: 'vendorName',
            name: 'VENDOR NAME',
            width: 200,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className="font-semibold text-gray-900">{row.vendorName}</span>
            )
        },
        {
            key: 'location',
            name: 'Location',
            width: 160,
            renderHeaderCell: FilterHeaderCell
        },
        {
            key: 'completedProjects',
            name: 'Completed projects',
            width: 170,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <div className="bg-green-50 text-green-700 font-bold px-3 py-1 rounded-lg border border-green-200 text-center">
                    {row.completedProjects}
                </div>
            )
        },
        {
            key: 'designStageProjects',
            name: 'Design stage projects',
            width: 180,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <div className="bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-lg border border-blue-200 text-center">
                    {row.designStageProjects}
                </div>
            )
        },
        {
            key: 'trialStageProjects',
            name: 'Trial stage projects',
            width: 170,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <div className="bg-amber-50 text-amber-700 font-bold px-3 py-1 rounded-lg border border-amber-200 text-center">
                    {row.trialStageProjects}
                </div>
            )
        },
        {
            key: 'bulkProjects',
            name: 'Bulk projects',
            width: 150,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <div className="bg-purple-50 text-purple-700 font-bold px-3 py-1 rounded-lg border border-purple-200 text-center">
                    {row.bulkProjects}
                </div>
            )
        },
        {
            key: 'totalProjects',
            name: 'Total projects',
            width: 150,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <button
                    onClick={() => handleTotalProjectsClick(row)}
                    className="w-full bg-tvs-blue text-white font-black px-3 py-1 rounded-lg shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all text-center"
                >
                    {row.totalProjects}
                </button>
            )
        },
        {
            key: 'vendorCapacity',
            name: 'Vendor capacity (V)',
            width: 170,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <div className="font-bold text-gray-700 text-center italic">
                    {row.vendorCapacity}
                </div>
            )
        },
        {
            key: 'currentLoading',
            name: 'Current loading (L)',
            width: 170,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => {
                const loadingVal = parseFloat(row.currentLoading) || 0;
                let colorClass = 'bg-green-50 text-green-700 border-green-200';
                if (loadingVal > 100) colorClass = 'bg-red-50 text-red-700 border-red-200 font-black animate-pulse';
                else if (loadingVal > 80) colorClass = 'bg-amber-50 text-amber-700 border-amber-200';

                return (
                    <div className={`${colorClass} font-bold px-3 py-1 rounded-lg border text-center`}>
                        {loadingVal}%
                    </div>
                );
            }
        },
        {
            key: 'updateQcdScore',
            name: 'Update QCD Score',
            width: 170,
            renderHeaderCell: ActionHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex justify-center">
                    <button
                        onClick={() => handleQcdEditClick(row)}
                        className="p-2 text-tvs-blue hover:bg-tvs-blue/10 rounded-lg transition-all shadow-sm border border-tvs-blue/20"
                        title="View/Update QCD Scores"
                    >
                        <Edit3 size={18} />
                    </button>
                </div>
            )
        }
    ];

    const freezeColumnList = dataGridColumns
        .filter(col => col.key !== 'serial' && col.key !== 'updateQcdScore')
        .map(col => ({ key: col.key, name: col.name }));

    const autoFitColumns = React.useMemo(() => {
        const withFreeze = dataGridColumns
            .filter(col => !hiddenKeys.has(col.key))
            .map(col => ({
                ...col,
                frozen: col.key === 'serial' || frozenKeys.has(col.key),
            }));

        if (!gridWidth) return withFreeze;

        const totalDefinedWidth = withFreeze.reduce((sum, column) => {
            return sum + (column.width || 0);
        }, 0);

        if (!totalDefinedWidth) return withFreeze;

        const scale = Math.max(gridWidth / totalDefinedWidth, 1);

        return withFreeze.map((column) => {
            if (!column.width) return column;
            const scaledWidth = Math.max(Math.floor(column.width * scale), column.width, 80);

            return {
                ...column,
                width: scaledWidth
            };
        });
    }, [dataGridColumns, gridWidth, frozenKeys, hiddenKeys]);

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

    useEffect(() => {
        if (!isProjectModalVisible || !popupGridContainerRef.current) return;

        const updateWidth = () => {
            setPopupGridWidth(popupGridContainerRef.current.clientWidth);
        };

        updateWidth();

        const observer = new ResizeObserver(updateWidth);
        observer.observe(popupGridContainerRef.current);

        return () => {
            observer.disconnect();
        };
    }, [isProjectModalVisible]);

    return (
        <div className="flex-1 flex flex-col h-full w-full bg-transparent fade-in">
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="px-6 pt-4 pb-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200 w-full sm:w-auto">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-bold text-gray-700">Showing <span className="text-emerald-700">{loadingData?.length || 0}</span> vendors</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg font-semibold text-sm transform hover:scale-105 active:scale-95"
                        >
                            <Download size={18} />
                            Template
                        </button>
                        <label className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-semibold text-sm transform hover:scale-105 active:scale-95 cursor-pointer">
                            <Upload size={18} />
                            Import Excel
                            <input type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleImport} />
                        </label>
                    </div>
                </div>

                <div className="px-6 py-4">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <ColumnCustomizer
                            columns={dataGridColumns}
                            hiddenKeys={hiddenKeys}
                            onChange={setHiddenKeys}
                            gridClass="vendor-loading-grid"
                            onDensity={({ rowH, headerH }) => {
                                setRowHeight(rowH);
                                setHeaderRowHeight(headerH);
                            }}
                        />
                        <FreezeToolbar
                            columns={freezeColumnList}
                            frozenKeys={frozenKeys}
                            onApply={setFrozenKeys}
                            frozenRowCount={frozenRowCount}
                            setFrozenRowCount={setFrozenRowCount}
                            maxRows={Math.min(gridRows.length, 50)}
                        />
                    </div>
                </div>

                <div className="flex-1 flex flex-col px-4 pb-4 md:px-6 md:pb-6 overflow-hidden">
                    <div ref={gridContainerRef} className="flex-1 w-full border border-gray-200 rounded-xl overflow-hidden bg-white relative min-h-[400px] shadow-sm">
                        <div className="h-full w-full absolute inset-0">
                            <FrozenRowsDataGrid
                                columns={autoFitColumns}
                                rows={gridRows}
                                rowKeyGetter={(row) => row._id || row.vendorCode}
                                className="rdg-light vendor-loading-grid"
                                style={{ blockSize: '100%', width: '100%' }}
                                rowHeight={rowHeight}
                                headerRowHeight={headerRowHeight}
                                frozenRowCount={frozenRowCount}
                                defaultColumnOptions={{
                                    resizable: true
                                }}
                                loading={loading}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                open={isProjectModalVisible}
                onCancel={() => setIsProjectModalVisible(false)}
                footer={null}
                width="95%"
                style={{ maxWidth: '720px' }}
                centered
                title={
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-black text-gray-900 m-0">
                                Projects for {projectModalVendor?.vendorName || projectModalVendor?.vendorCode || 'Vendor'}
                            </h2>
                            <p className="text-[11px] font-semibold text-gray-500 m-0">
                                Total projects: {projectRows.length}
                            </p>
                        </div>
                    </div>
                }
            >
                <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <div
                        ref={popupGridContainerRef}
                        className="h-[420px]"
                    >
                        {popupGridWidth > 0 && (
                            <DataGrid
                                columns={[
                                    {
                                        key: 'project',
                                        name: 'List of projects',
                                        width: Math.max(Math.floor(popupGridWidth * 0.6), 260),
                                        renderHeaderCell: FilterHeaderCell
                                    },
                                    {
                                        key: 'status',
                                        name: 'Status',
                                        width: Math.max(popupGridWidth - Math.max(Math.floor(popupGridWidth * 0.6), 260), 200),
                                        editable: true,
                                        renderHeaderCell: FilterHeaderCell
                                    }
                                ]}
                                rows={projectRows}
                                rowKeyGetter={(row) => row.id}
                                onRowsChange={setProjectRows}
                                className="rdg-light employee-master-grid"
                                rowHeight={60}
                                headerRowHeight={52}
                                defaultColumnOptions={{
                                    resizable: true
                                }}
                            />
                        )}
                    </div>
                </div>
            </Modal>

            <Modal
                title={
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                        <div className="p-2 bg-tvs-blue rounded-lg text-white">
                            <Edit3 size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 m-0">Update QCD Score</h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                {qcdVendor?.vendorName || qcdVendor?.vendorCode}
                            </p>
                        </div>
                    </div>
                }
                open={isQcdModalVisible}
                onCancel={() => setIsQcdModalVisible(false)}
                width="95%"
                style={{ maxWidth: '900px' }}
                centered
                footer={null}
            >
                <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <div className="h-[420px]">
                        <DataGrid
                            columns={[
                                { key: 'sno', name: 'Sno', width: 60 },
                                { key: 'vendorCode', name: 'Vendor code', width: 120 },
                                { key: 'vendorName', name: 'Vendor name', width: 200 },
                                { key: 'location', name: 'Location', width: 140 },
                                {
                                    key: 'scoringMonth',
                                    name: 'Scoring Month',
                                    width: 140,
                                    renderCell: ({ row }) => {
                                        const months = [
                                            'January',
                                            'February',
                                            'March',
                                            'April',
                                            'May',
                                            'June',
                                            'July',
                                            'August',
                                            'September',
                                            'October',
                                            'November',
                                            'December'
                                        ];
                                        const index = (row.scoringMonth || 0) - 1;
                                        const label = months[index] || '-';
                                        return (
                                            <div className="text-xs font-semibold text-gray-700">
                                                {label}
                                            </div>
                                        );
                                    }
                                },
                                {
                                    key: 'scoringYear',
                                    name: 'Scoring Year',
                                    width: 120,
                                    renderCell: ({ row }) => (
                                        <input
                                            type="number"
                                            className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs text-gray-700"
                                            value={row.scoringYear || new Date().getFullYear()}
                                            disabled={editingRowId !== row.id}
                                            onChange={(e) => handleQcdFieldChange(row.id, 'scoringYear', e.target.value)}
                                        />
                                    )
                                },
                                {
                                    key: 'qsrScore',
                                    name: 'QSR',
                                    width: 100,
                                    renderCell: ({ row }) => (
                                        <input
                                            type="number"
                                            className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs text-gray-700"
                                            value={row.qsrScore}
                                            min={1}
                                            max={5}
                                            disabled={editingRowId !== row.id}
                                            onChange={(e) => handleQcdFieldChange(row.id, 'qsrScore', e.target.value)}
                                        />
                                    )
                                },
                                {
                                    key: 'costScore',
                                    name: 'Cost',
                                    width: 100,
                                    renderCell: ({ row }) => (
                                        <input
                                            type="number"
                                            className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs text-gray-700"
                                            value={row.costScore}
                                            min={1}
                                            max={5}
                                            disabled={editingRowId !== row.id}
                                            onChange={(e) => handleQcdFieldChange(row.id, 'costScore', e.target.value)}
                                        />
                                    )
                                },
                                {
                                    key: 'deliveryScore',
                                    name: 'OnTime Delivery',
                                    width: 150,
                                    renderCell: ({ row }) => (
                                        <input
                                            type="number"
                                            className="w-full px-2 py-1 border border-gray-200 rounded-lg text-xs text-gray-700"
                                            value={row.deliveryScore}
                                            min={1}
                                            max={5}
                                            disabled={editingRowId !== row.id}
                                            onChange={(e) => handleQcdFieldChange(row.id, 'deliveryScore', e.target.value)}
                                        />
                                    )
                                },
                                {
                                    key: 'qcdScore',
                                    name: 'QCD Score',
                                    width: 130,
                                    renderCell: ({ row }) => (
                                        <div className="text-center font-semibold text-gray-800">
                                            {row.qcdScore}
                                        </div>
                                    )
                                },
                                {
                                    key: 'actions',
                                    name: 'Actions',
                                    width: 140,
                                    renderCell: ({ row }) => (
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleQcdRowEdit(row)}
                                                className="px-2 py-1 text-[11px] rounded-full bg-amber-500 text-white font-bold hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={editingRowId === row.id}
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleQcdRowSave(row)}
                                                className="px-2 py-1 text-[11px] rounded-full bg-emerald-500 text-white font-bold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    )
                                }
                            ]}
                            rows={qcdRows}
                            rowKeyGetter={(row) => row.id}
                            className="rdg-light employee-master-grid"
                            rowHeight={60}
                            headerRowHeight={52}
                            defaultColumnOptions={{
                                resizable: true
                            }}
                        />
                    </div>
                </div>
            </Modal>

            {/* Edit Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                        <div className="p-2 bg-amber-500 rounded-lg text-white">
                            <Edit3 size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 m-0">Project Statistics</h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Edit Workload for {editingEntry?.vendorName}</p>
                        </div>
                    </div>
                }
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={() => setIsModalVisible(false)}
                okText="UPDATE CAPACITY"
                cancelText="CANCEL"
                width="95%"
                style={{ maxWidth: '600px' }}
                centered
                okButtonProps={{ className: 'bg-amber-500 border-amber-500 font-black rounded-lg h-10' }}
                cancelButtonProps={{ className: 'font-bold rounded-lg h-10' }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    className="mt-6 font-inter"
                >
                    <div className="grid grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <Form.Item
                            name="vendorCapacity"
                            label={<span className="text-xs font-black text-gray-400 uppercase tracking-widest">Max Capacity (Nos)</span>}
                            rules={[{ required: true, type: 'number', min: 1 }]}
                        >
                            <InputNumber className="w-full h-11 rounded-xl font-black flex items-center" placeholder="10" />
                        </Form.Item>
                        <div></div> {/* Empty for grid */}

                        <div className="col-span-2 grid grid-cols-2 gap-4 mt-2">
                            <Form.Item
                                name="completedProjects"
                                label={<span className="text-[10px] font-black text-gray-500 uppercase">Completed</span>}
                            >
                                <InputNumber className="w-full rounded-lg" min={0} />
                            </Form.Item>
                            <Form.Item
                                name="designStageProjects"
                                label={<span className="text-[10px] font-black text-gray-500 uppercase">Design Stage</span>}
                            >
                                <InputNumber className="w-full rounded-lg" min={0} />
                            </Form.Item>
                            <Form.Item
                                name="trialStageProjects"
                                label={<span className="text-[10px] font-black text-gray-500 uppercase">Trial Stage</span>}
                            >
                                <InputNumber className="w-full rounded-lg" min={0} />
                            </Form.Item>
                            <Form.Item
                                name="bulkProjects"
                                label={<span className="text-[10px] font-black text-gray-500 uppercase">Bulk Production</span>}
                            >
                                <InputNumber className="w-full rounded-lg" min={0} />
                            </Form.Item>
                        </div>
                    </div>

                    <div className="mt-4 flex items-start gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <AlertCircle size={18} className="text-blue-500 mt-0.5" />
                        <p className="text-[11px] font-semibold text-blue-700 leading-relaxed m-0">
                            Updating these values will automatically recalculate the Total Projects, Loading Percentage, and Capacity Gap for this vendor.
                        </p>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default VendorLoadingChart;
