import React from 'react';
import Slot from './Slot';

interface DayProps {
    date: Date;
    dayBookings: boolean[];
    toggleSlot: (dayStr: string, slotIndex: number) => void;
}

const Day: React.FC<DayProps> = ({ date, dayBookings, toggleSlot }) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dateShort = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dateStr = date.toDateString();

    const slotTimes = [
        '8:00 AM',
        '9:00 AM',
        '10:00 AM',
        '10:15 AM',
        '11:15 AM',
        '12:15 PM',
        '12:45 PM',
        '1:45 PM',
        '2:45 PM',
        '3:00 PM',
        '4:00 PM'
    ];

    const breakIndexes = [2, 5, 8]; // indexes of break slots

    return (
        <div className="card h-100">
            <div className="card-header flex-column">
                <h5 className="mb-1">{dateShort}</h5>
                <small className="text-muted">{dayName}</small>
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