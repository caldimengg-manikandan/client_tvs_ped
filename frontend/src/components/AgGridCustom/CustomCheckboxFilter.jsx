import React, { forwardRef, useState, useEffect, useImperativeHandle, useMemo } from 'react';
import { Search } from 'lucide-react';

const CustomCheckboxFilter = forwardRef((props, ref) => {
    const [filterText, setFilterText] = useState('');
    const [selectAll, setSelectAll] = useState(true);
    const [selectedOptions, setSelectedOptions] = useState(new Set());
    const [options, setOptions] = useState([]);

    // Extract unique values from row data whenever new rows are loaded
    useEffect(() => {
        if (!props.api) return;

        const extractUniqueValues = () => {
            const unique = new Set();
            props.api.forEachNode((node) => {
                // Use the valueGetter if available to get the formatted value or raw value
                const val = props.valueGetter ? props.valueGetter(node) : node.data[props.colDef.field];
                if (val !== null && val !== undefined && val !== '') {
                    unique.add(val);
                }
            });
            return Array.from(unique).sort();
        };

        const allOptions = extractUniqueValues();
        setOptions(allOptions);
        setSelectedOptions(new Set(allOptions)); // Default to all selected
        setSelectAll(true);
    }, [props.api, props.colDef.field, props.rowData]); // Re-run if data changes

    // Filter options based on search text - Defined BEFORE handlers to avoid ReferenceError
    const filteredOptions = useMemo(() => {
        if (!filterText) return options;
        return options.filter(opt => String(opt).toLowerCase().includes(filterText.toLowerCase()));
    }, [options, filterText]);

    // Check if "Select All" should be checked based on filtered options
    const isSelectAllChecked = useMemo(() => {
        if (filteredOptions.length === 0) return false;
        // If we represent "Select All Search Results", check if all visible are selected
        return filteredOptions.every(opt => selectedOptions.has(opt));
    }, [filteredOptions, selectedOptions]);

    // Methods exposed to AG Grid
    useImperativeHandle(ref, () => ({
        isFilterActive() {
            // Filter is active if NOT all options are selected
            // Or if selectAll is false (even if all selected manually, might be edge case)
            // Robust check: Compare selected size with total options size
            return selectedOptions.size !== options.length;
        },

        doesFilterPass(params) {
            // If all selected, pass everything (except maybe empty/null if strictly typed)
            if (selectedOptions.size === options.length) return true;

            const val = props.valueGetter ? props.valueGetter(params.node) : params.data[props.colDef.field];
            // If value is missing/empty, decide policy. Usually hide unless specifically selected (if we had an (Empty) option).
            // For now, check if the value is in selected set.
            return selectedOptions.has(val);
        },

        getModel() {
            if (selectedOptions.size === options.length) return null; // No filter
            return {
                filterType: 'custom-checkbox',
                selected: Array.from(selectedOptions),
                selectAll
            };
        },

        setModel(model) {
            if (!model) {
                setSelectAll(true);
                setSelectedOptions(new Set(options));
            } else {
                setSelectAll(model.selectAll);
                setSelectedOptions(new Set(model.selected));
            }
        },

        // This is important for some AG Grid versions to know if filter allows updates
        afterGuiAttached(params) {
            // Focus search input or something if needed
        }
    }));

    // Handle "Select All" change
    const handleSelectAllChange = (e) => {
        const checked = e.target.checked;
        setSelectAll(checked);

        if (checked) {
            // Select all visible options
            const newSelected = new Set(selectedOptions);
            filteredOptions.forEach(opt => newSelected.add(opt));
            setSelectedOptions(newSelected);
        } else {
            // Deselect all visible options
            const newSelected = new Set(selectedOptions);
            filteredOptions.forEach(opt => newSelected.delete(opt));
            setSelectedOptions(newSelected);
        }
        props.filterChangedCallback();
    };

    // Handle individual checkbox change
    const handleOptionChange = (option) => {
        const newSelected = new Set(selectedOptions);
        if (newSelected.has(option)) {
            newSelected.delete(option);
            setSelectAll(false);
        } else {
            newSelected.add(option);
            // Check if now all are selected (ignoring search for global Select All status)
            if (newSelected.size === options.length) {
                setSelectAll(true);
            }
        }
        setSelectedOptions(newSelected);
        props.filterChangedCallback();
    };

    return (
        <div className="bg-white p-3 rounded-lg shadow-xl border border-gray-200 w-64 flex flex-col max-h-[400px]">
            {/* Search Box */}
            <div className="relative mb-3">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-tvs-blue/50 focus:border-tvs-blue transition-all"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                />
            </div>

            {/* Options List */}
            <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                {/* Select All Option */}
                <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer transition-colors select-none">
                    <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-gray-300 text-tvs-blue focus:ring-tvs-blue/50"
                        checked={isSelectAllChecked}
                        onChange={handleSelectAllChange}
                    />
                    <span className="text-sm font-semibold text-gray-700">
                        {filterText ? '(Select All Search Results)' : '(Select All)'}
                    </span>
                </label>

                <div className="h-px bg-gray-100 my-1"></div>

                {filteredOptions.length > 0 ? (
                    filteredOptions.map((option, idx) => (
                        <label key={idx} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer transition-colors group select-none">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-gray-300 text-tvs-blue focus:ring-tvs-blue/50 group-hover:border-tvs-blue"
                                checked={selectedOptions.has(option)}
                                onChange={() => handleOptionChange(option)}
                            />
                            <span className="text-sm text-gray-600 group-hover:text-gray-900 truncate" title={option}>
                                {option}
                            </span>
                        </label>
                    ))
                ) : (
                    <div className="text-center py-4 text-gray-400 text-xs italic">
                        No matches found
                    </div>
                )}
            </div>

            {/* Footer / Info */}
            <div className="mt-3 pt-2 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                <span>{selectedOptions.size} selected</span>
                {filterText && <span>{filteredOptions.length} matches</span>}
            </div>
        </div>
    );
});

export default CustomCheckboxFilter;
