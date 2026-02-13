import React, { useEffect, useRef, useState } from 'react';
import { Filter } from 'lucide-react';

const CustomHeader = (props) => {
    const [ascSort, setAscSort] = useState('inactive');
    const [descSort, setDescSort] = useState('inactive');
    const [filterActive, setFilterActive] = useState(false);
    const refButton = useRef(null);

    const onMenuClicked = (e) => {
        e.stopPropagation();
        props.showColumnMenu(refButton.current);
    };

    const onSortChanged = () => {
        setAscSort(props.column.isSortAscending() ? 'active' : 'inactive');
        setDescSort(props.column.isSortDescending() ? 'active' : 'inactive');
    };

    const onFilterChanged = () => {
        setFilterActive(props.column.isFilterActive());
    };

    useEffect(() => {
        props.column.addEventListener('sortChanged', onSortChanged);
        props.column.addEventListener('filterChanged', onFilterChanged);
        onSortChanged();
        onFilterChanged();

        return () => {
            props.column.removeEventListener('sortChanged', onSortChanged);
            props.column.removeEventListener('filterChanged', onFilterChanged);
        };
    }, []);

    return (
        <div className="flex items-center w-full h-full">
            {/* Click on name/sort area triggers sort */}
            <div
                className="flex items-center flex-1 cursor-pointer overflow-hidden gap-1"
                onClick={(event) => props.progressSort(event.shiftKey)}
            >
                <span className="truncate font-bold text-gray-700 text-xs sm:text-sm uppercase tracking-wide">
                    {props.displayName}
                </span>

                {/* Sort Icons */}
                {ascSort === 'active' && (
                    <span className="ag-icon ag-icon-asc text-tvs-blue text-xs ml-1"></span>
                )}
                {descSort === 'active' && (
                    <span className="ag-icon ag-icon-desc text-tvs-blue text-xs ml-1"></span>
                )}
                {/* If no sort, we can show a subtle placeholder or nothing. Standard AG Grid shows nothing. */}
            </div>

            {/* Filter Icon - Always visible as requested "Excel-style checkbox filter icon" usually implies the dropdown arrow/funnel */}
            <div
                ref={refButton}
                className={`ml-2 p-1 rounded cursor-pointer transition-colors ${filterActive ? 'text-tvs-blue bg-blue-50' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                onClick={onMenuClicked}
            >
                {/* Using Lucide Filter icon for a modern look, or we can use ag-icon-filter */}
                <Filter size={14} strokeWidth={filterActive ? 2.5 : 2} fill={filterActive ? "currentColor" : "none"} />
            </div>
        </div>
    );
};

export default CustomHeader;
