import React, { forwardRef, useState, useEffect, useImperativeHandle, useMemo } from 'react';
import { Search } from 'lucide-react';

const getValueFromRowNode = (node, { api, column, context, colDef, valueGetter }) => {
    if (!node) return null;

    let val = null;

    if (valueGetter) {
        val = valueGetter({
            data: node.data,
            node,
            api,
            column,
            colDef,
            context
        });
    } else if (colDef && colDef.field && node.data) {
        val = node.data[colDef.field];
    } else if (column && node.data) {
        const field = column.getColDef().field;
        if (field) {
            val = node.data[field];
        }
    }

    if (typeof val === 'object' && val !== null) {
        if (val.name) val = val.name;
        else if (val.label) val = val.label;
        else if (val.toString && val.toString() !== '[object Object]') val = val.toString();
        else val = JSON.stringify(val);
    }

    return (val === null || val === undefined || val === '') ? '(Blanks)' : val;
};

const getDisplayValueFromRowNode = (node, key, { api, column, context, colDef }) => {
    if (!node) return '';

    let display = key;

    if (colDef && typeof colDef.valueFormatter === 'function' && key !== '(Blanks)') {
        const params = {
            value: key,
            data: node.data,
            node,
            api,
            column,
            colDef,
            context
        };
        const formatted = colDef.valueFormatter(params);
        if (formatted !== null && formatted !== undefined) {
            display = formatted;
        }
    }

    return String(display);
};

const buildOptions = (api, column, context, colDef, valueGetter) => {
    if (!api) return [];

    const params = { api, column, context, colDef, valueGetter };
    const unique = new Map();

    api.forEachLeafNode((node) => {
        const val = getValueFromRowNode(node, params);
        if (!unique.has(val)) {
            const label = getDisplayValueFromRowNode(node, val, params);
            unique.set(val, label);
        }
    });

    return Array.from(unique.entries())
        .map(([key, label]) => ({ key, label }))
        .sort((a, b) => {
            if (a.key === '(Blanks)') return 1;
            if (b.key === '(Blanks)') return -1;

            const numA = Number(a.key);
            const numB = Number(b.key);
            if (!isNaN(numA) && !isNaN(numB)) {
                return numA - numB;
            }
            return String(a.label).localeCompare(String(b.label), undefined, { numeric: true, sensitivity: 'base' });
        });
};

const CustomCheckboxFilter = forwardRef((props, ref) => {
    const { api, column, context, colDef, valueGetter, filterChangedCallback } = props;

    const [filterText, setFilterText] = useState('');
    const [selectedKeys, setSelectedKeys] = useState(new Set());

    const options = useMemo(
        () => buildOptions(api, column, context, colDef, valueGetter),
        [api, column, context, colDef, valueGetter]
    );

    useEffect(() => {
        const allKeys = options.map(opt => opt.key);
        setSelectedKeys(prev => {
            if (!prev || prev.size === 0) {
                return new Set(allKeys);
            }

            const next = new Set();
            allKeys.forEach(key => {
                if (prev.has(key)) {
                    next.add(key);
                }
            });

            if (next.size === 0 && allKeys.length > 0) {
                return new Set(allKeys);
            }

            return next;
        });
    }, [options]);

    useEffect(() => {
        if (filterChangedCallback) {
            filterChangedCallback();
        }
    }, [selectedKeys, options, filterChangedCallback]);

    const filteredOptions = useMemo(() => {
        if (!filterText) return options;
        const lower = filterText.toLowerCase();
        return options.filter(opt => String(opt.label).toLowerCase().includes(lower));
    }, [options, filterText]);

    const isSelectAllChecked = useMemo(() => {
        if (filteredOptions.length === 0) return false;
        return filteredOptions.every(opt => selectedKeys.has(opt.key));
    }, [filteredOptions, selectedKeys]);

    useImperativeHandle(ref, () => {
        const isFilterActive = () => {
            if (!options || options.length === 0) return false;
            if (!selectedKeys || selectedKeys.size === 0) return false;
            return selectedKeys.size < options.length;
        };

        return {
            isFilterActive,

            doesFilterPass(params) {
                if (!isFilterActive()) return true;

                const val = getValueFromRowNode(params.node, { api, column, context, colDef, valueGetter });
                return selectedKeys.has(val);
            },

            getModel() {
                if (!isFilterActive()) return null;
                return {
                    filterType: 'custom-checkbox',
                    selected: Array.from(selectedKeys)
                };
            },

            setModel(model) {
                if (!model || !model.selected || model.selected.length === 0) {
                    const allKeys = options.map(opt => opt.key);
                    setSelectedKeys(new Set(allKeys));
                    setFilterText('');
                } else {
                    setSelectedKeys(new Set(model.selected));
                }
            },

            getModelAsString() {
                if (!isFilterActive()) return '';
                return `(${selectedKeys.size} selected)`;
            },

            afterGuiAttached() {}
        };
    });

    const handleSelectAllChange = (e) => {
        const checked = e.target.checked;

        setSelectedKeys(prev => {
            const next = new Set(prev || []);

            if (checked) {
                filteredOptions.forEach(opt => {
                    next.add(opt.key);
                });
            } else {
                filteredOptions.forEach(opt => {
                    next.delete(opt.key);
                });
            }

            return next;
        });
    };

    const handleOptionChange = (optionKey) => {
        setSelectedKeys(prev => {
            const next = new Set(prev || []);

            if (next.has(optionKey)) {
                next.delete(optionKey);
            } else {
                next.add(optionKey);
            }

            return next;
        });
    };

    const handleApply = () => {
        if (props.api && typeof props.api.hidePopupMenu === 'function') {
            props.api.hidePopupMenu();
        }
    };

    const handleClear = () => {
        const allKeys = options.map(opt => opt.key);
        setSelectedKeys(new Set(allKeys));
        setFilterText('');
        if (props.api && typeof props.api.hidePopupMenu === 'function') {
            props.api.hidePopupMenu();
        }
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
                                checked={selectedKeys.has(option.key)}
                                onChange={() => handleOptionChange(option.key)}
                            />
                            <span className="text-sm text-gray-600 group-hover:text-gray-900 truncate" title={option.label}>
                                {option.label}
                            </span>
                        </label>
                    ))
                ) : (
                    <div className="text-center py-4 text-gray-400 text-xs italic">
                        No matches found
                    </div>
                )}
            </div>

            <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
                <div className="text-gray-400">
                    <span>{selectedKeys.size} selected</span>
                    {filterText && <span className="ml-2">{filteredOptions.length} matches</span>}
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleClear}
                        className="px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 text-[11px] font-semibold"
                    >
                        Clear
                    </button>
                    <button
                        type="button"
                        onClick={handleApply}
                        className="px-3 py-1 rounded bg-tvs-blue text-white text-[11px] font-semibold hover:bg-opacity-90"
                    >
                        Apply
                    </button>
                </div>
            </div>
        </div>
    );
});

export default CustomCheckboxFilter;
