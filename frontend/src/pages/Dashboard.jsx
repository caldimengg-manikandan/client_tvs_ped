import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { Modal } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAssetRequests } from '../redux/slices/assetRequestSlice';
import KPICards from '../components/KPICards';
import { 
    TrendingUp, Activity, Clock, BarChart3, PieChart, Users, 
    FileText, Filter, RefreshCw, Search, Bell, 
    ChevronRight, ArrowUpRight, Zap, Target, Check,
    ClipboardList, Stamp, ShoppingBag, PenTool, FileSignature,
    Beaker, BadgeCheck, Handshake, Rocket
} from 'lucide-react';
import { DataGrid } from 'react-data-grid';
import { useAuth } from '../context/AuthContext';
import 'react-data-grid/lib/styles.css';
import { pptGenerator } from '../utils/pptGenerator';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const Dashboard = () => {
    const dispatch = useDispatch();
    const { user } = useAuth();
    const { items: assetRequests, loading: loadingRequests } = useSelector(state => state.assetRequests);

    const [stats, setStats] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [pptLoading, setPptLoading] = useState(false);

    const [kpiModal, setKpiModal] = useState({ open: false, type: null, title: '' });

    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const kpiSource = stats
        ? stats.kpiCards || {
            totalRequests: stats.totalRequests,
            accepted: stats.accepted,
            rejected: stats.rejected,
            implemented: stats.implemented
        }
        : null;

    const kpiChartData = kpiSource
        ? [
            {
                id: 'total',
                label: 'Total',
                value: kpiSource.totalRequests || 0,
                barColor: 'bg-indigo-500',
                glowColor: 'shadow-indigo-200'
            },
            {
                id: 'accepted',
                label: 'Accepted',
                value: kpiSource.accepted || 0,
                barColor: 'bg-emerald-500',
                glowColor: 'shadow-emerald-200'
            },
            {
                id: 'implemented',
                label: 'Implemented',
                value: kpiSource.implemented || 0,
                barColor: 'bg-amber-500',
                glowColor: 'shadow-amber-200'
            },
            {
                id: 'rejected',
                label: 'Rejected',
                value: kpiSource.rejected || 0,
                barColor: 'bg-rose-500',
                glowColor: 'shadow-rose-200'
            }
        ]
        : [];

    const maxKpiValue = kpiChartData.length > 0 ? Math.max(...kpiChartData.map(kpi => kpi.value), 1) : 1;

    const handleKpiClick = (type) => {
        let title = '';
        switch (type) {
            case 'total': title = 'All MH Requests'; break;
            case 'accepted': title = 'Approved MH Requests'; break;
            case 'implemented': title = 'Implemented MH Requests'; break;
            case 'rejected': title = 'Rejected MH Requests'; break;
            default: title = 'Requests';
        }

        setKpiModal({ open: true, type, title });

        // Fetch if empty
        if (assetRequests.length === 0) {
            dispatch(fetchAssetRequests());
        }
    };

    const getFilteredRequests = () => {
        if (!kpiModal.type) return [];
        if (kpiModal.type === 'total') return assetRequests;

        return assetRequests.filter(req => {
            if (kpiModal.type === 'accepted') return req.status === 'Accepted';
            if (kpiModal.type === 'rejected') return req.status === 'Rejected';
            if (kpiModal.type === 'implemented') return req.progressStatus === 'Production' || req.progressStatus === 'Implementation';
            return true;
        });
    };

    const dataGridColumns = React.useMemo(() => [
        {
            key: 'serial',
            name: 'S.NO',
            width: 80,
            frozen: true,
            renderCell: ({ rowIdx }) => (
                <span className="font-bold text-gray-700">{rowIdx + 1}</span>
            )
        },
        {
            key: 'mhRequestId',
            name: 'MH ID',
            width: 150
        },
        {
            key: 'departmentName',
            name: 'DEPARTMENT',
            width: 180
        },
        {
            key: 'userName',
            name: 'USER',
            width: 160
        },
        {
            key: 'handlingPartName',
            name: 'PART NAME',
            width: 200
        },
        {
            key: 'status',
            name: 'STATUS',
            width: 150,
            renderCell: ({ row }) => (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[1px] border ${getStatusColor(row.status)}`}>
                    {row.status}
                </span>
            )
        },
        {
            key: 'progressStatus',
            name: 'PROGRESS',
            width: 150,
            renderCell: ({ row }) => (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-gray-100 text-gray-500 border border-gray-200 inline-block leading-none">
                    {row.progressStatus || 'PENDING'}
                </span>
            )
        }
    ], []);


    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsRes, activityRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/dashboard/stats`),
                axios.get(`${API_BASE_URL}/api/dashboard/recent-activity?limit=5`)
            ]);

            setStats(statsRes.data);
            setRecentActivity(activityRes.data);
            setError(null);

            // Fetch trends separately (will use default date range)
            await fetchTrends();
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const fetchTrends = async () => {
        try {
            let url = `${API_BASE_URL}/api/dashboard/trends`;

            // Add date range params if both dates are selected
            if (fromDate && toDate) {
                url += `?from=${fromDate}&to=${toDate}`;
            }

            const trendsRes = await axios.get(url);
            setTrends(trendsRes.data);
        } catch (err) {
            console.error('Error fetching trends:', err);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return 'text-blue-600 bg-blue-50/50 border-blue-100';
            case 'Accepted': return 'text-emerald-600 bg-emerald-50/50 border-emerald-100';
            case 'Rejected': return 'text-rose-600 bg-rose-50/50 border-rose-100';
            default: return 'text-gray-600 bg-gray-50/50 border-gray-100';
        }
    };

    const getProgressColor = (progress) => {
        switch (progress) {
            case 'Design': return 'text-purple-600 bg-purple-50/50 border-purple-100';
            case 'Design Approved': return 'text-indigo-600 bg-indigo-50/50 border-indigo-100';
            case 'Implementation': return 'text-orange-600 bg-orange-50/50 border-orange-100';
            case 'Production': return 'text-emerald-600 bg-emerald-50/50 border-emerald-100';
            default: return 'text-gray-600 bg-gray-50/50 border-gray-100';
        }
    };

    const workflowStages = [
        {
            id: 'mh-requests',
            label: 'MH Requests',
            description: 'Request raised and captured',
            icon: ClipboardList
        },
        {
            id: 'approval-stage',
            label: 'Approval Stage',
            description: 'Screening and approvals',
            icon: Stamp
        },
        {
            id: 'vendor-selection',
            label: 'Vendor Selection',
            description: 'Partner identification',
            icon: Users
        },
        {
            id: 'design-release',
            label: 'Design Release',
            description: 'Engineering design finalized',
            icon: PenTool
        },
        {
            id: 'pr-po-release',
            label: 'PR / PO Release',
            description: 'Commercial release to vendor',
            icon: FileSignature
        },
        {
            id: 'sample-receipt',
            label: 'Sample Receipt / Trials',
            description: 'Trials and validation',
            icon: Beaker
        },
        {
            id: 'bulk-lot-clearance',
            label: 'Bulk Lot Clearance',
            description: 'Bulk production cleared',
            icon: BadgeCheck
        },
        {
            id: 'handover-signoff',
            label: 'Handover and Sign-off',
            description: 'Process handover completed',
            icon: Handshake
        },
        {
            id: 'asset-implementation',
            label: 'Asset Implementation',
            description: 'Asset rolled into production',
            icon: Rocket
        }
    ];

    const getActiveWorkflowIndex = () => {
        if (!stats?.productionWorkflow) return 0;

        const entries = Object.entries(stats.productionWorkflow || {});
        if (!entries.length) return 0;

        let lastNonZeroIndex = -1;

        entries.forEach(([, count], index) => {
            if (typeof count === 'number' && count > 0) {
                lastNonZeroIndex = index;
            }
        });

        if (lastNonZeroIndex === -1) return 0;

        const backendMaxIndex = entries.length - 1;
        if (backendMaxIndex <= 0) return 0;

        const mappedIndex = Math.round((lastNonZeroIndex / backendMaxIndex) * (workflowStages.length - 1));
        return Math.min(Math.max(mappedIndex, 0), workflowStages.length - 1);
    };

    const activeWorkflowIndex = getActiveWorkflowIndex();

    const getStageStatus = (index) => {
        if (!stats?.productionWorkflow) {
            return index === 0 ? 'active' : 'pending';
        }

        if (index < activeWorkflowIndex) return 'completed';
        if (index === activeWorkflowIndex) return 'active';
        return 'pending';
    };

    const getStageStatusMeta = (status) => {
        if (status === 'completed') {
            return {
                label: 'Completed',
                badgeClass: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
                circleClass: 'bg-gray-900 text-white border-gray-900 shadow-md shadow-gray-400/40'
            };
        }

        if (status === 'active') {
            return {
                label: 'In Progress',
                badgeClass: 'bg-indigo-50 text-indigo-700 border border-indigo-100',
                circleClass: 'bg-white text-gray-900 border-gray-900 ring-2 ring-indigo-300 shadow-lg shadow-indigo-200/80'
            };
        }

        return {
            label: 'Pending',
            badgeClass: 'bg-gray-50 text-gray-500 border border-gray-200',
            circleClass: 'bg-white text-gray-400 border-gray-300'
        };
    };

    const handleGeneratePPT = async () => {
        if (!stats) {
            return;
        }

        try {
            setPptLoading(true);
            const dashboardData = { stats, recentActivity, trends };
            const result = await pptGenerator.generateDashboardPPT(dashboardData);
            if (!result.success) {
                console.error('PPT generation failed:', result.error);
                window.alert('Failed to generate PPT. Please try again.');
            }
        } catch (error) {
            console.error('Error generating PPT:', error);
            window.alert('Failed to generate PPT. Please try again.');
        } finally {
            setPptLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-tvs-blue/10 border-t-tvs-blue rounded-full animate-spin"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-tvs-blue/5 rounded-full animate-pulse"></div>
                </div>
                <p className="mt-4 text-gray-500 font-medium animate-pulse">Synchronizing dashboard data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-rose-50 border border-rose-100 rounded-2xl p-8 max-w-lg mx-auto text-center"
            >
                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity size={32} />
                </div>
                <h3 className="text-lg font-bold text-rose-900 mb-2">Connection Error</h3>
                <p className="text-rose-600 mb-6">{error}</p>
                <button
                    onClick={fetchDashboardData}
                    className="flex items-center gap-2 mx-auto px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
                >
                    <RefreshCw size={18} />
                    Retry Connection
                </button>
            </motion.div>
        );
    }

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 pb-12"
        >
            <div className="flex justify-end">
                <button 
                    onClick={handleGeneratePPT} 
                    className="flex items-center gap-3 px-8 py-4 rounded-[1.5rem] bg-tvs-blue text-white shadow-xl shadow-tvs-blue/30 hover:bg-tvs-blue/90 hover:scale-[1.02] active:scale-[0.98] font-black transition-all group/btn disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={pptLoading || !stats}
                >
                    <FileText size={20} className={`${pptLoading ? 'animate-spin' : 'group-hover/btn:scale-110 transition-transform duration-700'}`} />
                    <span className="uppercase tracking-[2px] text-xs">Generate PPT</span>
                </button>
            </div>

            <motion.section
                variants={itemVariants}
                className="glass-card rounded-2xl p-6 border border-white/40 shadow-xl relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-72 h-72 bg-tvs-blue/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-base font-bold text-gray-800 flex items-center gap-2.5">
                            Key Performance Indicators
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                        <div className="lg:col-span-2 lg:border-r lg:border-gray-100 lg:pr-6">
                            <div className="h-full rounded-2xl bg-white/40 border border-white/60 shadow-sm flex items-center">
                                <div className="w-full p-4">
                                    <KPICards stats={stats?.kpiCards} onCardClick={handleKpiClick} />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center lg:pl-6">
                            <div className="w-full rounded-2xl bg-white/70 border border-gray-200 shadow-md p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[3px] text-gray-400">
                                            KPI Distribution
                                        </p>
                                        <p className="text-sm font-bold text-gray-800 mt-1">
                                            Snapshot of current request mix
                                        </p>
                                    </div>
                                </div>
                                {kpiChartData.length === 0 ? (
                                    <div className="flex items-center justify-center h-40 text-xs font-semibold text-gray-400">
                                        No KPI data available
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-end justify-between gap-4 mt-6">
                                            {kpiChartData.map((kpi, index) => {
                                                const heightPercent = maxKpiValue > 0 ? Math.max((kpi.value / maxKpiValue) * 100, 10) : 0;

                                                return (
                                                    <div key={kpi.id} className="flex-1 flex flex-col items-center gap-2 h-40">
                                                        <div className="w-full h-full flex items-end justify-center">
                                                            <motion.div
                                                                initial={{ height: 0 }}
                                                                animate={{ height: `${heightPercent}%` }}
                                                                transition={{ type: 'spring', stiffness: 140, damping: 18, delay: 0.1 + index * 0.05 }}
                                                                className={`relative w-6 md:w-5 rounded-xl ${kpi.barColor} shadow-lg ${kpi.glowColor} overflow-hidden`}
                                                            >
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-white/0 to-white/30 mix-blend-overlay"></div>
                                                            </motion.div>
                                                        </div>
                                                        <div className="text-[11px] font-semibold text-gray-500">
                                                            {kpi.label}
                                                        </div>
                                                        <div className="text-xs font-bold text-gray-900">
                                                            {kpi.value}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-semibold text-gray-400">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                                                <span>Total</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                <span>Accepted</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                                <span>Implemented</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                                <span>Rejected</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            <motion.section variants={itemVariants} className="glass-card rounded-2xl p-6 border border-white/40 shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-tvs-blue/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-tvs-blue/10 transition-colors duration-700"></div>
                <h2 className="text-lg font-bold mb-8 text-gray-800 flex items-center gap-2.5 relative">
                    Production Workflow Status
                </h2>
                <div className="relative">
                    <div className="relative mx-auto w-full">
                        <div className="relative w-full">
                            <div className="flex flex-col gap-6">
                                {/* Stepper track with icons and aligned labels */}
                                <div className="flex items-start gap-0">
                                    {workflowStages.map((stage, index) => {
                                        const status = getStageStatus(index);
                                        const statusMeta = getStageStatusMeta(status);
                                        const Icon = stage.icon;

                                        const connectorStatus = index - 1 < activeWorkflowIndex ? 'completed' : 'pending';
                                        const connectorClass =
                                            connectorStatus === 'completed'
                                                ? 'bg-gradient-to-r from-tvs-blue to-tvs-blue/70'
                                                : 'bg-gray-200';

                                        let circleClass = 'w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center border transition-all duration-300 shadow-sm';
                                        let iconClass = 'shrink-0';

                                        if (status === 'completed') {
                                            circleClass += ' bg-tvs-blue text-white border-tvs-blue shadow-md shadow-tvs-blue/40';
                                            iconClass += ' text-white';
                                        } else if (status === 'active') {
                                            circleClass += ' bg-white text-tvs-blue border-tvs-blue ring-2 ring-tvs-blue/30 shadow-md shadow-tvs-blue/30';
                                            iconClass += ' text-tvs-blue';
                                        } else {
                                            circleClass += ' bg-white text-gray-400 border-gray-300';
                                            iconClass += ' text-gray-300';
                                        }

                                        return (
                                            <div key={stage.id} className="flex-1 flex flex-col items-center min-w-0 px-1 md:px-2">
                                                <div className="w-full flex items-center">
                                                    <div className={`h-[3px] flex-1 rounded-full ${index === 0 ? 'bg-transparent' : connectorClass}`} />
                                                    <div className="flex-none flex items-center justify-center px-2">
                                                        <div className={circleClass}>
                                                            <Icon size={16} className={iconClass} />
                                                        </div>
                                                    </div>
                                                    <div className={`h-[3px] flex-1 rounded-full ${index === workflowStages.length - 1 ? 'bg-transparent' : connectorClass}`} />
                                                </div>

                                                <div className="mt-3 flex flex-col items-center text-center">
                                                    <div className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[2px]">
                                                        {`Step ${index + 1}`}
                                                    </div>
                                                    <div className={`mt-1 text-xs md:text-sm font-black ${status === 'pending' ? 'text-gray-500' : status === 'active' ? 'text-gray-900' : 'text-gray-800'}`}>
                                                        {stage.label}
                                                    </div>
                                                    {status === 'active' && (
                                                        <div className={`mt-2 inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[9px] font-semibold leading-none ${statusMeta.badgeClass}`}>
                                                            {statusMeta.label}
                                                        </div>
                                                    )}
                                                    {status === 'completed' && (
                                                        <div className="mt-2 text-[9px] font-semibold text-gray-400">
                                                            Completed
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity - Takes 2 columns */}
                <motion.div variants={itemVariants} className="lg:col-span-2 glass-card rounded-2xl p-6 border border-white/40 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="flex items-center justify-between mb-8 relative">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                                <Activity size={20} />
                            </div>
                            Live Activity Stream
                        </h2>
                        <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                Live Now
                            </span>
                        </div>
                    </div>
                    <div className="space-y-4 relative">
                        {recentActivity.length > 0 ? (
                            recentActivity.map((activity, idx) => (
                                <motion.div
                                    key={activity._id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + idx * 0.1 }}
                                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white/50 hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 rounded-2xl border border-transparent hover:border-gray-100 transition-all duration-300"
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform ${getStatusColor(activity.status).replace('text-', 'bg-').replace('border-', 'bg-opacity-10 text-')}`}>
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-bold text-gray-900">
                                                    {activity.mhRequestId}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${getStatusColor(activity.status)}`}>
                                                    {activity.status}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${getProgressColor(activity.progressStatus)}`}>
                                                    {activity.progressStatus || 'PENDING'}
                                                </span>
                                            </div>
                                            <div className="mt-1 text-xs text-gray-500 flex items-center gap-2 font-medium">
                                                <span className="text-tvs-blue font-bold">{activity.userName}</span>
                                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                <span>{activity.departmentName}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 sm:mt-0 flex flex-col items-end gap-1">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                            <Clock size={12} />
                                            {formatDate(activity.createdAt)}
                                        </div>
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-400">
                                                    {activity.userName?.charAt(0)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                                    <Activity size={32} />
                                </div>
                                <p className="text-sm font-bold opacity-60">No recent activity detected</p>
                            </div>
                        )}
                        <button className="w-full py-4 text-xs font-bold text-tvs-blue uppercase tracking-widest hover:bg-tvs-blue/5 rounded-2xl transition-colors mt-2">
                            View Full Audit Log
                        </button>
                    </div>
                </motion.div>

                {/* Category & Type Breakdown - Takes 1 column */}
                <motion.div variants={itemVariants} className="flex flex-col gap-6">
                    <div className="glass-card rounded-2xl p-6 border border-white/40 shadow-xl flex-1 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-tvs-blue via-indigo-500 to-transparent"></div>
                        <h2 className="text-lg font-bold mb-8 text-gray-800 flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                                <Target size={20} />
                            </div>
                            Core Breakdown
                        </h2>

                        {/* Product Model Breakdown */}
                        <div className="mb-8">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-4 flex items-center justify-between">
                                By Product Model
                                <span className="w-1/2 h-px bg-gray-100"></span>
                            </h3>
                            <div className="grid grid-cols-1 gap-3 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                                {stats?.additionalStats?.productBreakdown ? Object.entries(stats.additionalStats.productBreakdown).map(([model, count]) => (
                                    <div key={model} className="flex items-center justify-between p-4 bg-white/50 hover:bg-white rounded-2xl border border-transparent hover:border-gray-100 hover:shadow-lg hover:shadow-gray-200/30 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-tvs-blue opacity-40 group-hover:opacity-100 scale-0 group-hover:scale-100 transition-all"></div>
                                            <span className="text-sm font-bold text-gray-700">{model}</span>
                                        </div>
                                        <span className="text-lg font-black text-tvs-blue bg-tvs-blue/5 px-3 py-1 rounded-xl">
                                            {count}
                                        </span>
                                    </div>
                                )) : (
                                    <div className="text-center py-6 text-gray-400 text-xs italic">No model data available</div>
                                )}
                            </div>
                        </div>

                        {/* Request Type Breakdown */}
                        <div>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-4 flex items-center justify-between">
                                By Request Type
                                <span className="w-1/2 h-px bg-gray-100"></span>
                            </h3>
                            <div className="grid grid-cols-1 gap-3">
                                {stats?.additionalStats?.typeBreakdown ? Object.entries(stats.additionalStats.typeBreakdown).map(([type, count]) => (
                                    <div key={type} className="flex items-center justify-between p-4 bg-white/50 hover:bg-white rounded-2xl border border-transparent hover:border-gray-100 hover:shadow-lg hover:shadow-gray-200/30 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-amber-500 opacity-40 group-hover:opacity-100 scale-0 group-hover:scale-100 transition-all"></div>
                                            <span className="text-sm font-bold text-gray-700">{type}</span>
                                        </div>
                                        <span className="text-lg font-black text-amber-600 bg-amber-500/5 px-3 py-1 rounded-xl">
                                            {count}
                                        </span>
                                    </div>
                                )) : (
                                    <div className="text-center py-6 text-gray-400 text-xs italic">No type data available</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Highlight */}
                   
                </motion.div>
            </div>

            {/* Monthly Trends Chart */}
            {trends.length > 0 && (
                <motion.section variants={itemVariants} className="glass-card rounded-2xl p-8 border border-white/40 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-tvs-red/5 rounded-full blur-3xl -mr-48 -mt-48"></div>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-12 gap-8 relative">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-tvs-red/10 flex items-center justify-center text-tvs-red shadow-inner">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <span className="block text-xl font-bold">Historical Trends</span>
                                <span className="text-xs font-medium text-gray-400">Request Volume Analytics</span>
                            </div>
                        </h2>

                        {/* Filters Card */}
                        <div className="flex flex-wrap items-center gap-4 p-3 bg-white/60 backdrop-blur-md rounded-[1.5rem] border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 px-3">
                                <Filter size={16} className="text-tvs-blue" />
                                <div className="flex items-center gap-2">
                                    <input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-700 p-1"
                                    />
                                    <span className="text-gray-300 font-bold">—</span>
                                    <input
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-700 p-1"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 ml-auto">
                                <button
                                    onClick={fetchTrends}
                                    disabled={!fromDate || !toDate}
                                    className="px-6 py-2.5 bg-tvs-blue text-white rounded-xl hover:bg-tvs-blue/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-[10px] font-black uppercase tracking-widest shadow-lg shadow-tvs-blue/10"
                                >
                                    Apply Filter
                                </button>

                                {(fromDate || toDate) && (
                                    <button
                                        onClick={() => {
                                            setFromDate('');
                                            setToDate('');
                                            fetchTrends();
                                        }}
                                        className="px-6 py-2.5 bg-white text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-[10px] font-black uppercase tracking-widest"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto custom-scrollbar">
                        <div className="flex items-end gap-6 min-w-max pb-6 px-2" style={{ height: '280px' }}>
                            {trends.map((trend, index) => {
                                const maxValue = Math.max(...trends.map(t => t.total), 1);
                                
                                return (
                                    <div key={index} className="flex flex-col items-center gap-3 flex-1 min-w-[90px] group/chart">
                                        <div className="relative w-full h-[220px] flex items-end">
                                            {/* Background guide lines */}
                                            <div className="absolute inset-0 border-b border-gray-100 -z-0"></div>
                                            
                                            <div className="relative w-full flex flex-col gap-1 z-10">
                                                <AnimatePresence>
                                                    {trend.accepted > 0 && (
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${(trend.accepted / maxValue) * 200}px` }}
                                                            className="w-full bg-emerald-500 rounded-lg shadow-lg shadow-emerald-200/50 hover:bg-emerald-600 transition-colors cursor-pointer relative group/bar"
                                                        >
                                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-50">
                                                                Accepted: {trend.accepted}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                    {trend.active > 0 && (
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${(trend.active / maxValue) * 200}px` }}
                                                            className="w-full bg-blue-500 rounded-lg shadow-lg shadow-blue-200/50 hover:bg-blue-600 transition-colors cursor-pointer relative group/bar"
                                                        >
                                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-50">
                                                                Active: {trend.active}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                    {trend.rejected > 0 && (
                                                        <motion.div
                                                            initial={{ height: 0 }}
                                                            animate={{ height: `${(trend.rejected / maxValue) * 200}px` }}
                                                            className="w-full bg-rose-500 rounded-lg shadow-lg shadow-rose-200/50 hover:bg-rose-600 transition-colors cursor-pointer relative group/bar"
                                                        >
                                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-50">
                                                                Rejected: {trend.rejected}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center gap-0.5">
                                            <span className="text-sm font-black text-gray-800">{trend.total}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{trend.displayDate}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center justify-center gap-8 mt-10 pt-8 border-t border-gray-50">
                        <div className="flex items-center gap-3 group">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-lg shadow-emerald-200 group-hover:scale-125 transition-transform"></div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Accepted</span>
                        </div>
                        <div className="flex items-center gap-3 group">
                            <div className="w-3 h-3 bg-blue-500 rounded-full shadow-lg shadow-blue-200 group-hover:scale-125 transition-transform"></div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Active</span>
                        </div>
                        <div className="flex items-center gap-3 group">
                            <div className="w-3 h-3 bg-rose-500 rounded-full shadow-lg shadow-rose-200 group-hover:scale-125 transition-transform"></div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Rejected</span>
                        </div>
                    </div>
                </motion.section>
            )}

            {/* KPI Details Modal */}
            <Modal
                title={<div className="font-outfit text-xl font-bold text-gray-900 pb-2">{kpiModal.title}</div>}
                open={kpiModal.open}
                onCancel={() => setKpiModal({ ...kpiModal, open: false })}
                width={1200}
                centered
                footer={null}
                className="custom-modal"
            >
                <div className="relative w-full h-[500px] mt-4 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-white">
                    <DataGrid
                        columns={dataGridColumns}
                        rows={getFilteredRequests()}
                        rowKeyGetter={(row) => row._id || row.mhRequestId}
                        className="rdg-light"
                    />
                    {loadingRequests && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                            <div className="w-8 h-8 border-4 border-tvs-blue/20 border-t-tvs-blue rounded-full animate-spin" />
                        </div>
                    )}
                </div>
            </Modal>
        </motion.div>
    );
};

export default Dashboard;
