import React, { useState, useEffect } from 'react';
import { Modal, Calendar, Badge, Spin, Alert, List, Tag, Empty } from 'antd';
import { CalendarDays, Package, Clock, Flag, CheckCircle2 } from 'lucide-react';
import dayjs from 'dayjs';
import api from '../../api/axiosConfig';

const DashboardCalendar = ({ open, onClose }) => {
    const [events, setEvents] = useState({});
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(dayjs());

    useEffect(() => {
        if (open) {
            fetchCalendarData();
        }
    }, [open]);

    const fetchCalendarData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/dashboard/calendar');
            setEvents(res.data);
        } catch (err) {
            console.error('Failed to fetch calendar events', err);
        } finally {
            setLoading(false);
        }
    };

    const onSelect = (date) => {
        setSelectedDate(date);
    };

    const dateCellRender = (value) => {
        const dateStr = value.format('YYYY-MM-DD');
        const dayEvents = events[dateStr] || [];
        
        if (dayEvents.length === 0) return null;

        return (
            <ul className="m-0 p-0 list-none flex gap-1 justify-end absolute bottom-1 right-1">
                {dayEvents.some(e => e.type === 'Creation') && (
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Request Created" />
                )}
                {dayEvents.some(e => e.type === 'Delivery') && (
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" title="Vendor Delivery" />
                )}
                {dayEvents.some(e => e.type === 'Milestone') && (
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Milestone" />
                )}
            </ul>
        );
    };

    const selectedDateStr = selectedDate.format('YYYY-MM-DD');
    const selectedEvents = events[selectedDateStr] || [];

    const getEventIcon = (type) => {
        switch(type) {
            case 'Creation': return <Package size={16} className="text-blue-500" />;
            case 'Delivery': return <Flag size={16} className="text-red-500" />;
            case 'Milestone': return <Clock size={16} className="text-amber-500" />;
            default: return <CheckCircle2 size={16} className="text-slate-400" />;
        }
    };

    return (
        <Modal
            title={<div className="flex items-center gap-2"><CalendarDays size={20} className="text-slate-600"/> Request & Delivery Calendar</div>}
            open={open}
            onCancel={onClose}
            width={900}
            footer={null}
            destroyOnClose
            className="calendar-modal"
            styles={{ body: { padding: 0 } }}
        >
            <div className="flex flex-col md:flex-row h-[550px]">
                {/* Left side: Calendar */}
                <div className="w-full md:w-2/3 p-4 border-r border-slate-100 overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center items-center h-full"><Spin size="large" /></div>
                    ) : (
                        <Calendar 
                            fullscreen={false} 
                            onSelect={onSelect} 
                            value={selectedDate}
                            cellRender={dateCellRender}
                            className="custom-calendar"
                        />
                    )}
                </div>

                {/* Right side: Event List */}
                <div className="w-full md:w-1/3 bg-slate-50 overflow-y-auto">
                    <div className="p-4 border-b border-slate-200 bg-white sticky top-0 z-10">
                        <h4 className="m-0 font-bold text-slate-800">{selectedDate.format('MMMM D, YYYY')}</h4>
                        <p className="text-xs text-slate-500 m-0 mt-1">{selectedEvents.length} events scheduled</p>
                    </div>
                    
                    <div className="p-4">
                        {selectedEvents.length === 0 ? (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No events for this date" />
                        ) : (
                            <div className="flex flex-col gap-3">
                                {selectedEvents.map((ev, i) => (
                                    <div key={i} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex gap-3 relative overflow-hidden group">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 group-hover:bg-blue-500 transition-colors" />
                                        <div className="mt-1">
                                            {getEventIcon(ev.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-0.5">
                                                {ev.type}
                                            </div>
                                            <div className="font-semibold text-slate-800 text-[13px] truncate" title={ev.title}>
                                                {ev.title}
                                            </div>
                                            <div className="text-[12px] text-slate-500 truncate mt-1">
                                                ID: <span className="font-mono text-slate-700">{ev.id}</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                <Tag color="blue" bordered={false} className="m-0 text-[10px]">{ev.phase}</Tag>
                                                {ev.department && <Tag color="default" bordered={false} className="m-0 text-[10px]">{ev.department}</Tag>}
                                            </div>
                                            {ev.vendor && (
                                                <div className="mt-2 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded">
                                                    Vendor: {ev.vendor}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <style>{`
                .custom-calendar .ant-picker-calendar-date {
                    height: 50px !important;
                }
                .custom-calendar .ant-picker-calendar-date-value {
                    text-align: center;
                }
            `}</style>
        </Modal>
    );
};

export default DashboardCalendar;
