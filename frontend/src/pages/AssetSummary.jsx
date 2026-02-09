import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Download, FileText, Filter } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const AssetSummary = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [departmentFilter, setDepartmentFilter] = useState('all');
    const [locationFilter, setLocationFilter] = useState('all');

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/asset-request`);
            // Requirement: show records until reached Implementation Status (Accepted or Rejected)
            const summaryAssets = response.data.filter(req =>
                (req.status === 'Accepted' || req.status === 'Rejected') &&
                req.progressStatus === 'Implementation'
            );
            setAssets(summaryAssets);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching assets:', error);
            setLoading(false);
        }
    };

    const filteredAssets = assets.filter(asset => {
        const term = searchTerm.toLowerCase();
        const matchesSearch = (
            (asset.assetRequestId?.toLowerCase() || '').includes(term) ||
            (asset.assetName?.toLowerCase() || '').includes(term) ||
            (asset.departmentName?.toLowerCase() || '').includes(term) ||
            (asset.location?.toLowerCase() || '').includes(term)
        );

        const matchesDepartment = departmentFilter === 'all' || asset.departmentName === departmentFilter;
        const matchesLocation = locationFilter === 'all' || asset.location === locationFilter;

        return matchesSearch && matchesDepartment && matchesLocation;
    });

    // Get unique departments and locations for filters
    const departments = [...new Set(assets.map(a => a.departmentName).filter(Boolean))];
    const locations = [...new Set(assets.map(a => a.location).filter(Boolean))];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-tvs-border overflow-hidden fade-in">
            <div className="flex justify-between items-center p-6 border-b border-tvs-border bg-gray-50">
                <h1 className="text-xl font-bold text-tvs-dark-gray m-0">Asset's Summary</h1>
                <div className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                    Total Assets: {filteredAssets.length}
                </div>
            </div>

            {/* Search and Filters */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Search by ID, Name, Department..."
                        />
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <Filter size={18} className="text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-700">Department:</span>
                        </div>
                        <select
                            value={departmentFilter}
                            onChange={(e) => setDepartmentFilter(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                        >
                            <option value="all">All Departments</option>
                            {departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                            <Filter size={18} className="text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-700">Location:</span>
                        </div>
                        <select
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                        >
                            <option value="all">All Locations</option>
                            {locations.map(loc => (
                                <option key={loc} value={loc}>{loc}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">S.No</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Asset ID</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Asset Name</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Vendor Name</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">PO Price of the Asset</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Department Name</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Plant Location</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200">Asset Location</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="8" className="p-8 text-center text-gray-500 font-medium bg-gray-50">Loading assets...</td>
                            </tr>
                        ) : filteredAssets.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="p-8 text-center text-gray-500 font-medium bg-gray-50">No assets found</td>
                            </tr>
                        ) : (
                            filteredAssets.map((asset, index) => (
                                <tr key={asset._id} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">{index + 1}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap"><strong>{asset.allocationAssetId || asset.assetRequestId}</strong></td>
                                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap font-medium">{asset.assetName || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">
                                        {typeof asset.assignedVendor === 'object' && asset.assignedVendor !== null
                                            ? asset.assignedVendor.vendorName
                                            : (asset.assignedVendor || '-')}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">
                                        {asset.poPrice ? `₹ ${asset.poPrice.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">{asset.departmentName}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">{asset.location}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700 border-b border-gray-100 whitespace-nowrap">{asset.assetLocation || asset.assetNeededLocation}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AssetSummary;
