import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Skeleton } from 'antd';

const PALETTE = ['#253C80','#00C9A7','#FFB800','#E24B4A','#534AB7','#378ADD','#0F6E56'];

const AssetBreakdownChart = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-border p-5 h-72">
                <Skeleton active paragraph={{ rows: 4 }} />
            </div>
        );
    }

    const categories = data?.byCategory || [];
    const total = data?.totalAssets || 0;

    if (!categories.length) {
        return (
            <div className="bg-white rounded-2xl border border-border p-5 h-72 flex flex-col items-center justify-center text-txt-3">
                <span className="text-3xl mb-2">📦</span>
                <p className="text-sm font-semibold">No asset data</p>
            </div>
        );
    }

    const chartData = {
        labels: categories.map(c => c.category),
        datasets: [{
            data: categories.map(c => c.count),
            backgroundColor: categories.map((_, i) => PALETTE[i % PALETTE.length]),
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverOffset: 6,
        }],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed}` } },
        },
    };

    return (
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-txt-1">Asset Category Breakdown</h3>
                <span className="text-xs text-txt-3">{total} total</span>
            </div>
            <div className="relative" style={{ height: 160 }}>
                <Doughnut data={chartData} options={options} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-bold text-txt-1">{total}</span>
                    <span className="text-xs text-txt-3">Assets</span>
                </div>
            </div>
            <div className="mt-3 space-y-1">
                {categories.map((c, i) => (
                    <div key={c.category} className="flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                        <span className="text-txt-2 truncate flex-1">{c.category}</span>
                        <span className="text-txt-3 font-semibold">{c.count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AssetBreakdownChart;
