const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');

const newFilterCode = `
        const hasFilter = rawSelected !== undefined;

        return (
            <div className="relative h-full w-full flex items-center justify-between px-3 gap-1">
                <div className="flex-1 min-w-0">
                    <span className="font-bold text-[11px] leading-tight tracking-wide uppercase truncate text-white">{column.name}</span>
                </div>
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setActiveFilterKey(prev => (prev === key ? null : key));
                    }}
                    className={\`ml-1 p-1 rounded flex-shrink-0 transition-colors \${hasFilter ? 'bg-white/30 border border-white/50' : 'hover:bg-white/20 border border-transparent'}\`}
                >
                    <Filter size={12} className="text-white" />
                </button>
                {activeFilterKey === key && (
                    <div className="absolute z-50 top-full right-0 mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-2xl p-0 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{column.name}</span>
                            <div className="flex gap-2">
                                <button type="button" onClick={handleSelectAll} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors">Select All</button>
                                <button type="button" onClick={handleClear} className="text-[10px] font-bold text-red-500 hover:text-red-700 transition-colors">Clear</button>
                            </div>
                        </div>
                        <div className="p-2 border-b border-gray-100">
                            <input
                                type="text"
                                value={searchValue}
                                onChange={(e) => setFilterSearchText(prev => ({ ...prev, [key]: e.target.value }))}
                                placeholder="Search..."
                                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                            />
                        </div>
                        <div className="max-h-48 overflow-y-auto p-1 bg-white">
                            {visibleValues.map(value => {
                                const label = (value && String(value).trim()) ? String(value) : '(Blank)';
                                const checked = selectedValues.includes(value);
                                return (
                                    <label key={label} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => toggleValue(value)}
                                            className="w-3.5 h-3.5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                        />
                                        <span className="text-xs text-gray-700 truncate select-none">{label}</span>
                                    </label>
                                );
                            })}
                            {visibleValues.length === 0 && (
                                <div className="text-xs text-gray-400 text-center py-4">No matching values</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };`;

function walkDir(dir) {
    let files = fs.readdirSync(dir);
    for (let file of files) {
        let fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('const FilterHeaderCell = ({ column }) => {')) {
                const searchStr = 'const hasFilter = rawSelected !== undefined;';
                const startIndex = content.indexOf(searchStr);
                if (startIndex !== -1) {
                    let endIndex = content.indexOf('    };\n\n', startIndex);
                    if (endIndex === -1) endIndex = content.indexOf('    };\n', startIndex);
                    if (endIndex === -1) endIndex = content.indexOf('    };', startIndex);
                    
                    if (endIndex !== -1) {
                        endIndex += 6; 
                        const originalChunk = content.substring(startIndex, endIndex);
                        
                        if (content.lastIndexOf('const FilterHeaderCell =', startIndex) !== -1) {
                            content = content.replace(originalChunk, newFilterCode.trim() + '\n');
                            fs.writeFileSync(fullPath, content);
                            console.log(`Updated ${fullPath}`);
                        }
                    }
                }
            }
        }
    }
}

walkDir(pagesDir);
