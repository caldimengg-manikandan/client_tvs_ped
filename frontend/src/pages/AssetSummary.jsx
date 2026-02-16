import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { AgGridReact } from 'ag-grid-react';
import { defaultColDef, defaultGridOptions, createSerialNumberColumn } from '../config/agGridConfig';
import CustomCheckboxFilter from '../components/AgGridCustom/CustomCheckboxFilter';
import CustomHeader from '../components/AgGridCustom/CustomHeader';

// AG Grid Modules are registered GLOBALLY in agGridConfig.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const AssetSummary = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/asset-request`);
            // Requirement: show records until reached Implementation Status (Accepted or Rejected)
            const summaryAssets = response.data.filter(req =>
                (req.status === 'Accepted' || req.status === 'Rejected') &&
                req.progressStatus === 'Implementation'
            );
            setAssets(summaryAssets);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching assets:', error);
            setLoading(false);
        }
    };



    const columnDefs = React.useMemo(() => [
        createSerialNumberColumn(),
        {
            headerName: 'MH ID',
            valueGetter: (params) => params.data.allocationAssetId || params.data.mhRequestId,
            width: 150,
            cellClass: 'ag-cell-bold',
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'PART NAME',
            field: 'handlingPartName',
            width: 200,
            valueFormatter: (params) => params.value || '-',
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'VENDOR NAME',
            width: 200,
            valueGetter: (params) => {
                const vendor = params.data.assignedVendor;
                return (typeof vendor === 'object' && vendor !== null) ? vendor.vendorName : (vendor || '-');
            },
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'PO PRICE',
            field: 'poPrice',
            width: 150,
            valueFormatter: (params) => params.value ? `₹ ${params.value.toLocaleString()}` : '-',
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'DEPARTMENT',
            field: 'departmentName',
            width: 180,
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'PLANT LOCATION',
            field: 'location',
            width: 160,
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'HANDLING LOCATION',
            width: 200,
            valueGetter: (params) => params.data.assetLocation || params.data.materialHandlingLocation || '-',
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        }
    ], []);



    return (
        <div className="bg-white rounded-lg shadow-sm border border-tvs-border overflow-hidden fade-in">


            <div className="ag-theme-alpine w-full h-[600px]">
                <AgGridReact
                    theme="legacy"
                    rowData={assets}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    {...defaultGridOptions}
                    loading={loading}
                />
            </div>
        </div>
    );
};

export default AssetSummary;
