import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, Check, Palette, Layout, Columns3, RotateCcw } from 'lucide-react';

/* ─────────────────────────────────────────────
   HEADER GRADIENT PRESETS (16 options)
───────────────────────────────────────────── */
const HEADER_PALETTES = [
    { id: 'navy',      label: 'TVS Navy',   from: '#2d4a9a', to: '#1e3070', dot: '#253C80' },
    { id: 'midnight',  label: 'Midnight',   from: '#1e293b', to: '#0f172a', dot: '#1e293b' },
    { id: 'emerald',   label: 'Emerald',    from: '#065f46', to: '#064e3b', dot: '#059669' },
    { id: 'crimson',   label: 'Crimson',    from: '#991b1b', to: '#7f1d1d', dot: '#dc2626' },
    { id: 'violet',    label: 'Violet',     from: '#5b21b6', to: '#4c1d95', dot: '#7c3aed' },
    { id: 'teal',      label: 'Teal',       from: '#0d5c63', to: '#0a4a50', dot: '#0d9488' },
    { id: 'amber',     label: 'Amber',      from: '#92400e', to: '#78350f', dot: '#f59e0b' },
    { id: 'rose',      label: 'Rose',       from: '#9d174d', to: '#831843', dot: '#f43f5e' },
    { id: 'indigo',    label: 'Indigo',     from: '#3730a3', to: '#312e81', dot: '#6366f1' },
    { id: 'slate',     label: 'Slate',      from: '#334155', to: '#1e293b', dot: '#64748b' },
    { id: 'sky',       label: 'Sky Blue',   from: '#0369a1', to: '#075985', dot: '#0ea5e9' },
    { id: 'forest',    label: 'Forest',     from: '#14532d', to: '#052e16', dot: '#22c55e' },
    { id: 'orange',    label: 'Orange',     from: '#9a3412', to: '#7c2d12', dot: '#f97316' },
    { id: 'pink',      label: 'Hot Pink',   from: '#9d174d', to: '#701a75', dot: '#ec4899' },
    { id: 'cyan',      label: 'Cyan',       from: '#155e75', to: '#0e4f63', dot: '#06b6d4' },
    { id: 'bronze',    label: 'Bronze',     from: '#713f12', to: '#5c3208', dot: '#d97706' },
];

/* ─────────────────────────────────────────────
   ROW BACKGROUND PRESETS (10 options)
───────────────────────────────────────────── */
const ROW_BG_OPTIONS = [
    { id: 'white',    label: 'White',      odd: '#ffffff', even: '#F7F9FF', dot: '#ffffff', border: '#E4E9F2' },
    { id: 'navytint', label: 'Navy Tint',  odd: '#f7f9ff', even: '#eef2ff', dot: '#d0d9ff', border: '#c7d2fe' },
    { id: 'greentint',label: 'Green Tint', odd: '#f0fdf4', even: '#dcfce7', dot: '#bbf7d0', border: '#86efac' },
    { id: 'yellowtint',label:'Yellow Tint',odd: '#fffbeb', even: '#fef9c3', dot: '#fde68a', border: '#fcd34d' },
    { id: 'redtint',  label: 'Red Tint',   odd: '#fff1f2', even: '#ffe4e6', dot: '#fecdd3', border: '#fda4af' },
    { id: 'purpletint',label:'Purple Tint',odd: '#faf5ff', even: '#f3e8ff', dot: '#e9d5ff', border: '#d8b4fe' },
    { id: 'tealthint',label: 'Teal Tint',  odd: '#f0fdfa', even: '#ccfbf1', dot: '#99f6e4', border: '#5eead4' },
    { id: 'skytint',  label: 'Sky Tint',   odd: '#f0f9ff', even: '#e0f2fe', dot: '#bae6fd', border: '#7dd3fc' },
    { id: 'grayedge', label: 'Gray',       odd: '#fafafa', even: '#f4f4f5', dot: '#d4d4d8', border: '#a1a1aa' },
    { id: 'cream',    label: 'Cream',      odd: '#fffdf7', even: '#fef9ec', dot: '#fde68a', border: '#fcd34d' },
];

