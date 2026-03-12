import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Pagination = ({ 
    currentPage, 
    totalPages, 
    onPageChange, 
    totalItems, 
    itemsPerPage = 7,
    loading = false 
}) => {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        
        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            let start = Math.max(1, currentPage - 2);
            let end = Math.min(totalPages, start + maxVisiblePages - 1);
            
            if (end === totalPages) {
                start = Math.max(1, end - maxVisiblePages + 1);
            }
            
            for (let i = start; i <= end; i++) pages.push(i);
        }
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 bg-white border-t border-gray-100/80 transition-all">
            <div className="text-xs text-slate-500 font-bold tracking-tight">
                Showing <span className="text-tvs-blue bg-tvs-blue/5 px-2 py-0.5 rounded">{startItem}</span> to <span className="text-tvs-blue bg-tvs-blue/5 px-2 py-0.5 rounded">{endItem}</span> of <span className="text-slate-900 font-extrabold">{totalItems}</span> records
            </div>

            <div className="flex items-center gap-2">
                {/* Previous Page */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-slate-200 transition-all duration-300 font-bold text-[11px] shadow-sm active:scale-95"
                >
                    <ChevronLeft size={14} strokeWidth={3} />
                    <span>PREVIOUS</span>
                </button>

                <div className="flex items-center gap-1.5 mx-2">
                    {getPageNumbers().map(page => (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            disabled={loading}
                            className={`min-w-[36px] h-9 px-3 rounded-xl text-xs font-black transition-all duration-300 border ${
                                currentPage === page
                                    ? 'bg-tvs-blue text-white border-tvs-blue shadow-[0_4px_12px_rgba(37,60,128,0.25)] scale-110 z-10'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-sm'
                            }`}
                        >
                            {page}
                        </button>
                    ))}
                </div>

                {/* Next Page */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-slate-200 transition-all duration-300 font-bold text-[11px] shadow-sm active:scale-95"
                >
                    <span>NEXT</span>
                    <ChevronRight size={14} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
