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
    Beaker, BadgeCheck, Handshake, Rocket,
    X, CheckCircle2, Circle, ArrowRight, ListChecks, Package
} from 'lucide-react';
import { DataGrid } from 'react-data-grid';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();
    const { user } = useAuth();
    const { items: assetRequests, loading: loadingRequests } = useSelector(state => state.assetRequests);

    const [stats, setStats] = useState(null);
    const [recentActivity, setRecentActivity] = useState([]);
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [pptLoading, setPptLoading] = useState(false);
    const [selectedWorkflowStage, setSelectedWorkflowStage] = useState(null);
    const [topVendors, setTopVendors] = useState([]);

    /* ── Blur background when workflow modal is open ── */
    React.useEffect(() => {
        const el = document.getElementById('dashboard-bg-content');
        if (!el) return;
        if (selectedWorkflowStage !== null) {
            el.style.transition = 'filter 0.3s ease, transform 0.3s ease';
            el.style.filter = 'blur(6px) brightness(0.75) saturate(0.8)';
            el.style.transform = 'scale(1.02)';
            el.style.pointerEvents = 'none';
        } else {
            el.style.filter = '';
            el.style.transform = '';
            el.style.pointerEvents = '';
        }
        return () => {
            if (el) {
                el.style.filter = '';
                el.style.transform = '';
                el.style.pointerEvents = '';
            }
        };
    }, [selectedWorkflowStage]);

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

    const CustomHeaderCell = ({ column }) => (
        <div className="h-full w-full flex items-center px-4 text-white" style={{ backgroundColor: '#253C80' }}>
            <span className="font-bold text-[11px] leading-tight tracking-wide uppercase">{column.name}</span>
        </div>
    );

    const dataGridColumns = React.useMemo(() => [
        {
            key: 'serial',
            name: 'S.NO',
            width: 80,
            frozen: true,
            renderHeaderCell: CustomHeaderCell,
            renderCell: ({ rowIdx }) => (
                <span className="font-bold text-gray-700">{rowIdx + 1}</span>
            )
        },
        {
            key: 'mhRequestId',
            name: 'MH ID',
            width: 150,
            renderHeaderCell: CustomHeaderCell
        },
        {
            key: 'departmentName',
            name: 'DEPARTMENT',
            width: 180,
            renderHeaderCell: CustomHeaderCell
        },
        {
            key: 'userName',
            name: 'USER',
            width: 160,
            renderHeaderCell: CustomHeaderCell
        },
        {
            key: 'handlingPartName',
            name: 'PART NAME',
            width: 200,
            renderHeaderCell: CustomHeaderCell
        },
        {
            key: 'status',
            name: 'STATUS',
            width: 150,
            renderHeaderCell: CustomHeaderCell,
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
            renderHeaderCell: CustomHeaderCell,
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
            const [statsRes, activityRes, vendorRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/dashboard/stats`),
                axios.get(`${API_BASE_URL}/api/dashboard/recent-activity?limit=5`),
                axios.get(`${API_BASE_URL}/api/vendor-scoring`).catch(() => ({ data: { data: [] } }))
            ]);

            setStats(statsRes.data);
            setRecentActivity(activityRes.data);
            setError(null);

            // Derive top 3 vendors by qcdScore
            const vendorList = vendorRes?.data?.data || [];
            const top3 = [...vendorList]
                .sort((a, b) => (b.qcdScore || 0) - (a.qcdScore || 0))
                .slice(0, 3);
            setTopVendors(top3);

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
            icon: ClipboardList,
            detailedDescription: 'Material Handling requests are initiated by department heads or authorized personnel. Each request captures the specific need, justification, and expected outcomes for the proposed material handling solution.',
            keyActivities: [
                'Capture MH requirement details',
                'Attach supporting documents & specifications',
                'Assign priority and urgency level',
                'Route to appropriate approval chain'
            ],
            deliverables: ['MH Request Form', 'Requirement Specification', 'Cost Estimation Draft'],
            metrics: {
                avgDuration: stats?.additionalStats?.avgProcessingTime ? `${stats.additionalStats.avgProcessingTime} Days` : '2-3 Days',
                completion: stats?.stageMetrics?.mhRequests?.completionRate || '95%',
                pendingItems: stats?.stageMetrics?.mhRequests?.pending || 3
            }
        },
        {
            id: 'approval-stage',
            label: 'Approval Stage',
            description: 'Screening and approvals',
            icon: Stamp,
            detailedDescription: 'Submitted requests undergo a multi-level approval process. Technical feasibility, budget availability, and strategic alignment are evaluated before granting approval to proceed.',
            keyActivities: [
                'Technical feasibility assessment',
                'Budget and cost-benefit analysis',
                'Safety & compliance review',
                'Management approval sign-off'
            ],
            deliverables: ['Approval Certificate', 'Technical Assessment Report', 'Budget Allocation'],
            metrics: {
                avgDuration: stats?.additionalStats?.avgProcessingTime ? `${Math.max(1, (stats.additionalStats.avgProcessingTime * 0.2).toFixed(1))} Days` : '3-5 Days',
                completion: stats?.stageMetrics?.approval?.completionRate || '88%',
                pendingItems: stats?.stageMetrics?.approval?.pending || 5
            }
        },
        {
            id: 'vendor-selection',
            label: 'Vendor Selection',
            description: 'Partner identification',
            icon: Users,
            detailedDescription: 'Qualified vendors are identified and evaluated based on capability, past performance, pricing, and delivery timelines. Vendor scoring matrix is applied to select the optimal partner.',
            keyActivities: [
                'Vendor shortlisting & capability assessment',
                'Request for Quotation (RFQ) process',
                'Vendor scoring & comparative analysis',
                'Final vendor selection & negotiation'
            ],
            deliverables: ['Vendor Scorecard', 'Comparative Analysis Report', 'Selection Approval'],
            metrics: {
                avgDuration: '5-7 Days',
                completion: stats?.stageMetrics?.vendorSelection?.completionRate || '82%',
                pendingItems: stats?.stageMetrics?.vendorSelection?.pending || 4
            }
        },
        {
            id: 'design-release',
            label: 'Design Release',
            description: 'Engineering design finalized',
            icon: PenTool,
            detailedDescription: 'Engineering team finalizes the design specifications, CAD drawings, and technical documentation. Design review meetings ensure all requirements are met before release to vendor.',
            keyActivities: [
                'Detailed engineering design & CAD development',
                'Design review and validation',
                'Bill of Materials (BOM) preparation',
                'Design release documentation'
            ],
            deliverables: ['Engineering Drawings', 'BOM Document', 'Design Release Note'],
            metrics: {
                avgDuration: '7-10 Days',
                completion: stats?.stageMetrics?.designRelease?.completionRate || '75%',
                pendingItems: stats?.stageMetrics?.designRelease?.pending || 6
            }
        },
        {
            id: 'pr-po-release',
            label: 'PR / PO Release',
            description: 'Commercial release to vendor',
            icon: FileSignature,
            detailedDescription: 'Purchase Requisition is created and routed for approval. Upon approval, a Purchase Order is generated and formally released to the selected vendor with all commercial terms.',
            keyActivities: [
                'Purchase Requisition creation & approval',
                'Purchase Order generation',
                'Vendor acknowledgement & confirmation',
                'Delivery schedule finalization'
            ],
            deliverables: ['Purchase Requisition', 'Purchase Order', 'Vendor Confirmation'],
            metrics: {
                avgDuration: '3-5 Days',
                completion: stats?.stageMetrics?.prPoRelease?.completionRate || '90%',
                pendingItems: stats?.stageMetrics?.prPoRelease?.pending || 2
            }
        },
        {
            id: 'sample-receipt',
            label: 'Sample Receipt / Trials',
            description: 'Trials and validation',
            icon: Beaker,
            detailedDescription: 'Sample units are received from the vendor and undergo rigorous testing and validation trials. Performance metrics are measured against specifications to ensure quality standards.',
            keyActivities: [
                'Sample receipt & incoming inspection',
                'Functional testing & performance trials',
                'Quality parameter validation',
                'Trial report documentation & feedback'
            ],
            deliverables: ['Inspection Report', 'Trial Results', 'Quality Approval Certificate'],
            metrics: {
                avgDuration: '10-15 Days',
                completion: stats?.stageMetrics?.sampleReceipt?.completionRate || '70%',
                pendingItems: stats?.stageMetrics?.sampleReceipt?.pending || 7
            }
        },
        {
            id: 'bulk-lot-clearance',
            label: 'Bulk Lot Clearance',
            description: 'Bulk production cleared',
            icon: BadgeCheck,
            detailedDescription: 'After successful trials, bulk production lot is manufactured by the vendor. Final quality inspections and clearance processes ensure the entire batch meets production standards.',
            keyActivities: [
                'Bulk lot manufacturing by vendor',
                'Final quality inspection & audit',
                'Documentation & certification',
                'Clearance approval & release'
            ],
            deliverables: ['Bulk Lot Inspection Report', 'Quality Certificate', 'Release Authorization'],
            metrics: {
                avgDuration: '5-7 Days',
                completion: stats?.stageMetrics?.bulkLot?.completionRate || '85%',
                pendingItems: stats?.stageMetrics?.bulkLot?.pending || 3
            }
        },
        {
            id: 'handover-signoff',
            label: 'Handover and Sign-off',
            description: 'Process handover completed',
            icon: Handshake,
            detailedDescription: 'Formal handover of the completed material handling solution to the requesting department. Includes training, documentation transfer, and sign-off from all stakeholders.',
            keyActivities: [
                'Formal handover to operations team',
                'User training & knowledge transfer',
                'Documentation handover',
                'Stakeholder sign-off & closure'
            ],
            deliverables: ['Handover Document', 'Training Records', 'Sign-off Certificate'],
            metrics: {
                avgDuration: '2-3 Days',
                completion: stats?.stageMetrics?.handover?.completionRate || '92%',
                pendingItems: stats?.stageMetrics?.handover?.pending || 1
            }
        },
        {
            id: 'asset-implementation',
            label: 'Asset Implementation',
            description: 'Asset rolled into production',
            icon: Rocket,
            detailedDescription: 'The material handling asset is officially deployed into the production environment. Includes installation, commissioning, and integration with existing production systems.',
            keyActivities: [
                'Asset installation & commissioning',
                'Integration with production systems',
                'Performance monitoring & optimization',
                'Asset registration & tagging'
            ],
            deliverables: ['Commissioning Report', 'Asset Registration', 'Performance Baseline'],
            metrics: {
                avgDuration: '3-5 Days',
                completion: stats?.stageMetrics?.assetImplementation?.completionRate || '78%',
                pendingItems: stats?.stageMetrics?.assetImplementation?.pending || 4
            }
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
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="relative">
                    <div className="w-14 h-14 border-4 rounded-full animate-spin" style={{ borderColor: 'rgba(0,201,167,0.15)', borderTopColor: '#00C9A7' }} />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full animate-pulse" style={{ background: 'rgba(0,201,167,0.12)' }} />
                </div>
                <p className="text-sm font-bold uppercase tracking-widest animate-pulse" style={{ color: '#B0BBC9' }}>Synchronizing dashboard data…</p>
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
        <>
        <div id="dashboard-bg-content" style={{ willChange: 'filter, transform', transformOrigin: 'center center' }}>
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6 pb-10"
        >
            {/* ── Dashboard Hero Banner ── */}
            <motion.div
                variants={itemVariants}
                className="relative overflow-hidden rounded-2xl"
                style={{
                    background: 'linear-gradient(145deg, #060D1F 0%, #0F2040 55%, #0B1730 100%)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.20)'
                }}
            >
                {/* Decorative blobs */}
                <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, #60a5fa 0%, transparent 70%)' }} />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)' }} />
                {/* Animated grid lines */}
                <div className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 39px, #fff 39px, #fff 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, #fff 39px, #fff 40px)'
                    }} />

                <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 px-7 py-6">
                    {/* Left: greeting + quick stats */}
                    <div className="flex flex-col gap-4 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Live badge */}
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-bold uppercase tracking-widest text-white/80 backdrop-blur-sm">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                Live Dashboard
                            </span>
                            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-semibold text-white/60 backdrop-blur-sm">
                                {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                        </div>

                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight uppercase">
                                MfG FACTORY <span className="text-emerald-400 opacity-90">Intelligence</span>
                            </h1>
                            <p className="text-[10px] text-white/40 mt-1 font-black uppercase tracking-[3px]">
                                Engineering · Analytics · Performance
                            </p>
                        </div>

                        {/* Location-wise Assets Generated */}
                        <div className="w-full">
                            <p className="text-[9px] font-black uppercase tracking-[3px] text-white/40 mb-2.5 flex items-center gap-2">
                                <span className="w-3 h-px bg-white/20" />
                                MfG Factory Deployment
                                <span className="flex-1 h-px bg-white/10" />
                            </p>
                            {stats?.locationBreakdown && Object.keys(stats.locationBreakdown).length > 0 ? (() => {
                                const entries = Object.entries(stats.locationBreakdown)
                                    .sort((a, b) => b[1] - a[1]);
                                const maxVal = Math.max(...entries.map(([, v]) => v), 1);
                                const barColors = ['#60a5fa', '#34d399', '#f59e0b', '#a78bfa', '#f472b6', '#22d3ee'];
                                return (
                                    <div className="flex flex-col gap-2">
                                        {entries.map(([loc, count], i) => {
                                            const pct = Math.max((count / maxVal) * 100, 6);
                                            const color = barColors[i % barColors.length];
                                            return (
                                                <div key={loc} className="flex items-center gap-2.5 group/locrow">
                                                    {/* Color dot */}
                                                    <span
                                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                                        style={{ background: color, boxShadow: `0 0 5px ${color}99` }}
                                                    />
                                                    {/* Location name */}
                                                    <span
                                                        className="text-[11px] font-semibold text-white/80 truncate w-24 group-hover/locrow:text-white transition-colors"
                                                        title={loc}
                                                    >
                                                        {loc}
                                                    </span>
                                                    {/* Bar */}
                                                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-700"
                                                            style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}77` }}
                                                        />
                                                    </div>
                                                    {/* Count */}
                                                    <span className="text-[11px] font-black text-white/70 w-5 text-right flex-shrink-0">
                                                        {count}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })() : (
                                <p className="text-[10px] text-white/30 italic">No asset location data available</p>
                            )}
                        </div>{/* ← closes location chart div */}
                    </div>{/* ← closes left column */}

                    {/* Right: Generate PPT button */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-2">
                        {/* Pulsing glow ring */}
                        <div className="relative">
                            <div className="absolute inset-0 rounded-2xl bg-white/20 animate-ping opacity-30 scale-110 pointer-events-none" />
                            <button
                                onClick={handleGeneratePPT}
                                disabled={pptLoading || !stats}
                                className="relative flex items-center gap-3 px-7 py-4 rounded-2xl bg-white text-tvs-blue font-black shadow-2xl hover:bg-blue-50 hover:scale-[1.03] active:scale-[0.97] transition-all group/pptbtn disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FileText
                                    size={20}
                                    className={pptLoading ? 'animate-spin' : 'group-hover/pptbtn:rotate-[-8deg] transition-transform duration-300'}
                                />
                                <div className="flex flex-col text-left leading-none">
                                    <span className="uppercase tracking-[2px] text-[10px] opacity-60 font-bold">Export as</span>
                                    <span className="text-sm font-black">Generate PPT</span>
                                </div>
                            </button>
                        </div>
                        <span className="text-[9px] text-white/30 font-medium tracking-wider uppercase">
                            PowerPoint Report
                        </span>
                    </div>
                </div>
            </motion.div>

            <motion.section
                variants={itemVariants}
                className="rounded-2xl p-6 relative overflow-hidden"
                style={{ background: '#ffffff', border: '1px solid #E0E4EF', boxShadow: '0 2px 12px rgba(13,27,62,0.05)' }}
            >
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: '#7B8AAB' }}>
                            <span className="w-3 h-3 rounded-full" style={{ background: '#00C9A7' }} />
                            Asset Status Overview
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
                        <div className="lg:col-span-2 lg:border-r lg:pr-6" style={{ borderColor: '#F0F3F9' }}>
                            <div className="h-full rounded-2xl flex items-center" style={{ background: '#F9FAFB', border: '1px solid #F0F3F9' }}>
                                <div className="w-full p-4">
                                    <KPICards stats={stats?.kpiCards} onCardClick={handleKpiClick} />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center lg:pl-6">
                            <div className="w-full rounded-2xl p-4" style={{ background: '#F9FAFB', border: '1px solid #F0F3F9' }}>
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-sm font-bold text-gray-800 mt-1">
                                            Current MH Requests
                                        </p>
                                    </div>
                                </div>
                                {kpiChartData.length === 0 ? (
                                    <div className="flex items-center justify-center h-40 text-xs font-semibold text-gray-400">
                                        No KPI data available
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-end justify-between gap-4 mt-8 px-2" style={{ perspective: '800px' }}>
                                            {kpiChartData.map((kpi, index) => {
                                                const heightPercent = maxKpiValue > 0 ? Math.max((kpi.value / maxKpiValue) * 100, 10) : 0;
                                                // Defended color palettes for each metric
                                                const palettes = [
                                                    ['#6366f1', '#4338ca', '#818cf8', '#6366f1'], // Blue/Indigo (Total)
                                                    ['#10b981', '#059669', '#34d399', '#10b981'], // Emerald/Green (Accepted)
                                                    ['#f59e0b', '#d97706', '#fbbf24', '#f59e0b'], // Amber/Orange (Implemented)
                                                    ['#f43f5e', '#e11d48', '#fb7185', '#f43f5e']  // Rose/Red (Rejected)
                                                ];
                                                const currentPalette = palettes[index % palettes.length];

                                                return (
                                                    <div key={kpi.id} className="flex-1 flex flex-col items-center gap-4 h-44">
                                                        <div className="w-full h-full flex items-end justify-center relative" style={{ transformStyle: 'preserve-3d' }}>
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{
                                                                    height: `${heightPercent}%`,
                                                                    opacity: 1,
                                                                    y: [0, -18, 0],
                                                                    backgroundColor: currentPalette, // Defended color show
                                                                }}
                                                                transition={{
                                                                    height: { type: 'spring', stiffness: 100, damping: 20, delay: index * 0.15 },
                                                                    opacity: { duration: 0.3, delay: index * 0.15 },
                                                                    y: {
                                                                        duration: 1.5,
                                                                        repeat: Infinity,
                                                                        ease: "easeInOut",
                                                                        delay: index * 0.2 // Snake/Wave offset
                                                                    },
                                                                    backgroundColor: {
                                                                        duration: 4,
                                                                        repeat: Infinity,
                                                                        ease: "easeInOut",
                                                                        delay: index * 0.4
                                                                    }
                                                                }}
                                                                whileHover={{ scaleZ: 1.2, translateZ: 50, y: -10 }}
                                                                className={`relative w-8 md:w-10 rounded-t-lg shadow-2xl ${kpi.glowColor}`}
                                                                style={{
                                                                    transformStyle: 'preserve-3d',
                                                                    transform: 'rotateY(-20deg)',
                                                                }}
                                                            >
                                                                {/* Top face */}
                                                                <div className="absolute top-0 left-0 right-0 h-3 rounded-full"
                                                                    style={{
                                                                        background: '#ffffff',
                                                                        opacity: 0.3,
                                                                        transform: 'translateY(-50%) rotateX(90deg)',
                                                                        filter: 'blur(1px)'
                                                                    }}
                                                                />
                                                                {/* Side highlight */}
                                                                <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white/30 to-transparent" />
                                                                {/* Bottom shadow */}
                                                                <div className="absolute -bottom-2 translate-y-full w-full h-2 bg-black/10 blur-xl rounded-full" />
                                                            </motion.div>
                                                        </div>
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#B0BBC9' }}>{kpi.label}</span>
                                                            <span className="text-sm font-black" style={{ color: '#0D1B3E' }}>{kpi.value}</span>
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

            <motion.section variants={itemVariants} className="rounded-2xl p-6 relative overflow-hidden" style={{ background: '#ffffff', border: '1px solid #E0E4EF', boxShadow: '0 2px 12px rgba(13,27,62,0.05)' }}>
                <div className="flex items-center gap-2.5 mb-8">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,201,167,0.1)' }}>
                        <Activity size={16} style={{ color: '#00C9A7' }} />
                    </div>
                    <h2 className="text-base font-black m-0" style={{ fontFamily: 'Outfit,sans-serif', color: '#0D1B3E' }}>
                        Production Workflow
                    </h2>
                    <span className="ml-auto badge" style={{ background: 'rgba(0,201,167,0.1)', color: '#00A98A' }}>Live</span>
                </div>
                <div className="relative">
                    <div className="relative mx-auto w-full">
                        <div className="relative w-full overflow-x-auto pb-6 -mb-6 custom-scrollbar">
                            <div className="flex flex-col gap-6 min-w-[1000px] lg:min-w-0">
                                {/* Stepper track with icons and aligned labels */}
                                <div className="flex items-start gap-0">
                                    {workflowStages.map((stage, index) => {
                                        const status = getStageStatus(index);
                                        const statusMeta = getStageStatusMeta(status);
                                        const Icon = stage.icon;

                                        const connectorStatus = index - 1 < activeWorkflowIndex ? 'completed' : 'pending';
                                        const connectorClass =
                                            connectorStatus === 'completed'
                                                ? 'bg-gradient-to-r from-[#00C9A7] to-[#00A98A]'
                                                : 'bg-gray-100';

                                        let circleClass = 'w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center border transition-all duration-300';
                                        let iconClass = 'shrink-0';

                                        if (status === 'completed') {
                                            circleClass += ' border-[#00C9A7]';
                                            iconClass += ' text-white';
                                        } else if (status === 'active') {
                                            circleClass += ' bg-white border-[#00C9A7] ring-2 ring-[#00C9A7]/25';
                                            iconClass += ' text-[#00C9A7]';
                                        } else {
                                            circleClass += ' bg-white border-gray-200';
                                            iconClass += ' text-gray-300';
                                        }

                                        const colorCycle = ['#00C9A7', '#6366f1', '#f59e0b', '#f43f5e', '#8B5CF6', '#0ea5e9'];

                                        return (
                                            <div key={stage.id} className="flex-1 flex flex-col items-center min-w-[120px] px-2 py-4">
                                                <div className="w-full flex items-center relative" style={{ height: 60 }}>
                                                    {/* Connector Left */}
                                                    <div className="h-[2px] flex-1 relative overflow-hidden">
                                                        <motion.div
                                                            animate={{
                                                                backgroundColor: colorCycle,
                                                                opacity: index === 0 ? 0 : [0.3, 1, 0.3],
                                                                scaleX: index === 0 ? 0 : [1, 1.2, 1]
                                                            }}
                                                            transition={{
                                                                backgroundColor: { duration: 8, repeat: Infinity, ease: "linear", delay: index * 0.4 },
                                                                opacity: { duration: 2, repeat: Infinity, delay: index * 0.4 },
                                                                scaleX: { duration: 2, repeat: Infinity, delay: index * 0.4 }
                                                            }}
                                                            className="absolute inset-0 w-full rounded-full"
                                                        />
                                                    </div>

                                                    <div className="flex-none flex items-center justify-center px-4" style={{ perspective: '800px' }}>
                                                        <motion.button
                                                            onClick={() => setSelectedWorkflowStage(index)}
                                                            animate={{
                                                                scale: [1, 1.1, 1],
                                                                y: [0, -8, 0], // Refined snake wave
                                                                borderColor: colorCycle,
                                                                boxShadow: ['0 0 0px rgba(0,0,0,0)', '0 0 15px currentColor', '0 0 0px rgba(0,0,0,0)']
                                                            }}
                                                            transition={{
                                                                duration: 2.5,
                                                                repeat: Infinity,
                                                                delay: index * 0.4,
                                                                ease: "easeInOut"
                                                            }}
                                                            className="w-11 h-11 rounded-full flex items-center justify-center cursor-pointer focus:outline-none border-2 transition-colors relative z-10"
                                                            style={{
                                                                background: '#ffffff',
                                                                transformStyle: 'preserve-3d',
                                                                rotateY: '-10deg'
                                                            }}
                                                            title={`View details: ${stage.label}`}
                                                        >
                                                            <div className="relative z-10" style={{ transform: 'translateZ(10px)' }}>
                                                                <Icon size={18} style={{ color: '#0D1B3E' }} className="drop-shadow-sm" />
                                                            </div>
                                                        </motion.button>
                                                    </div>

                                                    {/* Connector Right */}
                                                    <div className="h-[2px] flex-1 relative overflow-hidden">
                                                        <motion.div
                                                            animate={{
                                                                backgroundColor: colorCycle,
                                                                opacity: index === workflowStages.length - 1 ? 0 : [0.3, 1, 0.3],
                                                                scaleX: index === workflowStages.length - 1 ? 0 : [1, 1.2, 1]
                                                            }}
                                                            transition={{
                                                                backgroundColor: { duration: 8, repeat: Infinity, ease: "linear", delay: (index + 0.5) * 0.4 },
                                                                opacity: { duration: 2, repeat: Infinity, delay: (index + 0.5) * 0.4 },
                                                                scaleX: { duration: 2, repeat: Infinity, delay: (index + 0.5) * 0.4 }
                                                            }}
                                                            className="absolute inset-0 w-full rounded-full"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex flex-col items-center text-center max-w-[110px]">
                                                    <div className="text-[9px] font-black uppercase tracking-[1.5px] mb-1.5" style={{ color: '#B0BBC9' }}>
                                                        {`Step ${index + 1}`}
                                                    </div>
                                                    <div className="text-[11px] font-bold leading-tight min-h-[32px] flex items-center justify-center transition-colors"
                                                        style={{ color: '#0D1B3E' }}>
                                                        {stage.label}
                                                    </div>
                                                    <div className="h-6 mt-2 flex items-center justify-center">
                                                        {status === 'active' && (
                                                            <motion.span
                                                                animate={{ opacity: [0.6, 1, 0.6] }}
                                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                                className="badge text-[9px] px-2 py-0.5"
                                                                style={{ background: 'rgba(0,201,167,0.1)', color: '#00A98A', border: '1px solid rgba(0,201,167,0.2)' }}
                                                            >
                                                                Processing
                                                            </motion.span>
                                                        )}
                                                        {status === 'completed' && (
                                                            <span className="text-[9px] font-bold flex items-center gap-1" style={{ color: '#00C9A7' }}>
                                                                <CheckCircle2 size={10} /> Completed
                                                            </span>
                                                        )}
                                                    </div>
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
            {/* Activity Intelligence: Merged Activity Logs + Product Metrics */}
            <div className="grid grid-cols-1 gap-6">
                <motion.div variants={itemVariants} className="rounded-2xl p-6 relative overflow-hidden" style={{ background: '#ffffff', border: '1px solid #E0E4EF', boxShadow: '0 2px 12px rgba(13,27,62,0.05)' }}>
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(0,201,167,0.15) 0%, rgba(0,201,167,0.05) 100%)', border: '1px solid rgba(0,201,167,0.2)' }}>
                                <Activity size={22} style={{ color: '#00C9A7' }} />
                            </div>
                            <div className="flex flex-col">
                                <h2 className="text-lg font-black m-0 leading-none" style={{ fontFamily: 'Outfit,sans-serif', color: '#0D1B3E' }}>
                                    MfG Logistics
                                </h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1.5 opacity-60">Status Tracking · Real-time Operational Telemetry</p>
                            </div>
                        </div>
                        <span className="badge animate-pulse" style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live
                        </span>
                    </div>

                    {/* Section Top: Recent Activity Swipe */}
                    <div className="flex gap-4 overflow-x-auto pb-10 -mb-4 custom-scrollbar relative px-1">
                        {recentActivity.length > 0 ? (
                            recentActivity.map((activity, idx) => (
                                <motion.div
                                    key={activity._id}
                                    initial={{ opacity: 0, x: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    transition={{
                                        delay: 0.2 + idx * 0.1,
                                        type: 'spring',
                                        stiffness: 100,
                                        damping: 15
                                    }}
                                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                                    className="group flex flex-col min-w-[280px] max-w-[300px] p-5 rounded-2xl transition-all duration-300 cursor-default relative overflow-hidden shrink-0"
                                    style={{
                                        background: '#F9FAFB',
                                        border: '1px solid #F0F3F9',
                                        boxShadow: '0 4px 12px rgba(13,27,62,0.03)'
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = '#ffffff';
                                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(13,27,62,0.08)';
                                        e.currentTarget.style.borderColor = '#E0E4EF';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = '#F9FAFB';
                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(13,27,62,0.03)';
                                        e.currentTarget.style.borderColor = '#F0F3F9';
                                    }}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                                            style={{ background: 'rgba(0,201,167,0.1)', transform: 'rotate(-5deg)' }}>
                                            <FileText size={17} style={{ color: '#00C9A7' }} />
                                        </div>
                                        <div className="flex flex-col items-end gap-1 text-[10px] font-bold text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <Clock size={10} />
                                                {formatDate(activity.createdAt)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3 mb-4">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-black text-sm tracking-tight" style={{ color: '#0D1B3E' }}>{activity.mhRequestId}</span>
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-gray-50 border border-gray-100">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                <span className="text-[9px] font-black uppercase text-gray-500">{activity.modelName || 'General'}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusColor(activity.status)}`}>
                                                {activity.status}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getProgressColor(activity.progressStatus)}`}>
                                                {activity.progressStatus || 'PENDING'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-auto pt-4 border-t border-gray-100/50 flex items-center gap-3">
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white"
                                            style={{ background: 'linear-gradient(135deg, #253C80, #1C3A6E)' }}>
                                            {activity.userName?.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[11px] font-bold truncate" style={{ color: '#0D1B3E' }}>{activity.userName}</span>
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 truncate">{activity.departmentName}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="w-full flex flex-col items-center justify-center py-10" style={{ color: '#B0BBC9' }}>
                                <Activity size={28} className="mb-3 opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-wider">No recent activity detected</p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-center mb-10 border-b border-gray-50 pb-8">
                        <button className="px-6 py-2.5 text-[10px] font-black uppercase tracking-[2px] rounded-xl transition-all border border-gray-100 hover:border-emerald-200 hover:text-emerald-500 hover:bg-emerald-50/30"
                            style={{ color: '#7B8AAB' }}>
                            View Full Audit Log
                        </button>
                    </div>

                    {/* Section Bottom: MH Products Intelligence Breakdown */}
                    <div className="pt-2">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg,#6366f1,#4338ca)' }}>
                                <Target size={18} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black" style={{ color: '#0D1B3E' }}>Equipment & Request Insights</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Statistical distribution of production assets</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {/* 3D Discovery Carousel: One-by-One View */}
                            <div className="lg:col-span-2 bg-gray-50/30 rounded-3xl p-8 border border-gray-100 relative overflow-hidden">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-8 flex items-center">
                                    Product Model Discovery
                                    <div className="ml-4 h-px flex-1 bg-gray-100"></div>
                                </h4>

                                <div className="relative h-[360px] flex items-center overflow-hidden" style={{ perspective: '1500px' }}>
                                    {/* The Ticker Track */}
                                    <motion.div
                                        className="flex gap-10 whitespace-nowrap px-4"
                                        animate={{
                                            x: [0, -2000] // Initial estimate, will be fine-tuned by content
                                        }}
                                        transition={{
                                            duration: 40,
                                            repeat: Infinity,
                                            ease: "linear"
                                        }}
                                        style={{ display: 'flex' }}
                                    >
                                        {/* Original + Duplicated for Seamless Loop */}
                                        {[...(Object.entries(stats?.additionalStats?.productBreakdown || {})), ...(Object.entries(stats?.additionalStats?.productBreakdown || {})), ...(Object.entries(stats?.additionalStats?.productBreakdown || {}))].map(([model, count], i) => {
                                            const imageUrls = {
                                                'Scooter': 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=800&auto=format&fit=crop',
                                                'Motorcycle': 'https://images.unsplash.com/photo-1558981403-c5f97db4d5b1?q=80&w=800&auto=format&fit=crop',
                                                'Super Premium': 'https://images.unsplash.com/photo-1611634882194-e532b21cf51e?q=80&w=800&auto=format&fit=crop',
                                                'Scooter, Motorcycle, Electric Vehicle': 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?q=80&w=800&auto=format&fit=crop',
                                                'Scooter, Three Wheeler': 'https://images.unsplash.com/photo-1557053503-0c252e5c8294?q=80&w=800&auto=format&fit=crop'
                                            };
                                            const img = imageUrls[model] || 'https://images.unsplash.com/photo-1504917595217-d4dc5f583dab?q=80&w=800&auto=format&fit=crop';

                                            return (
                                                <motion.div
                                                    key={`${model}-${i}`}
                                                    whileHover={{
                                                        scale: 1.05,
                                                        y: -10,
                                                        rotateY: -5,
                                                        transition: { duration: 0.3 }
                                                    }}
                                                    className="shrink-0 w-[280px] md:w-[320px] aspect-[4/5] bg-[#0F172A] rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden group relative"
                                                    style={{ transformStyle: 'preserve-3d' }}
                                                >
                                                    {/* Background Image Container */}
                                                    <div className="absolute inset-0 w-full h-full overflow-hidden">
                                                        <img
                                                            src={img}
                                                            alt={model}
                                                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-1000 ease-out"
                                                            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop'; }}
                                                        />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-[#060D1F] via-[#060D1F]/40 to-transparent" />
                                                    </div>

                                                    {/* Content Overlay */}
                                                    <div className="absolute inset-0 p-8 flex flex-col justify-end text-white z-20">
                                                        <h5 className="text-2xl font-black mb-2 leading-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] whitespace-normal uppercase tracking-tight">{model}</h5>

                                                        <div className="flex items-end justify-between mt-4 overflow-hidden">
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Production Vol.</span>
                                                                <span className="text-4xl font-black tracking-tighter">{count}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Reflection */}
                                                    <div className="absolute -inset-full bg-gradient-to-tr from-transparent via-white/5 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-1000 pointer-events-none" />
                                                </motion.div>
                                            );
                                        })}
                                    </motion.div>

                                    {/* Indicators & Left/Right Gradient Fades */}
                                    <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white via-white/40 to-transparent z-10 pointer-events-none" />
                                    <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white via-white/40 to-transparent z-10 pointer-events-none" />

                                </div>
                            </div>

                            {/* Request Type Grid */}
                            <div className="bg-gray-50/50 rounded-3xl p-6 border border-gray-100">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-6 flex items-center">
                                    By Request Type
                                    <div className="ml-4 h-px flex-1 bg-gray-100"></div>
                                </h4>
                                <div className="grid grid-cols-1 gap-3">
                                    {stats?.additionalStats?.typeBreakdown ? Object.entries(stats.additionalStats.typeBreakdown).map(([type, count], i) => (
                                        <motion.div
                                            key={type}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.6 + i * 0.05 }}
                                            className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:border-rose-200 hover:shadow-lg hover:shadow-rose-500/5 transition-all group"
                                        >
                                            <span className="text-[11px] font-black text-gray-700 truncate">{type}</span>
                                            <span className="text-md font-black text-rose-600 px-2 py-0.5 bg-rose-50 rounded-lg shadow-sm">
                                                {count}
                                            </span>
                                        </motion.div>
                                    )) : (
                                        <div className="col-span-full text-center py-6 text-gray-400 text-[10px] font-bold uppercase tracking-widest border-2 border-dashed border-gray-100 rounded-2xl">No Logic Defined</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Monthly Trends Chart */}
            {trends.length > 0 && (
                <motion.section variants={itemVariants} className="rounded-2xl p-6 relative overflow-hidden" style={{ background: '#ffffff', border: '1px solid #E0E4EF', boxShadow: '0 2px 12px rgba(13,27,62,0.05)' }}>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(250,17,2,0.08)' }}>
                                <TrendingUp size={18} style={{ color: '#FA1102' }} />
                            </div>
                            <div>
                                <h2 className="text-base font-black m-0" style={{ fontFamily: 'Outfit,sans-serif', color: '#0D1B3E' }}>Monthly Chart Analysis</h2>
                                <p className="text-xs m-0" style={{ color: '#B0BBC9' }}>Request Volume Analytics</p>
                            </div>
                        </div>

                        {/* Filters Card */}
                        <div className="flex flex-wrap items-center gap-3 p-2.5 rounded-xl" style={{ background: '#F9FAFB', border: '1px solid #E0E4EF' }}>
                            <Filter size={14} style={{ color: '#7B8AAB', marginLeft: 6 }} />
                            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                                className="bg-transparent border-none outline-none text-xs font-semibold p-1"
                                style={{ color: '#3D4B6B' }} />
                            <span style={{ color: '#D0D5E0', fontWeight: 700 }}>—</span>
                            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                                className="bg-transparent border-none outline-none text-xs font-semibold p-1"
                                style={{ color: '#3D4B6B' }} />
                            <div className="flex items-center gap-2 ml-auto">
                                <button onClick={fetchTrends} disabled={!fromDate || !toDate}
                                    className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                    style={{ background: 'linear-gradient(135deg,#253C80,#1C3A6E)', color: '#ffffff' }}>
                                    Apply
                                </button>
                                {(fromDate || toDate) && (
                                    <button onClick={() => { setFromDate(''); setToDate(''); fetchTrends(); }}
                                        className="px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                                        style={{ background: '#ffffff', color: '#7B8AAB', border: '1px solid #E0E4EF' }}>
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
                width="95%"
                style={{ maxWidth: '1200px' }}
                centered
                footer={null}
                className="custom-modal"
            >
                <div className="relative w-full h-[500px] mt-4 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-white">
                    <DataGrid
                        columns={dataGridColumns}
                        rows={getFilteredRequests()}
                        rowKeyGetter={(row) => row._id || row.mhRequestId}
                        className="rdg-light dashboard-grid"
                        rowHeight={44}
                        headerRowHeight={52}
                    />
                    {loadingRequests && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                            <div className="w-8 h-8 border-4 border-tvs-blue/20 border-t-tvs-blue rounded-full animate-spin" />
                        </div>
                    )}
                </div>
            </Modal>

        </motion.div>
        </div>{/* end #dashboard-bg-content */}

            {/* Workflow Stage Detail Modal */}
            <AnimatePresence>
                {selectedWorkflowStage !== null && (() => {
                    const stage = workflowStages[selectedWorkflowStage];
                    const status = getStageStatus(selectedWorkflowStage);
                    const statusMeta = getStageStatusMeta(status);
                    const StageIcon = stage.icon;

                    const statusColorMap = {
                        completed: { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200', gradient: 'from-emerald-500/10 to-emerald-500/5' },
                        active: { bg: 'bg-tvs-blue', text: 'text-tvs-blue', light: 'bg-indigo-50', border: 'border-indigo-200', gradient: 'from-indigo-500/10 to-indigo-500/5' },
                        pending: { bg: 'bg-gray-400', text: 'text-gray-500', light: 'bg-gray-50', border: 'border-gray-200', gradient: 'from-gray-500/10 to-gray-500/5' }
                    };
                    const colors = statusColorMap[status] || statusColorMap.pending;

                    return (
                        <motion.div
                            key="workflow-modal-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                            style={{
                                backdropFilter: 'blur(20px) saturate(1.4)',
                                WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
                                background: 'radial-gradient(ellipse at center, rgba(4,10,28,0.50) 0%, rgba(4,10,28,0.72) 100%)',
                            }}
                            onClick={(e) => { if (e.target === e.currentTarget) setSelectedWorkflowStage(null); }}
                        >
                            <motion.div
                                key="workflow-modal-content"
                                initial={{ opacity: 0, scale: 0.88, y: 40 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.94, y: 24 }}
                                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                                className="relative w-full max-w-2xl rounded-3xl overflow-hidden"
                                style={{
                                    background: 'rgba(255,255,255,0.98)',
                                    boxShadow: '0 32px 80px rgba(0,0,0,0.38), 0 8px 24px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.12)',
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {/* Header gradient band */}
                                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${status === 'completed' ? 'from-emerald-400 via-emerald-500 to-teal-500' : status === 'active' ? 'from-tvs-blue via-indigo-500 to-blue-500' : 'from-gray-300 via-gray-400 to-gray-300'}`} />

                                {/* Close button */}
                                <button
                                    onClick={() => setSelectedWorkflowStage(null)}
                                    className="absolute top-5 right-5 z-10 w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all hover:scale-105 active:scale-95"
                                >
                                    <X size={18} />
                                </button>

                                {/* Content */}
                                <div className="p-8 pt-10">
                                    {/* Stage header */}
                                    <div className="flex items-start gap-5 mb-8">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${status === 'completed' ? 'bg-emerald-500 text-white shadow-emerald-200' : status === 'active' ? 'bg-tvs-blue text-white shadow-tvs-blue/30' : 'bg-gray-100 text-gray-400 shadow-gray-200/50'}`}>
                                            <StageIcon size={28} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">
                                                    Step {selectedWorkflowStage + 1} of {workflowStages.length}
                                                </span>
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusMeta.badgeClass}`}>
                                                    {status === 'completed' && <CheckCircle2 size={12} />}
                                                    {status === 'active' && <Circle size={12} className="animate-pulse" />}
                                                    {statusMeta.label}
                                                </span>
                                            </div>
                                            <h3 className="text-2xl font-black text-gray-900 mt-2">{stage.label}</h3>
                                            <p className="text-sm text-gray-500 font-medium mt-1">{stage.description}</p>
                                        </div>
                                    </div>

                                    {selectedWorkflowStage === 0 ? (
                                        <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100 flex flex-col max-h-[400px] mb-6">
                                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                                                <h4 className="text-sm font-black text-gray-800 flex items-center gap-2">
                                                    <ListChecks size={18} className="text-tvs-blue" />
                                                    Lists of Requests ({(stats?.stageMetrics?.mhRequests?.pendingList?.length || 0) + (stats?.stageMetrics?.mhRequests?.completedList?.length || 0)})
                                                </h4>
                                                <button
                                                    onClick={() => {
                                                        setSelectedWorkflowStage(null);
                                                        navigate('/mh-requests');
                                                    }}
                                                    className="flex items-center gap-2 px-4 py-2 bg-tvs-blue text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-colors shadow-md shadow-blue-200"
                                                >
                                                    View
                                                    <ArrowRight size={14} />
                                                </button>
                                            </div>
                                            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                                {(() => {
                                                    const pendingItems = stats?.stageMetrics?.mhRequests?.pendingList || [];
                                                    const completedItems = stats?.stageMetrics?.mhRequests?.completedList || [];
                                                    const allItems = [
                                                        ...pendingItems.map(item => ({ ...item, isPending: true })),
                                                        ...completedItems.map(item => ({ ...item, isPending: false }))
                                                    ];

                                                    console.log("MH REQUEST ITEMS:", allItems, pendingItems, completedItems);

                                                    if (allItems.length === 0) {
                                                        return <div className="text-center text-sm text-gray-400 py-6 font-medium italic">No requests found.</div>;
                                                    }

                                                    return allItems.map((item, i) => (
                                                        <div key={i} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-gray-300 transition-all group">
                                                            <div className="flex items-start gap-4 min-w-0">
                                                                <div className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${item.isPending ? 'bg-gray-400' : 'bg-emerald-500'}`} />
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="text-sm text-gray-800 font-bold truncate">{item.id}</span>
                                                                    <span className="text-xs text-gray-500 font-medium truncate">{item.name || 'Unknown Equipment'}</span>
                                                                </div>
                                                            </div>
                                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase border ${item.isPending ? 'bg-gray-50 text-gray-500 border-gray-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                                                {item.isPending ? 'Pending' : 'Cleared'}
                                                            </span>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                            {/* Pending Items List */}
                                            <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100 flex flex-col max-h-[300px]">
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-4 flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <Circle size={14} className={colors.text} />
                                                        Currently in this Stage
                                                    </div>
                                                    <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-[9px]">
                                                        {(() => {
                                                            const keys = ['mhRequests', 'approval', 'vendorSelection', 'designRelease', 'prPoRelease', 'sampleReceipt', 'bulkLot', 'handover', 'assetImplementation'];
                                                            return stats?.stageMetrics?.[keys[selectedWorkflowStage]]?.pendingList?.length || 0;
                                                        })()}
                                                    </span>
                                                </h4>
                                                <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                                    {(() => {
                                                        const keys = ['mhRequests', 'approval', 'vendorSelection', 'designRelease', 'prPoRelease', 'sampleReceipt', 'bulkLot', 'handover', 'assetImplementation'];
                                                        const pendingItems = stats?.stageMetrics?.[keys[selectedWorkflowStage]]?.pendingList || [];
                                                        if (pendingItems.length === 0) {
                                                            return <div className="text-center text-sm text-gray-400 py-4 font-medium italic">No items currently residing in this stage.</div>;
                                                        }
                                                        return pendingItems.map((item, i) => (
                                                            <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:border-gray-300 transition-all group">
                                                                <div className="flex items-start gap-3 min-w-0">
                                                                    <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${colors.bg}`} />
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className="text-xs text-gray-800 font-bold truncate">{item.id}</span>
                                                                        <span className="text-xs text-gray-500 font-medium truncate">{item.name || 'Unknown'}</span>
                                                                    </div>
                                                                </div>
                                                                <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase bg-gray-50 text-gray-500 border border-gray-100`}>
                                                                    Pending
                                                                </span>
                                                            </div>
                                                        ));
                                                    })()}
                                                </div>
                                            </div>

                                            {/* Completed Items List */}
                                            <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-100 flex flex-col max-h-[300px]">
                                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-4 flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2 size={14} className="text-emerald-500" />
                                                        Moved to Next Stage
                                                    </div>
                                                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[9px]">
                                                        {(() => {
                                                            const keys = ['mhRequests', 'approval', 'vendorSelection', 'designRelease', 'prPoRelease', 'sampleReceipt', 'bulkLot', 'handover', 'assetImplementation'];
                                                            return stats?.stageMetrics?.[keys[selectedWorkflowStage]]?.completedList?.length || 0;
                                                        })()}
                                                    </span>
                                                </h4>
                                                <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                                    {(() => {
                                                        const keys = ['mhRequests', 'approval', 'vendorSelection', 'designRelease', 'prPoRelease', 'sampleReceipt', 'bulkLot', 'handover', 'assetImplementation'];
                                                        const completedItems = stats?.stageMetrics?.[keys[selectedWorkflowStage]]?.completedList || [];
                                                        if (completedItems.length === 0) {
                                                            return <div className="text-center text-sm text-gray-400 py-4 font-medium italic">No items have moved past this stage yet.</div>;
                                                        }
                                                        return completedItems.map((item, i) => (
                                                            <div key={i} className="flex items-center justify-between p-3 bg-white rounded-xl border border-emerald-100 shadow-sm hover:border-emerald-200 transition-all group">
                                                                <div className="flex items-start gap-3 min-w-0">
                                                                    <div className="mt-0.5 w-2 h-2 rounded-full shrink-0 bg-emerald-500" />
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className="text-xs text-gray-800 font-bold truncate">{item.id}</span>
                                                                        <span className="text-xs text-gray-500 font-medium truncate">{item.name || 'Unknown'}</span>
                                                                    </div>
                                                                </div>
                                                                <span className="px-2 py-1 rounded-md text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                                    Cleared
                                                                </span>
                                                            </div>
                                                        ));
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Navigation footer */}
                                    <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                                        <button
                                            onClick={() => setSelectedWorkflowStage(Math.max(0, selectedWorkflowStage - 1))}
                                            disabled={selectedWorkflowStage === 0}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            <ArrowRight size={16} className="rotate-180" />
                                            Previous Stage
                                        </button>
                                        <div className="flex items-center gap-1.5">
                                            {workflowStages.map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setSelectedWorkflowStage(i)}
                                                    className={`w-2 h-2 rounded-full transition-all duration-200 ${i === selectedWorkflowStage ? `${colors.bg} scale-125` : 'bg-gray-200 hover:bg-gray-300'}`}
                                                />
                                            ))}
                                        </div>
                                        <button
                                            onClick={() => setSelectedWorkflowStage(Math.min(workflowStages.length - 1, selectedWorkflowStage + 1))}
                                            disabled={selectedWorkflowStage === workflowStages.length - 1}
                                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            Next Stage
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })()}
            </AnimatePresence>
            <style>{`
                .dashboard-grid.rdg-light {
                    border: none;
                }
                .dashboard-grid .rdg-header-row .rdg-cell {
                    background-color: #253C80;
                    color: white;
                    font-weight: bold;
                    border-bottom: 2px solid #e2e8f0;
                    font-size: 11px;
                    text-transform: uppercase;
                }
                .dashboard-grid .rdg-row .rdg-cell {
                    border-bottom: 1px solid #f1f5f9;
                    font-size: 13px;
                }
            `}</style>
        </>
    );
};

export default Dashboard;
