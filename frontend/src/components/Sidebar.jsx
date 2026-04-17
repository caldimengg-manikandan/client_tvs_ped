import React, { useState } from 'react';
import {
    Home, Settings, FileText, ClipboardList, Users, Shield,
    BarChart2, TrendingUp, Menu, ChevronLeft, ChevronDown,
    Layers, Package, PieChart, Factory, Sliders, Palette,
    Type, Layout as LayoutIcon, Check
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

/* ══════════════════════════════════════════════════
   COLOR THEMES  (8 total: 6 dark + white + black)
══════════════════════════════════════════════════ */
const COLOR_THEMES = [
    {
        key: 'navy', label: 'Navy',
        bg: 'linear-gradient(180deg,#0B1730 0%,#0F2040 60%,#091526 100%)',
        accent: '#00C9A7', preview: '#0F2040', isLight: false,
    },
    {
        key: 'slate', label: 'Slate',
        bg: 'linear-gradient(180deg,#1e293b 0%,#0f172a 100%)',
        accent: '#38bdf8', preview: '#1e293b', isLight: false,
    },
    {
        key: 'forest', label: 'Forest',
        bg: 'linear-gradient(180deg,#052e16 0%,#14532d 60%,#052e16 100%)',
        accent: '#4ade80', preview: '#14532d', isLight: false,
    },
    {
        key: 'violet', label: 'Violet',
        bg: 'linear-gradient(180deg,#2e1065 0%,#1e1b4b 60%,#0d0a2e 100%)',
        accent: '#a78bfa', preview: '#2e1065', isLight: false,
    },
    {
        key: 'crimson', label: 'Crimson',
        bg: 'linear-gradient(180deg,#3b0018 0%,#560020 60%,#1e0010 100%)',
        accent: '#fb7185', preview: '#560020', isLight: false,
    },
    {
        key: 'midnight', label: 'Dark',
        bg: 'linear-gradient(180deg,#09090b 0%,#18181b 60%,#09090b 100%)',
        accent: '#fbbf24', preview: '#18181b', isLight: false,
    },
    /* ── NEW ── */
    {
        key: 'white', label: 'White',
        bg: 'linear-gradient(180deg,#ffffff 0%,#f8fafc 60%,#f1f5f9 100%)',
        accent: '#253C80', preview: '#f8fafc', isLight: true,
    },
    {
        key: 'black', label: 'Black',
        bg: 'linear-gradient(180deg,#000000 0%,#0a0a0a 60%,#000000 100%)',
        accent: '#00C9A7', preview: '#000000', isLight: false,
    },
];

const FONT_OPTIONS = [
    { key: 'inter',  label: 'Inter',   style: "'Inter', sans-serif" },
    { key: 'outfit', label: 'Outfit',  style: "'Outfit', sans-serif" },
    { key: 'dm',     label: 'DM Sans', style: "'DM Sans', sans-serif" },
    { key: 'mono',   label: 'Mono',    style: "'JetBrains Mono', 'Fira Mono', monospace" },
];

const LAYOUT_OPTIONS = [
    { key: 'spacious', label: 'Spacious', itemPY: 14, iconSize: 36 },
    { key: 'normal',   label: 'Normal',   itemPY: 11, iconSize: 34 },
    { key: 'compact',  label: 'Compact',  itemPY: 8,  iconSize: 30 },
];

/* ── localStorage helpers ── */
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

/* ══════════════════════════════════════════════════
   SIDEBAR
══════════════════════════════════════════════════ */
const Sidebar = ({ isSidebarOpen, setIsSidebarOpen, windowWidth }) => {
    const { hasPermission } = useAuth();
    const location = useLocation();
    const navigate  = useNavigate();

    const [openGroups,    setOpenGroups]    = React.useState({ vendorManagement: true });
    const [showCustomize, setShowCustomize] = useState(false);

    const [activeTheme,  setActiveTheme]  = useState(() => load('sb_theme',  'navy'));
    const [activeFont,   setActiveFont]   = useState(() => load('sb_font',   'inter'));
    const [activeLayout, setActiveLayout] = useState(() => load('sb_layout', 'normal'));

    const theme  = COLOR_THEMES.find(t => t.key  === activeTheme)  ?? COLOR_THEMES[0];
    const font   = FONT_OPTIONS.find(f => f.key   === activeFont)   ?? FONT_OPTIONS[0];
    const layout = LAYOUT_OPTIONS.find(l => l.key === activeLayout) ?? LAYOUT_OPTIONS[1];

    /* ── Dynamic color tokens (dark vs light sidebar) ── */
    const lx = theme.isLight;
    const tc = {
        text:    lx ? '#0D1B3E'              : '#ffffff',
        text80:  lx ? 'rgba(13,27,62,0.80)'  : 'rgba(255,255,255,0.80)',
        muted:   lx ? 'rgba(13,27,62,0.42)'  : 'rgba(255,255,255,0.42)',
        muted2:  lx ? 'rgba(13,27,62,0.28)'  : 'rgba(255,255,255,0.28)',
        label:   lx ? 'rgba(13,27,62,0.30)'  : 'rgba(255,255,255,0.28)',
        border:  lx ? 'rgba(0,0,0,0.08)'     : 'rgba(255,255,255,0.07)',
        iconBg:  lx ? 'rgba(13,27,62,0.06)'  : 'rgba(255,255,255,0.05)',
        panelBg: lx ? 'rgba(0,0,0,0.04)'     : 'rgba(0,0,0,0.35)',
        panelBorder: lx ? `rgba(0,0,0,0.08)` : `${theme.accent}22`,
        custBtnBg: lx ? 'rgba(0,0,0,0.04)'   : 'rgba(255,255,255,0.05)',
        custBtnBorder: lx ? 'rgba(0,0,0,0.1)': 'rgba(255,255,255,0.08)',
        scrollTrack: lx ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)',
    };

    const applyTheme  = k => { setActiveTheme(k);  save('sb_theme',  k); };
    const applyFont   = k => { setActiveFont(k);   save('sb_font',   k); };
    const applyLayout = k => { setActiveLayout(k); save('sb_layout', k); };

    const isVendorGroupActive = location.pathname.startsWith('/vendor-master');
    React.useEffect(() => {
        if (isVendorGroupActive) setOpenGroups(p => ({ ...p, vendorManagement: true }));
    }, [isVendorGroupActive]);

    const navItems = [
        { name: 'Dashboard',        icon: Home,          path: '/',                        permission: 'dashboard' },
        { name: 'Employee Master',  icon: Users,         path: '/employee-master',         permission: 'employeeMaster' },
        { name: 'MH Requests',      icon: FileText,      path: '/mh-requests',            permission: 'assetRequest' },
        { name: 'Request Tracker',  icon: ClipboardList, path: '/request-tracker',        permission: 'requestTracker' },
        { name: 'MH Dev Tracker',   icon: TrendingUp,    path: '/mh-development-tracker', permission: 'mhDevelopmentTracker' },
        { name: 'Project Plan',     icon: BarChart2,     path: '/project-plan-model',     permission: 'mhDevelopmentTracker', isSubItem: true },
        { name: 'Vendor Management',icon: Shield,        path: '#',                       permission: 'vendorMaster', isHeader: true, groupKey: 'vendorManagement' },
        { name: 'Vendor Master',    icon: Layers,        path: '/vendor-master',          permission: 'vendorMaster', isSubItem: true, groupKey: 'vendorManagement' },
        { name: 'Vendor Scoring',   icon: PieChart,      path: '/vendor-master/scoring',  permission: 'vendorMaster', isSubItem: true, groupKey: 'vendorManagement' },
        { name: 'Loading Chart',    icon: BarChart2,     path: '/vendor-master/loading',  permission: 'vendorMaster', isSubItem: true, groupKey: 'vendorManagement' },
        { name: 'Asset Management', icon: Package,       path: '/asset-management-update',permission: 'assetSummary' },
        { name: 'Asset Summary',    icon: ClipboardList, path: '/asset-summary',          permission: 'assetSummary' },
        { name: 'Settings',         icon: Settings,      path: '/settings',               permission: 'settings' },
    ];

    const panelV = {
        hidden:  { opacity: 0, y: -8, scaleY: 0.94 },
        visible: { opacity: 1, y: 0,  scaleY: 1, transition: { type: 'spring', stiffness: 340, damping: 28 } },
        exit:    { opacity: 0, y: -6, scaleY: 0.94, transition: { duration: 0.16 } },
    };

    return (
        <>
            {/* Mobile overlay */}
            <AnimatePresence>
                {windowWidth <= 1024 && isSidebarOpen && (
                    <motion.div
                        key="sidebar-backdrop"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 z-backdrop lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </AnimatePresence>

            <motion.aside
                key="sidebar"
                initial={{ x: windowWidth <= 1024 ? -280 : 0, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -280, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 280, damping: 32 }}
                className="h-screen fixed left-0 top-0 z-sidebar flex flex-col overflow-hidden"
                style={{
                    width: isSidebarOpen ? 272 : 72,
                    transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
                    background: theme.bg,
                    fontFamily: font.style,
                    borderRight: `1px solid ${tc.border}`,
                    boxShadow: lx
                        ? '4px 0 24px rgba(0,0,0,0.08), 1px 0 0 rgba(0,0,0,0.06)'
                        : '4px 0 32px rgba(0,0,0,0.25)',
                }}
            >
                {/* ══ Logo area ══ */}
                <div className="flex items-center justify-between px-4 py-3 border-b"
                    style={{ borderColor: tc.border }}>
                    <div className="flex flex-col items-center gap-1.5 flex-1 overflow-hidden">
                        <motion.div
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            className={`flex items-center justify-center transition-all duration-300 ${isSidebarOpen ? 'h-13 w-13 mb-1' : 'h-10 w-10'} rounded-2xl`}
                            style={{
                                background: `linear-gradient(135deg,${theme.accent}26,${theme.accent}0d)`,
                                border: `1px solid ${theme.accent}4d`,
                                boxShadow: `0 0 20px ${theme.accent}26`,
                            }}>
                            <Factory size={isSidebarOpen ? 26 : 20} style={{ color: theme.accent }} />
                        </motion.div>

                        <AnimatePresence>
                            {isSidebarOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.28 }}
                                    className="text-center"
                                >
                                    <h1 className="flex flex-col items-center">
                                        <span className="text-[14px] font-black tracking-[0.2em] whitespace-nowrap"
                                            style={{ color: tc.text, textShadow: lx ? 'none' : `0 0 10px ${theme.accent}66` }}>
                                            <span style={{ color: theme.accent }}>MfG</span> FACTORY
                                        </span>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div style={{ width: 16, height: 1, background: lx ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }} />
                                            <span className="text-[8px] font-bold tracking-[0.3em] uppercase" style={{ color: tc.muted }}>
                                                Manufacturing Portal
                                            </span>
                                            <div style={{ width: 16, height: 1, background: lx ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }} />
                                        </div>
                                    </h1>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="hidden lg:inline-flex p-2 rounded-lg transition-colors ml-1 flex-shrink-0"
                        style={{ color: tc.muted }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = lx ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        {isSidebarOpen ? <ChevronLeft size={16} /> : <Menu size={16} />}
                    </button>
                </div>

                {/* ══ Customize Button ══ */}
                <div className="px-3 pt-3 pb-1">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowCustomize(v => !v)}
                        className={`w-full flex items-center rounded-xl border transition-all duration-200 ${isSidebarOpen ? 'px-3 py-2.5 gap-3 justify-start' : 'p-2.5 justify-center'}`}
                        style={{
                            background:   showCustomize ? `${theme.accent}18` : tc.custBtnBg,
                            borderColor:  showCustomize ? `${theme.accent}44` : tc.custBtnBorder,
                            color:        showCustomize ? theme.accent : tc.muted,
                        }}
                        title="Customize Sidebar"
                    >
                        <Sliders size={14} />
                        <AnimatePresence>
                            {isSidebarOpen && (
                                <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="text-[10.5px] font-bold tracking-[0.1em] uppercase overflow-hidden whitespace-nowrap"
                                >
                                    Customize
                                </motion.span>
                            )}
                        </AnimatePresence>
                        {isSidebarOpen && (
                            <motion.div
                                animate={{ rotate: showCustomize ? 180 : 0 }}
                                transition={{ duration: 0.22 }}
                                className="ml-auto"
                            >
                                <ChevronDown size={12} />
                            </motion.div>
                        )}
                    </motion.button>
                </div>

                {/* ══ Customize Panel ══ */}
                <AnimatePresence>
                    {showCustomize && isSidebarOpen && (
                        <motion.div
                            key="customize-panel"
                            variants={panelV}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="mx-3 mb-1 rounded-2xl overflow-hidden"
                            style={{
                                background: tc.panelBg,
                                border: `1px solid ${tc.panelBorder}`,
                                backdropFilter: 'blur(10px)',
                                transformOrigin: 'top center',
                            }}
                        >
                            <div style={{ maxHeight: 290, overflowY: 'auto' }} className="p-3 space-y-3.5">

                                {/* ── Colors ── */}
                                <div>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <Palette size={10} style={{ color: theme.accent }} />
                                        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: tc.label }}>
                                            Color Theme
                                        </span>
                                    </div>
                                    {/* 4-column grid to fit all 8 themes */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
                                        {COLOR_THEMES.map(t => (
                                            <button
                                                key={t.key}
                                                onClick={() => applyTheme(t.key)}
                                                title={t.label}
                                                style={{
                                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                                                    padding: '6px 4px', borderRadius: 10,
                                                    background:   activeTheme === t.key ? `${theme.accent}18` : lx ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                                                    border:       `1.5px solid ${activeTheme === t.key ? theme.accent : 'transparent'}`,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.18s ease',
                                                }}
                                            >
                                                {/* Swatch */}
                                                <div style={{
                                                    width: 26, height: 18, borderRadius: 6, position: 'relative', overflow: 'hidden',
                                                    background: t.preview,
                                                    border: t.key === 'white' ? '1px solid rgba(0,0,0,0.1)' : 'none',
                                                    boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                                                }}>
                                                    {/* Accent strip at bottom */}
                                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 5, background: t.accent }} />
                                                    {activeTheme === t.key && (
                                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Check size={9} color={t.isLight ? '#253C80' : '#fff'} strokeWidth={3} />
                                                        </div>
                                                    )}
                                                </div>
                                                <span style={{
                                                    fontSize: 8.5, fontWeight: 700,
                                                    color: activeTheme === t.key ? theme.accent : tc.muted,
                                                    lineHeight: 1,
                                                }}>
                                                    {t.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* ── Font ── */}
                                <div>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <Type size={10} style={{ color: theme.accent }} />
                                        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: tc.label }}>
                                            Font
                                        </span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                                        {FONT_OPTIONS.map(f => (
                                            <button key={f.key} onClick={() => applyFont(f.key)} style={{
                                                fontFamily: f.style,
                                                padding: '6px 8px', borderRadius: 8, textAlign: 'left', cursor: 'pointer',
                                                background:   activeFont === f.key ? `${theme.accent}18` : lx ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                                                border:       `1.5px solid ${activeFont === f.key ? theme.accent : 'transparent'}`,
                                                color:        activeFont === f.key ? theme.accent : tc.muted,
                                                fontSize: 11, fontWeight: 700,
                                                transition: 'all 0.16s ease',
                                            }}>
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* ── Density ── */}
                                <div>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <LayoutIcon size={10} style={{ color: theme.accent }} />
                                        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: tc.label }}>
                                            Density
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 5 }}>
                                        {LAYOUT_OPTIONS.map(l => (
                                            <button key={l.key} onClick={() => applyLayout(l.key)} style={{
                                                flex: 1, padding: '6px 4px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                                                background:   activeLayout === l.key ? `${theme.accent}18` : lx ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.04)',
                                                border:       `1.5px solid ${activeLayout === l.key ? theme.accent : 'transparent'}`,
                                                color:        activeLayout === l.key ? theme.accent : tc.muted,
                                                fontSize: 10, fontWeight: 700,
                                                transition: 'all 0.16s ease',
                                            }}>
                                                {l.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ══ Navigation ══ */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 sidebar-scrollbar">
                    <AnimatePresence>
                        {isSidebarOpen && (
                            <motion.p
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="px-5 mb-2 text-[9px] font-bold uppercase tracking-[0.2em]"
                                style={{ color: tc.label }}
                            >
                                Main Menu
                            </motion.p>
                        )}
                    </AnimatePresence>

                    <ul style={{ listStyle: 'none', margin: 0 }}
                        className={`${isSidebarOpen ? 'px-3' : 'px-2'} relative`}
                    >
                        {navItems.map((item, index) => {
                            if (item.permission && !hasPermission(item.permission)) return null;
                            if (!isSidebarOpen && (item.isHeader || item.isSubItem)) return null;
                            if (item.groupKey && !item.isHeader && openGroups[item.groupKey] === false) return null;

                            const isActive = location.pathname === item.path
                                || (item.path !== '/' && item.path !== '#' && location.pathname.startsWith(item.path));

                            /* ── Group header ── */
                            if (item.isHeader) {
                                const isGroupActive = item.groupKey === 'vendorManagement' && isVendorGroupActive;
                                return (
                                    <li key={item.name} style={{ paddingTop: 12, paddingBottom: 4 }}>
                                        <motion.button
                                            whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}
                                            type="button"
                                            onClick={() => {
                                                if (item.groupKey) setOpenGroups(p => ({ ...p, [item.groupKey]: !p[item.groupKey] }));
                                                navigate('/vendor-master');
                                            }}
                                            className="w-full flex items-center justify-between px-3 rounded-2xl transition-all border border-transparent"
                                            style={{
                                                paddingTop: layout.itemPY, paddingBottom: layout.itemPY,
                                                color: isGroupActive ? theme.accent : tc.muted,
                                                background: isGroupActive ? `${theme.accent}14` : 'transparent',
                                                borderColor: isGroupActive ? `${theme.accent}26` : 'transparent',
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center rounded-xl"
                                                    style={{
                                                        width: layout.iconSize, height: layout.iconSize,
                                                        background: isGroupActive ? `linear-gradient(135deg,${theme.accent},${theme.accent}aa)` : tc.iconBg,
                                                        boxShadow: isGroupActive ? `0 4px 12px ${theme.accent}4d` : 'none',
                                                    }}>
                                                    <item.icon size={15} color={isGroupActive ? '#fff' : tc.muted} />
                                                </div>
                                                {isSidebarOpen && (
                                                    <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: isGroupActive ? theme.accent : tc.muted }}>
                                                        {item.name}
                                                    </span>
                                                )}
                                            </div>
                                            {item.groupKey && isSidebarOpen && (
                                                <ChevronDown size={13}
                                                    style={{ color: tc.muted }}
                                                    className={`transition-transform duration-300 ${openGroups[item.groupKey] ? 'rotate-180' : ''}`} />
                                            )}
                                        </motion.button>
                                    </li>
                                );
                            }

                            /* ── Regular nav item ── */
                            return (
                                <motion.li
                                    key={item.name}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.32, delay: index * 0.04, type: 'spring', damping: 22 }}
                                    style={{ marginBottom: 4 }}
                                >
                                    <NavLink to={item.path} end={item.path === '/'} className="block outline-none">
                                        {({ isActive }) => (
                                            <motion.div
                                                whileHover={{ x: isSidebarOpen ? 5 : 0, scale: isSidebarOpen ? 1 : 1.08 }}
                                                whileTap={{ scale: 0.96 }}
                                                className={`flex items-center ${isSidebarOpen ? 'justify-start' : 'justify-center'} px-3 rounded-2xl transition-all group relative overflow-hidden`}
                                                style={{
                                                    paddingTop: layout.itemPY,
                                                    paddingBottom: layout.itemPY,
                                                    background: isActive ? `${theme.accent}12` : 'transparent',
                                                }}
                                            >
                                                {/* Active floating pill */}
                                                {isActive && (
                                                    <motion.div
                                                        layoutId="floatingPill"
                                                        className="absolute inset-0 rounded-2xl z-0"
                                                        style={{
                                                            background: `linear-gradient(90deg,${theme.accent}1a,transparent)`,
                                                            border: `1px solid ${theme.accent}33`,
                                                        }}
                                                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                                                    />
                                                )}

                                                <div className="flex items-center gap-3.5 z-10">
                                                    {/* Icon */}
                                                    <div className="flex items-center justify-center rounded-xl relative group-hover:rotate-[5deg] transition-transform duration-300"
                                                        style={{
                                                            width: layout.iconSize, height: layout.iconSize,
                                                            background: isActive ? `linear-gradient(135deg,${theme.accent},${theme.accent}aa)` : tc.iconBg,
                                                            boxShadow: isActive ? `0 6px 16px ${theme.accent}4d` : 'none',
                                                        }}>
                                                        <item.icon
                                                            size={layout.iconSize <= 30 ? 14 : 16}
                                                            color={isActive ? '#ffffff' : tc.muted}
                                                            className="group-hover:scale-110 transition-transform"
                                                        />
                                                        {isActive && <div className="absolute inset-0 bg-white/20 rounded-xl blur-md opacity-50" />}
                                                    </div>

                                                    {/* Label */}
                                                    {isSidebarOpen && (
                                                        <span style={{
                                                            fontSize: 12, fontWeight: isActive ? 800 : 600,
                                                            color: isActive ? tc.text : tc.muted,
                                                            fontFamily: font.style,
                                                            transition: 'color 0.18s ease',
                                                        }}
                                                            className="group-hover:!text-opacity-100"
                                                            onMouseEnter={e => { if (!isActive) e.target.style.color = tc.text80; }}
                                                            onMouseLeave={e => { if (!isActive) e.target.style.color = tc.muted; }}
                                                        >
                                                            {item.name}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Active dot */}
                                                {isActive && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="ml-auto w-1.5 h-1.5 rounded-full z-10"
                                                        style={{ background: theme.accent, boxShadow: `0 0 10px ${theme.accent}cc` }}
                                                    />
                                                )}
                                            </motion.div>
                                        )}
                                    </NavLink>
                                </motion.li>
                            );
                        })}
                    </ul>
                </nav>

                {/* ══ Footer ══ */}
                <div className="p-3 border-t" style={{ borderColor: tc.border }}>
                    <div
                        className={`rounded-xl transition-all duration-300 ${isSidebarOpen ? 'p-3' : 'p-2 flex justify-center'}`}
                        style={{ background: `${theme.accent}0f`, border: `1px solid ${theme.accent}1f` }}
                    >
                        {isSidebarOpen ? (
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: theme.accent }} />
                                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: tc.muted }}>
                                    System Online
                                </p>
                            </div>
                        ) : (
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: theme.accent }} />
                        )}
                    </div>
                </div>
            </motion.aside>
        </>
    );
};

export default Sidebar;