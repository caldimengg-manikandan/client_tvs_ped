const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');

const paginationUI = `
                        {/* Pagination Controls */}
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200 shrink-0">
                            <div className="text-[11px] font-semibold text-gray-500">
                                Showing {gridRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, gridRows.length)} of {gridRows.length} entries
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-gray-500 font-medium">Rows per page:</span>
                                    <select 
                                        value={pageSize} 
                                        onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                        className="text-[11px] font-medium border border-gray-300 rounded px-2 py-1 outline-none focus:border-tvs-primary bg-white cursor-pointer hover:border-gray-400 transition-colors"
                                    >
                                        <option value={15}>15</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>
                                <div className="h-4 w-px bg-gray-300"></div>
                                <div className="flex items-center gap-1">
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 border border-gray-300 rounded text-[11px] font-bold text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                                    >
                                        Prev
                                    </button>
                                    <span className="text-[11px] font-bold text-gray-600 px-2 min-w-[70px] text-center">
                                        Page {currentPage} / {Math.max(1, Math.ceil(gridRows.length / pageSize))}
                                    </span>
                                    <button 
                                        onClick={() => setCurrentPage(p => Math.min(Math.ceil(gridRows.length / pageSize), p + 1))}
                                        disabled={currentPage >= Math.ceil(gridRows.length / pageSize) || gridRows.length === 0}
                                        className="px-3 py-1 border border-gray-300 rounded text-[11px] font-bold text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>`;

function walkDir(dir) {
    let files = fs.readdirSync(dir);
    for (let file of files) {
        let fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Check if file uses FrozenRowsDataGrid
            if (!content.includes('FrozenRowsDataGrid')) continue;

            // If it already has pagination, skip
            if (content.includes('const [currentPage, setCurrentPage]')) {
                console.log(`Skipping ${file} - already paginated`);
                continue;
            }

            // 1. Inject state logic
            const gridRowsMatch = content.match(/const\s+gridRows\s*=\s*.*?;/);
            if (gridRowsMatch) {
                const logic = `
    const [currentPage, setCurrentPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(50);
    const paginatedRows = React.useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return gridRows.slice(start, start + pageSize);
    }, [gridRows, currentPage, pageSize]);`;
                content = content.replace(gridRowsMatch[0], gridRowsMatch[0] + logic);
                modified = true;
            } else {
                console.warn(`Could not find gridRows in ${file}`);
                continue;
            }

            // 2. Modify FrozenRowsDataGrid to use paginatedRows
            const rowsRegex = /<FrozenRowsDataGrid[^>]*rows=\{gridRows\}/g;
            if (rowsRegex.test(content)) {
                content = content.replace(rowsRegex, (match) => {
                    return match.replace('rows={gridRows}', 'rows={paginatedRows}');
                });
            } else {
                // Sometime it might be broken up on newlines
                const rowsMultiRegex = /(<FrozenRowsDataGrid[\s\S]*?)rows=\{gridRows\}/;
                if (rowsMultiRegex.test(content)) {
                    content = content.replace(rowsMultiRegex, '$1rows={paginatedRows}');
                } else {
                    console.warn(`Could not find rows={gridRows} in ${file}`);
                    continue;
                }
            }

            // 3. Inject pagination UI after the grid
            const gridEndRegex = /(<FrozenRowsDataGrid[\s\S]*?\/>\s*)(<\/div>)/;
            if (gridEndRegex.test(content)) {
                content = content.replace(gridEndRegex, `$1${paginationUI}\n$2`);
            } else {
                console.warn(`Could not find end of FrozenRowsDataGrid in ${file}`);
                continue;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log(`Added pagination to ${fullPath}`);
            }
        }
    }
}

walkDir(pagesDir);
