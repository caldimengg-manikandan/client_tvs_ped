import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, FileText, X, Filter, Eye, Pencil, Trash2 } from 'lucide-react';
import { fetchAssetRequests, deleteAssetRequest, createAssetRequest, resetStatus } from '../../redux/slices/assetRequestSlice';
import { useAuth } from '../../context/AuthContext';
import { Modal as AntModal, message, Form, Input, Select, Button, Row, Col, Tag } from 'antd';
import 'react-data-grid/lib/styles.css';
import FreezeToolbar from '../../components/FreezeToolbar';
import FrozenRowsDataGrid from '../../components/FrozenRowsDataGrid';
import ColumnCustomizer from '../../components/ColumnCustomizer';

const { Option } = Select;

const CreateMHRequestList = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useAuth();
    const { items: requests, loading, success, error } = useSelector((state) => state.assetRequests);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const [columnFilters, setColumnFilters] = useState({});
    const [activeFilterKey, setActiveFilterKey] = useState(null);
    const [filterSearchText, setFilterSearchText] = useState({});
    const [mhListGridWidth, setMhListGridWidth] = useState(0);
    const [frozenKeys, setFrozenKeys] = useState(new Set());
    const [frozenRowCount, setFrozenRowCount] = useState(0);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [hiddenKeys, setHiddenKeys] = useState(new Set());
    const [rowHeight, setRowHeight] = useState(44);
    const [headerRowHeight, setHeaderRowHeight] = useState(52);

    const mhListGridContainerRef = useRef(null);

    useEffect(() => {
        dispatch(fetchAssetRequests());
    }, [dispatch]);

    useEffect(() => {
        if (success && isModalOpen) {
            message.success('MH Request created successfully');
            setIsModalOpen(false);
            form.resetFields();
            dispatch(resetStatus());
            dispatch(fetchAssetRequests());
        }
        if (error && isModalOpen) {
            message.error(error);
            dispatch(resetStatus());
        }
    }, [success, error, isModalOpen, form, dispatch]);

    const handleCreateClick = () => {
        if (!user || !user.employeeId) {
            message.error("Please add employee information first.");
            navigate('/employee-master/add');
            return;
        }

        form.setFieldsValue({
            departmentName: user.department || 'N/A',
            location: user.location || 'N/A',
            userName: user.name || 'N/A',
            mailId: user.email || ''
        });
        setIsModalOpen(true);
    };

    const handleViewRequest = (row) => {
        setSelectedRequest(row);
        setIsViewModalOpen(true);
    };

    const handleEditRequest = (row) => {
        if (!row || !row._id) return;
        navigate(`/mh-requests/edit/${row._id}`);
    };

    const handleDeleteRequest = (row) => {
        if (!row || !row._id) return;
        AntModal.confirm({
            title: 'Delete MH Request',
            content: `Are you sure you want to delete MH Request ${row.mhRequestId || ''}?`,
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await dispatch(deleteAssetRequest(row._id)).unwrap();
                    message.success('MH Request deleted successfully');
                } catch (err) {
                    message.error(err || 'Failed to delete MH Request');
                }
            }
        });
    };

    const handleFormSubmit = async (values) => {
        const formData = new FormData();
        Object.keys(values).forEach(key => {
            if (values[key] !== undefined && values[key] !== null) {
                if (Array.isArray(values[key])) {
                    formData.append(key, values[key].join(', '));
                } else {
                    formData.append(key, values[key]);
                }
            }
        });

        dispatch(createAssetRequest(formData));
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

    const baseRows = requests || [];
    const gridRows = applyColumnFilters(baseRows).map((row, i) => ({ ...row, _serialNo: i + 1 }));

    const PlainHeaderCell = ({ column }) => (
        <div className="h-full w-full flex items-center px-4 text-white">
            <span className="font-bold text-[11px] leading-tight tracking-wide uppercase">{column.name}</span>
        </div>
    );

    const FilterHeaderCell = ({ column }) => {
        const key = column.key;
        const valuesSet = new Set();
        baseRows.forEach(row => {
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
                    <Filter size={11} />
                </button>
                {activeFilterKey === key && (
                    <div className="absolute z-50 top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                        <div className="flex items-center justify-between mb-2">
                            <Button
                                type="text"
                                size="small"
                                onClick={handleSelectAll}
                                className="!text-[10px] !font-semibold !text-tvs-blue !px-0"
                            >
                                Select All
                            </Button>
                            <Button
                                type="text"
                                size="small"
                                onClick={handleClear}
                                className="!text-[10px] !font-semibold !text-gray-500 !px-0"
                            >
                                Clear
                            </Button>
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
            key: 'mhRequestId',
            name: 'MH ID',
            width: 140,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className="font-semibold text-gray-900">{row.mhRequestId}</span>
            )
        },
        {
            key: 'requestType',
            name: 'TYPE',
            width: 150,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className="font-semibold text-gray-900">{row.requestType}</span>
            )
        },
        {
            key: 'plantLocation',
            name: 'PLANT',
            width: 160,
            renderHeaderCell: FilterHeaderCell
        },
        {
            key: 'productModel',
            name: 'PRODUCT',
            width: 180,
            renderHeaderCell: FilterHeaderCell
        },
        {
            key: 'handlingPartName',
            name: 'PART NAME',
            width: 160,
            renderHeaderCell: FilterHeaderCell
        },
        {
            key: 'materialHandlingEquipment',
            name: 'MATERIAL HANDLING EQUIPMENT',
            width: 220,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className="font-semibold text-gray-900">
                    {row.materialHandlingEquipment || '-'}
                </span>
            )
        },
        {
            key: 'materialHandlingLocation',
            name: 'HANDLING LOC',
            width: 180,
            renderHeaderCell: FilterHeaderCell
        },
        {
            key: 'flow',
            name: 'FLOW',
            width: 150,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className="font-semibold text-tvs-blue">
                    {(row.from || '') + ' \u2192 ' + (row.to || '')}
                </span>
            )
        },
        {
            key: 'volumePerDay',
            name: 'VOL/DAY',
            width: 100,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className="font-black text-center">{row.volumePerDay}</span>
            )
        },
        {
            key: 'problemStatement',
            name: 'PROBLEM STATEMENT',
            width: 250,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span title={row.problemStatement} className="truncate block">
                    {row.problemStatement}
                </span>
            )
        },
        {
            key: 'actions',
            name: 'ACTIONS',
            width: 150,
            renderHeaderCell: PlainHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex items-center justify-center gap-2">
                    <button
                        type="button"
                        onClick={() => handleViewRequest(row)}
                        className="p-1.5 rounded-full hover:bg-blue-50 text-blue-600 border border-blue-100"
                    >
                        <Eye size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={() => handleEditRequest(row)}
                        className="p-1.5 rounded-full hover:bg-amber-50 text-amber-600 border border-amber-100"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        type="button"
                        onClick={() => handleDeleteRequest(row)}
                        className="p-1.5 rounded-full hover:bg-red-50 text-red-600 border border-red-100"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )
        }
    ];

    const freezeColumnList = dataGridColumns
        .filter(col => col.key !== 'serial')
        .map(col => ({ key: col.key, name: col.name }));

    const autoFitColumns = useMemo(() => {
        const withFreeze = dataGridColumns
            .filter(col => !hiddenKeys.has(col.key))
            .map(col => ({
                ...col,
                frozen: col.key === 'serial' || frozenKeys.has(col.key),
            }));
        if (!mhListGridWidth) return withFreeze;
        const totalDefinedWidth = withFreeze.reduce((sum, column) => sum + (column.width || 0), 0);
        if (!totalDefinedWidth) return withFreeze;
        const scale = Math.max(mhListGridWidth / totalDefinedWidth, 1);
        return withFreeze.map((column) => {
            if (!column.width) return column;
            const scaledWidth = Math.max(Math.floor(column.width * scale), column.width, 80);
            return { ...column, width: scaledWidth };
        });
    }, [dataGridColumns, mhListGridWidth, frozenKeys, hiddenKeys]);

    useEffect(() => {
        if (!mhListGridContainerRef.current) return;
        const updateWidth = () => setMhListGridWidth(mhListGridContainerRef.current.clientWidth);
        updateWidth();
        const observer = new ResizeObserver(updateWidth);
        observer.observe(mhListGridContainerRef.current);
        return () => observer.disconnect();
    }, []);

    const handleExportCsv = () => {
        const rows = baseRows;
        if (!rows.length) {
            message.info('No data to export');
            return;
        }

        const headers = [
            'MH ID',
            'Department',
            'Type',
            'Plant',
            'Product',
            'Part Name',
            'Handling Location',
            'From',
            'To',
            'Volume/Day',
            'Problem Statement',
            'User Name',
            'User Location',
            'Created At'
        ];

        const csvRows = [
            headers.join(',')
        ];

        rows.forEach(row => {
            const values = [
                row.mhRequestId || '',
                row.departmentName || '',
                row.requestType || '',
                row.plantLocation || '',
                row.productModel || '',
                row.handlingPartName || '',
                row.materialHandlingLocation || '',
                row.from || '',
                row.to || '',
                row.volumePerDay || '',
                (row.problemStatement || '').replace(/\r?\n/g, ' '),
                row.userName || '',
                row.location || '',
                row.createdAt || ''
            ].map(value => {
                const str = String(value);
                if (str.includes('"') || str.includes(',') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            });
            csvRows.push(values.join(','));
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `MH_Requests_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex-1 flex flex-col h-full w-full bg-transparent fade-in">
            {/* Enhanced AG Grid Table Section */}
            <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="px-6 py-4 flex flex-col gap-4">
                    {/* Toolbar with Export and Create Button */}
                    <div className="flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r from-white to-gray-50 px-6 py-4 rounded-xl border border-gray-200/80 shadow-sm gap-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-600 w-full sm:w-auto">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                            <span>Showing <span className="text-emerald-700 font-bold">{requests?.length || 0}</span> active requests</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
                            <button
                                onClick={handleExportCsv}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-semibold text-sm transform hover:scale-105 active:scale-95"
                            >
                                <FileText size={16} />
                                Template Download
                            </button>
                            <button
                                onClick={handleCreateClick}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-tvs-blue to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg font-semibold text-sm transform hover:scale-105 active:scale-95"
                            >
                                <Plus size={20} strokeWidth={3} />
                                <span>CREATE NEW REQUEST</span>
                            </button>
                        </div>
                    </div>

                    {/* Customize + Freeze Toolbar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <ColumnCustomizer
                            columns={dataGridColumns}
                            hiddenKeys={hiddenKeys}
                            onChange={setHiddenKeys}
                            gridClass="mh-request-grid"
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
                    <div ref={mhListGridContainerRef} className="flex-1 w-full border border-gray-200 rounded-xl overflow-hidden bg-white relative min-h-[400px]">
                        <div className="h-full w-full absolute inset-0">
                            <FrozenRowsDataGrid
                                columns={autoFitColumns}
                                rows={gridRows}
                                rowKeyGetter={(row) => row._id || row.mhRequestId}
                                className="rdg-light mh-request-grid"
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

            {/* Create MH Request Modal */}
            <AntModal
                title={
                    <div className="flex items-center gap-5 p-4 bg-gradient-to-r from-tvs-blue/5 to-transparent rounded-t-3xl border-b border-gray-100">
                        <div className="w-14 h-14 rounded-2xl bg-white border border-tvs-blue/10 flex items-center justify-center text-tvs-blue shadow-sm">
                            <Plus size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Create New Material Handling Entry</p>
                        </div>
                    </div>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width="95%"
                style={{ maxWidth: '1000px' }}
                centered
                destroyOnClose
                className="custom-modal"
                closeIcon={<div className="bg-gray-100 p-2 rounded-full hover:bg-red-50 hover:text-red-500 transition-all"><X size={18} /></div>}
            >
                <div className="p-6">
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleFormSubmit}
                        requiredMark={false}
                        initialValues={{
                            requestType: 'New Project',
                            plantLocation: 'Hosur Plant 1 (TN)',
                            productModel: ['Scooter']
                        }}
                    >
                        <Form.Item name="mailId" hidden>
                            <Input />
                        </Form.Item>
                        <div className="mb-10">
                            <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[3px] mb-6 flex items-center gap-3">
                                <span>01 PERSONNEL DATA</span>
                                <div className="h-[1px] flex-1 bg-gray-100"></div>
                            </h3>
                            <Row gutter={[16, 0]}>
                                <Col xs={24} sm={8}>
                                    <Form.Item label={<span className="text-xs font-bold text-gray-500">REQUESTER NAME</span>} name="userName">
                                        <Input disabled className="bg-gray-50 h-12 rounded-2xl text-gray-500 font-bold border-gray-100" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={8}>
                                    <Form.Item label={<span className="text-xs font-bold text-gray-500">LOCATION</span>} name="location">
                                        <Input disabled className="bg-gray-50 h-12 rounded-2xl text-gray-500 font-bold border-gray-100" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={8}>
                                    <Form.Item label={<span className="text-xs font-bold text-gray-500">DEPARTMENT</span>} name="departmentName">
                                        <Input disabled className="bg-gray-50 h-12 rounded-2xl text-gray-500 font-bold border-gray-100" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>

                        <div className="mb-10">
                            <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[3px] mb-6 flex items-center gap-3">
                                <span>02 PROJECT SPECIFICATIONS</span>
                                <div className="h-[1px] flex-1 bg-gray-100"></div>
                            </h3>
                            <Row gutter={[16, 16]}>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        label={<span className="text-xs font-bold text-gray-500 italic">REQUEST TYPE</span>}
                                        name="requestType"
                                        rules={[{ required: true, message: 'Please select request type' }]}
                                    >
                                        <Select className="custom-select h-12 rounded-2xl overflow-hidden border-gray-100">
                                            <Option value="New Project">New Project</Option>
                                            <Option value="Modification">Modification</Option>
                                            <Option value="Replacement">Replacement</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        label={<span className="text-xs font-bold text-gray-500 italic">PLANT LOCATION</span>}
                                        name="plantLocation"
                                        rules={[{ required: true, message: 'Please select plant location' }]}
                                    >
                                        <Select className="custom-select h-12 rounded-2xl overflow-hidden border-gray-100">
                                            <Option value="Hosur Plant 1 (TN)">Hosur Plant 1 (TN)</Option>
                                            <Option value="Hosur Plant 2 (TN)">Hosur Plant 2 (TN)</Option>
                                            <Option value="Mysore Plant (KA)">Mysore Plant (KA)</Option>
                                            <Option value="Nalagarh Plant (HP)">Nalagarh Plant (HP)</Option>
                                            <Option value="Karawang Plant (Indonesia)">Karawang Plant (Indonesia)</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        label={<span className="text-xs font-bold text-gray-500 italic">PRODUCT MODEL</span>}
                                        name="productModel"
                                        rules={[{ required: true, message: 'Please select product model' }]}
                                    >
                                        <Select mode="tags" className="custom-select h-auto min-h-[48px] rounded-2xl overflow-hidden border-gray-100">
                                            <Option value="Scooter">Scooter</Option>
                                            <Option value="Motorcycle">Motorcycle</Option>
                                            <Option value="Moped">Moped</Option>
                                            <Option value="Three Wheeler">Three Wheeler</Option>
                                            <Option value="Electric Vehicle">Electric Vehicle</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        label={<span className="text-xs font-bold text-gray-500 italic">HANDLING PART NAME</span>}
                                        name="handlingPartName"
                                        rules={[{ required: true, message: 'Please enter handling part name' }]}
                                    >
                                        <Input placeholder="e.g. Chassis, Engine, Fuel Tank" className="h-12 rounded-2xl border-gray-100" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>

                        <div className="mb-10">
                            <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[3px] mb-6 flex items-center gap-3">
                                <span>03 EQUIPMENT & LOGISTICS</span>
                                <div className="h-[1px] flex-1 bg-gray-100"></div>
                            </h3>
                            <Row gutter={[16, 16]}>
                                <Col xs={24} md={8}>
                                    <Form.Item
                                        label={<span className="text-xs font-bold text-gray-500 italic">EQUIPMENT TYPE</span>}
                                        name="materialHandlingEquipment"
                                        rules={[{ required: true, message: 'Please enter equipment type' }]}
                                    >
                                        <Input placeholder="e.g. Trolley, Pallet, Rack" className="h-12 rounded-2xl border-gray-100" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={8}>
                                    <Form.Item
                                        label={<span className="text-xs font-bold text-gray-500 italic">HANDLING LOCATION</span>}
                                        name="materialHandlingLocation"
                                        rules={[{ required: true, message: 'Please enter handling location' }]}
                                    >
                                        <Input placeholder="e.g. Assembly Line A, Logistics Dock 4" className="h-12 rounded-2xl border-gray-100" />
                                    </Form.Item>
                                </Col>
                                <Col xs={12} md={4}>
                                    <Form.Item
                                        label={<span className="text-xs font-bold text-gray-500 italic">FROM</span>}
                                        name="from"
                                        rules={[{ required: true, message: 'Origin required' }]}
                                    >
                                        <Input placeholder="Origin" className="h-12 rounded-2xl border-gray-100" />
                                    </Form.Item>
                                </Col>
                                <Col xs={12} md={4}>
                                    <Form.Item
                                        label={<span className="text-xs font-bold text-gray-500 italic">TO</span>}
                                        name="to"
                                        rules={[{ required: true, message: 'Destination required' }]}
                                    >
                                        <Input placeholder="Destination" className="h-12 rounded-2xl border-gray-100" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        label={<span className="text-xs font-bold text-gray-500 italic">VOLUME PER DAY</span>}
                                        name="volumePerDay"
                                        rules={[{ required: true, message: 'Please enter volume' }]}
                                    >
                                        <Input type="number" placeholder="Daily unit volume" className="h-12 rounded-2xl border-gray-100" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} sm={12}>
                                    <Form.Item
                                        label={<span className="text-xs font-bold text-gray-500 italic">PROBLEM STATEMENT</span>}
                                        name="problemStatement"
                                        rules={[{ required: true, message: 'Please describe the problem' }]}
                                    >
                                        <Input.TextArea rows={1} placeholder="Briefly describe the requirement or problem" className="rounded-2xl border-gray-100 py-3" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>

                        <div className="flex justify-end gap-3 mt-10">
                            <Button
                                onClick={() => setIsModalOpen(false)}
                                className="h-12 px-8 rounded-2xl border-gray-200 font-bold text-gray-400 hover:text-gray-600 transition-all"
                            >
                                CANCEL
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                className="h-12 px-10 rounded-2xl bg-tvs-blue hover:bg-blue-700 font-black tracking-widest shadow-lg shadow-blue-100 transition-all"
                            >
                                SUBMIT MH REQUEST
                            </Button>
                        </div>
                    </Form>
                </div>
            </AntModal>

            {/* View Request Modal */}
            <AntModal
                title={
                    <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                        <Eye size={20} className="text-tvs-blue" />
                        <span className="text-lg font-bold">Request Details - {selectedRequest?.mhRequestId}</span>
                    </div>
                }
                open={isViewModalOpen}
                onCancel={() => setIsViewModalOpen(false)}
                footer={null}
                width={700}
                centered
            >
                {selectedRequest && (
                    <div className="py-4 space-y-6">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Status</p>
                                <Tag color={selectedRequest.status === 'Accepted' ? 'green' : selectedRequest.status === 'Rejected' ? 'red' : 'blue'} className="rounded-md font-bold">
                                    {selectedRequest.status?.toUpperCase() || 'PENDING'}
                                </Tag>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Progress</p>
                                <Tag color="gold" className="rounded-md font-bold">
                                    {selectedRequest.progressStatus?.toUpperCase() || 'NEW'}
                                </Tag>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Department</p>
                                <p className="text-sm font-bold text-gray-800">{selectedRequest.departmentName}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Plant</p>
                                <p className="text-sm font-bold text-gray-800">{selectedRequest.plantLocation}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Product</p>
                                <p className="text-sm font-bold text-gray-800">{selectedRequest.productModel}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Part Name</p>
                                <p className="text-sm font-bold text-gray-800">{selectedRequest.handlingPartName}</p>
                            </div>
                            <div className="col-span-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Problem Statement</p>
                                <p className="text-sm text-gray-700 leading-relaxed">{selectedRequest.problemStatement}</p>
                            </div>
                        </div>
                    </div>
                )}
            </AntModal>

            <style>{`
                .custom-select .ant-select-selector {
                    border-radius: 1rem !important;
                    height: 48px !important;
                    display: flex !important;
                    align-items: center !important;
                    border-color: #f3f4f6 !important;
                }
                .custom-select .ant-select-selection-item {
                    font-weight: 600 !important;
                    color: #1f2937 !important;
                }
                .mh-request-grid.rdg-light {
                    width: 100%;
                    height: 100%;
                    border: none;
                }
                .mh-request-grid .rdg-row .rdg-cell {
                    border-inline: none;
                    padding-block: 12px;
                    padding-inline: 16px;
                    font-size: 13px;
                }
                .mh-request-grid .rdg-row:not(.rdg-row-selected) .rdg-cell {
                    border-bottom: 1px solid #f1f5f9;
                }
                .mh-request-grid .rdg-row:hover .rdg-cell {
                    background-color: #f8fafc;
                }
                .mh-request-grid .rdg-header-row .rdg-cell {
                    padding-block: 14px;
                    padding-inline: 16px;
                    font-weight: 700;
                    border-inline: none;
                    border-bottom: 2px solid #e2e8f0;
                    position: relative;
                    font-size: 12px;
                    background-color: #253C80;
                    color: #ffffff;
                }
            `}</style>
        </div>
    );
};

export default CreateMHRequestList;