import React from 'react';

interface SlotProps {
    time: string;
    isBooked: boolean;
    isBreak: boolean;
    onClick: () => void;
}

const Slot: React.FC<SlotProps> = ({ time, isBooked, isBreak, onClick }) => {
    let className = 'btn w-100 btn-slot';
    if (isBreak) className += ' btn-break';
    else if (isBooked) className += ' btn-booked';
    else className += ' btn-available';

    return (
        <button
            className={className}
            onClick={isBreak ? undefined : onClick}
            disabled={isBreak}
        >
            {time}
        </button>
    );
};

export default Slot;