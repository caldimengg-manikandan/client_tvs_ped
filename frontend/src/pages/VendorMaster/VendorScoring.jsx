import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Plus, Search, RefreshCw, Star, MapPin, Building, Shield, ChevronRight, BarChart, Download, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVendorScores, createVendorScore, updateVendorScore, deleteVendorScore, bulkImportVendorScores } from '../../redux/slices/vendorScoringSlice';
import { Modal, Input, InputNumber, Form } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import { defaultColDef, defaultGridOptions, createSerialNumberColumn, createActionColumn, createBoldColumn } from '../../config/agGridConfig';
import * as XLSX from 'xlsx';

const { confirm } = Modal;

const VendorScoring = () => {
    const dispatch = useDispatch();
    const gridRef = useRef();
    const [form] = Form.useForm();
    
    const { items: vendors, loading, error, success } = useSelector((state) => state.vendorScoring);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);
    const [tempScores, setTempScores] = useState({ qsr: 1, cost: 1, delivery: 1 });

    useEffect(() => {
        dispatch(fetchVendorScores());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            toast.error(error);
        }
    }, [error]);

    const calculateQCD = (qsr, cost, delivery) => {
        return parseFloat(((qsr * 0.4) + (cost * 0.3) + (delivery * 0.3)).toFixed(2));
    };

    const handleAddClick = () => {
        setEditingVendor(null);
        setTempScores({ qsr: 1, cost: 1, delivery: 1 });
        form.resetFields();
        setIsModalVisible(true);
    };

    const handleEditClick = (vendor) => {
        setEditingVendor(vendor);
        setTempScores({ 
            qsr: vendor.qsrScore, 
            cost: vendor.costScore, 
            delivery: vendor.deliveryScore 
        });
        form.setFieldsValue({
            vendorCode: vendor.vendorCode,
            vendorName: vendor.vendorName,
            location: vendor.location,
            qsrScore: vendor.qsrScore,
            costScore: vendor.costScore,
            deliveryScore: vendor.deliveryScore
        });
        setIsModalVisible(true);
    };

    const handleDeleteClick = (id) => {
        confirm({
            title: 'Delete Vendor Score',
            content: 'Are you sure you want to delete this vendor and their scoring data? This will also remove them from the Loading Chart.',
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            onOk: async () => {
                const result = await dispatch(deleteVendorScore(id));
                if (deleteVendorScore.fulfilled.match(result)) {
                    toast.success('Vendor scoring deleted successfully');
                }
            }
        });
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            if (editingVendor) {
                const result = await dispatch(updateVendorScore({ id: editingVendor._id, vendorData: values }));
                if (updateVendorScore.fulfilled.match(result)) {
                    toast.success('Vendor scoring updated');
                    setIsModalVisible(false);
                }
            } else {
                const result = await dispatch(createVendorScore(values));
                if (createVendorScore.fulfilled.match(result)) {
                    toast.success('Vendor scoring created');
                    setIsModalVisible(false);
                }
            }
        } catch (err) {
            console.error('Validation failed:', err);
        }
    };

    const handleScoreChange = (field, value) => {
        setTempScores(prev => ({ ...prev, [field]: value || 0 }));
    };

    const handleExport = () => {
        if (gridRef.current) {
            gridRef.current.api.exportDataAsCsv({
                fileName: `Vendor_Scoring_${new Date().toISOString().split('T')[0]}.csv`,
                columnKeys: ['vendorCode', 'vendorName', 'location', 'qsrScore', 'costScore', 'deliveryScore', 'qcdScore']
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

                const loadingToast = toast.loading('Importing vendor scores...');
                const result = await dispatch(bulkImportVendorScores(data));
                
                if (bulkImportVendorScores.fulfilled.match(result)) {
                    toast.success(`Successfully imported ${result.payload.successCount} vendors`, { id: loadingToast });
                    dispatch(fetchVendorScores());
                } else {
                    toast.error(result.payload || 'Import failed', { id: loadingToast });
                }
            } catch (err) {
                console.error('Import error:', err);
                toast.error('Failed to parse file');
            }
            // Reset input
            e.target.value = null;
        };
        reader.readAsBinaryString(file);
    };

    const filteredVendors = (vendors || []).filter(v => 
        v.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.vendorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columnDefs = useMemo(() => [
        createSerialNumberColumn(),
        createBoldColumn('vendorCode', 'VENDOR CODE', { width: 140 }),
        createBoldColumn('vendorName', 'VENDOR NAME', { width: 220 }),
        { field: 'location', headerName: 'LOCATION', width: 160 },
        { 
            field: 'qsrScore', 
            headerName: 'QSR (40%)', 
            width: 120,
            cellRenderer: (params) => (
                <div className="flex items-center gap-1 font-bold text-gray-700">
                    <Star size={14} className="text-yellow-500 fill-yellow-500" />
                    {params.value}
                </div>
            )
        },
        { 
            field: 'costScore', 
            headerName: 'COST (30%)', 
            width: 120,
            cellRenderer: (params) => (
                <div className="flex items-center gap-1 font-bold text-gray-700">
                    <Star size={14} className="text-blue-500 fill-blue-500" />
                    {params.value}
                </div>
            )
        },
        { 
            field: 'deliveryScore', 
            headerName: 'DELIVERY (30%)', 
            width: 140,
            cellRenderer: (params) => (
                <div className="flex items-center gap-1 font-bold text-gray-700">
                    <Star size={14} className="text-green-500 fill-green-500" />
                    {params.value}
                </div>
            )
        },
        { 
            field: 'qcdScore', 
            headerName: 'QCD SCORE', 
            width: 140,
            sort: 'desc',
            cellRenderer: (params) => (
                <div className="bg-tvs-blue/10 text-tvs-blue font-black px-3 py-1 rounded-lg border border-tvs-blue/20 text-center">
                    {params.value}
                </div>
            )
        },
        createActionColumn([
            {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>',
                title: 'Edit Scores',
                className: 'p-2 text-gray-400 hover:text-tvs-blue hover:bg-blue-50 rounded-lg transition-all',
                onClick: (data) => handleEditClick(data)
            },
            {
                icon: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>',
                title: 'Delete Vendor',
                className: 'p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all',
                onClick: (data) => handleDeleteClick(data._id)
            }
        ])
    ], []);

    const topPerformer = useMemo(() => {
        if (!vendors || vendors.length === 0) return null;
        // Find vendor with max qcdScore
        return [...vendors].reduce((prev, current) => (prev.qcdScore > current.qcdScore) ? prev : current);
    }, [vendors]);

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden fade-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-50 to-white px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-tvs-blue rounded-2xl shadow-lg shadow-tvs-blue/20 text-white">
                        <BarChart size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 m-0 tracking-tight">Vendor Scoring Index</h1>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-0.5">Performance Based Vendor Evaluation (SFCS)</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => dispatch(fetchVendorScores())}
                        className="p-3 text-gray-400 hover:text-tvs-blue hover:bg-blue-50 rounded-xl transition-all"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button 
                        onClick={handleAddClick}
                        className="bg-tvs-blue text-white px-6 py-2.5 rounded-2xl font-black text-sm shadow-xl shadow-tvs-blue/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <Plus size={20} strokeWidth={3} />
                        CREATE SCORECARD
                    </button>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-8">
                {/* Search Bar & Actions */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative max-w-md w-full">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-tvs-blue/20 focus:bg-white transition-all font-medium text-gray-700"
                            placeholder="Filter by Code, Name, or Location..."
                        />
                    </div>
                    <div className="flex items-center gap-3">
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

                {/* Info Bar */}
                <div className="mb-6 flex items-center justify-between bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-bold text-gray-700">Weightage Matrix: </span>
                        <div className="flex items-center gap-4 ml-2">
                            <span className="text-xs font-semibold text-emerald-700 bg-white px-3 py-1 rounded-full border border-emerald-100">QSR: 40%</span>
                            <span className="text-xs font-semibold text-blue-700 bg-white px-3 py-1 rounded-full border border-blue-100">COST: 30%</span>
                            <span className="text-xs font-semibold text-purple-700 bg-white px-3 py-1 rounded-full border border-purple-100">DELIVERY: 30%</span>
                        </div>
                    </div>
                    <div className="text-sm font-black text-emerald-900 bg-white px-4 py-1.5 rounded-xl border border-emerald-200">
                        Top Performer: {topPerformer?.vendorName || 'N/A'} {topPerformer ? `(${topPerformer.qcdScore})` : ''}
                    </div>
                </div>

                {/* Grid */}
                <div className="ag-theme-alpine w-full h-[600px] border border-gray-100 rounded-2xl overflow-hidden shadow-inner bg-gray-50">
                    <AgGridReact
                        ref={gridRef}
                        theme="legacy"
                        rowData={filteredVendors}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        {...defaultGridOptions}
                        loading={loading}
                    />
                </div>
            </div>

            {/* Modal */}
            <Modal
                title={
                    <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                        <div className="p-2 bg-tvs-blue rounded-lg text-white">
                            <Star size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-gray-900 m-0">{editingVendor ? 'Update Score' : 'Add New Vendor'}</h2>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Vendor Performance Evaluation</p>
                        </div>
                    </div>
                }
                open={isModalVisible}
                onOk={handleModalOk}
                onCancel={() => setIsModalVisible(false)}
                okText={editingVendor ? "UPDATE SCORES" : "REGISTER VENDOR"}
                cancelText="CANCEL"
                width={700}
                centered
                okButtonProps={{ className: 'bg-tvs-blue font-black rounded-lg h-10' }}
                cancelButtonProps={{ className: 'font-bold rounded-lg h-10' }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    className="mt-6 font-inter"
                    initialValues={{ qsrScore: 1, costScore: 1, deliveryScore: 1 }}
                >
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item 
                            name="vendorCode" 
                            label={<span className="text-xs font-black text-gray-400 uppercase tracking-widest">Vendor Code</span>}
                            rules={[{ required: true, message: 'Required' }]}
                        >
                            <Input className="h-11 rounded-xl font-bold bg-gray-50 uppercase" placeholder="e.g. VEND001" disabled={!!editingVendor} />
                        </Form.Item>
                        <Form.Item 
                            name="vendorName" 
                            label={<span className="text-xs font-black text-gray-400 uppercase tracking-widest">Vendor Name</span>}
                            rules={[{ required: true, message: 'Required' }]}
                        >
                            <Input className="h-11 rounded-xl font-bold bg-gray-50" placeholder="e.g. Tata Steel" />
                        </Form.Item>
                    </div>

                    <Form.Item 
                        name="location" 
                        label={<span className="text-xs font-black text-gray-400 uppercase tracking-widest">Base Location</span>}
                        rules={[{ required: true, message: 'Required' }]}
                    >
                        <Input className="h-11 rounded-xl font-bold bg-gray-50" placeholder="e.g. Bengaluru, KA" />
                    </Form.Item>

                    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 mt-4">
                        <h3 className="text-sm font-black text-gray-900 mb-6 flex items-center gap-2">
                            <Star size={16} className="text-yellow-500" />
                            PERFORMANCE METRICS (SCALE 1-5)
                        </h3>
                        <div className="grid grid-cols-3 gap-6">
                            <Form.Item 
                                name="qsrScore" 
                                label={<span className="text-[10px] font-black text-gray-500 uppercase">QSR (40%)</span>}
                                rules={[{ required: true, type: 'number', min: 1, max: 5 }]}
                            >
                                <InputNumber 
                                    className="w-full rounded-lg font-black" 
                                    min={1} max={5} 
                                    onChange={(v) => handleScoreChange('qsr', v)}
                                />
                            </Form.Item>
                            <Form.Item 
                                name="costScore" 
                                label={<span className="text-[10px] font-black text-gray-500 uppercase">Cost (30%)</span>}
                                rules={[{ required: true, type: 'number', min: 1, max: 5 }]}
                            >
                                <InputNumber 
                                    className="w-full rounded-lg font-black" 
                                    min={1} max={5}
                                    onChange={(v) => handleScoreChange('cost', v)}
                                />
                            </Form.Item>
                            <Form.Item 
                                name="deliveryScore" 
                                label={<span className="text-[10px] font-black text-gray-500 uppercase">Delivery (30%)</span>}
                                rules={[{ required: true, type: 'number', min: 1, max: 5 }]}
                            >
                                <InputNumber 
                                    className="w-full rounded-lg font-black" 
                                    min={1} max={5}
                                    onChange={(v) => handleScoreChange('delivery', v)}
                                />
                            </Form.Item>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Calculated QCD Score</span>
                                <div className="text-3xl font-black text-tvs-blue mt-1">
                                    {calculateQCD(tempScores.qsr, tempScores.cost, tempScores.delivery)}
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Real-time Calculation</span>
                            </div>
                        </div>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default VendorScoring;
