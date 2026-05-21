const fs = require('fs');
const path = require('path');

function walk(dir) {
    fs.readdirSync(dir).forEach(f => {
        let p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
            walk(p);
        } else if (p.endsWith('.jsx')) {
            let c = fs.readFileSync(p, 'utf8');
            
            // Check which one it actually defines
            let hasGridWidth = c.includes('const [gridWidth, setGridWidth]');
            let hasMhListGridWidth = c.includes('const [mhListGridWidth, setMhListGridWidth]');
            
            let replacement = 'const gridW = 0;';
            if (hasGridWidth) replacement = 'const gridW = gridWidth || 0;';
            if (hasMhListGridWidth) replacement = 'const gridW = mhListGridWidth || 0;';
            
            let searchRegex = /const gridW = \(typeof mhListGridWidth !== 'undefined' \? mhListGridWidth : \(typeof gridWidth !== 'undefined' \? gridWidth : 0\)\);/g;
            if (searchRegex.test(c)) {
                fs.writeFileSync(p, c.replace(searchRegex, replacement));
                console.log('Fully fixed ' + p);
            }
        }
    });
}
walk('src/pages');
