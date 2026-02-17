import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, FileText, X, Filter } from 'lucide-react';
import { fetchAssetRequests, deleteAssetRequest, createAssetRequest, resetStatus } from '../../redux/slices/assetRequestSlice';
import { useAuth } from '../../context/AuthContext';
import { Modal as AntModal, message, Form, Input, Select, Button, Row, Col, Tag } from 'antd';
import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';

// AG Grid Modules are registered GLOBALLY in agGridConfig.js


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

        // Set default values from logged in user
        form.setFieldsValue({
            departmentName: user.department || 'N/A',
            location: user.location || 'N/A',
            userName: user.name || 'N/A',
            mailId: user.email || ''
        });
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (values) => {
        const formData = new FormData();
        Object.keys(values).forEach(key => {
            if (values[key] !== undefined && values[key] !== null) {
                // If it's an array (like productModel tags), join it or handle it
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
    const gridRows = applyColumnFilters(baseRows);

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
            <div className="relative h-full flex items-center justify-between px-2 text-xs gap-1">
                <div className="flex-1 min-w-0">
                    <span className="font-semibold text-white truncate">{column.name}</span>
                </div>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveFilterKey(prev => (prev === key ? null : key));
                    }}
                    className={`ml-1 p-0.5 rounded shrink-0 ${hasFilter ? 'bg-tvs-blue text-white' : 'text-gray-400 hover:bg-gray-100'}`}
                >
                    <Filter size={10} />
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
            name: '#',
            width: 70,
            frozen: true,
            renderCell: ({ rowIdx }) => (
                <span className="font-semibold text-gray-700">{rowIdx + 1}</span>
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
            key: 'departmentName',
            name: 'DEPT',
            width: 120,
            renderHeaderCell: FilterHeaderCell
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
            key: 'userName',
            name: 'USER NAME',
            width: 150,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className="font-semibold text-gray-900">{row.userName}</span>
            )
        },
        {
            key: 'location',
            name: 'USER LOC',
            width: 140,
            renderHeaderCell: FilterHeaderCell
        }
    ];

    const autoFitColumns = React.useMemo(() => {
        if (!mhListGridWidth) return dataGridColumns;

        const totalDefinedWidth = dataGridColumns.reduce((sum, column) => {
            return sum + (column.width || 0);
        }, 0);

        if (!totalDefinedWidth) return dataGridColumns;

        const scale = Math.max(mhListGridWidth / totalDefinedWidth, 1);

        return dataGridColumns.map((column) => {
            if (!column.width) return column;
            const scaledWidth = Math.max(Math.floor(column.width * scale), column.width, 80);

            return {
                ...column,
                width: scaledWidth
            };
        });
    }, [dataGridColumns, mhListGridWidth]);

    useEffect(() => {
        if (!mhListGridContainerRef.current) return;

        const updateWidth = () => {
            setMhListGridWidth(mhListGridContainerRef.current.clientWidth);
        };

        updateWidth();

        const observer = new ResizeObserver(updateWidth);
        observer.observe(mhListGridContainerRef.current);

        return () => {
            observer.disconnect();
        };
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
        <div className="flex flex-col h-full space-y-6 fade-in pb-12">
            {/* Enhanced AG Grid Table Section */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6" style={{ backgroundColor: '#fafafa' }}>
                    {/* Toolbar with Export and Create Button */}
                    <div className="mb-4 flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Showing <span className="text-gray-900 font-bold">{requests?.length || 0}</span> active requests</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleExportCsv}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg font-semibold text-sm"
                            >
                                <FileText size={16} />
                                Template Download
                            </button>
                            <button
                                onClick={handleCreateClick}
                                className="flex items-center gap-3 bg-tvs-blue text-white px-6 py-2 rounded-lg font-bold shadow-md hover:shadow-lg hover:bg-blue-700 transition-all"
                            >
                                <Plus size={20} strokeWidth={3} />
                                <span>CREATE NEW REQUEST</span>
                            </button>
                        </div>
                    </div>

                    <div
                        ref={mhListGridContainerRef}
                        className="w-full h-[600px] border border-gray-200 rounded-xl overflow-hidden bg-white relative"
                    >
                        <div className="h-full">
                            <DataGrid
                                columns={autoFitColumns}
                                rows={gridRows}
                                rowKeyGetter={(row) => row._id || row.mhRequestId}
                                className="rdg-light mh-request-grid"
                                style={{ blockSize: '100%', width: '100%' }}
                                rowHeight={52}
                                headerRowHeight={48}
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
            </div>

            {/* Create MH Request Modal Overhaul */}
            <AntModal
                title={
                    <div className="flex items-center gap-5 p-4 bg-gradient-to-r from-tvs-blue/5 to-transparent rounded-t-3xl border-b border-gray-100">
                        <div className="w-14 h-14 rounded-2xl bg-white border border-tvs-blue/10 flex items-center justify-center text-tvs-blue shadow-sm">
                            <Plus size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 font-outfit tracking-tight">System Initialization</h2>
                            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Create New Material Handling Entry</p>
                        </div>
                    </div>
                }
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={1000}
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
                        {/* Hidden Fields */}
                        <Form.Item name="mailId" hidden>
                            <Input />
                        </Form.Item>
                        {/* Section: Personnel Info */}
                        <div className="mb-10">
                            <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[3px] mb-6 flex items-center gap-3">
                                <span>01 PERSONNEL DATA</span>
                                <div className="h-[1px] flex-1 bg-gray-100"></div>
                            </h3>
                            <Row gutter={24}>
                                <Col span={8}>
                                    <Form.Item label={<span className="text-xs font-bold text-gray-500">REQUESTER NAME</span>} name="userName">
                                        <Input disabled className="bg-gray-50 h-12 rounded-2xl text-gray-500 font-bold border-gray-100" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item label={<span className="text-xs font-bold text-gray-500">DEPARTMENT</span>} name="departmentName">
                                        <Input disabled className="bg-gray-50 h-12 rounded-2xl text-gray-500 font-bold border-gray-100" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item label={<span className="text-xs font-bold text-gray-500">OFFICE LOCATION</span>} name="location">
                                        <Input disabled className="bg-gray-50 h-12 rounded-2xl text-gray-500 font-bold border-gray-100" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>

                        {/* Section: Request Details */}
                        <div className="mb-10">
                            <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[3px] mb-6 flex items-center gap-3">
                                <span>02 REQUEST PARAMETERS</span>
                                <div className="h-[1px] flex-1 bg-gray-100"></div>
                            </h3>
                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item label={<span className="text-xs font-bold text-gray-500">REQUEST TYPE</span>} name="requestType" rules={[{ required: true }]}>
                                        <Select className="custom-select-large h-12">
                                            <Option value="New Project">New Project</Option>
                                            <Option value="Upgrade">Upgrade</Option>
                                            <Option value="Refresh">Refresh</Option>
                                            <Option value="Capacity">Capacity</Option>
                                            <Option value="Special Improvements">Special Improvements</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label={<span className="text-xs font-bold text-gray-500">PLANT LOCATION</span>} name="plantLocation" rules={[{ required: true }]}>
                                        <Select className="custom-select-large h-12">
                                            <Option value="Hosur Plant 1 (TN)">Hosur Plant 1 (TN)</Option>
                                            <Option value="Hosur Plant 2 (TN)">Hosur Plant 2 (TN)</Option>
                                            <Option value="Hosur Plant 3 (TN)">Hosur Plant 3 (TN)</Option>
                                            <Option value="Mysore (KA)">Mysore (KA)</Option>
                                            <Option value="Nalagarh (HP)">Nalagarh (HP)</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item label={<span className="text-xs font-bold text-gray-500">PRODUCT MODEL</span>} name="productModel" rules={[{ required: true }]}>
                                        <Select mode="tags" className="custom-select-large min-h-[48px]" placeholder="Scooter, Motorcycle, or type new...">
                                            <Option value="Scooter">Scooter</Option>
                                            <Option value="Motorcycle">Motorcycle</Option>
                                            <Option value="Super Premium">Super Premium</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item label={<span className="text-xs font-bold text-gray-500">HANDLING PART NAME</span>} name="handlingPartName" rules={[{ required: true }]}>
                                        <Input placeholder="e.g. Engine Block, Chassis" className="h-12 rounded-2xl font-semibold border-gray-100" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Form.Item label={<span className="text-xs font-bold text-gray-500">PROBLEM STATEMENT / REQUIREMENT</span>} name="problemStatement" rules={[{ required: true }]}>
                                <Input.TextArea rows={4} placeholder="Describe the current issue or material handling requirement in detail..." className="rounded-2xl p-4 font-semibold border-gray-100" />
                            </Form.Item>
                        </div>

                        {/* Section: Material Flow */}
                        <div className="mb-6">
                            <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[3px] mb-6 flex items-center gap-3">
                                <span>03 MATERIAL FLOW & LOGISTICS</span>
                                <div className="h-[1px] flex-1 bg-gray-100"></div>
                            </h3>
                            <Row gutter={24}>
                                <Col span={12}>
                                    <Form.Item label={<span className="text-xs font-bold text-gray-500">ZONE / SHOP FLOOR LOCATION</span>} name="materialHandlingLocation" rules={[{ required: true }]}>
                                        <Input placeholder="e.g. Shop Floor Zone A" className="h-12 rounded-2xl font-semibold border-gray-100" />
                                    </Form.Item>
                                </Col>
                                <Col span={4}>
                                    <Form.Item label={<span className="text-xs font-bold text-gray-500">FROM</span>} name="from" rules={[{ required: true }]}>
                                        <Input placeholder="Loc A" className="h-12 rounded-2xl font-bold text-center border-gray-100" />
                                    </Form.Item>
                                </Col>
                                <Col span={4}>
                                    <Form.Item label={<span className="text-xs font-bold text-gray-500">TO</span>} name="to" rules={[{ required: true }]}>
                                        <Input placeholder="Loc B" className="h-12 rounded-2xl font-bold text-center border-gray-100" />
                                    </Form.Item>
                                </Col>
                                <Col span={4}>
                                    <Form.Item label={<span className="text-xs font-bold text-gray-500">VOL/DAY</span>} name="volumePerDay" rules={[{ required: true }]}>
                                        <Input type="number" placeholder="0" className="h-12 rounded-2xl font-black text-center border-gray-100" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </div>

                        <div className="flex justify-end gap-4 mt-12 bg-gray-50 -mx-6 -mb-6 p-8 rounded-b-3xl">
                            <Button onClick={() => setIsModalOpen(false)} className="h-14 px-10 rounded-2xl font-bold border-gray-200 hover:bg-white text-gray-600">
                                ABORT
                            </Button>
                            <Button type="primary" htmlType="submit" loading={loading} className="h-14 px-12 rounded-2xl font-black bg-tvs-blue hover:bg-blue-700 border-none shadow-xl shadow-tvs-blue/30 scale-100 hover:scale-[1.02] transition-all">
                                SUBMIT MH REQUEST
                            </Button>
                        </div>
                    </Form>
                </div>
            </AntModal>


            <style>{`
                /* Minimalist AG Grid Styling - Matching Reference Image */
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                
                .custom-modal .ant-modal-content { border-radius: 40px; padding: 0; overflow: hidden; box-shadow: 0 40px 100px rgba(0,0,0,0.15); }
                .custom-modal .ant-modal-header { padding: 0; border: none; }
                .custom-modal .ant-modal-body { padding: 0; }
                
                .custom-select-large .ant-select-selector {
                    height: 48px !important;
                    border-radius: 16px !important;
                    border-color: #f1f5f9 !important;
                    font-weight: 600 !important;
                    display: flex !important;
                    align-items: center !important;
                }
                .ant-form-item-label label {
                    margin-bottom: 8px !important;
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
        </div >
    );
};

export default CreateMHRequestList;