/* ─────────────────────────────────────────────
   BORDER COLOR PRESETS
───────────────────────────────────────────── */
const BORDER_COLORS = [
    { id: 'light',  label: 'Light',   color: '#EEF1F9' },
    { id: 'navy',   label: 'Navy',    color: '#c7d2fe' },
    { id: 'green',  label: 'Green',   color: '#86efac' },
    { id: 'yellow', label: 'Yellow',  color: '#fcd34d' },
    { id: 'red',    label: 'Red',     color: '#fda4af' },
    { id: 'purple', label: 'Purple',  color: '#d8b4fe' },
    { id: 'teal',   label: 'Teal',    color: '#5eead4' },
    { id: 'gray',   label: 'Gray',    color: '#d4d4d8' },
];

/* ─────────────────────────────────────────────
   ROW DENSITY OPTIONS
───────────────────────────────────────────── */
const DENSITIES = [
    { id: 'compact',     label: 'Compact',     subLabel: '32px rows', rowH: 32, headerH: 42 },
    { id: 'normal',      label: 'Normal',      subLabel: '44px rows', rowH: 44, headerH: 52 },
    { id: 'comfortable', label: 'Comfortable', subLabel: '56px rows', rowH: 56, headerH: 60 },
];

/* ─────────────────────────────────────────────
   Default states
───────────────────────────────────────────── */
const DEFAULTS = {
    palette: HEADER_PALETTES[0],
    rowBg: ROW_BG_OPTIONS[0],
    borderColor: BORDER_COLORS[0],
    stripes: true,
    borders: true,
    density: DENSITIES[1],
};

/* ─────────────────────────────────────────────
   Build scoped CSS string
───────────────────────────────────────────── */
function buildCSS(gridClass, palette, rowBg, stripes, borders, borderColor) {
    const sel = `.${gridClass}`;
    const hFrom   = palette.from;
    const hTo     = palette.to;
    const hDiv    = 'rgba(255,255,255,0.12)';
    const oddBg   = rowBg.odd;
    const evenBg  = stripes ? rowBg.even : rowBg.odd;
    const bdrClr  = borders ? borderColor.color : 'transparent';

    return `
/* ════ ColumnCustomizer overrides: .${gridClass} ════ */

/* ── Header row + ALL header cell variants — direct gradient override ── */

/* 1. The header row container itself */
.rdg${sel} .rdg-header-row {
    background: linear-gradient(180deg, ${hFrom} 0%, ${hTo} 100%) !important;
}

/* 2. Every plain header cell */
.rdg${sel} .rdg-header-row .rdg-cell {
    background: linear-gradient(180deg, ${hFrom} 0%, ${hTo} 100%) !important;
    border-right: 1px solid ${hDiv} !important;
    border-bottom: none !important;
    box-shadow: none !important;
    color: #ffffff !important;
}

/* 3. Frozen header cells (rdg-cell-frozen) */
.rdg${sel} .rdg-header-row .rdg-cell.rdg-cell-frozen {
    background: linear-gradient(180deg, ${hFrom} 0%, ${hTo} 100%) !important;
    border-right: 1px solid ${hDiv} !important;
    border-bottom: none !important;
    color: #ffffff !important;
    z-index: 10 !important;
}

/* 4. Last frozen header cell */
.rdg${sel} .rdg-header-row .rdg-cell.rdg-cell-frozen-last {
    background: linear-gradient(180deg, ${hFrom} 0%, ${hTo} 100%) !important;
    border-right: 1px solid ${hDiv} !important;
    border-bottom: none !important;
    color: #ffffff !important;
    box-shadow: 2px 0 4px rgba(0,0,0,0.18) !important;
}
.rdg${sel} .rdg-header-row .rdg-cell .rdg-cell-resize-handle {
    background: ${hDiv} !important;
}
.rdg${sel} .rdg-header-row .rdg-sort-arrow {
    fill: rgba(255,255,255,0.6) !important;
}

/* Row backgrounds */
.rdg${sel} .rdg-row {
    background-color: ${oddBg} !important;
    border-bottom: 1px solid ${bdrClr} !important;
}
.rdg${sel} .rdg-row:nth-child(even) {
    background-color: ${evenBg} !important;
}
.rdg${sel} .rdg-row:hover {
    background-color: #EEF3FF !important;
}

/* Body cell borders */
.rdg${sel} .rdg-row .rdg-cell {
    border-right: 1px solid ${bdrClr} !important;
}
`;
}

