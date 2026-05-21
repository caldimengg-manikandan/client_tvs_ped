const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');

function walkDir(dir) {
    let files = fs.readdirSync(dir);
    for (let file of files) {
        let fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            const mapRegex = /return withFreeze\.map\(\(column\) => \{\s*if \(\!column\.width\) return column;\s*const scaledWidth = Math\.max\(Math\.floor\(column\.width \* scale\), column\.width, 120\);\s*return \{ \.\.\.column, width: scaledWidth \};\s*\}\);/g;
            
            const newMap = `let currentTotal = 0;
        const mapped = withFreeze.map((column, index) => {
            if (!column.width) return column;
            let scaledWidth = Math.max(Math.floor(column.width * scale), column.width, 120);
            
            // If it's the last column, give it all remaining pixels to avoid white gaps
            const gridW = mhListGridWidth || gridWidth || 0;
            if (index === withFreeze.length - 1 && gridW > 0) {
                const remaining = gridW - currentTotal;
                if (remaining > scaledWidth) {
                    scaledWidth = remaining - 2; // -2 for borders
                }
            }
            currentTotal += scaledWidth;
            return { ...column, width: scaledWidth };
        });
        return mapped;`;

            if (mapRegex.test(content)) {
                // Determine what variable is used for gridWidth
                let isMh = content.includes('mhListGridWidth');
                let mapStr = newMap;
                if (!isMh && !content.includes('gridWidth')) {
                    // Fallback
                    mapStr = newMap.replace(/const gridW.*/, 'const gridW = 0;');
                }

                content = content.replace(mapRegex, mapStr);
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log('Fixed width gap in ' + fullPath);
            }
        }
    }
}

walkDir(pagesDir);
