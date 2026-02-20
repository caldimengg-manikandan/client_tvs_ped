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
                            Assets Status Indicators
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
                                                        <button
                                                            onClick={() => setSelectedWorkflowStage(index)}
                                                            className={`${circleClass} cursor-pointer hover:scale-110 hover:shadow-lg active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-tvs-blue/40 focus:ring-offset-2`}
                                                            title={`View details: ${stage.label}`}
                                                        >
                                                            <Icon size={16} className={iconClass} />
                                                        </button>
                                                    </div>
                                                    <div className={`h-[3px] flex-1 rounded-full ${index === workflowStages.length - 1 ? 'bg-transparent' : connectorClass}`} />
                                                </div>

                                                <button
                                                    onClick={() => setSelectedWorkflowStage(index)}
                                                    className="mt-3 flex flex-col items-center text-center cursor-pointer group/stage hover:bg-gray-50/80 rounded-xl px-2 py-2 -mx-1 transition-all duration-200 focus:outline-none"
                                                    title={`View details: ${stage.label}`}
                                                >
                                                    <div className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-[2px]">
                                                        {`Step ${index + 1}`}
                                                    </div>
                                                    <div className={`mt-1 text-xs md:text-sm font-black group-hover/stage:text-tvs-blue transition-colors ${status === 'pending' ? 'text-gray-500' : status === 'active' ? 'text-gray-900' : 'text-gray-800'}`}>
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
                                                </button>
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
                            Activity Logs
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
                            Material Handling Products
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
                                <span className="block text-xl font-bold">Monthly Chart Analysis</span>
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
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                            style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
                            onClick={(e) => { if (e.target === e.currentTarget) setSelectedWorkflowStage(null); }}
                        >
                            <motion.div
                                key="workflow-modal-content"
                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
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
        </motion.div>
    );
};

export default Dashboard;
