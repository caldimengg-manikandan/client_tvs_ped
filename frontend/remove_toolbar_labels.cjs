const fs = require('fs');
const path = require('path');

const targetFiles = [
    'd:/Caldim_Projects/client_tvs_ped/frontend/src/pages/VendorMaster/VendorMaster.jsx',
    'd:/Caldim_Projects/client_tvs_ped/frontend/src/pages/VendorMaster/VendorScoring.jsx',
    'd:/Caldim_Projects/client_tvs_ped/frontend/src/pages/VendorMaster/VendorLoadingChart.jsx',
    'd:/Caldim_Projects/client_tvs_ped/frontend/src/pages/RequestTracker.jsx',
    'd:/Caldim_Projects/client_tvs_ped/frontend/src/pages/MHDevelopmentTracker/MHDevelopmentTracker.jsx',
    'd:/Caldim_Projects/client_tvs_ped/frontend/src/pages/ProjectPlanModel.jsx'
];

targetFiles.forEach(filepath => {
    if (!fs.existsSync(filepath)) return;
    let content = fs.readFileSync(filepath, 'utf8');

    // Remove the icon + text block in the toolbars
    content = content.replace(/<div className="h-8 w-\[1px\] bg-gray-200 mx-1 hidden sm:block"><\/div>\s*<div className="p-2 bg-tvs-blue\/10 rounded-lg text-tvs-blue shadow-sm">\s*<[a-zA-Z0-9]+ size=\{18\} \/>\s*<\/div>\s*<div className="flex flex-col">\s*<h2 className="text-sm font-bold text-gray-800 leading-tight">[^<]+<\/h2>\s*<span className="text-\[10px\] text-gray-500 font-medium">[^<]+<\/span>\s*<\/div>/g, '');

    fs.writeFileSync(filepath, content, 'utf8');
    console.log("Updated toolbar in", filepath);
});
