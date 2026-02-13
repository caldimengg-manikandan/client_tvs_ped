import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Button, Tag, Space, Tooltip, message } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle, MapPin, Star, Users, Zap, Award, Target, Info } from 'lucide-react';
import { fetchVendorsForSelection, allocateVendor } from '../../redux/slices/mhDevelopmentTrackerSlice';
import { createSerialNumberColumn, createBoldColumn, defaultColDef, defaultGridOptions } from '../../config/agGridConfig';

const VendorSelectionPopup = ({ visible, onCancel, trackerId, plantLocation }) => {
    const dispatch = useDispatch();
    const { vendors, loading } = useSelector(state => state.mhDevelopmentTracker);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [suggestedVendorId, setSuggestedVendorId] = useState(null);

    useEffect(() => {
        if (visible) {
            dispatch(fetchVendorsForSelection(plantLocation));
            setSelectedVendor(null);
            setSuggestedVendorId(null);
        }
    }, [visible, plantLocation, dispatch]);

    const handleSystemSuggestion = () => {
        if (!vendors || vendors.length === 0) return;

        // Scoring Formula: (QCD * 0.4) + (QSR * 0.2) + (Cost * 0.2) + (Delivery * 0.2)
        // Then normalize by subtracting 2 points for every active project (load penalty)
        const scoredVendors = vendors.map(v => {
            const baseScore = (v.qcdScore * 0.4) + (v.qsrScore * 0.2) + (v.costScore * 0.2) + (v.deliveryScore * 0.2);
            const loadPenalty = (v.currentLoad || 0) * 0.5; // Penalty for existing load
            return {
                ...v,
                efficiencyScore: baseScore - loadPenalty
            };
        });

        // Best vendor has highest efficiency score
        const best = scoredVendors.sort((a, b) => b.efficiencyScore - a.efficiencyScore)[0];
        setSuggestedVendorId(best._id);
        setSelectedVendor(best);
        message.success(`System suggests ${best.vendorName} based on performance and current load.`);
    };

    const handleAllocate = async () => {
        if (!selectedVendor) {
            message.warning('Please select a vendor first');
            return;
        }

        try {
            await dispatch(allocateVendor({
                id: trackerId,
                vendorData: {
                    vendorId: selectedVendor._id,
                    vendorCode: selectedVendor.vendorCode,
                    vendorName: selectedVendor.vendorName,
                    vendorLocation: selectedVendor.location,
                    vendorMailId: selectedVendor.vendorMailId
                }
            })).unwrap();
            message.success('Vendor allocated successfully and notification sent.');
            onCancel();
        } catch (err) {
            message.error(err || 'Failed to allocate vendor');
        }
    };

    const columnDefs = useMemo(() => [
        {
            headerName: '',
            width: 50,
            pinned: 'left',
            cellRenderer: (params) => (
                <div className="flex items-center justify-center h-full">
                    <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-gray-300 text-tvs-blue focus:ring-tvs-blue pointer-events-none"
                        checked={selectedVendor?._id === params.data._id}
                        readOnly
                    />
                </div>
            )
        },
        {
            headerName: 'VENDOR',
            field: 'vendorName',
            width: 220,
            pinned: 'left',
            cellRenderer: (params) => (
                <div className="flex flex-col py-1">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{params.data.vendorName}</span>
                        {suggestedVendorId === params.data._id && (
                            <Tooltip title="System Recommended">
                                <Award size={14} className="text-amber-500 fill-amber-100" />
                            </Tooltip>
                        )}
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{params.data.vendorCode}</span>
                </div>
            )
        },
        { 
            field: 'qcdScore', 
            headerName: 'QCD', 
            width: 100,
            cellRenderer: (params) => (
                <Tag color={params.value >= 4 ? 'success' : params.value >= 3 ? 'warning' : 'error'} className="font-bold border-none px-3">
                    {params.value?.toFixed(1) || '0.0'}
                </Tag>
            )
        },
        { field: 'qsrScore', headerName: 'QSR', width: 90, cellClass: 'font-bold' },
        { field: 'costScore', headerName: 'COST', width: 90, cellClass: 'font-bold' },
        { field: 'deliveryScore', headerName: 'DELIVERY', width: 110, cellClass: 'font-bold' },
        { 
            field: 'currentLoad', 
            headerName: 'CURRENT LOAD', 
            width: 140,
            cellRenderer: (params) => (
                <div className={`flex items-center gap-2 font-bold ${params.value > 5 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    <Target size={14} />
                    <span>{params.value || 0} Projects</span>
                </div>
            )
        }
    ], [selectedVendor, suggestedVendorId]);

    const onRowClicked = (event) => {
        setSelectedVendor(event.data);
    };

    const getRowStyle = (params) => {
        if (selectedVendor?._id === params.data._id) {
            return { background: '#eff6ff', borderLeft: '4px solid #253C80' };
        }
        if (suggestedVendorId === params.data._id) {
            return { background: '#fffbeb' };
        }
        return null;
    };

    return (
        <Modal
            title={
                <div className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gray-900 rounded-xl text-white shadow-lg">
                            <Users size={20} />
                        </div>
                        <div>
                            <span className="text-xl font-black text-gray-900 font-outfit uppercase tracking-tight">Vendor Decision Matrix</span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Tag color="blue" className="text-[9px] font-bold uppercase m-0 border-none">{plantLocation}</Tag>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Select vendor for automated allocation</span>
                            </div>
                        </div>
                    </div>
                </div>
            }
            open={visible}
            onCancel={onCancel}
            footer={
                <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-b-2xl border-t">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col text-left">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selected Entity</span>
                            <span className="text-sm font-bold text-gray-800">{selectedVendor ? selectedVendor.vendorName : 'None Selected'}</span>
                        </div>
                    </div>
                    <Space size="middle">
                        <Button 
                            onClick={handleSystemSuggestion} 
                            icon={<Zap size={16} />}
                            className="bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 font-bold rounded-xl h-10 flex items-center gap-2"
                        >
                            System Suggestion
                        </Button>
                        <Button 
                            type="primary" 
                            onClick={handleAllocate}
                            disabled={!selectedVendor}
                            loading={loading}
                            icon={<CheckCircle size={16} />}
                            className="bg-tvs-blue hover:bg-tvs-blue/90 font-black rounded-xl h-10 flex items-center gap-2 px-8 shadow-lg shadow-tvs-blue/20"
                        >
                            Allocate & Notify
                        </Button>
                    </Space>
                </div>
            }
            width={1000}
            centered
            className="vendor-selection-modal"
        >
            <div className="py-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-2">
                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                        <div className="flex items-center gap-2 text-blue-600 mb-1">
                            <Users size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Available Pool</span>
                        </div>
                        <p className="text-2xl font-black text-blue-900">{vendors.length || 0}</p>
                    </div>
                    <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                        <div className="flex items-center gap-2 text-emerald-600 mb-1">
                            <Award size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Avg. QCD Score</span>
                        </div>
                        <p className="text-2xl font-black text-emerald-900">
                            {(vendors.reduce((acc, v) => acc + (v.qcdScore || 0), 0) / (vendors.length || 1)).toFixed(2)}
                        </p>
                    </div>
                    <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl">
                        <div className="flex items-center gap-2 text-amber-600 mb-1">
                            <Info size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Strategy</span>
                        </div>
                        <p className="text-xs font-bold text-amber-900 leading-tight mt-1">Optimization based on quality performance and current workload.</p>
                    </div>
                </div>

                {vendors.length === 0 && !loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
                        <Users size={64} className="text-gray-200 mb-4" />
                        <span className="text-xl font-black text-gray-400">No Vendors Found</span>
                        <p className="text-gray-400 text-sm mt-2 max-w-xs text-center border-t pt-4 border-gray-100">There are no registered vendors for the location: <span className="font-black text-tvs-blue">{plantLocation}</span></p>
                    </div>
                ) : (
                    <div className="ag-theme-alpine w-full h-[400px] rounded-[2rem] overflow-hidden border border-gray-100 shadow-xl shadow-gray-200/50">
                        <AgGridReact
                            rowData={vendors}
                            columnDefs={columnDefs}
                            defaultColDef={defaultColDef}
                            {...defaultGridOptions}
                            onRowClicked={onRowClicked}
                            getRowStyle={getRowStyle}
                            loading={loading}
                        />
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default VendorSelectionPopup;
