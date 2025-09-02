import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Booking } from './utils';

type Props = {
    time: string;
    slotBooking: Booking | null;
    isBreak: boolean;
    onClick: () => void;
};

const Slot: React.FC<Props> = ({ time, slotBooking, isBreak, onClick }) => {
    const { user } = useAuth();
    const cancelled = Boolean((slotBooking as any)?.cancelled) || (!!slotBooking && !slotBooking.learnerId);
    const instructorId = (slotBooking as any)?.instructorId as string | undefined;
    const isBooked = !!slotBooking && !cancelled;
    const mine = !!slotBooking && slotBooking.learnerId === user?.learner?.id;
    const isAdmin = user?.role === 'ADMIN';
    const isInstructor = user?.role === 'INSTRUCTOR';
    const canCancelVacation =
        cancelled && (isAdmin || (isInstructor && instructorId === user?.id));
    const canCancelBooked = isBooked && (isAdmin || mine);
    const clickable = !isBreak && (canCancelVacation || canCancelBooked || !isBooked && !cancelled);

    let label = time;
    let style: React.CSSProperties = {
        border: 'none',
        borderRadius: '0.5rem',
        padding: '0.9rem',
        fontWeight: 600,
        textAlign: 'center',
        width: '100%',
        transition: 'transform .1s ease',
    };

    if (isBreak) {
        label = 'Break';
        style = { ...style, backgroundColor: '#e9ecef', color: '#6c757d', cursor: 'default' };
    } else if (cancelled) {
        label = 'Canceled';
        style = { ...style, backgroundColor: '#adb5bd', color: '#212529', cursor: clickable ? 'pointer' : 'not-allowed' };
    } else if (isBooked) {
        if (isAdmin) {
            const full = `${slotBooking!.learnerFirstName ?? ''} ${slotBooking!.learnerLastName ?? ''}`.trim();
            label = full || 'Booked';
            style = { ...style, backgroundColor: '#e63946', color: '#fff', cursor: 'pointer' };
        } else if (mine) {
            label = 'Booked (Instructor)';
            style = { ...style, backgroundColor: '#4361ee', color: '#fff', cursor: 'pointer' };
        } else {
            label = 'Booked';
            style = { ...style, backgroundColor: '#e63946', color: '#fff', cursor: 'not-allowed' };
        }
    } else {
        label = time;
        style = { ...style, backgroundColor: '#4895ef', color: '#fff', cursor: 'pointer' };
    }

    return (
        <button
            style={style}
            onClick={clickable ? onClick : undefined}
            disabled={!clickable}
            aria-label={label}
            title={label}
        >
            {label}
        </button>
    );
};

export default Slot;