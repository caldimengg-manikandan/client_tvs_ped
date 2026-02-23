import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Modal } from 'antd';
import { ClipboardList, Eye, Filter } from 'lucide-react';
import dayjs from 'dayjs';
import { fetchTrackers, updateTracker, clearError, clearSuccess } from '../redux/slices/mhDevelopmentTrackerSlice';
import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';
import ProjectPlanActualModal from './ProjectPlanActualModal';
import { toast } from 'react-hot-toast';

const ProjectPlanModel = () => {
    const dispatch = useDispatch();
    const { trackers, loading, error, success } = useSelector(state => state.mhDevelopmentTracker);
    const [projectPlanVisible, setProjectPlanVisible] = useState(false);
    const [selectedTrackerId, setSelectedTrackerId] = useState(null);
    const [viewPlanVisible, setViewPlanVisible] = useState(false);
    const [viewTrackerId, setViewTrackerId] = useState(null);
    const [columnFilters, setColumnFilters] = useState({});
    const [activeFilterKey, setActiveFilterKey] = useState(null);
    const [filterSearchText, setFilterSearchText] = useState({});
    const [gridWidth, setGridWidth] = useState(0);
    const gridContainerRef = useRef(null);

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
                const milestones = t.projectPlan.milestones;

                let planStart = null;
                let planEnd = null;
                let actualStart = null;
                let actualEnd = null;
                let delayInDays = 0;

                milestones.forEach(m => {
                    if (m.planStart) {
                        if (!planStart || dayjs(m.planStart).isBefore(dayjs(planStart))) {
                            planStart = m.planStart;
                        }
                    }
                    if (m.planEnd) {
                        if (!planEnd || dayjs(m.planEnd).isAfter(dayjs(planEnd))) {
                            planEnd = m.planEnd;
                        }
                    }
                    if (m.actualStart) {
                        if (!actualStart || dayjs(m.actualStart).isBefore(dayjs(actualStart))) {
                            actualStart = m.actualStart;
                        }
                    }
                    if (m.actualEnd) {
                        if (!actualEnd || dayjs(m.actualEnd).isAfter(dayjs(actualEnd))) {
                            actualEnd = m.actualEnd;
                        }
                    }
                    if (typeof m.delayInDays === 'number') {
                        if (m.delayInDays > delayInDays) {
                            delayInDays = m.delayInDays;
                        }
                    }
                });

                rows.push({
                    trackerId: t._id,
                    assetRequestId: t.assetRequestId,
                    planStart,
                    planEnd,
                    actualStart,
                    actualEnd,
                    delayInDays
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

    const handleProjectPlanSave = () => {
        setProjectPlanVisible(false);
        setSelectedTrackerId(null);
        dispatch(fetchTrackers());
    };

    const applyColumnFilters = rows => {
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

    const FilterHeaderCell = ({ column }) => {
        const key = column.key;
        const valuesSet = new Set();
        milestoneRows.forEach(row => {
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

        const toggleValue = value => {
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
            <div className="relative h-full flex items-center justify-between px-2 text-xs">
                <div className="flex-1 min-w-0">
                    <span className="font-semibold text-white truncate">{column.name}</span>
                </div>
                <button
                    type="button"
                    onClick={e => {
                        e.stopPropagation();
                        setActiveFilterKey(prev => (prev === key ? null : key));
                    }}
                    className={`ml-1 p-0.5 rounded ${hasFilter ? 'bg-tvs-blue text-white' : 'text-gray-400 hover:bg-gray-100'
                        }`}
                >
                    <Filter size={10} />
                </button>
                {activeFilterKey === key && (
                    <div className="absolute z-50 top-full right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                        <div className="flex items-center justify-between mb-2">
                            <button
                                type="button"
                                onClick={handleSelectAll}
                                className="text-[10px] font-semibold text-tvs-blue"
                            >
                                Select All
                            </button>
                            <button
                                type="button"
                                onClick={handleClear}
                                className="text-[10px] font-semibold text-gray-500"
                            >
                                Clear
                            </button>
                        </div>
                        <div className="mb-2">
                            <input
                                type="text"
                                value={searchValue}
                                onChange={e =>
                                    setFilterSearchText(prev => ({ ...prev, [key]: e.target.value }))
                                }
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

    const gridRows = applyColumnFilters(milestoneRows);

    const dataGridColumns = [
        {
            key: 'assetRequestId',
            name: 'ASSET ID',
            width: 170,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className="font-semibold text-gray-900">{row.assetRequestId}</span>
            )
        },
        {
            key: 'planStart',
            name: 'PLAN START',
            width: 150,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span>{row.planStart ? dayjs(row.planStart).format('DD-MMM-YYYY') : '-'}</span>
            )
        },
        {
            key: 'planEnd',
            name: 'PLAN END',
            width: 150,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span>{row.planEnd ? dayjs(row.planEnd).format('DD-MMM-YYYY') : '-'}</span>
            )
        },
        {
            key: 'actualStart',
            name: 'ACTUAL START DATE',
            width: 180,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span>
                    {row.actualStart ? dayjs(row.actualStart).format('DD-MMM-YYYY') : '-'}
                </span>
            )
        },
        {
            key: 'actualEnd',
            name: 'ACTUAL END DATE',
            width: 180,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span>{row.actualEnd ? dayjs(row.actualEnd).format('DD-MMM-YYYY') : '-'}</span>
            )
        },
        {
            key: 'delayInDays',
            name: 'DELAY IN DAYS',
            width: 160,
            renderHeaderCell: FilterHeaderCell
        },
        {
            key: 'action',
            name: 'ACTIONS',
            width: 180,
            renderCell: ({ row }) => (
                <div className="flex items-center justify-center gap-2">
                    <button
                        type="button"
                        className="p-1.5 rounded-full border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200 bg-white shadow-sm"
                        onClick={() => handleViewPlan(row.trackerId)}
                        title="View Project Plan"
                    >
                        <Eye size={14} />
                    </button>
                    <button
                        type="button"
                        className="px-3 py-1.5 text-xs font-semibold rounded-full border border-indigo-100 text-indigo-600 hover:bg-indigo-50 bg-white shadow-sm"
                        onClick={() => handleProjectPlan(row.trackerId)}
                        title="Initialise Actual Start"
                    >
                        Initialise Actual Start
                    </button>
                </div>
            )
        }
    ];

    const autoFitColumns = useMemo(() => {
        if (!gridWidth) return dataGridColumns;

        const totalDefinedWidth = dataGridColumns.reduce((sum, column) => {
            return sum + (column.width || 0);
        }, 0);

        if (!totalDefinedWidth) return dataGridColumns;

        const scale = gridWidth / totalDefinedWidth;

        return dataGridColumns.map(column => {
            if (!column.width) return column;
            const scaledWidth = Math.max(Math.floor(column.width * scale), 120);

            return {
                ...column,
                width: scaledWidth
            };
        });
    }, [dataGridColumns, gridWidth]);

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

    useEffect(() => {
        if (!gridContainerRef.current) return;

        const updateWidth = () => {
            setGridWidth(gridContainerRef.current.clientWidth);
        };

        updateWidth();

        const observer = new ResizeObserver(updateWidth);
        observer.observe(gridContainerRef.current);

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <div className="flex-1 flex flex-col h-full w-full bg-transparent">
            <div
                ref={gridContainerRef}
                className="flex-1 w-full border border-gray-200 rounded-2xl overflow-hidden bg-white relative min-h-[400px]"
            >
                <div className="h-full w-full absolute inset-0">
                    <DataGrid
                        columns={autoFitColumns}
                        rows={gridRows}
                        rowKeyGetter={row =>
                            `${row.trackerId || ''}-${row.sNo || ''}-${row.activity || ''}`
                        }
                        className="rdg-light mh-development-grid"
                        style={{ blockSize: '100%' }}
                        rowHeight={60}
                        headerRowHeight={52}
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

            <ProjectPlanActualModal
                visible={projectPlanVisible}
                onCancel={() => setProjectPlanVisible(false)}
                onSave={handleProjectPlanSave}
                trackerInfo={
                    trackers.find(t => t._id === selectedTrackerId)
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
                                        Responsible Person
                                    </th>
                                    <th className="px-3 py-2 text-left border-b border-gray-200 font-semibold text-gray-600">
                                        Plan Start
                                    </th>
                                    <th className="px-3 py-2 text-left border-b border-gray-200 font-semibold text-gray-600">
                                        Plan End
                                    </th>
                                    <th className="px-3 py-2 text-left border-b border-gray-200 font-semibold text-gray-600">
                                        Actual Start
                                    </th>
                                    <th className="px-3 py-2 text-left border-b border-gray-200 font-semibold text-gray-600">
                                        Actual End
                                    </th>
                                    <th className="px-3 py-2 text-left border-b border-gray-200 font-semibold text-gray-600">
                                        Delay
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {viewMilestones.map(m => {
                                    const planStart = m.planStart ? dayjs(m.planStart) : null;
                                    const planEnd = m.planEnd ? dayjs(m.planEnd) : null;
                                    const actualStart = m.actualStart ? dayjs(m.actualStart) : null;
                                    const actualEnd = m.actualEnd ? dayjs(m.actualEnd) : null;

                                    return (
                                        <tr key={m.sNo || m.activity} className="border-b border-gray-100">
                                            <td className="px-3 py-2 text-gray-800">
                                                {m.activity || '-'}
                                            </td>
                                            <td className="px-3 py-2 text-gray-700">
                                                {m.remarks || '-'}
                                            </td>
                                            <td className="px-3 py-2 text-gray-700">
                                                {m.responsibility || '-'}
                                            </td>
                                            <td className="px-3 py-2 text-gray-700">
                                                {planStart ? planStart.format('DD-MMM-YYYY') : '-'}
                                            </td>
                                            <td className="px-3 py-2 text-gray-700">
                                                {planEnd ? planEnd.format('DD-MMM-YYYY') : '-'}
                                            </td>
                                            <td className="px-3 py-2 text-gray-700">
                                                {actualStart ? actualStart.format('DD-MMM-YYYY') : '-'}
                                            </td>
                                            <td className="px-3 py-2 text-gray-700">
                                                {actualEnd ? actualEnd.format('DD-MMM-YYYY') : '-'}
                                            </td>
                                            <td className={`px-3 py-2 font-medium ${m.delayInDays > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                                                {m.delayInDays > 0 ? `${m.delayInDays} days` : '-'}
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
