import React, { useState, useEffect, useRef } from 'react';
import { Download, UserPlus, X, Check, ArrowRight, Paperclip, Package, Filter } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAssetRequests, updateAssetRequest, sendEmailNotification } from '../redux/slices/assetRequestSlice';
import { fetchEmployees } from '../redux/slices/employeeSlice';
import { DataGrid } from 'react-data-grid';
import 'react-data-grid/lib/styles.css';

// AG Grid Modules are registered GLOBALLY in agGridConfig.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const RequestTracker = () => {
    const dispatch = useDispatch();

    // Redux State
    const { items: requests, loading: loadingRequests } = useSelector((state) => state.assetRequests);
    const { items: employees, loading: loadingEmployees } = useSelector((state) => state.employees);

    // Local UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [columnFilters, setColumnFilters] = useState({});
    const [activeFilterKey, setActiveFilterKey] = useState(null);
    const [filterSearchText, setFilterSearchText] = useState({});
    const [gridWidth, setGridWidth] = useState(0);

    const gridContainerRef = useRef(null);

    useEffect(() => {
        dispatch(fetchAssetRequests());
    }, [dispatch]);

    const handleAssignClick = (request) => {
        // Frontend validation - only allow notification for Rejected status
        if (request.status === 'Active') {
            toast.error('Cannot send notification. Request status is Active.');
            return;
        }

        if (request.status === 'Accepted') {
            toast.error('Cannot send notification. Notifications are only sent for Rejected requests.');
            return;
        }

        if (request.status !== 'Rejected') {
            toast.error('Notifications can only be sent for Rejected requests.');
            return;
        }

        setSelectedRequest(request);
        setSelectedMembers([]);
        setIsModalOpen(true);
        // Fetch employees if not already loaded (or just fetch always to be fresh)
        if (employees.length === 0) {
            dispatch(fetchEmployees());
        }
    };

    const handleConfirmAssign = async () => {
        if (!selectedRequest || selectedMembers.length === 0) {
            toast.warning('Please select at least one employee to notify');
            return;
        }

        // Additional validation - only allow Rejected status
        if (selectedRequest.status === 'Active') {
            toast.error('Cannot send notification. Request status is Active.');
            setIsModalOpen(false);
            return;
        }

        if (selectedRequest.status === 'Accepted') {
            toast.error('Cannot send notification. Notifications are only sent for Rejected requests.');
            setIsModalOpen(false);
            return;
        }

        if (selectedRequest.status !== 'Rejected') {
            toast.error('Notifications can only be sent for Rejected requests.');
            setIsModalOpen(false);
            return;
        }

        const result = await dispatch(sendEmailNotification({
            requestId: selectedRequest.mhRequestId,
            recipients: selectedMembers
        }));

        if (sendEmailNotification.fulfilled.match(result)) {
            toast.success('Email notifications sent successfully');
            setIsModalOpen(false);
            setSelectedMembers([]);
        } else {
            // Display backend validation error
            const errorMessage = result.payload || 'Failed to send email notifications';
            toast.error(errorMessage);
        }
    };

    const handleStatusChange = async (request, newStatus) => {
        // Frontend validation - prevent changes to finalized status
        if (request.status === 'Accepted' || request.status === 'Rejected') {
            toast.error(`Cannot change status. Request is already ${request.status} and locked.`);
            return;
        }

        const formData = {
            ...request,
            status: newStatus
        };

        // updateAssetRequest expects { id, formData }
        const result = await dispatch(updateAssetRequest({ id: request._id, formData }));

        if (updateAssetRequest.fulfilled.match(result)) {
            // Send email notification ONLY when request is REJECTED
            if (newStatus === 'Rejected' && request.mailId) {
                const emailResult = await dispatch(sendEmailNotification({
                    requestId: request.mhRequestId,
                    recipients: [request.mailId] // Send to request creator
                }));

                if (sendEmailNotification.fulfilled.match(emailResult)) {
                    toast.success(`Request ${newStatus}. Email notification sent to ${request.userName}.`);
                } else {
                    toast.warning(`Request ${newStatus}, but failed to send email notification.`);
                }
            } else if (newStatus === 'Accepted') {
                // Just show success message, no email for accepted requests
                toast.success(`Request ${newStatus} successfully.`);
            } else {
                toast.success(`Status updated to ${newStatus}.`);
            }
        } else {
            // Display backend validation error
            const errorMessage = result.payload || 'Failed to update status';
            toast.error(errorMessage);
        }
    };

    // Helper to get file URL
    const getFileUrl = (path) => {
        if (!path) return null;
        return `${API_BASE_URL.replace('/api', '')}${path}`;
    };

    // Helper to download file
    const downloadFile = (path, filename) => {
        const url = getFileUrl(path);
        if (url) {
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            toast.error('File not found or URL is invalid.');
        }
    };

    // Placeholder for handleAccept and handleReject
    const handleAccept = async (id) => {
        const request = requests.find(req => req._id === id);
        if (request) {
            await handleStatusChange(request, 'Accepted');
        }
    };

    const handleReject = async (id) => {
        const request = requests.find(req => req._id === id);
        if (request) {
            await handleStatusChange(request, 'Rejected');
        }
    };

    const handleAllocateAsset = (request) => {
        toast.info(`Allocate asset for request ${request.mhRequestId}`);
        // Implement allocation logic here
    };

    const baseRows = requests || [];

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
            <div className="relative h-full flex items-center justify-between px-2 text-xs gap-1 text-white">
                <div className="flex-1 min-w-0">
                    <span className="font-semibold truncate">{column.name}</span>
                </div>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveFilterKey(prev => (prev === key ? null : key));
                    }}
                    className={`ml-1 p-0.5 rounded shrink-0 ${hasFilter ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/10'}`}
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
            width: 150,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span className="font-semibold text-gray-900">{row.mhRequestId}</span>
            )
        },
        {
            key: 'departmentName',
            name: 'DEPT',
            width: 140,
            renderHeaderCell: FilterHeaderCell
        },
        {
            key: 'status',
            name: 'STATUS',
            width: 140,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => {
                const statusColors = {
                    'Active': 'bg-blue-50 text-tvs-blue border-blue-200',
                    'Accepted': 'bg-green-50 text-green-700 border-green-200',
                    'Rejected': 'bg-red-50 text-red-700 border-red-200'
                };
                return (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border inline-block ${statusColors[row.status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                        {row.status}
                    </span>
                );
            }
        },
        {
            key: 'location',
            name: 'LOCATION',
            width: 140,
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
            name: 'PART',
            width: 180,
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
            width: 170,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <div className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">{row.from}</span>
                    <ArrowRight size={14} className="text-gray-400" />
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded font-medium">{row.to}</span>
                </div>
            )
        },
        {
            key: 'problemStatement',
            name: 'PROBLEM',
            width: 230,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => (
                <span title={row.problemStatement} className="truncate block">
                    {row.problemStatement}
                </span>
            )
        },
        {
            key: 'userName',
            name: 'USER',
            width: 150,
            renderHeaderCell: FilterHeaderCell
        },
        {
            key: 'attachments',
            name: 'ATTACHMENTS',
            width: 100,
            renderCell: ({ row }) => {
                const hasDrawing = row.drawingFile?.filename;
                return hasDrawing ? (
                    <button
                        onClick={() => downloadFile(row.drawingFile.path, row.drawingFile.filename)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                    >
                        <Paperclip size={14} />
                        <Download size={14} />
                    </button>
                ) : (
                    <span className="text-gray-400 text-xs">No file</span>
                );
            }
        },
        {
            key: 'allocationAssetId',
            name: 'ASSET ID',
            width: 140,
            renderHeaderCell: FilterHeaderCell,
            renderCell: ({ row }) => {
                return row.allocationAssetId ? (
                    <span className="px-2.5 py-1 bg-tvs-blue text-white rounded-lg font-bold text-xs inline-block">
                        {row.allocationAssetId}
                    </span>
                ) : (
                    <span className="text-gray-400 text-xs">Not Allocated</span>
                );
            }
        },
        {
            key: 'actions',
            name: 'ACTIONS',
            width: 120,
            renderCell: ({ row }) => {
                const isPending = row.status === 'Active';
                const isRejected = row.status === 'Rejected';

                return (
                    <div className="flex gap-2">
                        {isPending && (
                            <>
                                <button
                                    onClick={() => handleAccept(row._id)}
                                    className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 border border-green-200"
                                    title="Accept Request"
                                >
                                    <Check size={16} />
                                </button>
                                <button
                                    onClick={() => handleReject(row._id)}
                                    className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 border border-red-200"
                                    title="Reject Request"
                                >
                                    <X size={16} />
                                </button>
                            </>
                        )}
                        {!isPending && !isRejected && (
                            <button
                                onClick={() => handleAllocateAsset(row)}
                                className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-200 text-xs font-medium"
                            >
                                <Package size={14} />
                                Allocate
                            </button>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'notify',
            name: 'NOTIFY',
            width: 120,
            renderCell: ({ row }) => {
                if (row.status === 'Accepted') {
                    return <span className="text-xs text-gray-400 italic">—</span>;
                }
                return (
                    <button
                        onClick={() => {
                            if (row.status === 'Rejected') {
                                handleAssignClick(row);
                            }
                        }}
                        disabled={row.status === 'Active'}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-xl transition-all text-[10px] font-black uppercase tracking-widest
                            ${row.status === 'Rejected'
                                ? 'bg-tvs-blue/10 text-tvs-blue border-tvs-blue/20 hover:bg-tvs-blue hover:text-white'
                                : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed opacity-50'
                            }`}
                    >
                        <UserPlus size={12} strokeWidth={3} />
                        Notify
                    </button>
                );
            }
        }
    ];

    const autoFitColumns = React.useMemo(() => {
        if (!gridWidth) return dataGridColumns;

        const totalDefinedWidth = dataGridColumns.reduce((sum, column) => {
            return sum + (column.width || 0);
        }, 0);

        if (!totalDefinedWidth) return dataGridColumns;

        const scale = Math.max(gridWidth / totalDefinedWidth, 1);

        return dataGridColumns.map((column) => {
            if (!column.width) return column;
            const scaledWidth = Math.max(Math.floor(column.width * scale), column.width, 80);

            return {
                ...column,
                width: scaledWidth
            };
        });
    }, [dataGridColumns, gridWidth]);

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
        <div className="bg-white rounded-lg shadow-sm border border-tvs-border overflow-hidden fade-in">

            <div ref={gridContainerRef} className="w-full h-[600px] border border-gray-200 rounded-xl overflow-hidden bg-white relative">
                <div className="h-full">
                    <DataGrid
                        columns={autoFitColumns}
                        rows={gridRows}
                        rowKeyGetter={(row) => row._id || row.mhRequestId}
                        className="rdg-light request-tracker-grid"
                        style={{ blockSize: '100%', width: '100%' }}
                        rowHeight={52}
                        headerRowHeight={48}
                        defaultColumnOptions={{
                            resizable: true
                        }}
                    />
                    {loadingRequests && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/60 pointer-events-none">
                            <div className="w-8 h-8 border-4 border-tvs-blue/20 border-t-tvs-blue rounded-full animate-spin" />
                        </div>
                    )}
                </div>
            </div>

            {/* Assign Member Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden transform transition-all">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold text-tvs-dark-gray">Select Employee</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-white focus:outline-none"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                                Select employees to notify about Request <strong className="text-tvs-blue">{selectedRequest?.mhRequestId}</strong>
                            </p>

                            <div className="max-h-[300px] overflow-y-auto border border-gray-200 rounded-lg shadow-inner bg-gray-50/30">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-tvs-blue text-white font-semibold border-b border-tvs-blue">
                                        <tr>
                                            <th className="px-4 py-3 w-16 text-center border-r border-gray-200">S.No</th>
                                            <th className="px-4 py-3 border-r border-gray-200">Email</th>
                                            <th className="px-4 py-3 w-16 text-center">Select</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">

                                        {loadingEmployees ? (
                                            <tr>
                                                <td colSpan="3" className="p-4 text-center text-gray-500">Loading employees...</td>
                                            </tr>
                                        ) : employees.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="p-4 text-center text-gray-500">No employees found</td>
                                            </tr>
                                        ) : (
                                            employees.map((emp, index) => {
                                                const email = emp.contactEmail || emp.mailId;
                                                const name = emp.employeeName || emp.fullName;

                                                if (!email) return null;

                                                const isSelected = selectedMembers.includes(email);
                                                return (
                                                    <tr
                                                        key={emp._id || index}
                                                        className={`hover:bg-blue-50 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/30' : ''}`}
                                                        onClick={() => {
                                                            if (isSelected) {
                                                                setSelectedMembers(selectedMembers.filter(m => m !== email));
                                                            } else {
                                                                setSelectedMembers([...selectedMembers, email]);
                                                            }
                                                        }}
                                                    >
                                                        <td className="px-4 py-3 text-center text-gray-500 border-r border-gray-100">{index + 1}</td>
                                                        <td className="px-4 py-3 text-gray-700 font-medium border-r border-gray-100">
                                                            <div>{name}</div>
                                                            <div className="text-xs text-gray-400 font-normal">{email}</div>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected
                                                                ? 'bg-tvs-blue border-tvs-blue text-white'
                                                                : 'bg-white border-gray-300 text-transparent hover:border-tvs-blue'
                                                                }`}>
                                                                <Check size={14} strokeWidth={3} />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirmAssign}
                                    className="px-4 py-2 text-sm font-medium !text-white bg-tvs-blue rounded-lg hover:bg-blue-700 shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    disabled={selectedMembers.length === 0}
                                >
                                    Send Email{selectedMembers.length !== 1 ? 's' : ''}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <style>{`
                .request-tracker-grid.rdg-light {
                    width: 100%;
                    height: 100%;
                    border: none;
                }
                .request-tracker-grid .rdg-row .rdg-cell {
                    border-inline: none;
                    padding-block: 12px;
                    padding-inline: 16px;
                    font-size: 13px;
                }
                .request-tracker-grid .rdg-row:not(.rdg-row-selected) .rdg-cell {
                    border-bottom: 1px solid #f1f5f9;
                }
                .request-tracker-grid .rdg-row:hover .rdg-cell {
                    background-color: #f8fafc;
                }
                .request-tracker-grid .rdg-header-row .rdg-cell {
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

export default RequestTracker;
