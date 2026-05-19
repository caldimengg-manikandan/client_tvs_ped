import React from 'react';
import { Line } from 'react-chartjs-2';
import { Skeleton } from 'antd';

const EMPTY_DATA = { labels: [], datasets: [] };

const MHTrendChart = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-border p-5 h-80">
                <Skeleton active paragraph={{ rows: 5 }} />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-border p-5 h-80 flex flex-col items-center justify-center text-txt-3">
                <span className="text-3xl mb-2">📈</span>
                <p className="text-sm font-semibold">No trend data for this period</p>
            </div>
        );
    }

    const labels = data.map(d => d.month);
    const chartData = {
        labels,
        datasets: [
            {
                label: 'Requested',
                data: data.map(d => d.requested),
                borderColor: '#378ADD',
                backgroundColor: 'rgba(55,138,221,0.08)',
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 6,
                fill: false,
                borderWidth: 2,
            },
            {
                label: 'Approved',
                data: data.map(d => d.approved),
                borderColor: '#1D9E75',
                backgroundColor: 'rgba(29,158,117,0.08)',
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 6,
                fill: false,
                borderWidth: 2,
            },
            {
                label: 'Rejected',
                data: data.map(d => d.rejected),
                borderColor: '#E24B4A',
                backgroundColor: 'rgba(226,75,74,0.08)',
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 6,
                fill: false,
                borderWidth: 2,
                borderDash: [5, 3],
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    title: (ctx) => ctx[0].label,
                },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { size: 11 }, color: '#7B8AAB' },
            },
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: { font: { size: 11 }, color: '#7B8AAB', stepSize: 1 },
            },
        },
        interaction: { mode: 'index', intersect: false },
    };

    return (
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-txt-1">MH Request Trend</h3>
                <div className="flex items-center gap-3 text-xs text-txt-3">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#378ADD] inline-block" />Requested</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#1D9E75] inline-block" />Approved</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#E24B4A] inline-block border-dashed" />Rejected</span>
                </div>
            </div>
            <div style={{ height: 220 }}>
                <Line data={chartData} options={options} />
            </div>
        </div>
    );
};

export default MHTrendChart;
