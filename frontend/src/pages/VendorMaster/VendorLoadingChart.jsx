import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Download, AlertCircle, Edit3, Upload, Filter as FilterIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVendorLoading, updateVendorLoading, bulkImportVendorLoading } from '../../redux/slices/vendorLoadingSlice';
import { fetchVendorScores, updateVendorScore } from '../../redux/slices/vendorScoringSlice';
import { Modal, Form, InputNumber } from 'antd';
import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import * as XLSX from 'xlsx';

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
            const result = await dispatch(updateVendorLoading({ id: editingEntry._id, loadingData: values }));
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
        if (gridRef.current) {
            gridRef.current.api.exportDataAsCsv({
                fileName: `Vendor_Loading_${new Date().toISOString().split('T')[0]}.csv`,
                columnKeys: ['vendorCode', 'vendorName', 'location', 'totalProjects', 'completedProjects', 'designStageProjects', 'trialStageProjects', 'bulkProjects', 'vendorCapacity', 'loadingPercentage', 'gap', 'qcdScore']
            });
        }
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

    const ActionHeaderCell = ({ column }) => {
        return (
            <div className="h-full w-full flex items-center justify-center px-2 text-xs bg-tvs-blue">
                <span className="font-semibold text-white truncate">{column.name}</span>
            </div>
        );
    };

    const gridRows = applyColumnFilters(loadingData || []);

    const handleTotalProjectsClick = (row) => {
        const count = Number(row.totalProjects) || 0;
        const rows = Array.from({ length: count }, (_, index) => ({
            id: index + 1,
            project: `Project ${index + 1}`,
            status: ''
        }));
        setProjectRows(rows);
        setProjectModalVendor(row);
        setIsProjectModalVisible(true);
    };

    const dataGridColumns = [
        {
            key: 'serial',
            name: 'S.no',
            width: 80,
            frozen: true,
            renderCell: ({ rowIdx }) => (
                <span className="font-semibold text-gray-700">{rowIdx + 1}</span>
            )
        },
        {
            key: 'vendorCode',
            name: 'Vendor code',
            width: 140,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className="font-semibold text-gray-900">{row.vendorCode}</span>
            )
        },
        {
            key: 'vendorName',
            name: 'Vendor name',
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
            key: 'totalProjects',
            name: 'Total projects',
            width: 120,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <button
                    type="button"
                    onClick={() => handleTotalProjectsClick(row)}
                    className="w-full text-center font-bold text-tvs-blue bg-blue-50/30 block rounded-full px-2 py-0.5 hover:bg-blue-100 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-tvs-blue/40"
                >
                    {row.totalProjects}
                </button>
            )
        },
        {
            key: 'loadingPercentage',
            name: 'Overall loading %',
            width: 180,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => {
                const perc = row.loadingPercentage;
                let colorClass = 'bg-emerald-100 text-emerald-700 border-emerald-200';
                if (perc >= 85) colorClass = 'bg-rose-100 text-rose-700 border-rose-200';
                else if (perc >= 60) colorClass = 'bg-amber-100 text-amber-700 border-amber-200';

                return (
                    <div className="flex items-center gap-2 h-full">
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden flex-1">
                            <div
                                className={`h-full transition-all duration-500 ${perc >= 85 ? 'bg-rose-500' : perc >= 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(perc, 100)}%` }}
                            />
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${colorClass}`}>
                            {perc}%
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'qcdScore',
            name: 'Qcd score',
            width: 100,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <div className="text-center font-black text-gray-500 italic">
                    {row.qcdScore || '-'}
                </div>
            )
        },
        {
            key: 'updateQcdScore',
            name: 'Update QCD Score',
            width: 180,
            renderHeaderCell: ActionHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex items-center justify-center h-full">
                    <button
                        type="button"
                        onClick={() => handleQcdEditClick(row)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                    >
                        <Edit3 size={14} />
                        Edit
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
        <div className="bg-gradient-to-br from-white to-gray-50/30 rounded-xl shadow-lg border border-gray-200/60 overflow-hidden fade-in">
            {/* AG Grid Table */}
            <div className="px-8 py-6">
                {/* Toolbar with Export */}
                <div className="mb-5 flex items-center justify-between bg-gradient-to-r from-white to-gray-50 px-6 py-4 rounded-xl border border-gray-200/80 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-bold text-gray-700">Showing <span className="text-emerald-700">{loadingData?.length || 0}</span> vendors</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
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

                <div
                    ref={gridContainerRef}
                    className="w-full h-[620px] border border-gray-200 rounded-xl overflow-hidden bg-white relative"
                >
                    <div className="h-full">
                        <DataGrid
                            columns={autoFitColumns}
                            rows={gridRows}
                            rowKeyGetter={(row) => row._id}
                            className="rdg-light employee-master-grid"
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

            <Modal
                open={isProjectModalVisible}
                onCancel={() => setIsProjectModalVisible(false)}
                footer={null}
                width={720}
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
                width={900}
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
                width={600}
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
