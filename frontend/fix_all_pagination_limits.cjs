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
    let changed = false;

    // Replace useState(50) or useState(10) or any other common limits with 7
    const matches = content.match(/const \[limit[^\]]*\] = useState\(\d+\);/g);
    if (matches) {
        matches.forEach(match => {
            const newVal = match.replace(/useState\(\d+\)/, 'useState(7)');
            if (content.includes(match)) {
                content = content.replace(match, newVal);
                changed = true;
            }
        });
    }

    // Special case for CreateMHRequestList or others that might use [limit, setLimit]
    if (content.match(/const \[limit, setLimit\] = useState\(\d+\);/)) {
        content = content.replace(/const \[limit, setLimit\] = useState\(\d+\);/g, 'const [limit] = useState(7);');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated pagination limit in ${file}`);
    }
});
