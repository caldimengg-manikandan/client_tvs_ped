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

            // Remove padding from rdg-scroll-outer
            const rdgOuterRegex = /className="rdg-scroll-outer[^"]*"/g;
            if (rdgOuterRegex.test(content)) {
                content = content.replace(rdgOuterRegex, 'className="flex-1 flex flex-col min-h-0 w-full"');
                modified = true;
            }

            // Clean up the panel wrapper
            const rdgPanelRegex = /className="rdg-scroll-panel[^"]*"/g;
            if (rdgPanelRegex.test(content)) {
                content = content.replace(rdgPanelRegex, 'className="flex-1 min-h-0 bg-white border-t border-gray-200 overflow-hidden w-full"');
                modified = true;
            }

            // Remove outer padding of the white container
            const pRegex = /className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col"/g;
            if (pRegex.test(content)) {
                content = content.replace(pRegex, 'className="flex-1 bg-white rounded-xl shadow border border-gray-200 overflow-hidden flex flex-col"');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated layout spacing in ${fullPath}`);
            }
        }
    }
}

walkDir(pagesDir);
