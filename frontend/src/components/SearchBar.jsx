import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ onSearch, placeholder = "Search...", initialValue = "", className = "" }) => {
    const [value, setValue] = useState(initialValue);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(value);
        }, 500);

        return () => clearTimeout(timer);
    }, [value, onSearch]);

    const handleClear = () => {
        setValue("");
        onSearch("");
    };

    return (
        <div className={`relative flex items-center ${className}`}>
            <Search className="absolute left-3 text-gray-400" size={16} />
            <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-tvs-blue focus:border-transparent transition-all shadow-sm"
            />
            {value && (
                <button
                    onClick={handleClear}
                    className="absolute right-3 p-1 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
};

export default SearchBar;
