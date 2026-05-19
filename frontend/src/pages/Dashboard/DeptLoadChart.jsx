import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Skeleton } from 'antd';

const DeptLoadChart = ({ data, loading }) => {
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
                <span className="text-3xl mb-2">📊</span>
                <p className="text-sm font-semibold">No department data</p>
            </div>
        );
    }

    const maxCount = Math.max(...data.map(d => d.requestCount));
    const colours = data.map(d => {
        const intensity = d.requestCount / (maxCount || 1);
        const r = Math.round(37 + (0 - 37) * intensity);
        const g = Math.round(60 + (40 - 60) * intensity);
        const b = Math.round(128 + (180 - 128) * intensity);
        return `rgba(${r},${g},${b},${0.5 + intensity * 0.5})`;
    });

    const chartData = {
        labels: data.map(d => d.department),
        datasets: [{
            label: 'Requests',
            data: data.map(d => d.requestCount),
            backgroundColor: colours,
            borderRadius: 6,
            borderSkipped: false,
        }],
    };

    const options = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx) => ` ${ctx.parsed.x} requests`,
                },
            },
        },
        scales: {
            x: {
                beginAtZero: true,
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: { font: { size: 10 }, color: '#7B8AAB' },
            },
            y: {
                grid: { display: false },
                ticks: { font: { size: 10 }, color: '#3D4B6B' },
            },
        },
    };

    return (
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="text-sm font-bold text-txt-1 mb-4">Department MH Load</h3>
            <div style={{ height: Math.max(200, data.length * 28) }}>
                <Bar data={chartData} options={options} />
            </div>
        </div>
    );
};

export default DeptLoadChart;
