import React, { useEffect, useMemo } from 'react';
import { Modal, Button, Tag } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle, MapPin, Star, Users } from 'lucide-react';
import { fetchVendorsForSelection } from '../../redux/slices/mhDevelopmentTrackerSlice';
import { createSerialNumberColumn, createBoldColumn, defaultColDef, defaultGridOptions } from '../../config/agGridConfig';

const VendorSelectionPopup = ({ visible, onCancel, onSelect }) => {
    const dispatch = useDispatch();
    const { vendors, loading } = useSelector(state => state.mhDevelopmentTracker);

    useEffect(() => {
        if (visible) {
            dispatch(fetchVendorsForSelection());
        }
    }, [visible, dispatch]);

    const columnDefs = useMemo(() => [
        createSerialNumberColumn(),
        createBoldColumn('vendorCode', 'VEND CODE', { width: 120 }),
        createBoldColumn('vendorName', 'VEND NAME', { width: 180 }),
        { 
            field: 'location', 
            headerName: 'LOCATION', 
            width: 140,
            cellRenderer: (params) => (
                <div className="flex items-center gap-1 text-gray-600">
                    <MapPin size={12} />
                    <span>{params.value}</span>
                </div>
            )
        },
        { 
            field: 'qcdScore', 
            headerName: 'QCD SCORE', 
            width: 120,
            cellRenderer: (params) => (
                <Tag color={params.value >= 4 ? 'success' : params.value >= 3 ? 'warning' : 'error'} className="font-bold">
                    {params.value.toFixed(2)}
                </Tag>
            )
        },
        { field: 'qsrScore', headerName: 'QSR', width: 90 },
        { field: 'costScore', headerName: 'COST', width: 90 },
        { field: 'deliveryScore', headerName: 'DELIVERY', width: 100 },
        { 
            field: 'currentLoad', 
            headerName: 'CURRENT LOAD', 
            width: 130,
            cellRenderer: (params) => (
                <div className="flex items-center gap-1 text-blue-600 font-semibold">
                    <Users size={12} />
                    <span>{params.value} Projects</span>
                </div>
            )
        },
        {
            headerName: 'SELECT',
            width: 100,
            pinned: 'right',
            cellRenderer: (params) => (
                <Button 
                    type="primary" 
                    size="small"
                    shape="round"
                    icon={<CheckCircle size={14} />}
                    className="bg-emerald-500 hover:bg-emerald-600 border-none flex items-center gap-1 text-[10px]"
                    onClick={() => {
                        onSelect(params.data);
                        onCancel();
                    }}
                >
                    Select
                </Button>
            )
        }
    ], [onSelect, onCancel]);

    return (
        <Modal
            title={
                <div className="flex items-center gap-3 pb-4 border-b">
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                        <Users size={20} />
                    </div>
                    <div>
                        <span className="text-xl font-bold">Select Vendor based on Performance</span>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-0.5">Fetched from Vendor Scoring Module</p>
                    </div>
                </div>
            }
            open={visible}
            onCancel={onCancel}
            footer={null}
            width={1000}
            centered
            className="vendor-selection-modal"
        >
            <div className="py-4">
                <div className="ag-theme-alpine w-full h-[450px]">
                    <AgGridReact
                        rowData={vendors}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        {...defaultGridOptions}
                        loading={loading}
                    />
                </div>
            </div>
            <div className="flex justify-end pt-4 border-t mt-4">
                <Button onClick={onCancel} className="rounded-lg">Cancel</Button>
            </div>
        </Modal>
    );
};

export default VendorSelectionPopup;
