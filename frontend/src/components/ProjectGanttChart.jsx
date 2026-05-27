import React, { useState, useMemo } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { Segmented } from 'antd';
import dayjs from 'dayjs';

const ProjectGanttChart = ({ milestones }) => {
    const [view, setView] = useState(ViewMode.Day);

    const tasks = useMemo(() => {
        if (!milestones || milestones.length === 0) return [];
        
        const generatedTasks = [];
        let previousId = null;

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
            } else if (m.actualStart) {
                progress = 50;
            }

            // Determine color based on status/delay
            let progressColor = '#2563eb'; // Blue for normal
            let bgColor = '#bfdbfe';
            
            if (m.delayInDays > 0 && progress < 100) {
                progressColor = '#dc2626'; // Red for delayed
                bgColor = '#fecaca';
            } else if (progress === 100) {
                progressColor = '#16a34a'; // Green for completed
                bgColor = '#bbf7d0';
            }

            const taskId = `Task-${idx}`;
            
            generatedTasks.push({
                start: safeStart,
                end: safeEnd,
                name: m.activity || `Milestone ${idx + 1}`,
                id: taskId,
                type: 'task',
                progress,
                isDisabled: true, // Read-only Gantt
                dependencies: previousId ? [previousId] : [], // Link sequentially
                styles: { 
                    progressColor, 
                    progressSelectedColor: progressColor,
                    backgroundColor: bgColor,
                    backgroundSelectedColor: bgColor
                },
            });

            previousId = taskId;
        });

        return generatedTasks;
    }, [milestones]);

    if (tasks.length === 0) {
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
            <div className="gantt-container flex-1 overflow-auto rounded-lg border border-gray-100 shadow-inner bg-gray-50/30">
                <Gantt
                    tasks={tasks}
                    viewMode={view}
                    listCellWidth={"155px"}
                    columnWidth={view === ViewMode.Month ? 200 : view === ViewMode.Week ? 150 : 60}
                    rowHeight={45}
                    barCornerRadius={6}
                    fontFamily="Inter, Arial, sans-serif"
                    fontSize="12px"
                    headerHeight={50}
                    todayColor="rgba(252, 165, 165, 0.2)"
                    barBackgroundColor="#e2e8f0"
                    barProgressColor="#1E2761"
                    barProgressSelectedColor="#990011"
                    TooltipContent={({ task }) => (
                        <div className="bg-white p-3 rounded-lg shadow-xl border border-gray-100 min-w-[200px]">
                            <p className="font-bold text-gray-800 text-[13px] border-b pb-2 mb-2">{task.name}</p>
                            <p className="text-[11px] text-gray-600">Start: <span className="font-bold">{dayjs(task.start).format('DD MMM YYYY')}</span></p>
                            <p className="text-[11px] text-gray-600 mt-1">End: <span className="font-bold">{dayjs(task.end).format('DD MMM YYYY')}</span></p>
                            <div className="mt-2 pt-2 border-t">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                    task.progress === 100 ? 'bg-green-100 text-green-700' :
                                    task.progress > 0 ? 'bg-amber-100 text-amber-700' :
                                    'bg-gray-100 text-gray-700'
                                }`}>
                                    {task.progress}% Complete
                                </span>
                            </div>
                        </div>
                    )}
                />
            </div>
            
            <div className="mt-4 flex flex-shrink-0 items-center justify-end gap-4 text-xs font-medium border-t border-gray-100 pt-3">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-[#16a34a]"></div>
                    <span className="text-gray-600">Completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-[#2563eb]"></div>
                    <span className="text-gray-600">On Track</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm bg-[#dc2626]"></div>
                    <span className="text-gray-600">Delayed</span>
                </div>
            </div>
        </div>
    );
};

export default ProjectGanttChart;
