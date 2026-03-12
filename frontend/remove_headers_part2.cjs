const fs = require('fs');
const path = require('path');

const srcFiles = [
    'd:/Caldim_Projects/client_tvs_ped/frontend/src/pages/EmployeeMaster/EmployeeMaster.jsx',
    'd:/Caldim_Projects/client_tvs_ped/frontend/src/pages/VendorMaster/VendorMaster.jsx',
    'd:/Caldim_Projects/client_tvs_ped/frontend/src/pages/VendorMaster/VendorScoring.jsx',
    'd:/Caldim_Projects/client_tvs_ped/frontend/src/pages/VendorMaster/VendorLoadingChart.jsx',
    'd:/Caldim_Projects/client_tvs_ped/frontend/src/pages/RequestTracker.jsx',
    'd:/Caldim_Projects/client_tvs_ped/frontend/src/pages/MHDevelopmentTracker/MHDevelopmentTracker.jsx',
    'd:/Caldim_Projects/client_tvs_ped/frontend/src/pages/ProjectPlanModel.jsx'
];

srcFiles.forEach(file => {
    if (!fs.existsSync(file)) return;
    let content = fs.readFileSync(file, 'utf8');

    // Remove the <div> containing the h1 tag
    const regexH1Div = /<div>\s*<h1 className="text-xl font-black text-slate-900 tracking-tight">[^<]+<\/h1>\s*<\/div>/g;
    content = content.replace(regexH1Div, '');

    // For ProjectPlanModel which had a slightly different structure:
    const regexProjSummary = /<div className="flex flex-col justify-center">\s*<h2 className="text-sm font-bold text-gray-800 leading-tight">Project Summary<\/h2>\s*<\/div>/g;
    content = content.replace(regexProjSummary, '');

    // Now change justify-between to justify-end so buttons align right
    // Also we need to make sure the search bar section stays left if it's there
    // In ProjectPlanModel it's: items-center justify-between
    // In other files it's: items-center justify-between gap-6
    content = content.replace(/justify-between/g, 'justify-end');

    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated ${file}`);
});
