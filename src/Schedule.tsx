import React, { useState, useEffect } from 'react';
import Day from './Day';

interface ScheduleProps {
    bookings: Record<number, Record<string, boolean[]>>;
    setBookings: React.Dispatch<React.SetStateAction<Record<number, Record<string, boolean[]>>>>;
}

const getMonday = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
};

const generateWeeks = () => {
    const weeks = [];
    let monday = getMonday(new Date());
    for (let i = 0; i < 3; i++) {
        const weekDays = [];
        for (let j = 0; j < 5; j++) {
            const day = new Date(monday);
            day.setDate(monday.getDate() + j);
            weekDays.push(day);
        }
        weeks.push(weekDays);
        monday.setDate(monday.getDate() + 7);
    }
    return weeks;
};

const Schedule: React.FC<ScheduleProps> = ({ bookings, setBookings }) => {
    const weeks = generateWeeks();
    const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

    useEffect(() => {
        const fetchBookings = async () => {
            const data = {}; // Mock for now
            setBookings(prev => ({ ...prev, [currentWeekIndex]: data }));
        };
        fetchBookings();
    }, [currentWeekIndex, setBookings]);

    const handleSlotToggle = (dayStr: string, slotIndex: number) => {
        setBookings(prev => {
            const weekBookings = prev[currentWeekIndex] || {};
            const dayBookings = weekBookings[dayStr] || Array(11).fill(false);
            dayBookings[slotIndex] = !dayBookings[slotIndex];
            return {
                ...prev,
                [currentWeekIndex]: { ...weekBookings, [dayStr]: dayBookings },
            };
        });
    };

    return (
        <div>
            <div className="week-navigation">
                <button
                    className="btn-nav"
                    onClick={() => setCurrentWeekIndex(prev => Math.max(prev - 1, 0))}
                    disabled={currentWeekIndex === 0}
                >
                    ◀ Previous
                </button>
                <span>
                    {currentWeekIndex === 0 ? 'This Week' : currentWeekIndex === 1 ? 'Next Week' : 'Week After'}
                </span>
                <button
                    className="btn-nav"
                    onClick={() => setCurrentWeekIndex(prev => Math.min(prev + 1, 2))}
                    disabled={currentWeekIndex === 2}
                >
                    Next ▶
                </button>
            </div>

            <div className="row row-cols-1 row-cols-md-5 g-3 align-items-stretch">
                {weeks[currentWeekIndex].map(day => (
                    <div className="col d-flex" key={day.toDateString()}>
                        <Day
                            date={day}
                            dayBookings={(bookings[currentWeekIndex] || {})[day.toDateString()] || Array(11).fill(false)}
                            toggleSlot={handleSlotToggle}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Schedule;
