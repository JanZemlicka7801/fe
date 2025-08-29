import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Booking } from './utils';

interface SlotProps {
    time: string;
    slotBooking: Booking | null;
    isBreak: boolean;
    onClick: () => void;
}

const Slot: React.FC<SlotProps> = ({ time, slotBooking, isBreak, onClick }) => {
    const { user } = useAuth();
    const isBooked = slotBooking !== null;
    let text = time;
    let style: React.CSSProperties = {
        border: 'none',
        borderRadius: '0.25rem',
        padding: '1rem',
        fontWeight: 500,
        transition: 'all 0.2s ease',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        width: '100%',
    };

    if (isBreak) {
        style = {
            ...style,
            backgroundColor: '#e9ecef',
            color: '#6c757d',
            cursor: 'default',
        };
    } else if (isBooked) {
        if (user?.role === 'ADMIN') {
            text = `${slotBooking.learnerFirstName} ${slotBooking.learnerLastName}`;
            style = {
                ...style,
                backgroundColor: '#e63946',
                color: '#ffffff',
                cursor: 'pointer',
            };
        } else {
            text = 'Booked';
            style = {
                ...style,
                backgroundColor: '#e63946',
                color: '#ffffff',
                cursor: 'not-allowed',
            };
            if (slotBooking.learnerId === user?.learner?.id) {
                style = {
                    ...style,
                    backgroundColor: '#4361ee',
                    color: '#ffffff',
                    cursor: 'pointer', // Allow learners to view/cancel their own
                };
            }
        }
    } else {
        style = {
            ...style,
            backgroundColor: '#4895ef',
            color: '#ffffff',
            cursor: 'pointer',
        };
    }

    return (
        <button
            style={style}
            onClick={isBreak || (isBooked && user?.role !== 'ADMIN' && slotBooking.learnerId !== user?.learner?.id) ? undefined : onClick}
            disabled={isBreak || (isBooked && user?.role !== 'ADMIN' && slotBooking.learnerId !== user?.learner?.id)}
        >
            {text}
        </button>
    );
};

export default Slot;