import React, { useState, useRef, useEffect } from 'react';
import { Columns3, Rows3 } from 'lucide-react';

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
 *   frozenRowCount     — number of rows currently frozen
 *   setFrozenRowCount  — setter for frozenRowCount
 *   maxRows            — maximum rows that can be frozen (default 10)
 */
const FreezeToolbar = ({
    columns = [],
    frozenKeys = new Set(),
    onApply,
    frozenRowCount = 0,
    setFrozenRowCount,
    maxRows = 10,
}) => {
    /* ── Column freeze state ── */
    const [colOpen, setColOpen] = useState(false);
    const [draft, setDraft] = useState(new Set(frozenKeys));
    const colRef = useRef(null);

    /* ── Row freeze state ── */
    const [rowOpen, setRowOpen] = useState(false);
    const [rowDraft, setRowDraft] = useState(frozenRowCount);
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
    useEffect(() => { if (rowOpen) setRowDraft(frozenRowCount); }, [rowOpen]);

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

    /* ── Row helpers ── */
    const clampRow = (v) => Math.max(0, Math.min(maxRows, v));
    const handleRowApply = () => {
        setFrozenRowCount(rowDraft);
        setRowOpen(false);
    };
    const handleRowClear = () => {
        setRowDraft(0);
        setFrozenRowCount(0);
        setRowOpen(false);
    };

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
                    {frozenRowCount > 0 && (
                        <span className="ml-1 bg-[#1a3c6e] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                            {frozenRowCount}
                        </span>
                    )}
                </button>

                {rowOpen && (
                    <div className="absolute left-0 top-[calc(100%+6px)] z-[999] w-64 bg-white rounded-xl shadow-2xl border border-[#cdd9e8] overflow-hidden"
                        style={{ animation: 'fp-in 0.15s ease' }}>
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                            <div className="flex items-center gap-2 text-[#1a3c6e] font-bold text-sm">
                                <Rows3 size={15} strokeWidth={2.5} />
                                <span>Freeze Rows</span>
                            </div>
                            <button type="button" onClick={() => setRowOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                        </div>

                        {/* Row stepper */}
                        <div className="px-6 py-6">
                            <p className="text-[11px] text-gray-500 font-semibold mb-4 uppercase tracking-wide">
                                Number of rows to freeze from top
                            </p>
                            <div className="flex items-center justify-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => setRowDraft(v => clampRow(v - 1))}
                                    disabled={rowDraft === 0}
                                    className="w-9 h-9 rounded-lg border-2 border-[#c8d6e8] flex items-center justify-center text-[#1a3c6e] font-black text-lg hover:bg-[#f0f5fb] hover:border-[#1a3c6e] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    −
                                </button>
                                <div className="flex flex-col items-center">
                                    <span className="text-3xl font-black text-[#1a3c6e] leading-none">{rowDraft}</span>
                                    <span className="text-[10px] text-gray-400 mt-1">rows frozen</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setRowDraft(v => clampRow(v + 1))}
                                    disabled={rowDraft >= maxRows}
                                    className="w-9 h-9 rounded-lg border-2 border-[#c8d6e8] flex items-center justify-center text-[#1a3c6e] font-black text-lg hover:bg-[#f0f5fb] hover:border-[#1a3c6e] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    +
                                </button>
                            </div>

                            {/* Quick-select pills */}
                            <div className="flex items-center justify-center gap-2 mt-5">
                                {[0, 1, 2, 3, 5].filter(n => n <= maxRows).map(n => (
                                    <button
                                        key={n}
                                        type="button"
                                        onClick={() => setRowDraft(n)}
                                        className={`text-[11px] font-bold px-2.5 py-1 rounded-md border transition-all
                                            ${rowDraft === n
                                                ? 'bg-[#1a3c6e] text-white border-[#1a3c6e]'
                                                : 'bg-white text-gray-500 border-gray-200 hover:border-[#1a3c6e] hover:text-[#1a3c6e]'
                                            }`}
                                    >
                                        {n === 0 ? 'None' : n}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
                            <button type="button" onClick={handleRowClear}
                                className="text-[12px] font-semibold text-gray-500 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all border border-transparent hover:border-red-100">
                                Clear
                            </button>
                            <button type="button" onClick={handleRowApply}
                                className="text-[12px] font-black text-white bg-[#1a3c6e] hover:bg-[#16325e] px-6 py-1.5 rounded-lg transition-all shadow-sm hover:shadow-md">
                                Apply
                            </button>
                        </div>
                    </div>
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

export default FreezeToolbar;