/* ─────────────────────────────────────────────
   Helper — small colour dot swatch
───────────────────────────────────────────── */
const Swatch = ({ color, size = 18, selected, onClick, shadow }) => (
    <div
        onClick={onClick}
        title={color}
        style={{
            width: size, height: size, borderRadius: '50%', cursor: 'pointer',
            background: color,
            border: selected ? '2.5px solid #6d28d9' : '2px solid rgba(0,0,0,0.1)',
            boxShadow: selected ? `0 0 0 3px ${color}55` : shadow ? `0 1px 4px ${color}66` : 'none',
            flexShrink: 0,
            transition: 'all 0.14s',
            transform: selected ? 'scale(1.18)' : 'scale(1)',
        }}
    />
);

/* ─────────────────────────────────────────────
   ColumnCustomizer Component
───────────────────────────────────────────── */
const ColumnCustomizer = ({
    columns = [],
    hiddenKeys = new Set(),
    onChange,
    lockedKeys = new Set(['serial']),
    gridClass = '',
    onDensity,
}) => {
    const [open, setOpen]           = useState(false);
    const [tab, setTab]             = useState('columns');
    const [palette, setPalette]     = useState(DEFAULTS.palette);
    const [rowBg, setRowBg]         = useState(DEFAULTS.rowBg);
    const [borderColor, setBorderColor] = useState(DEFAULTS.borderColor);
    const [stripes, setStripes]     = useState(DEFAULTS.stripes);
    const [borders, setBorders]     = useState(DEFAULTS.borders);
    const [density, setDensity]     = useState(DEFAULTS.density);
    const ref = useRef(null);

    /* Close on outside click */
    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    /* Inject/update scoped CSS whenever settings change */
    useEffect(() => {
        if (!gridClass) return;
        const id = `__cc_${gridClass}__`;
        let el = document.getElementById(id);
        if (!el) {
            el = document.createElement('style');
            el.id = id;
            document.head.appendChild(el);
        }
        el.textContent = buildCSS(gridClass, palette, rowBg, stripes, borders, borderColor);
    }, [gridClass, palette, rowBg, stripes, borders, borderColor]);

    /* Notify parent of density change */
    useEffect(() => {
        if (onDensity) onDensity({ rowH: density.rowH, headerH: density.headerH });
    }, [density]);

    /* Reset all to defaults */
    const handleReset = () => {
        setPalette(DEFAULTS.palette);
        setRowBg(DEFAULTS.rowBg);
        setBorderColor(DEFAULTS.borderColor);
        setStripes(DEFAULTS.stripes);
        setBorders(DEFAULTS.borders);
        setDensity(DEFAULTS.density);
    };

    /* Column helpers */
    const toggle = (key) => {
        if (lockedKeys.has(key)) return;
        const next = new Set(hiddenKeys);
        next.has(key) ? next.delete(key) : next.add(key);
        onChange(next);
    };
    const showAll = () => onChange(new Set());

    const visibleCount    = columns.filter(c => !hiddenKeys.has(c.key) && !lockedKeys.has(c.key)).length;
    const totalToggleable = columns.filter(c => !lockedKeys.has(c.key)).length;

    /* ── Shared style helpers ── */
    const btnBase = {
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '7px 14px', borderRadius: 10, cursor: 'pointer',
        fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
        transition: 'all 0.15s',
    };
    const tabBtn = (active) => ({
        flex: 1, padding: '7px 4px', borderRadius: 8, cursor: 'pointer',
        border: 'none', fontSize: 11, fontWeight: 700,
        background: active ? '#fff' : 'transparent',
        color: active ? '#6d28d9' : '#71717a',
        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.09)' : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        transition: 'all 0.12s',
    });
    const togglePill = (active) => ({
        width: 38, height: 22, borderRadius: 99, cursor: 'pointer',
        background: active ? '#7c3aed' : '#d4d4d8',
        position: 'relative', flexShrink: 0,
        transition: 'background 0.2s',
    });
    const pillDot = (active) => ({
        position: 'absolute', top: 3, borderRadius: '50%',
        width: 16, height: 16, background: '#fff',
        left: active ? 19 : 3,
        transition: 'left 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    });

    /* ── Section label ── */
    const SectionLabel = ({ children }) => (
        <p style={{ fontSize: 10, fontWeight: 800, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, marginTop: 2 }}>
            {children}
        </p>
    );

    /* ── Toggle row ── */
    const ToggleRow = ({ label, sub, on, set }) => (
        <label style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '8px 12px', borderRadius: 10,
            background: on ? '#f5f3ff' : '#f9f9fb',
            border: `1px solid ${on ? '#ddd6fe' : '#e4e4e7'}`,
            cursor: 'pointer', marginBottom: 6,
        }}>
            <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#27272a' }}>{label}</div>
                {sub && <div style={{ fontSize: 10, color: '#71717a' }}>{sub}</div>}
            </div>
            <div onClick={() => set(v => !v)} style={togglePill(on)}>
                <div style={pillDot(on)} />
            </div>
        </label>
    );

    return (
        <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>

            {/* ── Trigger button ── */}
            <button
                onClick={() => setOpen(o => !o)}
                title="Customize columns, colors & layout"
                style={{
                    ...btnBase,
                    background: open ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : '#fff',
                    border: open ? '1px solid #7c3aed' : '1px solid #d4d4d8',
                    color: open ? '#fff' : '#3f3f46',
                    boxShadow: open ? '0 2px 12px rgba(124,58,237,0.3)' : '0 1px 4px rgba(0,0,0,0.07)',
                }}
            >
                <SlidersHorizontal size={13} />
                Customize
                {hiddenKeys.size > 0 && (
                    <span style={{
                        background: open ? 'rgba(255,255,255,0.28)' : '#7c3aed',
                        color: '#fff', borderRadius: 99,
                        fontSize: 10, fontWeight: 900, padding: '1px 7px',
                        marginLeft: 2, lineHeight: 1.5,
                    }}>
                        {hiddenKeys.size} hidden
                    </span>
                )}
            </button>

            {/* ── Panel ── */}
            {open && (
                <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                    zIndex: 9999, width: 290,
                    background: '#fff', borderRadius: 16,
                    border: '1px solid #e4e4e7',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                    overflow: 'hidden',
                    animation: 'fp-in 0.14s ease',
                }}>

                    {/* Panel header */}
                    <div style={{
                        padding: '11px 14px 9px',
                        background: 'linear-gradient(135deg,#faf5ff,#f3e8ff)',
                        borderBottom: '1px solid #f0e8ff',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6d28d9', fontWeight: 800, fontSize: 13 }}>
                            <SlidersHorizontal size={14} />
                            Customize Table
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button onClick={handleReset} title="Reset to defaults" style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: '#a1a1aa', display: 'flex', alignItems: 'center',
                                padding: '1px 4px',
                            }}>
                                <RotateCcw size={13} />
                            </button>
                            <button onClick={() => setOpen(false)} style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: '#a1a1aa', fontSize: 18, lineHeight: 1, padding: '0 2px',
                            }}>×</button>
                        </div>
                    </div>

                    {/* Tab switcher */}
                    <div style={{
                        display: 'flex', gap: 4, padding: '7px 10px',
                        background: '#f9f9fb', borderBottom: '1px solid #f0f0f5',
                    }}>
                        <button style={tabBtn(tab === 'columns')} onClick={() => setTab('columns')}>
                            <Columns3 size={11} /> Columns
                        </button>
                        <button style={tabBtn(tab === 'colors')} onClick={() => setTab('colors')}>
                            <Palette size={11} /> Colors
                        </button>
                        <button style={tabBtn(tab === 'layout')} onClick={() => setTab('layout')}>
                            <Layout size={11} /> Layout
                        </button>
                    </div>

                    {/* ═══════════ COLUMNS TAB ═══════════ */}
                    {tab === 'columns' && (
                        <>
                            {hiddenKeys.size > 0 && (
                                <div style={{ padding: '6px 14px 2px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button onClick={showAll} style={{
                                        fontSize: 10, fontWeight: 700, color: '#6d28d9',
                                        cursor: 'pointer', border: 'none', background: 'transparent',
                                        textDecoration: 'underline',
                                    }}>Show All</button>
                                </div>
                            )}
                            <div style={{ maxHeight: 280, overflowY: 'auto', padding: '4px 0' }}>
                                {columns.map(col => {
                                    const isLocked = lockedKeys.has(col.key);
                                    const isHidden = hiddenKeys.has(col.key);
                                    return (
                                        <div
                                            key={col.key}
                                            onClick={() => toggle(col.key)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 10,
                                                padding: '7px 14px',
                                                cursor: isLocked ? 'default' : 'pointer',
                                                background: isHidden ? '#faf5ff' : 'transparent',
                                                opacity: isLocked ? 0.45 : 1,
                                            }}
                                            onMouseEnter={e => { if (!isLocked) e.currentTarget.style.background = '#f5f3ff'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = isHidden ? '#faf5ff' : 'transparent'; }}
                                        >
                                            <div style={{
                                                width: 15, height: 15, borderRadius: 4, flexShrink: 0,
                                                border: !isHidden ? '2px solid #7c3aed' : '2px solid #d4d4d8',
                                                background: !isHidden ? '#7c3aed' : '#fff',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                transition: 'all 0.12s',
                                            }}>
                                                {!isHidden && <Check size={9} color="#fff" strokeWidth={3} />}
                                            </div>
                                            <span style={{
                                                fontSize: 11, fontWeight: 600,
                                                color: isHidden ? '#a1a1aa' : '#27272a',
                                                textTransform: 'uppercase', letterSpacing: '0.04em',
                                                textDecoration: isHidden ? 'line-through' : 'none',
                                                flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            }}>
                                                {col.name}
                                            </span>
                                            {isLocked && <span style={{ fontSize: 9, color: '#a1a1aa', fontStyle: 'italic' }}>locked</span>}
                                        </div>
                                    );
                                })}
                            </div>
                            <div style={{
                                padding: '8px 14px', borderTop: '1px solid #f4f4f5',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                background: '#fafafa', fontSize: 11, color: '#71717a',
                            }}>
                                <span><strong style={{ color: '#27272a' }}>{visibleCount}</strong> / {totalToggleable} visible</span>
                                <button onClick={() => setOpen(false)} style={{
                                    background: '#7c3aed', color: '#fff', border: 'none',
                                    borderRadius: 8, padding: '4px 14px', fontSize: 11,
                                    fontWeight: 700, cursor: 'pointer',
                                }}>Done</button>
                            </div>
                        </>
                    )}

                    {/* ═══════════ COLORS TAB ═══════════ */}
                    {tab === 'colors' && (
                        <div style={{ padding: '12px 14px 10px', maxHeight: 420, overflowY: 'auto' }}>

                            {/* ── Header Color ── */}
                            <SectionLabel>Header Colour</SectionLabel>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7, marginBottom: 14 }}>
                                {HEADER_PALETTES.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setPalette(p)}
                                        title={p.label}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                                            padding: '7px 4px', borderRadius: 10, cursor: 'pointer',
                                            border: palette.id === p.id ? `2px solid ${p.dot}` : '2px solid transparent',
                                            background: palette.id === p.id ? `${p.dot}18` : '#f9f9fb',
                                            transition: 'all 0.12s',
                                        }}
                                    >
                                        <div style={{
                                            width: 36, height: 20, borderRadius: 6,
                                            background: `linear-gradient(135deg, ${p.from}, ${p.to})`,
                                            boxShadow: palette.id === p.id ? `0 2px 8px ${p.dot}55` : '0 1px 3px rgba(0,0,0,0.12)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            {palette.id === p.id && <Check size={10} color="#fff" strokeWidth={3} />}
                                        </div>
                                        <span style={{ fontSize: 8.5, fontWeight: 700, color: '#52525b', letterSpacing: '0.02em', textAlign: 'center', lineHeight: 1.2 }}>
                                            {p.label}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* ── Row Background Colour ── */}
                            <SectionLabel>Row Background</SectionLabel>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 6, marginBottom: 14 }}>
                                {ROW_BG_OPTIONS.map(rb => (
                                    <button
                                        key={rb.id}
                                        onClick={() => setRowBg(rb)}
                                        title={rb.label}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                                            padding: '6px 2px', borderRadius: 8, cursor: 'pointer',
                                            border: rowBg.id === rb.id ? `2px solid #7c3aed` : '2px solid transparent',
                                            background: rowBg.id === rb.id ? '#f5f3ff' : '#f9f9fb',
                                            transition: 'all 0.12s',
                                        }}
                                    >
                                        {/* Odd/even preview strips */}
                                        <div style={{ width: 32, borderRadius: 4, overflow: 'hidden', border: '1px solid #e4e4e7' }}>
                                            <div style={{ height: 8, background: rb.odd }} />
                                            <div style={{ height: 8, background: rb.even }} />
                                            <div style={{ height: 8, background: rb.odd }} />
                                        </div>
                                        <span style={{ fontSize: 8, fontWeight: 700, color: '#52525b', textAlign: 'center', lineHeight: 1.2 }}>
                                            {rb.label}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* ── Border Colour ── */}
                            <SectionLabel>Border Colour</SectionLabel>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
                                {BORDER_COLORS.map(bc => (
                                    <button
                                        key={bc.id}
                                        onClick={() => setBorderColor(bc)}
                                        title={bc.label}
                                        style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                                            padding: '5px 6px', borderRadius: 8, cursor: 'pointer',
                                            border: borderColor.id === bc.id ? `2px solid #7c3aed` : '2px solid transparent',
                                            background: borderColor.id === bc.id ? '#f5f3ff' : '#f9f9fb',
                                            transition: 'all 0.12s',
                                        }}
                                    >
                                        <Swatch color={bc.color} size={16} selected={borderColor.id === bc.id} shadow />
                                        <span style={{ fontSize: 8, fontWeight: 700, color: '#52525b' }}>{bc.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* ── Row Style toggles ── */}
                            <SectionLabel>Row Style</SectionLabel>
                            <ToggleRow label="Zebra Stripes" sub="Alternate row shading" on={stripes} set={setStripes} />
                            <ToggleRow label="Cell Borders"  sub="Hairline dividers"      on={borders} set={setBorders} />

                            <div style={{ borderTop: '1px solid #f4f4f5', marginTop: 10, paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <button onClick={handleReset} style={{
                                    background: 'none', border: '1px solid #e4e4e7', borderRadius: 8,
                                    padding: '4px 12px', fontSize: 11, fontWeight: 600,
                                    color: '#71717a', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: 4,
                                }}>
                                    <RotateCcw size={11} /> Reset
                                </button>
                                <button onClick={() => setOpen(false)} style={{
                                    background: '#7c3aed', color: '#fff', border: 'none',
                                    borderRadius: 8, padding: '5px 16px', fontSize: 11,
                                    fontWeight: 700, cursor: 'pointer',
                                }}>Apply</button>
                            </div>
                        </div>
                    )}

                    {/* ═══════════ LAYOUT TAB ═══════════ */}
                    {tab === 'layout' && (
                        <div style={{ padding: '12px 14px 10px' }}>
                            <SectionLabel>Row Density</SectionLabel>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                                {DENSITIES.map(d => (
                                    <button
                                        key={d.id}
                                        onClick={() => setDensity(d)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 12,
                                            padding: '10px 14px', borderRadius: 12, cursor: 'pointer',
                                            border: density.id === d.id ? '2px solid #7c3aed' : '2px solid #e4e4e7',
                                            background: density.id === d.id ? '#faf5ff' : '#fdfdfd',
                                            transition: 'all 0.12s', textAlign: 'left', width: '100%',
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: d.id === 'compact' ? 2 : d.id === 'normal' ? 4 : 7 }}>
                                            {[0,1,2].map(i => (
                                                <div key={i} style={{
                                                    width: 28,
                                                    height: d.id === 'compact' ? 4 : d.id === 'normal' ? 5 : 7,
                                                    borderRadius: 2,
                                                    background: density.id === d.id ? '#7c3aed' : '#d4d4d8',
                                                    opacity: i === 0 ? 0.5 : 1,
                                                }} />
                                            ))}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: density.id === d.id ? '#5b21b6' : '#27272a' }}>
                                                {d.label}
                                            </div>
                                            <div style={{ fontSize: 10, color: '#71717a' }}>{d.subLabel}</div>
                                        </div>
                                        {density.id === d.id && (
                                            <div style={{ marginLeft: 'auto' }}>
                                                <Check size={14} color="#7c3aed" strokeWidth={3} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Live preview strip */}
                            <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e4e4e7', marginBottom: 12 }}>
                                <div style={{
                                    background: `linear-gradient(180deg, ${palette.from}, ${palette.to})`,
                                    padding: '0 12px', height: density.headerH * 0.7,
                                    display: 'flex', alignItems: 'center',
                                }}>
                                    <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        Column Header
                                    </span>
                                </div>
                                {[0,1,2].map(i => (
                                    <div key={i} style={{
                                        padding: '0 12px', height: density.rowH * 0.65,
                                        display: 'flex', alignItems: 'center',
                                        background: stripes && i % 2 === 1 ? rowBg.even : rowBg.odd,
                                        borderBottom: borders && i < 2 ? `1px solid ${borderColor.color}` : 'none',
                                    }}>
                                        <span style={{ fontSize: 9, color: '#71717a' }}>Row {i + 1}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ borderTop: '1px solid #f4f4f5', paddingTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={() => setOpen(false)} style={{
                                    background: '#7c3aed', color: '#fff', border: 'none',
                                    borderRadius: 8, padding: '5px 16px', fontSize: 11,
                                    fontWeight: 700, cursor: 'pointer',
                                }}>Apply</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ColumnCustomizer;
