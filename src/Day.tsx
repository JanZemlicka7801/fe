import React from 'react';
import Slot from './Slot';

interface DayProps {
    date: Date;
    dayBookings: boolean[];
    toggleSlot: (dayStr: string, slotIndex: number) => void;
}

const Day: React.FC<DayProps> = ({ date, dayBookings, toggleSlot }) => {
    const breakIndexes = [3, 6, 7];
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = date.toDateString();

    const slotTimes = [
        '8:00 AM', '9:00 AM', '10:00 AM', '10:15 AM',
        '11:15 AM', '12:15 PM', '12:30 PM', '1:00 PM'
    ];

    return (
        <div className="card h-100">
            <div className="card-header">
                <h5 className="mb-0">{dayName}</h5>
            </div>
            <div className="card-body d-flex flex-column gap-2">
                {slotTimes.map((time, idx) => (
                    <Slot
                        key={idx}
                        time={time}
                        isBooked={dayBookings[idx]}
                        isBreak={breakIndexes.includes(idx)}
                        onClick={() => toggleSlot(dateStr, idx)}
                    />
                ))}
            </div>
        </div>
    );
};

export default Day;