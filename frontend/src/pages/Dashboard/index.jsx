import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Register Chart.js once
import './chartRegistration';

// Sub-components
import DashboardHeader from './DashboardHeader';
import KPIGrid from './KPIGrid';
import MHTrendChart from './MHTrendChart';
import StatusDonutChart from './StatusDonutChart';
import DeptLoadChart from './DeptLoadChart';
import VendorPerformanceList from './VendorPerformanceList';
import EngineerUtilList from './EngineerUtilList';
import RecentRequestsTable from './RecentRequestsTable';
import ActivityFeed from './ActivityFeed';
import AssetBreakdownChart from './AssetBreakdownChart';
import DevTrackerFunnel from './DevTrackerFunnel';
import RoleGuard from './RoleGuard';
import PhaseDetailModal from './PhaseDetailModal';
import KPIDetailModal from './KPIDetailModal';

const POLL_INTERVAL = 30000; // 30 s

class ErrorBoundary extends React.Component {
    constructor(props) { super(props); this.state = { hasError: false, error: null }; }
    static getDerivedStateFromError(error) { return { hasError: true, error }; }
    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center p-8">
                    <AlertTriangle size={40} className="text-red-500" />
                    <h2 className="text-lg font-bold text-gray-800">Dashboard render error</h2>
                    <p className="text-sm text-gray-500 max-w-md">{this.state.error?.message}</p>
                    <button onClick={() => this.setState({ hasError: false, error: null })}
                        className="px-4 py-2 bg-tvs-primary text-white rounded-lg text-sm font-semibold">
                        Try again
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [secondsAgo, setSecondsAgo] = useState(0);
    const [dateRange, setDateRange] = useState({ from: null, to: null });
    const pollRef = useRef(null);
    const tickRef = useRef(null);
    const [phaseModal, setPhaseModal] = useState({ visible: false, stage: null, colour: null });
    const [kpiModal,   setKpiModal]   = useState({ visible: false, type: null, title: '' });

    const fetchData = useCallback(async (isManual = false) => {
        if (isManual) setRefreshing(true);
        try {
            const params = {};
            if (dateRange.from) params.from = dateRange.from;
            if (dateRange.to) params.to = dateRange.to;
            const res = await api.get('/dashboard', { params });
            setData(res.data);
            setLastUpdated(Date.now());
            setSecondsAgo(0);
            setError(null);
        } catch (err) {
            console.error('[Dashboard] fetch error', err);
            setError(err.response?.data?.message || 'Could not load dashboard data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [dateRange]);

    // Initial load + polling
    useEffect(() => {
        fetchData();
        pollRef.current = setInterval(() => fetchData(), POLL_INTERVAL);
        return () => clearInterval(pollRef.current);
    }, [fetchData]);

    // "Seconds ago" ticker
    useEffect(() => {
        tickRef.current = setInterval(() => {
            if (lastUpdated) setSecondsAgo(Math.floor((Date.now() - lastUpdated) / 1000));
        }, 1000);
        return () => clearInterval(tickRef.current);
    }, [lastUpdated]);

    // Re-fetch when date range changes
    useEffect(() => {
        if (dateRange.from || dateRange.to) fetchData();
    }, [dateRange]);

    const handleDateRangeChange = (from, to) => setDateRange({ from, to });
    const handleRetry = () => { setError(null); setLoading(true); fetchData(true); };

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                {/* Skeleton header */}
                <div className="h-16 bg-gray-200 animate-pulse rounded-2xl" />
                {/* Skeleton KPI row */}
                <div className="grid grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="h-28 bg-gray-200 animate-pulse rounded-2xl" />
                    ))}
                </div>
                {/* Skeleton charts */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 h-72 bg-gray-200 animate-pulse rounded-2xl" />
                    <div className="h-72 bg-gray-200 animate-pulse rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-surface p-4 lg:p-6 space-y-5">

                {/* Error banner */}
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm font-medium">
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={16} />
                                <span>Dashboard data could not be loaded — {error}</span>
                            </div>
                            <button onClick={handleRetry} className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700">
                                Retry
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header */}
                <DashboardHeader
                    secondsAgo={secondsAgo}
                    refreshing={refreshing}
                    onRefresh={() => fetchData(true)}
                    onDateRangeChange={handleDateRangeChange}
                    dateRange={dateRange}
                    dashboardData={data}
                />

                {/* Row 1: KPI Cards */}
                <KPIGrid
                    data={data}
                    loading={loading}
                    user={user}
                    onPhaseClick={(stage, colour) => setPhaseModal({ visible: true, stage, colour })}
                    onKpiClick={(type, title) => setKpiModal({ visible: true, type, title })}
                />

                {/* Row 2: MH Trend + Status Donut */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <div className="lg:col-span-2">
                        <MHTrendChart data={data?.mhTrend} loading={loading} />
                    </div>
                    <div>
                        <StatusDonutChart data={data?.mhByStatus} loading={loading} />
                    </div>
                </div>

                {/* Row 3: Dept Load + Vendor Perf + Engineer Util */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <DeptLoadChart data={data?.mhByDepartment} loading={loading} />
                    <VendorPerformanceList data={data?.vendorPerformance} loading={loading} />
                    <RoleGuard roles={['Admin', 'Approver', 'PED Engineer']}>
                        <EngineerUtilList data={data?.engineerUtilisation} loading={loading} currentUser={user} />
                    </RoleGuard>
                </div>

                {/* Row 4: Recent Requests + Activity Feed */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <RecentRequestsTable data={data?.recentRequests} loading={loading} user={user} />
                    <ActivityFeed data={data?.activityFeed} loading={loading} />
                </div>

                {/* Row 5: Asset Breakdown + Dev Tracker Funnel */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <AssetBreakdownChart data={data?.assetSummary} loading={loading} />
                    <div className="lg:col-span-2">
                        <DevTrackerFunnel data={data?.mhDevTrackerFunnel} loading={loading} />
                    </div>
                </div>

                {/* Phase Detail Modal */}
                <PhaseDetailModal
                    visible={phaseModal.visible}
                    onClose={() => setPhaseModal({ visible: false, stage: null, colour: null })}
                    stage={phaseModal.stage}
                    stageColour={phaseModal.colour}
                />

                {/* KPI Detail Modal */}
                <KPIDetailModal
                    visible={kpiModal.visible}
                    onClose={() => setKpiModal({ visible: false, type: null, title: '' })}
                    type={kpiModal.type}
                    title={kpiModal.title}
                />
            </div>
        </ErrorBoundary>
    );
};

export default Dashboard;
