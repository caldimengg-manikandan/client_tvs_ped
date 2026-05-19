import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Skeleton } from 'antd';
import { useNavigate } from 'react-router-dom';

const STAGE_COLOURS = [
    'rgba(204,31,31,0.35)',
    'rgba(204,31,31,0.50)',
    'rgba(204,31,31,0.62)',
    'rgba(204,31,31,0.74)',
    'rgba(204,31,31,0.87)',
    'rgba(204,31,31,1.00)',
];

const DevTrackerFunnel = ({ data, loading }) => {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-border p-5 h-72">
                <Skeleton active paragraph={{ rows: 5 }} />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-border p-5 h-72 flex flex-col items-center justify-center text-txt-3">
                <span className="text-3xl mb-2">🔀</span>
                <p className="text-sm font-semibold">No tracker stage data</p>
            </div>
        );
    }

    const chartData = {
        labels: data.map(d => d.stage),
        datasets: [{
            label: 'Trackers',
            data: data.map(d => d.count),
            backgroundColor: STAGE_COLOURS,
            borderRadius: 8,
            borderSkipped: false,
        }],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (_, elements) => {
            if (elements.length > 0) {
                const idx = elements[0].index;
                const stage = data[idx]?.originalStage || '';
                navigate(`/mh-development-tracker?stage=${encodeURIComponent(stage)}`);
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx) => ` ${ctx.parsed.y} tracker(s)`,
                    afterLabel: () => 'Click to filter',
                },
            },
        },
        scales: {
            x: {
                grid: { display: false },
                ticks: { font: { size: 11 }, color: '#3D4B6B' },
            },
            y: {
                beginAtZero: true,
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: { font: { size: 11 }, color: '#7B8AAB', stepSize: 1 },
            },
        },
        cursor: 'pointer',
    };

    return (
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-txt-1">MH Development Tracker — Stage Funnel</h3>
                <span className="text-xs text-txt-3">Click bar to filter tracker</span>
            </div>
            <div style={{ height: 220 }}>
                <Bar data={chartData} options={options} />
            </div>
        </div>
    );
};

export default DevTrackerFunnel;
