import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { Modal } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAssetRequests } from '../redux/slices/assetRequestSlice';
import KPICards from '../components/KPICards';
import WaterfallStages from '../components/WaterfallStages';
import { TrendingUp, Activity, Clock, BarChart3, PieChart, Users, FileText, Calendar, Filter, RefreshCw } from 'lucide-react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { defaultColDef, defaultGridOptions, createSerialNumberColumn } from '../config/agGridConfig';

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
    const { items: assetRequests, loading: loadingRequests } = useSelector(state => state.assetRequests);

    const [stats, setStats] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // KPI Modal State
    const [kpiModal, setKpiModal] = useState({ open: false, type: null, title: '' });

    // Date range for trends
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

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

    const columnDefs = React.useMemo(() => [
        createSerialNumberColumn(),
        { 
            headerName: 'MH ID', 
            field: 'mhRequestId', 
            width: 150,
            cellClass: 'ag-cell-bold'
        },
        { headerName: 'DEPARTMENT', field: 'departmentName', width: 180 },
        { headerName: 'USER', field: 'userName', width: 160, cellClass: 'ag-cell-bold' },
        { headerName: 'PART NAME', field: 'handlingPartName', width: 200 },
        {
            headerName: 'STATUS',
            field: 'status',
            width: 130,
            cellRenderer: (params) => {
                const status = params.value;
                let colorClass = 'bg-gray-100 text-gray-700 border-gray-200';
                if (status === 'Accepted') colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                else if (status === 'Rejected') colorClass = 'bg-rose-50 text-rose-700 border-rose-200';
                
                return `<span class="px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${colorClass}">${status}</span>`;
            }
        },
        {
            headerName: 'PROGRESS',
            field: 'progressStatus',
            width: 150,
            cellRenderer: (params) => {
                return `<span class="px-2 py-1 rounded-full text-[10px] font-black uppercase bg-gray-100 text-gray-500 border border-gray-200">${params.value || 'N/A'}</span>`;
            }
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
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 font-outfit tracking-tight">Executive Dashboard</h1>
                    <p className="text-gray-500 mt-1 flex items-center gap-2">
                        <Calendar size={14} />
                        Insights for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchDashboardData} className="p-2.5 rounded-xl border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition-all text-gray-600">
                        <RefreshCw size={20} className={loadingRequests ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Main KPI Cards */}
            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-tvs-blue/10 flex items-center justify-center text-tvs-blue">
                            <BarChart3 size={18} />
                        </div>
                        Key Performance Indicators
                    </h2>
                </div>
                <KPICards stats={stats?.kpiCards} onCardClick={handleKpiClick} />
            </section>

            {/* Production Workflow Section */}
            <motion.section variants={itemVariants} className="glass-card rounded-[2rem] p-8 border border-white/40 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-tvs-blue/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-tvs-blue/10 transition-colors duration-700"></div>
                <h2 className="text-lg font-bold mb-8 text-gray-800 flex items-center gap-2.5 relative">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                        <PieChart size={18} />
                    </div>
                    Production Workflow Status
                </h2>
                <div className="relative">
                    <WaterfallStages stats={stats?.productionWorkflow} />
                </div>
            </motion.section>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity - Takes 2 columns */}
                <motion.div variants={itemVariants} className="lg:col-span-2 glass-card rounded-[2rem] p-8 border border-white/40 shadow-2xl">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
                                <FileText size={18} />
                            </div>
                            Recent Activity
                        </h2>
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                            Live Stream
                        </span>
                    </div>
                    <div className="space-y-4">
                        {recentActivity.length > 0 ? (
                            recentActivity.map((activity, idx) => (
                                <motion.div
                                    key={activity._id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + idx * 0.1 }}
                                    className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white/40 hover:bg-white/80 rounded-2xl border border-transparent hover:border-gray-100 transition-all duration-300"
                                >
                                    <div className="flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-bold text-tvs-blue text-sm">
                                                {activity.mhRequestId}
                                            </span>
                                            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${getStatusColor(activity.status)}`}>
                                                {activity.status?.toUpperCase()}
                                            </span>
                                            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${getProgressColor(activity.progressStatus)}`}>
                                                {activity.progressStatus?.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                                            <span className="font-semibold text-gray-700">{activity.userName}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                            <span>{activity.departmentName}</span>
                                        </div>
                                    </div>
                                    <div className="mt-3 sm:mt-0 flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                        <Clock size={12} />
                                        {formatDate(activity.createdAt)}
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                    <FileText size={20} />
                                </div>
                                <p className="text-sm font-medium">No activity recorded yet</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Category & Type Breakdown - Takes 1 column */}
                <motion.div variants={itemVariants} className="flex flex-col gap-8">
                    <div className="glass-card rounded-[2rem] p-8 border border-white/40 shadow-2xl flex-1">
                        <h2 className="text-lg font-bold mb-8 text-gray-800 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                                <Users size={18} />
                            </div>
                            Breakdown
                        </h2>

                        {/* Product Model Breakdown */}
                        <div className="mb-8">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px] mb-4">By Product Model</h3>
                            <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {stats?.additionalStats?.productBreakdown ? Object.entries(stats.additionalStats.productBreakdown).map(([model, count]) => (
                                    <div key={model} className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 group hover:bg-blue-50 transition-colors">
                                        <span className="text-sm font-semibold text-gray-700">{model}</span>
                                        <span className="text-xl font-black text-blue-600">
                                            {count}
                                        </span>
                                    </div>
                                )) : (
                                    <div className="text-center py-4 text-gray-400 text-sm italic">No data</div>
                                )}
                            </div>
                        </div>

                        {/* Request Type Breakdown */}
                        <div>
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px] mb-4">By Request Type</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {stats?.additionalStats?.typeBreakdown ? Object.entries(stats.additionalStats.typeBreakdown).map(([type, count]) => (
                                    <div key={type} className="flex items-center justify-between p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50 group hover:bg-orange-50 transition-colors">
                                        <span className="text-sm font-semibold text-gray-700">{type}</span>
                                        <span className="text-xl font-black text-orange-600">
                                            {count}
                                        </span>
                                    </div>
                                )) : (
                                    <div className="text-center py-4 text-gray-400 text-sm italic">No data</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Highlight */}
                    <motion.div 
                        whileHover={{ scale: 1.02 }}
                        className="bg-gradient-to-br from-tvs-blue to-[#1a2b5e] rounded-[2rem] p-8 text-white shadow-2xl shadow-tvs-blue/20 relative overflow-hidden"
                    >
                        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                        <div className="relative">
                            <div className="text-[10px] font-bold opacity-70 uppercase tracking-[3px] mb-2">Portfolio Overview</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black font-outfit tracking-tighter">
                                    {stats?.additionalStats?.totalActiveRequests || 0}
                                </span>
                                <span className="text-xs font-bold opacity-80 uppercase tracking-widest">Active</span>
                            </div>
                            <p className="mt-2 text-xs opacity-60 font-medium">Global Asset Requests Lifecycle</p>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* Monthly Trends Chart */}
            {trends.length > 0 && (
                <motion.section variants={itemVariants} className="glass-card rounded-[2rem] p-8 border border-white/40 shadow-2xl">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-10 gap-6">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-tvs-red/10 flex items-center justify-center text-tvs-red">
                                <TrendingUp size={18} />
                            </div>
                            Historical Trends
                        </h2>

                        {/* Filters Card */}
                        <div className="flex flex-wrap items-center gap-3 p-2 bg-gray-50/80 rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-2 px-2">
                                <Filter size={14} className="text-gray-400" />
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="bg-transparent border-none focus:ring-0 text-sm font-semibold text-gray-600 p-1"
                                />
                                <span className="text-gray-300 mx-1">—</span>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="bg-transparent border-none focus:ring-0 text-sm font-semibold text-gray-600 p-1"
                                />
                            </div>

                            <div className="flex items-center gap-1.5 ml-auto">
                                <button
                                    onClick={fetchTrends}
                                    disabled={!fromDate || !toDate}
                                    className="px-4 py-2 bg-tvs-blue text-white rounded-xl hover:bg-tvs-blue/90 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-[10px] font-bold uppercase tracking-widest"
                                >
                                    Filter
                                </button>

                                {(fromDate || toDate) && (
                                    <button
                                        onClick={() => {
                                            setFromDate('');
                                            setToDate('');
                                            fetchTrends();
                                        }}
                                        className="px-4 py-2 bg-white text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-[10px] font-bold uppercase tracking-widest"
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
                <div className="ag-theme-alpine w-full h-[500px] mt-4 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                    <AgGridReact
                        theme="legacy"
                        rowData={getFilteredRequests()}
                        columnDefs={columnDefs}
                        defaultColDef={defaultColDef}
                        {...defaultGridOptions}
                        loading={loadingRequests}
                    />
                </div>
            </Modal>
        </motion.div>
    );
};

export default Dashboard;