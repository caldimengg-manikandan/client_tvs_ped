const fs = require('fs');
const path = require('path');

function walk(dir) {
    fs.readdirSync(dir).forEach(f => {
        let p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
            walk(p);
        } else if (p.endsWith('.jsx')) {
            let c = fs.readFileSync(p, 'utf8');
            let modified = false;

            if (c.includes('className="flex-1 flex flex-col h-full w-full min-h-0"')) {
                c = c.replace(/className="flex-1 flex flex-col h-full w-full min-h-0"/g, 'className="flex-1 flex flex-col w-full min-h-0"');
                modified = true;
            }

            if (c.includes('className="flex-1 flex flex-col h-full w-full min-h-0 bg-white border-t border-gray-200 overflow-hidden"')) {
                c = c.replace(/className="flex-1 flex flex-col h-full w-full min-h-0 bg-white border-t border-gray-200 overflow-hidden"/g, 'className="flex-1 flex flex-col w-full min-h-0 bg-white border-t border-gray-200 overflow-hidden"');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(p, c);
                console.log('Removed h-full collapse bug from ' + p);
            }
        }
    });
}
walk('src/pages');
