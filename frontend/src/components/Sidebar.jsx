import React, { useState } from 'react';
import {
    Home, Settings, FileText, ClipboardList, Users, Shield,
    BarChart2, TrendingUp, Menu, ChevronLeft, ChevronDown,
    Layers, Package, PieChart, Factory, Sliders, Palette,
    Type, Layout as LayoutIcon, Check
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Tooltip } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

/* ══════════════════════════════════════════════════
   COLOR THEMES  (8 total: 6 dark + white + black)
══════════════════════════════════════════════════ */
const COLOR_THEMES = [
    {
        key: 'navy', label: 'Navy',
        bg: 'linear-gradient(180deg,#7A0F0F 0%,#991515 60%,#091526 100%)',
        accent: '#00C9A7', preview: '#991515', isLight: false,
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
        accent: '#CC1F1F', preview: '#f8fafc', isLight: true,
    },
    {
        key: 'tvs-red', label: 'TVS Red',
        bg: '#CC1F1F',
        accent: '#ffffff', preview: '#CC1F1F', isLight: false,
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

    const [showCustomize, setShowCustomize] = useState(false);

    const [activeTheme,  setActiveTheme]  = useState(() => load('sb_theme',  'tvs-red'));
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


    const NAV_SECTIONS = [
        { label: 'OPERATIONS', items: [
            { name: 'Dashboard',        short: 'Dashboard',  icon: Home,          path: '/',                        permission: 'dashboard' },
            { name: 'MH Request',       short: 'MH Request', icon: FileText,      path: '/mh-requests',             permission: 'assetRequest' },
            { name: 'Request Tracker',  short: 'Tracker',    icon: ClipboardList, path: '/request-tracker',         permission: 'requestTracker' },
            { name: 'MH Development',   short: 'MH Dev',     icon: TrendingUp,    path: '/mh-development-tracker',  permission: 'mhDevelopmentTracker' },
        ]},
        { label: 'ASSETS', items: [
            { name: 'Asset Management', short: 'Assets',     icon: Package,       path: '/asset-management-update', permission: 'assetSummary' },
            { name: 'Asset Summary',    short: 'Summary',    icon: ClipboardList, path: '/asset-summary',           permission: 'assetSummary' },
        ]},
        { label: 'MANAGEMENT', items: [
            { name: 'Employee Master',  short: 'Employees',  icon: Users,         path: '/employee-master',         permission: 'employeeMaster' },
            { name: 'Vendor Master',    short: 'Vendors',    icon: Layers,        path: '/vendor-master',           permission: 'vendorMaster' },
            { name: 'Vendor Scoring',   short: 'Scoring',    icon: PieChart,      path: '/vendor-master/scoring',   permission: 'vendorMaster' },
            { name: 'Vendor Loading',   short: 'Loading',    icon: BarChart2,     path: '/vendor-master/loading',   permission: 'vendorMaster' },
        ]},
        { label: 'SYSTEM', items: [
            { name: 'Settings',         short: 'Settings',   icon: Settings,      path: '/settings',                permission: 'settings' },
        ]},
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
                    width: isSidebarOpen ? 220 : 64,
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
                <div style={{ borderColor: tc.border, borderBottomWidth: 1, borderBottomStyle: 'solid' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent: isSidebarOpen ? 'space-between' : 'center', padding: isSidebarOpen ? '8px 8px 0 8px' : '8px 0 0 0' }}>
                        {/* ── Logo badge — always visible, no text ── */}
                        <div
                            onClick={() => isSidebarOpen ? navigate('/') : setIsSidebarOpen(true)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flex: isSidebarOpen ? 1 : '0 0 auto',
                                marginRight: isSidebarOpen ? 8 : 0,
                                minHeight: 64,
                                cursor: 'pointer',
                                /* No overflow:hidden — avoids clipping logo edges */
                                transition: 'flex 0.3s cubic-bezier(0.4,0,0.2,1)',
                            }}
                        >
                            {/* Colored TVS logo — always shown */}
                            <div style={{
                                background: '#ffffff',
                                borderRadius: 10,
                                /* Smaller padding when collapsed so badge fits 64px sidebar */
                                padding: isSidebarOpen ? '6px 12px' : '5px 6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                                transition: 'padding 0.3s cubic-bezier(0.4,0,0.2,1)',
                            }}>
                                <img
                                    src="/tvs_logo_clean.png"
                                    alt="TVS"
                                    style={{
                                        /* 120px expanded, 40px collapsed — fits within 64px sidebar */
                                        width: isSidebarOpen ? 120 : 40,
                                        height: 'auto',
                                        objectFit: 'contain',
                                        display: 'block',
                                        transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
                                    }}
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="hidden lg:inline-flex p-2 rounded-lg transition-colors flex-shrink-0"
                            style={{ color: tc.muted }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = lx ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.07)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                            {isSidebarOpen ? <ChevronLeft size={16} /> : <Menu size={16} />}
                        </button>
                    </div>
                    <div style={{ borderBottom:`1px solid ${tc.border}`, margin:'12px 0 8px 0' }} />
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
                                                            <Check size={9} color={t.isLight ? '#CC1F1F' : '#fff'} strokeWidth={3} />
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
                <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 sidebar-scrollbar">
                    {NAV_SECTIONS.map(section => {
                        const visibleItems = section.items.filter(item =>
                            !item.permission || hasPermission(item.permission)
                        );
                        if (visibleItems.length === 0) return null;
                        return (
                            <div key={section.label}>
                                {/* Section header — hidden in collapsed mode */}
                                {isSidebarOpen && (
                                    <div style={{
                                        fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                                        color: tc.label, padding: '16px 16px 4px 16px', marginTop: 4,
                                    }}>
                                        {section.label}
                                    </div>
                                )}
                                <ul style={{ listStyle:'none', margin:0, padding: isSidebarOpen ? '0 8px' : '0 4px' }}>
                                    {visibleItems.map((item, idx) => {
                                        const isActive = location.pathname === item.path
                                            || (item.path !== '/' && location.pathname.startsWith(item.path));
                                        const navItem = (
                                            <motion.li
                                                key={item.path}
                                                initial={{ opacity:0, x:-8 }}
                                                animate={{ opacity:1, x:0 }}
                                                transition={{ duration:0.28, delay: idx * 0.03 }}
                                                style={{ marginBottom: isSidebarOpen ? 2 : 0 }}
                                            >
                                                <NavLink to={item.path} end={item.path === '/'} className="block outline-none">
                                                    {({ isActive: navActive }) => (
                                                        isSidebarOpen ? (
                                                            /* ── EXPANDED item ── */
                                                            <motion.div
                                                                whileHover={{ x: 3 }}
                                                                whileTap={{ scale: 0.97 }}
                                                                style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    padding: '10px 14px',
                                                                    borderRadius: 10,
                                                                    borderLeft: navActive ? '3px solid #fff' : '3px solid transparent',
                                                                    background: navActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.18s ease',
                                                                }}
                                                                onMouseEnter={e => { if (!navActive) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                                                                onMouseLeave={e => { if (!navActive) e.currentTarget.style.background = 'transparent'; }}
                                                            >
                                                                <item.icon
                                                                    size={20}
                                                                    style={{ marginRight:12, flexShrink:0, color: navActive ? tc.text : tc.muted }}
                                                                />
                                                                <span style={{
                                                                    fontSize: 13,
                                                                    fontWeight: navActive ? 500 : 400,
                                                                    color: navActive ? tc.text : tc.muted,
                                                                    fontFamily: font.style,
                                                                    whiteSpace: 'nowrap',
                                                                    overflow: 'hidden',
                                                                    textOverflow: 'ellipsis',
                                                                }}>
                                                                    {item.name}
                                                                </span>
                                                            </motion.div>
                                                        ) : (
                                                            /* ── COLLAPSED item: icon tile + label below ── */
                                                            <div style={{
                                                                display: 'flex', flexDirection: 'column',
                                                                alignItems: 'center', justifyContent: 'center',
                                                                padding: '8px 0', width: '100%',
                                                            }}>
                                                                <div style={{
                                                                    width: 36, height: 36, borderRadius: 8,
                                                                    /* Use theme tokens — works on both dark AND light/white sidebars */
                                                                    background: navActive ? `${theme.accent}33` : tc.iconBg,
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    transition: 'background 0.18s ease',
                                                                }}>
                                                                    <item.icon size={18} color={navActive ? theme.accent : tc.text80} />
                                                                </div>
                                                                <div style={{
                                                                    fontSize: 9,
                                                                    /* Theme-aware text color — visible on white sidebar too */
                                                                    color: navActive ? theme.accent : tc.muted,
                                                                    marginTop: 4, textAlign: 'center', lineHeight: 1.2,
                                                                    maxWidth: 56, whiteSpace: 'normal',
                                                                }}>
                                                                    {item.short}
                                                                </div>
                                                            </div>
                                                        )
                                                    )}
                                                </NavLink>
                                            </motion.li>
                                        );
                                        /* Wrap collapsed items with Ant Design Tooltip */
                                        return isSidebarOpen ? navItem : (
                                            <Tooltip key={item.path} title={item.name} placement="right">
                                                {navItem}
                                            </Tooltip>
                                        );
                                    })}
                                </ul>
                            </div>
                        );
                    })}
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