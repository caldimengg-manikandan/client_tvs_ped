import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, FileText, X } from 'lucide-react';
import { fetchAssetRequests, deleteAssetRequest, createAssetRequest, resetStatus } from '../../redux/slices/assetRequestSlice';
import { useAuth } from '../../context/AuthContext';
import { Modal as AntModal, message, Form, Input, Select, Button, Row, Col, Tag } from 'antd';
import { AgGridReact } from 'ag-grid-react';
import { defaultColDef as globalDefaultColDef, defaultGridOptions, createSerialNumberColumn, createBoldColumn } from '../../config/agGridConfig';
import CustomCheckboxFilter from '../../components/AgGridCustom/CustomCheckboxFilter';
import CustomHeader from '../../components/AgGridCustom/CustomHeader';

// AG Grid Modules are registered GLOBALLY in agGridConfig.js


const { Option } = Select;

const CreateMHRequestList = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useAuth();
    const { items: requests, loading, success, error } = useSelector((state) => state.assetRequests);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    const gridRef = useRef();


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

    // Column Definitions for AG Grid - All Input Fields
    const columnDefs = useMemo(() => [
        createSerialNumberColumn(),
        {
            headerName: 'MH ID',
            field: 'mhRequestId',
            width: 140,
            cellClass: 'ag-cell-bold',
            pinned: 'left',
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            ...createBoldColumn('departmentName', 'DEPT', { width: 120 }),
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'TYPE',
            field: 'requestType',
            width: 150,
            cellClass: 'ag-cell-bold',
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'PLANT',
            field: 'plantLocation',
            width: 160,
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'PRODUCT',
            field: 'productModel',
            width: 180,
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'PART NAME',
            field: 'handlingPartName',
            width: 160,
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'HANDLING LOC',
            field: 'materialHandlingLocation',
            width: 180,
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'FLOW',
            width: 150,
            valueGetter: (params) => `${params.data.from} → ${params.data.to}`,
            cellClass: 'font-bold text-tvs-blue',
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'VOL/DAY',
            field: 'volumePerDay',
            width: 100,
            cellClass: 'text-center font-black',
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'PROBLEM STATEMENT',
            field: 'problemStatement',
            width: 250,
            tooltipField: 'problemStatement',
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            ...createBoldColumn('userName', 'USER NAME', { width: 150 }),
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        },
        {
            headerName: 'USER LOC',
            field: 'location',
            width: 140,
            headerComponent: CustomHeader,
            filter: CustomCheckboxFilter
        }
    ], []);


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
                                onClick={() => gridRef.current?.api?.exportDataAsCsv({
                                    fileName: `MH_Requests_${new Date().toISOString().split('T')[0]}.csv`,
                                    columnKeys: [
                                        'mhRequestId',
                                        'departmentName',
                                        'requestType',
                                        'productModel',
                                        'handlingPartName',
                                        'materialHandlingLocation',
                                        'userName',
                                        'location',
                                        'plantLocation',
                                        'from',
                                        'to',
                                        'volumePerDay',
                                        'problemStatement',
                                        'createdAt'
                                    ],
                                    allColumns: false,
                                    skipColumnGroupHeaders: true,
                                    skipColumnHeaders: false
                                })}
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

                    {/* Clean Minimalist AG Grid */}
                    <div className="ag-theme-alpine w-full h-[600px]">
                        <AgGridReact
                            ref={gridRef}
                            theme="legacy"
                            rowData={requests}
                            columnDefs={columnDefs}
                            defaultColDef={globalDefaultColDef}
                            {...defaultGridOptions}
                            loading={loading}
                        />
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
            `}</style>
        </div >
    );
};

export default CreateMHRequestList;
