const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');

function walk(dir, filelist = []) {
    fs.readdirSync(dir).forEach(file => {
        const dirFile = path.join(dir, file);
        if (fs.statSync(dirFile).isDirectory()) {
            filelist = walk(dirFile, filelist);
        } else if (dirFile.endsWith('.jsx')) {
            filelist.push(dirFile);
        }
    });
    return filelist;
}

const files = walk(pagesDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('useState(10)')) {
        const newContent = content.replace(/useState\(10\)/g, 'useState(7)');
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`Updated pagination limit in ${file}`);
    }
});
