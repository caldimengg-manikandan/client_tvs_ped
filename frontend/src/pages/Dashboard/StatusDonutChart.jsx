import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Skeleton } from 'antd';

const STATUS_COLOURS_MAP = {
    Pending:     '#BA7517',
    Notified:    '#378ADD',
    Assigned:    '#534AB7',
    Rejected:    '#E24B4A',
    'In Progress': '#378ADD',
    Completed:   '#0F6E56',
};

const StatusDonutChart = ({ data, loading }) => {
    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-border p-5 h-80">
                <Skeleton active paragraph={{ rows: 4 }} />
            </div>
        );
    }

    const entries = data ? Object.entries(data).filter(([, v]) => v > 0) : [];
    const total = entries.reduce((s, [, v]) => s + v, 0);

    if (!entries.length) {
        return (
            <div className="bg-white rounded-2xl border border-border p-5 h-80 flex flex-col items-center justify-center text-txt-3">
                <span className="text-3xl mb-2">🍩</span>
                <p className="text-sm font-semibold">No status data</p>
            </div>
        );
    }

    const chartData = {
        labels: entries.map(([k]) => k),
        datasets: [{
            data: entries.map(([, v]) => v),
            backgroundColor: entries.map(([k]) => STATUS_COLOURS_MAP[k] || '#94a3b8'),
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverOffset: 6,
        }],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx) => ` ${ctx.label}: ${ctx.parsed} (${((ctx.parsed / total) * 100).toFixed(1)}%)`,
                },
            },
        },
    };

    return (
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm h-full">
            <h3 className="text-sm font-bold text-txt-1 mb-4">Request Status Split</h3>
            <div className="relative" style={{ height: 180 }}>
                <Doughnut data={chartData} options={options} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-txt-1">{total}</span>
                    <span className="text-xs text-txt-3">Total</span>
                </div>
            </div>
            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-1.5">
                {entries.map(([key, val]) => (
                    <div key={key} className="flex items-center gap-1.5 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLOURS_MAP[key] || '#94a3b8' }} />
                        <span className="text-txt-2 font-medium truncate">{key}</span>
                        <span className="text-txt-3 ml-auto">{((val / total) * 100).toFixed(0)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StatusDonutChart;
