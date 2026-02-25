import React, { useState, useRef, useEffect } from 'react';
import { Columns3, Rows3, ArrowRight } from 'lucide-react';

/**
 * FreezeToolbar
 *
 * Provides two freeze controls side-by-side:
 *   1. Freeze Columns — dropdown with per-column checkboxes
 *   2. Freeze Rows    — dropdown with a +/- row count stepper
 *
 * Props:
 *   columns            — array of { key, name } for all grid columns (excluding 'serial')
 *   frozenKeys         — Set of column keys currently frozen
 *   onApply(newSet)    — called when user clicks Apply on column panel
 *   frozenRowCount     — number of rows currently frozen (can be number or {start, end})
 *   setFrozenRowCount  — setter for frozenRowCount
 *   maxRows            — maximum rows that can be frozen (default 50)
 */
const FreezeToolbar = ({
    columns = [],
    frozenKeys = new Set(),
    onApply,
    frozenRowCount = 0,
    setFrozenRowCount,
    maxRows = 50,
}) => {
    /* ── Column freeze state ── */
    const [colOpen, setColOpen] = useState(false);
    const [draft, setDraft] = useState(new Set(frozenKeys));
    const colRef = useRef(null);

    /* ── Row freeze state ── */
    const [rowOpen, setRowOpen] = useState(false);
    const rowRef = useRef(null);

    /* ── Close on outside click ── */
    useEffect(() => {
        const handler = (e) => {
            if (colRef.current && !colRef.current.contains(e.target)) setColOpen(false);
            if (rowRef.current && !rowRef.current.contains(e.target)) setRowOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    /* ── Sync draft when panels open ── */
    useEffect(() => { if (colOpen) setDraft(new Set(frozenKeys)); }, [colOpen]);

    /* ── Column helpers ── */
    const toggleDraft = (key) => {
        setDraft(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };
    const handleColClear = () => setDraft(new Set());
    const handleColApply = () => { onApply(draft); setColOpen(false); };

    const frozenColCount = frozenKeys.size;

    return (
        <div className="flex items-center gap-2" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

            {/* ═══════════════ FREEZE COLUMNS BUTTON ═══════════════ */}
            <div className="relative inline-block" ref={colRef}>
                <button
                    type="button"
                    onClick={() => { setColOpen(o => !o); setRowOpen(false); }}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold
                        transition-all duration-150 shadow-sm
                        ${colOpen
                            ? 'bg-[#1a3c6e] text-white border-[#1a3c6e] shadow-md'
                            : 'bg-white text-[#1a3c6e] border-[#c8d6e8] hover:bg-[#f0f5fb] hover:border-[#1a3c6e]'
                        }
                    `}
                >
                    <Columns3 size={16} strokeWidth={2.2} />
                    <span>Freeze Columns</span>
                    {frozenColCount > 0 && (
                        <span className="ml-1 bg-[#1a3c6e] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                            {frozenColCount}
                        </span>
                    )}
                </button>

                {colOpen && (
                    <div className="absolute left-0 top-[calc(100%+6px)] z-[999] w-64 bg-white rounded-xl shadow-2xl border border-[#cdd9e8] overflow-hidden"
                        style={{ animation: 'fp-in 0.15s ease' }}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                            <div className="flex items-center gap-2 text-[#1a3c6e] font-bold text-sm">
                                <Columns3 size={15} strokeWidth={2.5} />
                                <span>Freeze Columns</span>
                            </div>
                            <button type="button" onClick={() => setColOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>

                        {/* Always-frozen S.No */}
                        <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
                            <label className="flex items-center gap-3 cursor-default">
                                <div className="w-4 h-4 rounded border-2 border-[#1a3c6e] bg-[#1a3c6e] flex items-center justify-center flex-shrink-0">
                                    <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                        <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <span className="text-[12px] text-gray-400 italic font-medium">S.no (always frozen)</span>
                            </label>
                        </div>

                        {/* Scrollable column list */}
                        <div className="max-h-52 overflow-y-auto py-1" style={{ scrollbarWidth: 'thin' }}>
                            {columns.map((col) => {
                                const checked = draft.has(col.key);
                                return (
                                    <label key={col.key}
                                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f4f8ff] cursor-pointer transition-colors"
                                        onClick={(e) => { e.preventDefault(); toggleDraft(col.key); }}>
                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors
                                            ${checked ? 'bg-[#1a3c6e] border-[#1a3c6e]' : 'bg-white border-gray-300'}`}>
                                            {checked && (
                                                <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                                                    <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-[12px] font-semibold text-gray-700 uppercase tracking-wide truncate">
                                            {col.name}
                                        </span>
                                    </label>
                                );
                            })}
                            {columns.length === 0 && (
                                <div className="px-4 py-3 text-xs text-gray-400 text-center">No columns available</div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
                            <button type="button" onClick={handleColClear}
                                className="text-[12px] font-semibold text-gray-500 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all border border-transparent hover:border-red-100">
                                Clear All
                            </button>
                            <button type="button" onClick={handleColApply}
                                className="text-[12px] font-black text-white bg-[#1a3c6e] hover:bg-[#16325e] px-6 py-1.5 rounded-lg transition-all shadow-sm hover:shadow-md">
                                Apply
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══════════════ FREEZE ROWS BUTTON ═══════════════ */}
            <div className="relative inline-block" ref={rowRef}>
                <button
                    type="button"
                    onClick={() => { setRowOpen(o => !o); setColOpen(false); }}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold
                        transition-all duration-150 shadow-sm
                        ${rowOpen
                            ? 'bg-[#1a3c6e] text-white border-[#1a3c6e] shadow-md'
                            : 'bg-white text-[#1a3c6e] border-[#c8d6e8] hover:bg-[#f0f5fb] hover:border-[#1a3c6e]'
                        }
                    `}
                >
                    <Rows3 size={16} strokeWidth={2.2} />
                    <span>Freeze Rows</span>
                    {((typeof frozenRowCount === 'number' && frozenRowCount > 0) || (typeof frozenRowCount === 'object' && frozenRowCount !== null && frozenRowCount.end > 0)) && (
                        <span className="ml-1 bg-[#1a3c6e] text-white text-[10px] font-black px-2 py-0.5 rounded-full leading-none">
                            {typeof frozenRowCount === 'number' ? frozenRowCount : `${frozenRowCount.start}-${frozenRowCount.end}`}
                        </span>
                    )}
                </button>

                {rowOpen && (
                    <FreezeRowDropdown 
                        initialValue={frozenRowCount}
                        maxRows={maxRows}
                        onApply={(val) => { setFrozenRowCount(val); setRowOpen(false); }}
                        onClose={() => setRowOpen(false)}
                    />
                )}
            </div>

            <style>{`
                @keyframes fp-in {
                    from { opacity: 0; transform: translateY(-6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

const FreezeRowDropdown = ({ initialValue, maxRows, onApply, onClose }) => {
    // Mode can be 'top' (Standard) or 'range' (Custom)
    const initialMode = (typeof initialValue === 'object' && initialValue !== null) ? 'range' : 'top';
    const [mode, setMode] = useState(initialMode);
    
    // Use strings for drafts to allow empty inputs while typing
    const [topDraft, setTopDraft] = useState(String(typeof initialValue === 'number' ? initialValue : 0));
    const [rangeStart, setRangeStart] = useState(String(typeof initialValue === 'object' && initialValue !== null ? initialValue.start : 1));
    const [rangeEnd, setRangeEnd] = useState(String(typeof initialValue === 'object' && initialValue !== null ? initialValue.end : 1));

    const handleApply = () => {
        if (mode === 'top') {
            const val = Math.max(0, Math.min(maxRows, parseInt(topDraft, 10) || 0));
            onApply(val);
        } else {
            const sNum = parseInt(rangeStart, 10) || 1;
            const eNum = parseInt(rangeEnd, 10) || sNum;
            
            const start = Math.max(1, Math.min(maxRows, sNum));
            const end = Math.max(start, Math.min(maxRows, eNum));
            
            onApply({ start, end });
        }
    };

    const handleClear = () => {
        onApply(0);
    };

    return (
        <div className="absolute left-0 top-[calc(100%+6px)] z-[999] w-72 bg-white rounded-xl shadow-2xl border border-[#cdd9e8] overflow-hidden"
            style={{ animation: 'fp-in 0.15s ease' }}>
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2 text-[#1a3c6e] font-bold text-sm">
                    <Rows3 size={15} strokeWidth={2.5} />
                    <span>Freeze Rows</span>
                </div>
                <button type="button" onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex p-2 bg-gray-50/50 border-b border-gray-100">
                <button 
                    onClick={() => setMode('top')}
                    className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all
                        ${mode === 'top' ? 'bg-white text-[#1a3c6e] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    From Top
                </button>
                <button 
                    onClick={() => setMode('range')}
                    className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all
                        ${mode === 'range' ? 'bg-white text-[#1a3c6e] shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Specific Range
                </button>
            </div>

            <div className="px-6 py-6 font-sans">
                {mode === 'top' ? (
                    <>
                        <p className="text-[11px] text-gray-500 font-bold mb-5 uppercase tracking-wider text-center">
                            Number of rows from top
                        </p>
                        <div className="flex flex-col items-center gap-3">
                            <div className="relative group">
                                <input
                                    type="number"
                                    value={topDraft}
                                    onChange={(e) => setTopDraft(e.target.value)}
                                    className="w-32 h-14 text-center text-3xl font-black text-[#1a3c6e] bg-[#f8fafc] border-2 border-[#cdd9e8] rounded-xl outline-none focus:border-[#1a3c6e] focus:ring-4 focus:ring-[#1a3c6e]/5 transition-all shadow-inner"
                                    placeholder="0"
                                />
                            </div>
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Rows Frozen</span>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
                            {[0, 5, 10, 20, 50].filter(n => n <= maxRows).map(n => (
                                <button key={n} type="button" onClick={() => setTopDraft(String(n))}
                                    className={`text-[11px] font-bold px-3 py-1 rounded-md border transition-all
                                        ${topDraft === String(n) ? 'bg-[#1a3c6e] text-white border-[#1a3c6e]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#1a3c6e]'}`}
                                >
                                    {n === 0 ? 'None' : n}
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-[11px] text-gray-500 font-bold mb-5 uppercase tracking-wider text-center">
                            Select specific row range
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[9px] font-black text-gray-400 uppercase">From</span>
                                <input
                                    type="number"
                                    value={rangeStart}
                                    onChange={(e) => setRangeStart(e.target.value)}
                                    className="w-20 h-12 text-center text-xl font-black text-[#1a3c6e] bg-[#f8fafc] border-2 border-[#cdd9e8] rounded-lg outline-none focus:border-[#1a3c6e] transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
                                />
                            </div>
                            <div className="pt-4 text-gray-300">
                                <ArrowRight size={16} strokeWidth={3} />
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <span className="text-[9px] font-black text-gray-400 uppercase">To</span>
                                <input
                                    type="number"
                                    value={rangeEnd}
                                    onChange={(e) => setRangeEnd(e.target.value)}
                                    className="w-20 h-12 text-center text-xl font-black text-[#1a3c6e] bg-[#f8fafc] border-2 border-[#cdd9e8] rounded-lg outline-none focus:border-[#1a3c6e] transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none shadow-inner"
                                />
                            </div>
                        </div>
                        <div className="mt-6 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                             <p className="text-[10px] text-blue-700 font-medium text-center">
                                Rows <span className="font-bold">{rangeStart} to {rangeEnd}</span> will be pinned to the top.
                             </p>
                        </div>
                    </>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
                <button type="button" onClick={handleClear}
                    className="text-[12px] font-semibold text-gray-500 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all border border-transparent hover:border-red-100">
                    Clear
                </button>
                <button type="button" onClick={handleApply}
                    className="text-[12px] font-black text-white bg-[#1a3c6e] hover:bg-[#16325e] px-6 py-1.5 rounded-lg transition-all shadow-sm hover:shadow-md">
                    Apply
                </button>
            </div>
        </div>
    );
};

export default FreezeToolbar;