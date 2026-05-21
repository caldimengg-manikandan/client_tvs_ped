const fs = require('fs');
const path = require('path');

function walk(dir) {
    fs.readdirSync(dir).forEach(f => {
        let p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) {
            walk(p);
        } else if (p.endsWith('.jsx')) {
            let c = fs.readFileSync(p, 'utf8');
            let matchString = "const gridW = mhListGridWidth || gridWidth || 0;";
            let replaceString = "const gridW = (typeof mhListGridWidth !== 'undefined' ? mhListGridWidth : (typeof gridWidth !== 'undefined' ? gridWidth : 0));";
            if (c.includes(matchString)) {
                fs.writeFileSync(p, c.replace(matchString, replaceString));
                console.log('Fixed ' + p);
            }
            
            // Just in case I wrote it as let gridW or something
            let fallbackRegex = /const gridW\s*=\s*mhListGridWidth\s*\|\|\s*gridWidth\s*\|\|\s*0;/g;
            if (fallbackRegex.test(c)) {
                fs.writeFileSync(p, c.replace(fallbackRegex, replaceString));
                console.log('Fixed regex ' + p);
            }
        }
    });
}
walk('src/pages');
