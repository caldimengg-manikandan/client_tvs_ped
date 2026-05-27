import React, { useState, useMemo } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { Segmented } from 'antd';
import dayjs from 'dayjs';

const ProjectGanttChart = ({ milestones }) => {
    const [view, setView] = useState(ViewMode.Day);

    const tasks = useMemo(() => {
        if (!milestones || milestones.length === 0) return { tasks: [], analytics: null };
        
        const generatedTasks = [];
        let previousId = null;
        let totalDelay = 0;
        let completedCount = 0;
        const totalTasks = milestones.length;

        milestones.forEach((m, idx) => {
            // Gantt task react requires valid Dates. We use plan start/end if available.
            // If actual dates exist, we can show them or use them.
            // For a Gantt chart, we usually plot the plan vs actual.
            // Let's plot Plan. If no Plan, try Actual. If neither, skip.
            
            const start = m.actualStart ? new Date(m.actualStart) : (m.planStart ? new Date(m.planStart) : null);
            const end = m.actualEnd ? new Date(m.actualEnd) : (m.planEnd ? new Date(m.planEnd) : null);

            if (!start || !end) {
                // If we don't have valid dates, we can't show it on the Gantt chart.
                return; 
            }

            // Ensure start is before end
            let safeStart = start;
            let safeEnd = end;
            if (safeStart.getTime() > safeEnd.getTime()) {
                safeEnd = new Date(safeStart.getTime() + 24 * 60 * 60 * 1000); // add 1 day
            }
            if (safeStart.getTime() === safeEnd.getTime()) {
                safeEnd = new Date(safeStart.getTime() + 24 * 60 * 60 * 1000); // Minimum 1 day width
            }

            // Determine progress based on actual dates
            let progress = 0;
            if (m.actualEnd) {
                progress = 100;
                completedCount++;
            } else if (m.actualStart) {
                progress = 50;
            }
            
            if (m.delayInDays > 0) {
                totalDelay += m.delayInDays;
            }

            // Color Palette to match the reference images (Orange, Purple, Teal, Red, etc)
            const palette = ['#f59e0b', '#6366f1', '#10b981', '#ef4444', '#8b5cf6', '#0ea5e9', '#14b8a6'];
            const solidColor = palette[idx % palette.length];

            const taskId = `Task-${idx}`;
            
            // Append the date range to the task name so gantt-task-react renders it next to the bar (like the screenshot)
            const dateString = `${safeStart.getDate().toString().padStart(2, '0')}-${(safeStart.getMonth() + 1).toString().padStart(2, '0')}-${safeStart.getFullYear()} - ${safeEnd.getDate().toString().padStart(2, '0')}-${(safeEnd.getMonth() + 1).toString().padStart(2, '0')}-${safeEnd.getFullYear()}`;
            const displayString = `${m.activity || `Milestone ${idx + 1}`} (${dateString})`;

            generatedTasks.push({
                start: safeStart,
                end: safeEnd,
                name: displayString,
                originalName: m.activity || `Milestone ${idx + 1}`,
                id: taskId,
                type: 'task',
                progress,
                isDisabled: true, // Read-only Gantt
                dependencies: previousId ? [previousId] : [], // Link sequentially
                styles: { 
                    progressColor: solidColor, 
                    progressSelectedColor: solidColor,
                    backgroundColor: solidColor,
                    backgroundSelectedColor: solidColor
                },
                // Extra fields for analytics tooltip
                delayInDays: m.delayInDays || 0,
                responsibility: m.responsibility || 'Unassigned',
                remarks: m.remarks || '',
                planStart: m.planStart,
                planEnd: m.planEnd,
                actualStart: m.actualStart,
                actualEnd: m.actualEnd
            });

            previousId = taskId;
        });

        const overallCompletion = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
        const healthStatus = totalDelay > 10 ? 'At Risk' : totalDelay > 0 ? 'Needs Attention' : 'Healthy';

        return { 
            tasks: generatedTasks, 
            analytics: { totalTasks, completedCount, totalDelay, overallCompletion, healthStatus }
        };
    }, [milestones]);

    if (!tasks || tasks.tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-16 h-16 bg-gray-200 rounded-full mb-4 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <p className="text-gray-500 font-medium">Insufficient Date Data</p>
                <p className="text-gray-400 text-sm mt-1">Please ensure tasks have Start and End dates to generate Gantt timeline.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col h-full">
            <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4 flex-shrink-0">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 tracking-tight">Project Timeline Gantt</h3>
                    <p className="text-xs text-gray-500">Visual mapping of milestones and dependencies</p>
                </div>
                <Segmented 
                    options={[
                        { label: 'Day', value: ViewMode.Day },
                        { label: 'Week', value: ViewMode.Week },
                        { label: 'Month', value: ViewMode.Month }
                    ]} 
                    value={view} 
                    onChange={setView}
                    className="font-semibold shadow-sm"
                />
            </div>
            <div className="flex gap-4 mb-4 flex-shrink-0">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex-1">
                    <p className="text-blue-600 text-[10px] font-bold uppercase tracking-wider mb-1">Overall Completion</p>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-blue-900">{tasks.analytics?.overallCompletion}%</span>
                        <span className="text-xs text-blue-700 font-medium mb-1">({tasks.analytics?.completedCount}/{tasks.analytics?.totalTasks} Milestones)</span>
                    </div>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 flex-1">
                    <p className="text-red-600 text-[10px] font-bold uppercase tracking-wider mb-1">Total Delay Impact</p>
                    <div className="flex items-end gap-2">
                        <span className="text-2xl font-bold text-red-900">{tasks.analytics?.totalDelay}</span>
                        <span className="text-xs text-red-700 font-medium mb-1">Days Total</span>
                    </div>
                </div>
                <div className={`border rounded-lg p-3 flex-1 ${
                    tasks.analytics?.healthStatus === 'Healthy' ? 'bg-green-50 border-green-100' :
                    tasks.analytics?.healthStatus === 'At Risk' ? 'bg-red-50 border-red-100' :
                    'bg-amber-50 border-amber-100'
                }`}>
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                        tasks.analytics?.healthStatus === 'Healthy' ? 'text-green-600' :
                        tasks.analytics?.healthStatus === 'At Risk' ? 'text-red-600' :
                        'text-amber-600'
                    }`}>Project Health</p>
                    <span className={`text-xl font-bold ${
                        tasks.analytics?.healthStatus === 'Healthy' ? 'text-green-900' :
                        tasks.analytics?.healthStatus === 'At Risk' ? 'text-red-900' :
                        'text-amber-900'
                    }`}>{tasks.analytics?.healthStatus}</span>
                </div>
            </div>

            <div className="gantt-container flex-1 overflow-auto rounded-lg border border-gray-100 shadow-inner bg-gray-50/30">
                <Gantt
                    tasks={tasks.tasks}
                    viewMode={view}
                    listCellWidth={"180px"}
                    columnWidth={view === ViewMode.Month ? 200 : view === ViewMode.Week ? 150 : 60}
                    rowHeight={55}
                    barCornerRadius={4}
                    fontFamily="Inter, Arial, sans-serif"
                    fontSize="11px"
                    headerHeight={50}
                    todayColor="rgba(252, 165, 165, 0.2)"
                    barBackgroundColor="#e2e8f0"
                    TaskListHeader={({ headerHeight, fontFamily, fontSize }) => (
                        <div style={{ height: headerHeight, fontFamily, fontSize }} className="bg-red-50 flex items-center px-4 border-b border-r border-gray-200">
                            <span className="text-red-500 font-bold tracking-widest text-[10px] uppercase">Schedule / Project</span>
                        </div>
                    )}
                    TaskListTable={({ rowWidth, rowHeight, tasks: tblTasks, fontFamily, fontSize }) => (
                        <div style={{ width: rowWidth, fontFamily, fontSize }} className="border-r border-gray-200 bg-white">
                            {tblTasks.map(t => (
                                <div key={t.id} style={{ height: rowHeight }} className="flex flex-col justify-center px-4 border-b border-gray-100">
                                    <span className="font-bold text-gray-700 text-xs truncate" title={t.originalName}>{t.originalName}</span>
                                    <span className="text-[9px] text-gray-400 uppercase mt-0.5 tracking-wider truncate">SEQ: {t.id.split('-')[1]}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    TooltipContent={({ task }) => (
                        <div className="bg-white p-4 rounded-xl shadow-2xl border border-gray-100 min-w-[280px] z-50">
                            <div className="flex justify-between items-start border-b pb-3 mb-3">
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">{task.name}</p>
                                    <p className="text-[11px] text-gray-500 font-medium flex items-center gap-1 mt-1">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                        {task.responsibility}
                                    </p>
                                </div>
                                <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider ${
                                    task.progress === 100 ? 'bg-green-100 text-green-700' :
                                    task.delayInDays > 0 ? 'bg-red-100 text-red-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                    {task.progress === 100 ? 'Done' : task.delayInDays > 0 ? 'Delayed' : 'On Track'}
                                </span>
                            </div>
                            
                            <div className="space-y-2 mb-3">
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-gray-500">Plan:</span>
                                    <span className="font-medium text-gray-700">{task.planStart ? dayjs(task.planStart).format('DD MMM') : '-'} to {task.planEnd ? dayjs(task.planEnd).format('DD MMM') : '-'}</span>
                                </div>
                                <div className="flex justify-between text-[11px]">
                                    <span className="text-gray-500">Actual:</span>
                                    <span className="font-medium text-gray-700">{task.actualStart ? dayjs(task.actualStart).format('DD MMM') : '-'} to {task.actualEnd ? dayjs(task.actualEnd).format('DD MMM') : (task.actualStart ? 'Ongoing' : 'Pending')}</span>
                                </div>
                            </div>
                            
                            {task.delayInDays > 0 && (
                                <div className="bg-red-50 text-red-700 text-xs p-2 rounded-md font-medium border border-red-100 mb-2">
                                    ⚠️ Delayed by {task.delayInDays} Days
                                </div>
                            )}
                            
                            {task.remarks && (
                                <p className="text-[10px] text-gray-500 italic bg-gray-50 p-2 rounded border border-gray-100 mt-2">
                                    "{task.remarks}"
                                </p>
                            )}
                        </div>
                    )}
                />
            </div>
            
            <div className="mt-4 flex flex-shrink-0 items-center justify-end gap-4 text-xs font-medium border-t border-gray-100 pt-3">
                <div className="flex items-center gap-1.5 text-gray-500">
                    <span>Chart rendering with dynamic task-specific color coding and date-embedded labels</span>
                </div>
            </div>
        </div>
    );
};

export default ProjectGanttChart;
