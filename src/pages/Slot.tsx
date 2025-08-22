import React from 'react';

interface SlotProps {
    time: string;
    isBooked: boolean;
    isBreak: boolean;
    onClick: () => void;
    hasUserBooked: boolean;
}

const Slot: React.FC<SlotProps> = ({ time, isBooked, isBreak, onClick, hasUserBooked }) => {
    let className = 'btn w-100 btn-slot';
    if (isBreak) className += ' btn-break';
    else if (hasUserBooked) className += ' btn-user-booked';
    else if (isBooked) className += ' btn-booked';
    else className += ' btn-available';

    return (
        <button
            className={className}
            onClick={isBreak || isBooked ? undefined : onClick}
            disabled={isBreak || isBooked}
        >
            {isBooked ? 'Booked' : time}
        </button>
    );
};

export default Slot;