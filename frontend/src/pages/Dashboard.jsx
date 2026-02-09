import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { Modal, Table, Tag } from 'antd';
import { fetchAssetRequests } from '../redux/slices/assetRequestSlice';
import KPICards from '../components/KPICards';
import WaterfallStages from '../components/WaterfallStages';
import { TrendingUp, TrendingDown, Activity, Clock, BarChart3, PieChart, Users, FileText } from 'lucide-react';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
            case 'total': title = 'All Asset Requests'; break;
            case 'accepted': title = 'Approved Requests'; break;
            case 'implemented': title = 'Implemented Requests'; break;
            case 'rejected': title = 'Rejected Requests'; break;
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

    const modalColumns = [
        {
            title: 'Request ID',
            dataIndex: 'assetRequestId',
            key: 'assetRequestId',
            render: (text) => <strong>{text}</strong>,
        },
        {
            title: 'Department',
            dataIndex: 'departmentName',
            key: 'departmentName',
        },
        {
            title: 'User',
            dataIndex: 'userName',
            key: 'userName',
        },
        {
            title: 'Part Name',
            dataIndex: 'handlingPartName',
            key: 'handlingPartName',
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                let color = status === 'Accepted' ? 'green' : status === 'Rejected' ? 'red' : 'gold';
                return <Tag color={color}>{status}</Tag>;
            }
        },
        {
            title: 'Progress',
            dataIndex: 'progressStatus',
            key: 'progressStatus',
            render: (status) => <Tag color="blue">{status || 'N/A'}</Tag>
        }
    ];


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
            case 'Active': return 'text-blue-600 bg-blue-100';
            case 'Accepted': return 'text-green-600 bg-green-100';
            case 'Rejected': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getProgressColor = (progress) => {
        switch (progress) {
            case 'Design': return 'text-purple-600 bg-purple-100';
            case 'Design Approved': return 'text-indigo-600 bg-indigo-100';
            case 'Implementation': return 'text-orange-600 bg-orange-100';
            case 'Production': return 'text-green-600 bg-green-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-tvs-blue mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <p className="text-red-600">{error}</p>
                <button
                    onClick={fetchDashboardData}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8">

            {/* Main KPI Cards */}
            <section>
                <h2 className="text-xl font-semibold mb-4 text-tvs-dark-gray flex items-center gap-2">
                    <BarChart3 size={24} className="text-tvs-blue" />
                    Key Performance Indicators
                </h2>
                <KPICards stats={stats?.kpiCards} onCardClick={handleKpiClick} />
            </section>



            {/* Production Workflow Section */}
            <section className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <h2 className="text-xl font-semibold mb-6 text-tvs-dark-gray flex items-center gap-2">
                    <PieChart size={24} className="text-tvs-blue" />
                    Production Workflow Status
                </h2>
                <WaterfallStages stats={stats?.productionWorkflow} />
            </section>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity - Takes 2 columns */}
                <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4 text-tvs-dark-gray flex items-center gap-2">
                        <FileText size={24} className="text-tvs-blue" />
                        Recent Activity
                    </h2>
                    <div className="space-y-3">
                        {recentActivity.length > 0 ? (
                            recentActivity.map((activity) => (
                                <div
                                    key={activity._id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold text-tvs-dark-gray">
                                                {activity.assetRequestId}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                                                {activity.status}
                                            </span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProgressColor(activity.progressStatus)}`}>
                                                {activity.progressStatus}
                                            </span>
                                        </div>
                                        <div className="mt-1 text-sm text-gray-600">
                                            <span className="font-medium">{activity.userName}</span>
                                            {' • '}
                                            <span>{activity.departmentName}</span>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {formatDate(activity.createdAt)}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No recent activity
                            </div>
                        )}
                    </div>
                </div>

                {/* Category & Type Breakdown - Takes 1 column */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                    <h2 className="text-xl font-semibold mb-4 text-tvs-dark-gray flex items-center gap-2">
                        <Users size={24} className="text-tvs-blue" />
                        Breakdown
                    </h2>

                    {/* Category Breakdown */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-600 mb-3">By Category</h3>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">New Project</span>
                                <span className="text-lg font-bold text-blue-600">
                                    {stats?.additionalStats?.newProjects || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Product Support</span>
                                <span className="text-lg font-bold text-green-600">
                                    {stats?.additionalStats?.currentProductSupport || 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Request Type Breakdown */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-600 mb-3">By Request Type</h3>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">New</span>
                                <span className="text-lg font-bold text-purple-600">
                                    {stats?.additionalStats?.newRequests || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Modify</span>
                                <span className="text-lg font-bold text-orange-600">
                                    {stats?.additionalStats?.modifyRequests || 0}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="mt-6 p-4 bg-gradient-to-br from-tvs-blue to-tvs-dark-blue rounded-lg text-white">
                        <div className="text-sm font-medium opacity-90">Total Active</div>
                        <div className="text-3xl font-bold mt-1">
                            {stats?.additionalStats?.totalActiveRequests || 0}
                        </div>
                        <div className="text-xs opacity-75 mt-1">Asset Requests</div>
                    </div>
                </div>
            </div>

            {/* Monthly Trends Chart */}
            {trends.length > 0 && (
                <section className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-tvs-dark-gray flex items-center gap-2">
                            <BarChart3 size={24} className="text-tvs-blue" />
                            Monthly Trends
                        </h2>

                        {/* Date Range Filter */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-600">From:</label>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-600">To:</label>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <button
                                onClick={fetchTrends}
                                disabled={!fromDate || !toDate}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                            >
                                Search
                            </button>

                            {(fromDate || toDate) && (
                                <button
                                    onClick={() => {
                                        setFromDate('');
                                        setToDate('');
                                        fetchTrends();
                                    }}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all text-sm font-medium"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="overflow-x-auto custom-scrollbar">
                        <div className="flex items-end gap-4 min-w-max pb-4" style={{ height: '250px' }}>
                            {trends.map((trend, index) => {
                                const maxValue = Math.max(...trends.map(t => t.total));
                                const heightPercent = maxValue > 0 ? (trend.total / maxValue) * 100 : 0;

                                return (
                                    <div key={index} className="flex flex-col items-center gap-2 flex-1 min-w-[80px]">
                                        <div className="flex flex-col items-center gap-1 w-full">
                                            {/* Stacked bars */}
                                            <div className="relative w-full" style={{ height: '180px' }}>
                                                <div className="absolute bottom-0 w-full flex flex-col gap-0.5">
                                                    {trend.accepted > 0 && (
                                                        <div
                                                            className="w-full bg-green-500 rounded-t transition-all hover:bg-green-600 cursor-pointer group relative"
                                                            style={{ height: `${(trend.accepted / maxValue) * 180}px` }}
                                                        >
                                                            <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {trend.accepted}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {trend.active > 0 && (
                                                        <div
                                                            className="w-full bg-blue-500 transition-all hover:bg-blue-600 cursor-pointer group relative"
                                                            style={{ height: `${(trend.active / maxValue) * 180}px` }}
                                                        >
                                                            <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {trend.active}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {trend.rejected > 0 && (
                                                        <div
                                                            className="w-full bg-red-500 transition-all hover:bg-red-600 cursor-pointer group relative"
                                                            style={{ height: `${(trend.rejected / maxValue) * 180}px` }}
                                                        >
                                                            <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                {trend.rejected}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-xs font-semibold text-gray-700">{trend.total}</div>
                                        </div>
                                        <div className="text-xs text-gray-500 text-center">{trend.displayDate}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                            <span className="text-sm text-gray-600">Accepted</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-500 rounded"></div>
                            <span className="text-sm text-gray-600">Active</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-500 rounded"></div>
                            <span className="text-sm text-gray-600">Rejected</span>
                        </div>
                    </div>
                </section>
            )}
            {/* KPI Details Modal */}
            <Modal
                title={kpiModal.title}
                open={kpiModal.open}
                onCancel={() => setKpiModal({ ...kpiModal, open: false })}
                width={1000}
                footer={null}
            >
                <Table
                    dataSource={getFilteredRequests()}
                    columns={modalColumns}
                    rowKey="_id"
                    loading={loadingRequests}
                    pagination={{ pageSize: 10 }}
                />
            </Modal>
        </div>
    );
};

export default Dashboard;