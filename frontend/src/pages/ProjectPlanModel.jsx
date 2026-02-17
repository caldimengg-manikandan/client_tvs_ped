import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AgGridReact } from 'ag-grid-react';
import { Button, Modal } from 'antd';
import { ClipboardList, Eye, Edit } from 'lucide-react';
import dayjs from 'dayjs';
import { fetchTrackers, updateTracker, clearError, clearSuccess } from '../redux/slices/mhDevelopmentTrackerSlice';
import { createSerialNumberColumn, createBoldColumn, defaultColDef, defaultGridOptions } from '../config/agGridConfig';
import CustomCheckboxFilter from '../components/AgGridCustom/CustomCheckboxFilter';
import CustomHeader from '../components/AgGridCustom/CustomHeader';
import ProjectPlanModal from './MHDevelopmentTracker/ProjectPlanModal';
import { toast } from 'react-hot-toast';

const ProjectPlanModel = () => {
    const dispatch = useDispatch();
    const { trackers, loading, error, success } = useSelector(state => state.mhDevelopmentTracker);
    const gridRef = useRef();

    const [projectPlanVisible, setProjectPlanVisible] = useState(false);
    const [selectedTrackerId, setSelectedTrackerId] = useState(null);
    const [viewPlanVisible, setViewPlanVisible] = useState(false);
    const [viewTrackerId, setViewTrackerId] = useState(null);

    useEffect(() => {
        dispatch(fetchTrackers());
    }, [dispatch]);

    useEffect(() => {
        if (error) {
            toast.error(error);
            dispatch(clearError());
        }
        if (success) {
            toast.success('Project plan updated successfully');
            dispatch(clearSuccess());
            setProjectPlanVisible(false);
            setSelectedTrackerId(null);
        }
    }, [error, success, dispatch]);

    const milestoneRows = useMemo(() => {
        const rows = [];
        (trackers || []).forEach(t => {
            if (
                t.projectPlan &&
                Array.isArray(t.projectPlan.milestones) &&
                t.projectPlan.milestones.length > 0
            ) {
                t.projectPlan.milestones.forEach(m => {
                    rows.push({
                        trackerId: t._id,
                        assetRequestId: t.assetRequestId,
                        requestType: t.requestType,
                        productModel: t.productModel,
                        plantLocation: t.plantLocation,
                        implementationTarget: t.implementationTarget,
                        sNo: m.sNo,
                        activity: m.activity,
                        responsibility: m.responsibility,
                        planStart: m.planStart,
                        planEnd: m.planEnd,
                        actualStart: m.actualStart,
                        actualEnd: m.actualEnd,
                        delayDays: m.delayDays,
                        remarks: m.remarks
                    });
                });
            }
        });
        return rows;
    }, [trackers]);

    const handleProjectPlan = trackerId => {
        setSelectedTrackerId(trackerId);
        setProjectPlanVisible(true);
    };

    const handleViewPlan = trackerId => {
        setViewTrackerId(trackerId);
        setViewPlanVisible(true);
    };

    const handleProjectPlanSave = planData => {
        if (selectedTrackerId) {
            dispatch(
                updateTracker({
                    id: selectedTrackerId,
                    data: { projectPlan: planData }
                })
            );
        }
    };

    const columnDefs = useMemo(
        () => [
            {
                headerName: 'VIEW',
                width: 100,
                pinned: 'left',
                headerComponent: CustomHeader,
                cellRenderer: params => {
                    const trackerId = params.data.trackerId;
                    return (
                        <div className="flex items-center gap-2 justify-center">
                            <button
                                type="button"
                                className="p-1.5 rounded-full border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200 bg-white shadow-sm"
                                onClick={() => handleViewPlan(trackerId)}
                            >
                                <Eye size={14} />
                            </button>
                            <button
                                type="button"
                                className="p-1.5 rounded-full border border-indigo-100 text-indigo-600 hover:bg-indigo-50 bg-white shadow-sm"
                                onClick={() => handleProjectPlan(trackerId)}
                            >
                                <Edit size={14} />
                            </button>
                        </div>
                    );
                }
            },
            {
                ...createBoldColumn('assetRequestId', 'ASSET REQ ID', { width: 140 }),
                headerComponent: CustomHeader,
                filter: CustomCheckboxFilter
            },
            {
                field: 'requestType',
                headerName: 'REQ TYPE',
                width: 140,
                headerComponent: CustomHeader,
                filter: CustomCheckboxFilter
            },
            {
                field: 'productModel',
                headerName: 'PRODUCT MODEL',
                width: 160,
                headerComponent: CustomHeader,
                filter: CustomCheckboxFilter
            },
            {
                field: 'plantLocation',
                headerName: 'PLANT LOCATION',
                width: 140,
                headerComponent: CustomHeader,
                filter: CustomCheckboxFilter
            },
            {
                field: 'implementationTarget',
                headerName: 'IMP. TARGET',
                width: 130,
                valueFormatter: params =>
                    params.value ? dayjs(params.value).format('DD-MMM-YYYY') : '-',
                headerComponent: CustomHeader,
                filter: CustomCheckboxFilter
            },
            {
                field: 'sNo',
                headerName: 'S.No',
                width: 80,
                headerComponent: CustomHeader,
                filter: CustomCheckboxFilter
            },
            {
                field: 'activity',
                headerName: 'Activity',
                width: 180,
                headerComponent: CustomHeader,
                filter: CustomCheckboxFilter
            },
            {
                field: 'responsibility',
                headerName: 'Responsibility',
                width: 160,
                headerComponent: CustomHeader,
                filter: CustomCheckboxFilter
            },
            {
                field: 'planStart',
                headerName: 'Plan Start',
                width: 130,
                valueFormatter: params =>
                    params.value ? dayjs(params.value).format('DD-MMM-YYYY') : '-',
                headerComponent: CustomHeader,
                filter: CustomCheckboxFilter
            },
            {
                field: 'planEnd',
                headerName: 'Plan End',
                width: 130,
                valueFormatter: params =>
                    params.value ? dayjs(params.value).format('DD-MMM-YYYY') : '-',
                headerComponent: CustomHeader,
                filter: CustomCheckboxFilter
            },
            {
                field: 'actualStart',
                headerName: 'Actual Start',
                width: 130,
                valueFormatter: params =>
                    params.value ? dayjs(params.value).format('DD-MMM-YYYY') : '-',
                headerComponent: CustomHeader,
                filter: CustomCheckboxFilter
            },
            {
                field: 'actualEnd',
                headerName: 'Actual End',
                width: 130,
                valueFormatter: params =>
                    params.value ? dayjs(params.value).format('DD-MMM-YYYY') : '-',
                headerComponent: CustomHeader,
                filter: CustomCheckboxFilter
            },
            {
                field: 'delayDays',
                headerName: 'Delay (Days)',
                width: 120,
                headerComponent: CustomHeader,
                filter: CustomCheckboxFilter
            },
            {
                field: 'remarks',
                headerName: 'Remarks',
                width: 220,
                headerComponent: CustomHeader,
                filter: CustomCheckboxFilter
            }
        ],
        []
    );

    const selectedViewTracker = useMemo(
        () => trackers.find(t => t._id === viewTrackerId),
        [trackers, viewTrackerId]
    );

    const viewMilestones = useMemo(
        () =>
            selectedViewTracker &&
            selectedViewTracker.projectPlan &&
            Array.isArray(selectedViewTracker.projectPlan.milestones)
                ? selectedViewTracker.projectPlan.milestones
                : [],
        [selectedViewTracker]
    );

    return (
        <div className="min-h-screen bg-gray-50/50 p-4 lg:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center justify-center">
                        <ClipboardList size={28} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Project Plan Model</h1>
                        <p className="text-gray-500 font-medium">
                            View and manage project plan milestones created in MH Dev Tracker
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <div className="px-8 py-6">
                    <div className="ag-theme-alpine w-full mh-tracker-grid">
                        <AgGridReact
                            ref={gridRef}
                            rowData={milestoneRows}
                            columnDefs={columnDefs}
                            defaultColDef={defaultColDef}
                            {...defaultGridOptions}
                            domLayout="autoHeight"
                            loading={loading}
                        />
                    </div>
                </div>
            </div>

            <ProjectPlanModal
                visible={projectPlanVisible}
                onCancel={() => setProjectPlanVisible(false)}
                onSave={handleProjectPlanSave}
                trackerId={selectedTrackerId}
                initialData={
                    trackers.find(t => t._id === selectedTrackerId)?.projectPlan
                }
                assetRequestId={
                    trackers.find(t => t._id === selectedTrackerId)?.assetRequestId
                }
            />

            <Modal
                open={viewPlanVisible}
                onCancel={() => {
                    setViewPlanVisible(false);
                    setViewTrackerId(null);
                }}
                footer={null}
                width={900}
                title={
                    <div className="flex flex-col">
                        <span className="text-lg font-bold">
                            Project Tasks
                            {viewMilestones && viewMilestones.length > 0
                                ? ` (${viewMilestones.length})`
                                : ''}
                        </span>
                        {selectedViewTracker && (
                            <span className="text-xs text-gray-500 mt-1">
                                Asset Request ID: {selectedViewTracker.assetRequestId || '-'}
                            </span>
                        )}
                    </div>
                }
            >
                <div className="overflow-x-auto">
                    {viewMilestones && viewMilestones.length > 0 ? (
                        <table className="min-w-full border border-gray-200 rounded-xl text-xs">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left border-b border-gray-200 font-semibold text-gray-600">
                                        Phase
                                    </th>
                                    <th className="px-3 py-2 text-left border-b border-gray-200 font-semibold text-gray-600">
                                        Task
                                    </th>
                                    <th className="px-3 py-2 text-left border-b border-gray-200 font-semibold text-gray-600">
                                        Duration
                                    </th>
                                    <th className="px-3 py-2 text-left border-b border-gray-200 font-semibold text-gray-600">
                                        Responsible Person
                                    </th>
                                    <th className="px-3 py-2 text-left border-b border-gray-200 font-semibold text-gray-600">
                                        Start Date
                                    </th>
                                    <th className="px-3 py-2 text-left border-b border-gray-200 font-semibold text-gray-600">
                                        End Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {viewMilestones.map(m => {
                                    const planStart = m.planStart ? dayjs(m.planStart) : null;
                                    const planEnd = m.planEnd ? dayjs(m.planEnd) : null;
                                    let durationLabel = '-';
                                    if (planStart && planEnd) {
                                        const diff = planEnd.diff(planStart, 'day') + 1;
                                        if (!Number.isNaN(diff) && diff > 0) {
                                            durationLabel = `${diff} day${diff > 1 ? 's' : ''}`;
                                        }
                                    }
                                    return (
                                        <tr key={m.sNo || m.activity} className="border-b border-gray-100">
                                            <td className="px-3 py-2 text-gray-800">
                                                {m.activity || '-'}
                                            </td>
                                            <td className="px-3 py-2 text-gray-700">
                                                {m.remarks || '-'}
                                            </td>
                                            <td className="px-3 py-2 text-gray-700">
                                                {durationLabel}
                                            </td>
                                            <td className="px-3 py-2 text-gray-700">
                                                {m.responsibility || '-'}
                                            </td>
                                            <td className="px-3 py-2 text-gray-700">
                                                {planStart ? planStart.format('D/M/YYYY') : '-'}
                                            </td>
                                            <td className="px-3 py-2 text-gray-700">
                                                {planEnd ? planEnd.format('D/M/YYYY') : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="py-8 text-center text-gray-400 text-sm">
                            No project plan phases available for this tracker.
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default ProjectPlanModel;
