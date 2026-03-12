const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'pages');

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

const files = walk(srcDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // Regex to match the complex header structure
    // Need to match:
    // <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
    //     <div className="p-2 bg-tvs-blue/10 rounded-lg text-tvs-blue shadow-sm">
    //         <IconName size={20} />
    //     </div>
    //     Title Text
    // </h1>
    // <p className="text-xs font-bold text-slate-500 mt-1">Subtitle Text</p>

    const regex1 = /<h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">\s*<div className="p-2 bg-tvs-blue\/10 rounded-lg text-tvs-blue shadow-sm">\s*<[\w\s={}"']+ \/>\s*<\/div>\s*([^<]+)\s*<\/h1>\s*<p className="text-xs font-bold text-slate-500 mt-1">[^<]+<\/p>/g;

    const regex2 = /<h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">\s*<div className="p-2 bg-slate-100 rounded-lg text-slate-500">\s*<[\w\s={}"']+ \/>\s*<\/div>\s*([^<]+)\s*<\/h1>\s*<p className="text-xs font-bold text-slate-500 mt-1">[^<]+<\/p>/g;

    let changed = false;

    content = content.replace(regex1, (match, titleText) => {
        changed = true;
        return `<h1 className="text-xl font-black text-slate-900 tracking-tight">${titleText.trim()}</h1>`;
    });

    content = content.replace(regex2, (match, titleText) => {
        changed = true;
        return `<h1 className="text-xl font-black text-slate-900 tracking-tight">${titleText.trim()}</h1>`;
    });

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${file}`);
    }
});
