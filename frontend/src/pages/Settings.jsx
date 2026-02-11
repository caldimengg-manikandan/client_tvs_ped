import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, FileText, Users, Save, Check, Search } from 'lucide-react';
import { message } from 'antd';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Settings State
    const [frequency, setFrequency] = useState('Weekly');
    const [reportType, setReportType] = useState('Progress Report of MH Requests');
    const [selectedEmployees, setSelectedEmployees] = useState([]);

    useEffect(() => {
        fetchEmployees();
        fetchExistingSettings();
    }, []);

    const fetchExistingSettings = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/report-settings`);
            if (response.data.success && response.data.data) {
                const { frequency: freq, reportType: type, recipients } = response.data.data;
                if (freq) setFrequency(freq);
                if (type) setReportType(type);
                if (recipients && recipients.length > 0) setSelectedEmployees(recipients);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        }
    };

    const fetchEmployees = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/employees`);
            if (response.data.success) {
                setEmployees(response.data.data);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching employees:', error);
            message.error('Failed to load employees');
            setLoading(false);
        }
    };

    const handleEmployeeToggle = (email) => {
        setSelectedEmployees(prev => {
            if (prev.includes(email)) {
                return prev.filter(e => e !== email);
            } else {
                return [...prev, email];
            }
        });
    };

    const generatePDF = (data, summary, type) => {
        try {
            console.log('Generating PDF with data:', { dataLength: data?.length, summary });
            const doc = new jsPDF();

            // Header
            doc.setFontSize(20);
            doc.text(type || 'Asset Management Report', 14, 22);

            doc.setFontSize(11);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

            // Summary
            doc.text('Summary:', 14, 40);
            doc.text(`Total Requests: ${summary?.totalRequests || 0}`, 14, 46);

            // Detailed Table
            const tableColumn = ["MH ID", "User", "Dept", "Status", "Progress", "Date"];
            const tableRows = [];

            if (data && Array.isArray(data)) {
                data.forEach(req => {
                    const requestData = [
                        req.mhRequestId || 'N/A',
                        req.userName || 'N/A',
                        req.departmentName || 'N/A',
                        req.status || 'N/A',
                        req.progressStatus || 'N/A',
                        req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'N/A'
                    ];
                    tableRows.push(requestData);
                });
            }

            console.log('Table rows prepared:', tableRows.length);

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 55,
            });

            // Open in new tab
            const pdfBlob = doc.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            window.open(pdfUrl, '_blank');
            console.log('PDF generated and opened successfully');
        } catch (error) {
            console.error('Error inside generatePDF:', error);
            throw new Error('PDF Generation failed: ' + error.message);
        }
    };

    const handleSave = async () => {
        if (selectedEmployees.length === 0) {
            message.warning('Please select at least one recipient');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post(`${API_BASE_URL}/api/report-settings`, {
                frequency,
                reportType,
                recipients: selectedEmployees
            });

            if (response.data.success) {
                message.success('Settings saved successfully! Reports will be sent automatically.');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            message.error(error.response?.data?.message || 'Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = async () => {
        try {
            setLoading(true);
            console.log('Requesting preview for:', reportType);

            const response = await axios.post(`${API_BASE_URL}/api/report-settings/preview`, {
                reportType
            });

            console.log('Preview API Response:', response.data);

            if (response.data.success) {
                const responseData = response.data.data;
                const data = responseData.data || [];
                const summary = responseData.summary || { totalRequests: 0 };

                console.log('Processing preview data:', { dataLength: data.length, summary });

                generatePDF(data, summary, reportType);
                message.success('Report preview generated successfully');
            }
        } catch (error) {
            console.error('Error generating preview:', error);
            message.error(`Failed to generate preview: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSendNow = async () => {
        if (selectedEmployees.length === 0) {
            message.warning('Please select at least one recipient');
            return;
        }

        try {
            setLoading(true);
            const response = await axios.post(`${API_BASE_URL}/api/report-settings/send-now`, {
                reportType,
                recipients: selectedEmployees
            });

            if (response.data.success) {
                message.success('Report sent successfully!');
            }
        } catch (error) {
            console.error('Error sending report:', error);
            message.error(error.response?.data?.message || 'Failed to send report');
        } finally {
            setLoading(false);
        }
    };

    if (loading && employees.length === 0) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tvs-blue"></div>
            </div>
        );
    }

    const filteredEmployees = employees.filter(emp =>
        (emp.employeeName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (emp.mailId?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const frequencies = ['Daily', 'Weekly', 'Fortnightly', 'Monthly'];

    const reportTypes = [
        'Progress Report of MH Requests',
        'Progress Report of Approved Requests',
        'Progress Report of Implemented',
        'Progress Report of Rejected'
    ];

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Report Settings</h1>
                    <p className="text-gray-600">Configure automated report generation and delivery</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handlePreview}
                        style={{ color: '#fff' }}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
                    >
                        <FileText size={18} color="#fff" />
                        <span>Preview Report</span>
                    </button>
                    <button
                        onClick={handleSendNow}
                        style={{ color: '#fff' }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                    >
                        <Users size={18} color="#fff" />
                        <span>Send Now</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Frequency Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center space-x-3 mb-4 text-tvs-blue">
                        <Calendar className="w-6 h-6" />
                        <h2 className="text-lg font-semibold">Frequency</h2>
                    </div>
                    <div className="space-y-3">
                        {frequencies.map((freq) => (
                            <button
                                key={freq}
                                onClick={() => setFrequency(freq)}
                                className={`w-full p-4 text-left rounded-lg border transition-all ${frequency === freq
                                    ? 'border-tvs-blue bg-blue-50 text-tvs-blue ring-1 ring-blue-200'
                                    : 'border-gray-200 hover:border-blue-300'
                                    }`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">{freq}</span>
                                    {frequency === freq && <Check size={18} />}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Report Type Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center space-x-3 mb-4 text-tvs-blue">
                        <FileText className="w-6 h-6" />
                        <h2 className="text-lg font-semibold">Report Type</h2>
                    </div>
                    <div className="space-y-3">
                        {reportTypes.map((type) => (
                            <button
                                key={type}
                                onClick={() => setReportType(type)}
                                className={`w-full p-4 text-left rounded-lg border transition-all ${reportType === type
                                    ? 'border-tvs-blue bg-blue-50 text-tvs-blue ring-1 ring-blue-200'
                                    : 'border-gray-200 hover:border-blue-300'
                                    }`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-sm">{type}</span>
                                    {reportType === type && <Check size={18} />}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Recipients Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-[500px]">
                    <div className="flex items-center space-x-3 mb-4 text-tvs-blue">
                        <Users className="w-6 h-6" />
                        <h2 className="text-lg font-semibold">Recipients</h2>
                    </div>

                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search employees..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-tvs-blue"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                        {filteredEmployees.map((emp) => (
                            <div
                                key={emp._id}
                                onClick={() => handleEmployeeToggle(emp.mailId)}
                                className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedEmployees.includes(emp.mailId)
                                    ? 'border-tvs-blue bg-blue-50'
                                    : 'border-gray-100 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${selectedEmployees.includes(emp.mailId)
                                        ? 'bg-blue-200 text-tvs-blue'
                                        : 'bg-gray-200 text-gray-600'
                                        }`}>
                                        {(emp.employeeName || '?').charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">{emp.employeeName || 'Unknown Name'}</p>
                                        <p className="text-xs text-gray-500 truncate">{emp.mailId || 'No Email'}</p>
                                    </div>
                                    {selectedEmployees.includes(emp.mailId) && (
                                        <Check size={16} className="text-tvs-blue" />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="text-sm text-gray-500 mb-2">
                            Selected: <span className="font-bold text-tvs-blue">{selectedEmployees.length}</span> recipients
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    style={{ color: '#fff' }}
                    className="flex items-center bg-tvs-blue px-8 py-3 rounded-lg font-medium shadow-sm hover:bg-opacity-90 transform active:scale-95 transition-all cursor-pointer text-white disabled:opacity-50 disabled:cursor-not-allowed space-x-2"
                >
                    <Save size={20} color="#fff" />
                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                </button>
            </div>
        </div>
    );
};

export default Settings;
