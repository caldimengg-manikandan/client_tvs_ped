const fs = require('fs');
const path = require('path');

const targetFiles = [
    'd:/Caldim_Projects/client_tvs_ped/frontend/src/pages/EmployeeMaster/EmployeeMaster.jsx',
    'd:/Caldim_Projects/client_tvs_ped/frontend/src/pages/VendorMaster/VendorMaster.jsx',
    'd:/Caldim_Projects/client_tvs_ped/frontend/src/pages/VendorMaster/VendorScoring.jsx',
    'd:/Caldim_Projects/client_tvs_ped/frontend/src/pages/VendorMaster/VendorLoadingChart.jsx',
    'd:/Caldim_Projects/client_tvs_ped/frontend/src/pages/RequestTracker.jsx',
    'd:/Caldim_Projects/client_tvs_ped/frontend/src/pages/MHDevelopmentTracker/MHDevelopmentTracker.jsx',
    'd:/Caldim_Projects/client_tvs_ped/frontend/src/pages/ProjectPlanModel.jsx'
];

targetFiles.forEach(filepath => {
    if (!fs.existsSync(filepath)) {
        console.log("File not found:", filepath);
        return;
    }

    let content = fs.readFileSync(filepath, 'utf8');

    // Pattern 1: Title block with icon and subtitle
    // <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
    //     <div>
    //         <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
    //              ...
    //         </h1>
    //         <p ...>...</p>
    //     </div>

    // This regex will find the entire containing `<div>` of the header and replace `justify-between` with `justify-end`
    // and remove the child `<div>` containing the `<h1>` and `<p>`.

    // EmployeeMaster, RequestTracker, VendorMaster, VendorScoring, VendorLoading, MHDevelopmentTracker
    content = content.replace(
        /<div className="flex flex-col sm:flex-row items-center justify-between gap-6">\s*<div>\s*<h1 className="text-xl font-black text-slate-900 tracking-tight[^>]*>[\s\S]*?<\/h1>(\s*<p className="text-xs font-bold text-slate-500 mt-1">[^<]*<\/p>)?\s*<\/div>/g,
        '<div className="flex flex-col sm:flex-row items-center justify-end gap-6">'
    );

    // Pattern 2: ProjectPlanModel.jsx
    // <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between bg-gradient-to-r... gap-4...">
    //  <div className="flex items-center gap-3 w-full sm:w-auto">
    //      <SearchBar .../>
    //      <div className="h-8 w-[1px] bg-gray-200 mx-1 hidden sm:block"></div>
    //      <div className="flex flex-col justify-center">
    //         <h2 className="text-sm font-bold text-gray-800 leading-tight">Project Summary</h2>
    //      </div>

    // In ProjectPlanModel it's slightly different, but since I reverted the checkout, it has the original format:
    // <div className="flex flex-col">
    //    <h2 className="text-sm font-bold text-gray-800 leading-tight">Project Summary</h2>
    //    <span className="text-[10px] text-gray-500 font-medium">Timeline Overview</span>
    // </div>

    content = content.replace(
        /<div className="h-8 w-\[1px\] bg-gray-200 mx-1 hidden sm:block"><\/div>\s*<div className="p-2 bg-tvs-blue\/10 rounded-lg text-tvs-blue shadow-sm">\s*<ListChecks size=\{18\} \/>\s*<\/div>\s*<div className="flex flex-col">\s*<h2 className="text-sm font-bold text-gray-800 leading-tight">Project Summary<\/h2>\s*<span className="text-\[10px\] text-gray-500 font-medium">Timeline Overview<\/span>\s*<\/div>/g,
        ''
    );

    // If there's an issue with VendorMaster not having the exact string
    content = content.replace(
        /<div className="flex flex-col sm:flex-row items-center justify-between gap-6">\s*<div>\s*<h1 className="text-xl font-black text-slate-900 tracking-tight[^>]*>[\s\S]*?<\/h1>\s*<\/div>/g,
        '<div className="flex flex-col sm:flex-row items-center justify-end gap-6">'
    );


    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`Updated ${filepath}`);
});
