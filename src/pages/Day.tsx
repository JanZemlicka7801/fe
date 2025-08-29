import React from 'react';
import Slot from './Slot';
import { slotTimes } from './utils';
import { Booking } from './utils';

interface DayProps {
    date: Date;
    dayBookings: (Booking | null)[];
    toggleSlot: (dayStr: string, slotIndex: number) => void;
}

const Day: React.FC<DayProps> = ({ date, dayBookings, toggleSlot }) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dateShort = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dateStr = date.toDateString();
    const isPastDay = date.getTime() < Date.now();

    const breakIndexes = [2, 5, 8];

    return (
        <div className="card h-100">
            <div className="card-header flex-column">
                <h5 className="mb-1">{dateShort}</h5>
                <small className="text-muted">{dayName}</small>
            </div>
            <div className="card-body d-flex flex-column gap-2">
                {slotTimes.map((time, slotIndex) => (
                    <Slot
                        key={slotIndex}
                        time={time}
                        slotBooking={dayBookings[slotIndex]}
                        isBreak={breakIndexes.includes(slotIndex)}
                        onClick={() => !isPastDay && toggleSlot(dateStr, slotIndex)}
                    />
                ))}
            </div>
        </div>
    );
};

export default Day;