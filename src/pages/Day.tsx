// Day.tsx
import React from 'react';
import Slot from './Slot';
import { slotTimes } from './utils';
import { Booking } from './utils';

// add locally
export const parseSlotTime = (slot: string) => {
    const [timePart, ampm] = slot.split(' ');
    let [hour, minute] = timePart.split(':').map(Number);
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    return { hour, minute };
};

interface DayProps {
    date: Date;
    dayBookings: (Booking | null)[];
    toggleSlot: (dayStr: string, slotIndex: number) => void;
}

const Day: React.FC<DayProps> = ({ date, dayBookings, toggleSlot }) => {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    const dateShort = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dateStr = date.toDateString();

    const breakIndexes = [2, 5, 8];

    return (
        <div className="card h-100">
            <div className="card-header flex-column">
                <h5 className="mb-1">{dateShort}</h5>
                <small className="text-muted">{dayName}</small>
            </div>
            <div className="card-body d-flex flex-column gap-2">
                {slotTimes.map((time, slotIndex) => {
                    const { hour, minute } = parseSlotTime(time);
                    const slotDt = new Date(date);
                    slotDt.setHours(hour, minute, 0, 0);
                    const isPastSlot = slotDt.getTime() < Date.now();

                    return (
                        <Slot
                            key={slotIndex}
                            time={time}
                            slotBooking={dayBookings[slotIndex]}
                            isBreak={breakIndexes.includes(slotIndex)}
                            onClick={() => !isPastSlot && toggleSlot(dateStr, slotIndex)}
                            isPastDay={isPastSlot} // keep prop name, value is per-slot
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default Day;