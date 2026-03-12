import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Button, Tag, Space, Tooltip, message } from 'antd';
import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle, MapPin, Star, Users, Zap, Award, Target, Info } from 'lucide-react';
import { fetchVendorsForSelection, allocateVendor } from '../../redux/slices/mhDevelopmentTrackerSlice';
import { useAuth } from '../../context/AuthContext';

const VendorSelectionPopup = ({ visible, onCancel, trackerId, plantLocation }) => {
    const dispatch = useDispatch();
    const { user } = useAuth();
    const { vendors, loading } = useSelector(state => state.mhDevelopmentTracker);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [suggestedVendorId, setSuggestedVendorId] = useState(null);
    const [overrideLocation, setOverrideLocation] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const isAdmin = user?.role === 'Admin';

    const filteredVendors = useMemo(() => {
        if (!vendors) return [];
        if (!searchTerm) return vendors;
        const lowSearch = searchTerm.toLowerCase();
        return vendors.filter(v => 
            v.vendorName?.toLowerCase().includes(lowSearch) || 
            v.vendorCode?.toLowerCase().includes(lowSearch)
        );
    }, [vendors, searchTerm]);

    useEffect(() => {
        if (visible) {
            dispatch(fetchVendorsForSelection({ 
                location: plantLocation, 
                overrideLocation 
            }));
            setSelectedVendor(null);
            setSuggestedVendorId(null);
            setSearchTerm('');
        }
    }, [visible, plantLocation, overrideLocation, dispatch]);

    const highestQcdScore = useMemo(() => {
        if (!vendors || vendors.length === 0) return '0.00';
        return Math.max(...vendors.map(v => v.qcdScore || 0)).toFixed(2);
    }, [vendors]);

    const topVendorName = useMemo(() => {
        if (!vendors || vendors.length === 0) return 'N/A';
        const scoredVendors = vendors.map(v => {
            const baseScore = ((v.qcdScore || 0) * 0.4) + ((v.qsrScore || 0) * 0.2) + ((v.costScore || 0) * 0.2) + ((v.deliveryScore || 0) * 0.2);
            const loadPenalty = (v.currentLoad || 0) * 0.5;
            return { ...v, efficiencyScore: baseScore - loadPenalty };
        });
        const best = scoredVendors.sort((a, b) => b.efficiencyScore - a.efficiencyScore)[0];
        return best ? best.vendorName : 'N/A';
    }, [vendors]);

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

    const PlainHeaderCell = ({ column }) => (
        <div className={`h-full w-full flex items-center px-4 ${column.key !== 'vendorName' && column.key !== 'selection' ? 'justify-center' : ''}`}>
            <span className={`font-bold text-[11px] leading-tight tracking-wide ${column.key !== 'vendorName' && column.key !== 'selection' ? 'text-center' : ''}`}>
                {column.name}
            </span>
        </div>
    );

    const columns = useMemo(() => [
        {
            key: 'selection',
            name: '',
            width: 60,
            frozen: true,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex items-center justify-center h-full">
                    <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-tvs-blue focus:ring-tvs-blue pointer-events-none"
                        checked={selectedVendor?._id === row._id}
                        readOnly
                    />
                </div>
            )
        },
        {
            key: 'vendorName',
            name: 'VENDOR',
            width: 290,
            frozen: true,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex flex-col py-1">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{row.vendorName}</span>
                        {suggestedVendorId === row._id && (
                            <Tooltip title="System Recommended">
                                <Award size={14} className="text-amber-500 fill-amber-100" />
                            </Tooltip>
                        )}
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{row.vendorCode}</span>
                </div>
            )
        },
        {
            key: 'qcdScore',
            name: 'QCD',
            width: 110,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex items-center justify-center h-full">
                    <Tag color={row.qcdScore >= 4 ? 'success' : row.qcdScore >= 3 ? 'warning' : 'error'} className="font-bold border-none px-3 m-0">
                        {row.qcdScore?.toFixed(1) || '0.0'}
                    </Tag>
                </div>
            )
        },
        { key: 'qsrScore', name: 'QSR', width: 110, renderHeaderCell: PlainHeaderCell, renderCell: ({ row }) => <div className="flex items-center justify-center h-full font-bold text-xs">{row.qsrScore}</div> },
        { key: 'costScore', name: 'COST', width: 110, renderHeaderCell: PlainHeaderCell, renderCell: ({ row }) => <div className="flex items-center justify-center h-full font-bold text-xs">{row.costScore}</div> },
        { key: 'deliveryScore', name: 'DELIVERY', width: 110, renderHeaderCell: PlainHeaderCell, renderCell: ({ row }) => <div className="flex items-center justify-center h-full font-bold text-xs">{row.deliveryScore}</div> },
        {
            key: 'currentLoad',
            name: 'CURRENT LOAD',
            width: 160,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <div className={`flex items-center justify-center h-full gap-2 font-bold text-xs ${row.currentLoad > 5 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    <Target size={14} />
                    <span>{row.currentLoad || 0} Projects</span>
                </div>
            )
        }
    ], [selectedVendor, suggestedVendorId]);

    const handleCellClick = (args) => {
        setSelectedVendor(args.row);
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
                            <span className="text-xl font-black text-gray-900 font-mono uppercase tracking-tight">Vendor Decision Matrix</span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <Tag color="blue" className="text-[9px] font-bold uppercase m-0 border-none">{overrideLocation ? 'ALL LOCATIONS' : plantLocation}</Tag>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Select vendor for automated allocation</span>
                                {isAdmin && (
                                    <button 
                                        onClick={() => setOverrideLocation(!overrideLocation)}
                                        className="text-[9px] font-bold text-tvs-blue hover:underline uppercase ml-2"
                                    >
                                        {overrideLocation ? 'Filter by Location' : 'Show All Vendors'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            }
            open={visible}
            onCancel={onCancel}
            footer={
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-gray-50/50 rounded-b-2xl border-t gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="flex flex-col text-left">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selected Entity</span>
                            <span className="text-sm font-bold text-gray-800 truncate max-w-[150px] sm:max-w-none">{selectedVendor ? selectedVendor.vendorName : 'None Selected'}</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                        <Button
                            onClick={handleSystemSuggestion}
                            icon={<Zap size={16} />}
                            className="bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 font-bold rounded-xl h-10 flex items-center gap-2 text-xs"
                        >
                            <span className="hidden xs:inline">System Suggestion</span>
                            <span className="xs:hidden">Suggest</span>
                        </Button>
                        <Button
                            type="primary"
                            onClick={handleAllocate}
                            disabled={!selectedVendor}
                            loading={loading}
                            icon={<CheckCircle size={16} />}
                            className="bg-tvs-blue hover:bg-tvs-blue/90 font-black rounded-xl h-10 flex items-center gap-2 px-4 sm:px-8 shadow-lg shadow-tvs-blue/20 text-xs"
                        >
                            Allocate
                        </Button>
                    </div>
                </div>
            }
            width="95%"
            style={{ maxWidth: '1000px', top: 20 }}
            centered
            className="vendor-selection-modal"
        >
            <div className="py-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 mt-2">
                    <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl">
                        <div className="flex items-center gap-2 text-blue-600 mb-1">
                            <Users size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Available Vendors</span>
                        </div>
                        <p className="text-2xl font-black text-blue-900">{vendors.length || 0}</p>
                    </div>
                    <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl">
                        <div className="flex items-center gap-2 text-emerald-600 mb-1">
                            <Award size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Highest QCD Score</span>
                        </div>
                        <p className="text-2xl font-black text-emerald-900">
                            {highestQcdScore}
                        </p>
                    </div>
                    <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl">
                        <div className="flex items-center gap-2 text-amber-600 mb-1">
                            <Star size={14} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Top Performance Vendor</span>
                        </div>
                        <p className="text-sm font-bold text-amber-900 leading-tight mt-1 pt-1 truncate" title={topVendorName}>{topVendorName}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-4">
                    <div className="flex-1 max-w-md relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Target size={16} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by vendor name or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-2xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-tvs-blue/20 focus:border-tvs-blue bg-white shadow-sm transition-all"
                        />
                    </div>
                </div>

                {filteredVendors.length === 0 && !loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-100">
                        <Users size={64} className="text-gray-200 mb-4" />
                        <span className="text-xl font-black text-gray-400">No Vendors Found</span>
                        <p className="text-gray-400 text-sm mt-2 max-w-xs text-center border-t pt-4 border-gray-100">
                            {searchTerm ? `No results for "${searchTerm}"` : `There are no registered vendors for the location: `}
                            {!searchTerm && <span className="font-black text-tvs-blue">{overrideLocation ? 'Any' : plantLocation}</span>}
                        </p>
                    </div>
                ) : (
                    <div className="w-full h-[400px] rounded-[2rem] overflow-hidden border border-gray-100 shadow-xl shadow-gray-200/50">
                        <DataGrid
                            columns={columns}
                            rows={filteredVendors}
                            rowKeyGetter={(row) => row._id}
                            className="rdg-light vendor-selection-grid"
                            style={{ blockSize: '100%' }}
                            rowHeight={52}
                            headerRowHeight={44}
                            onCellClick={handleCellClick}
                            rowClass={(row) => {
                                if (selectedVendor?._id === row._id) return '!bg-blue-50 border-l-4 !border-l-tvs-blue';
                                if (suggestedVendorId === row._id) return '!bg-amber-50';
                                return undefined;
                            }}
                        />
                        {loading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/60 pointer-events-none z-10">
                                <div className="w-8 h-8 border-4 border-tvs-blue/20 border-t-tvs-blue rounded-full animate-spin" />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default VendorSelectionPopup;
