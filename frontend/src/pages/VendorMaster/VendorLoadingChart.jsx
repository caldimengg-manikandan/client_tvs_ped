import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Download, RefreshCw, BarChart2, PieChart, Users, AlertCircle, Edit3, Layout, Layers, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVendorLoading, updateVendorLoading, bulkImportVendorLoading } from '../../redux/slices/vendorLoadingSlice';
import { Modal, Form, InputNumber } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import { defaultColDef, defaultGridOptions, createSerialNumberColumn, createBoldColumn } from '../../config/agGridConfig';
import * as XLSX from 'xlsx';

const VendorLoadingChart = () => {
    const dispatch = useDispatch();
    const gridRef = useRef();
    const [form] = Form.useForm();
    
    const { items: loadingData, loading, error } = useSelector((state) => state.vendorLoading);
    
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);

    useEffect(() => {
        dispatch(fetchVendorLoading());
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
                dispatch(fetchVendorLoading()); // Refetch to get joined scoring data correctly
            }
        } catch (err) {
            console.error('Validation failed:', err);
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

    const stats = useMemo(() => {
        if (!loadingData.length) return { total: 0, avgLoad: 0, available: 0 };
        const total = loadingData.length;
        const avgLoad = loadingData.reduce((acc, curr) => acc + curr.loadingPercentage, 0) / total;
        const available = loadingData.filter(v => v.loadingPercentage < 100).length;
        return { total, avgLoad: avgLoad.toFixed(1), available };
    }, [loadingData]);

    const columnDefs = useMemo(() => [
        createSerialNumberColumn(),
        createBoldColumn('vendorCode', 'CODE', { width: 120 }),
        createBoldColumn('vendorName', 'VENDOR NAME', { width: 180 }),
        { field: 'location', headerName: 'LOCATION', width: 140 },
        { 
            field: 'totalProjects', 
            headerName: 'TOTAL', 
            width: 90,
            cellClass: 'text-center font-bold text-tvs-blue bg-blue-50/30'
        },
        { field: 'completedProjects', headerName: 'COMPLETED', width: 110, cellClass: 'text-center' },
        { field: 'designStageProjects', headerName: 'DESIGN', width: 90, cellClass: 'text-center' },
        { field: 'trialStageProjects', headerName: 'TRIAL', width: 90, cellClass: 'text-center' },
        { field: 'bulkProjects', headerName: 'BULK', width: 90, cellClass: 'text-center' },
        {
            field: 'loadingPercentage',
            headerName: 'LOADING %',
            width: 130,
            cellRenderer: (params) => {
                const perc = params.value;
                let colorClass = 'bg-emerald-100 text-emerald-700 border-emerald-200';
                if (perc >= 85) colorClass = 'bg-rose-100 text-rose-700 border-rose-200';
                else if (perc >= 60) colorClass = 'bg-amber-100 text-amber-700 border-amber-200';
                
                return (
                    <div className="flex items-center gap-2 h-full">
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden flex-1">
                            <div 
                                className={`h-full transition-all duration-500 ${
                                    perc >= 85 ? 'bg-rose-500' : perc >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
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
            field: 'gap', 
            headerName: 'GAP', 
            width: 90,
            cellClass: (params) => `text-center font-black ${params.value > 0 ? 'text-emerald-600' : 'text-rose-600'}`
        },
        { 
            field: 'qcdScore', 
            headerName: 'QCD', 
            width: 90,
            cellRenderer: (params) => (
                <div className="text-center font-black text-gray-500 italic">
                    {params.value || '-'}
                </div>
            )
        },
        {
            headerName: 'ACTION',
            width: 80,
            pinned: 'right',
            cellRenderer: (params) => (
                <button 
                    onClick={() => handleEditClick(params.data)}
                    className="p-2 text-gray-400 hover:text-tvs-blue hover:bg-blue-50 rounded-lg transition-all"
                >
                    <Edit3 size={16} />
                </button>
            )
        }
    ], []);

    return (
        <div className="fade-in space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex justify-between items-center bg-gradient-to-r from-white to-gray-50/50">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500 rounded-2xl shadow-lg shadow-amber-500/20 text-white">
                        <Layers size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 m-0 tracking-tight">Vendor Loading Chart</h1>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">Real-time Capacity & Allocation Management</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => dispatch(fetchVendorLoading())}
                        className="p-3 text-gray-400 hover:text-tvs-blue hover:bg-blue-50 rounded-xl transition-all"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#1d61ff] text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        <Download size={18} />
                        Template
                    </button>
                    <label className="flex items-center gap-2 px-5 py-2.5 bg-[#00b067] text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-100 hover:bg-emerald-600 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer">
                        <Upload size={18} />
                        Import Excel
                        <input type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleImport} />
                    </label>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-5 translate-y-0 hover:-translate-y-1 transition-transform">
                    <div className="w-14 h-14 bg-blue-50 text-tvs-blue rounded-xl flex items-center justify-center">
                        <Users size={28} />
                    </div>
                    <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Registered</span>
                        <div className="text-2xl font-black text-gray-900">{stats.total} Vendors</div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-5 translate-y-0 hover:-translate-y-1 transition-transform">
                    <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                        <PieChart size={28} />
                    </div>
                    <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Avg Grid Load</span>
                        <div className="text-2xl font-black text-gray-900">{stats.avgLoad}% Usage</div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-5 translate-y-0 hover:-translate-y-1 transition-transform">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                        <BarChart2 size={28} />
                    </div>
                    <div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Available Vendors</span>
                        <div className="text-2xl font-black text-emerald-600">{stats.available} Ready</div>
                    </div>
                </div>
            </div>

            {/* Main Table Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50/50 px-8 py-5 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Layout size={18} className="text-gray-400" />
                        <span className="text-sm font-black text-gray-700 uppercase tracking-tighter">Capacity Matrix</span>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Healthy (&lt;60%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Normal (60-85%)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-rose-500 rounded-full"></span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Overload (&gt;85%)</span>
                        </div>
                    </div>
                </div>
                <div className="p-8 pb-10">
                    <div className="ag-theme-alpine w-full h-[600px] border border-gray-100 rounded-2xl overflow-hidden shadow-inner bg-gray-50">
                        <AgGridReact
                            ref={gridRef}
                            theme="legacy"
                            rowData={loadingData}
                            columnDefs={columnDefs}
                            defaultColDef={defaultColDef}
                            {...defaultGridOptions}
                            loading={loading}
                        />
                    </div>
                </div>
            </div>

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
