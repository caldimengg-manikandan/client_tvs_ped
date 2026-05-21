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

            // Fix rdg-scroll-outer
            const rdgOuterRegex = /className="flex-1 flex flex-col min-h-0 w-full"/g;
            if (rdgOuterRegex.test(content)) {
                content = content.replace(rdgOuterRegex, 'className="flex-1 flex flex-col h-full w-full min-h-0"');
                modified = true;
            }

            // Fix rdg-scroll-panel
            const rdgPanelRegex = /className="flex-1 min-h-0 bg-white border-t border-gray-200 overflow-hidden w-full"/g;
            if (rdgPanelRegex.test(content)) {
                content = content.replace(rdgPanelRegex, 'className="flex-1 flex flex-col h-full w-full min-h-0 bg-white border-t border-gray-200 overflow-hidden"');
                modified = true;
            }

            // Ensure the grid style uses flex: 1
            const gridStyleRegex = /style=\{\{\s*blockSize:\s*'100%',\s*width:\s*'100%'\s*\}\}/g;
            if (gridStyleRegex.test(content)) {
                content = content.replace(gridStyleRegex, 'style={{ flex: 1, width: "100%", height: "100%", minHeight: 0 }}');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated grid height constraints in ${fullPath}`);
            }
        }
    }
}

walkDir(pagesDir);
