import React, { useEffect, useMemo, useState } from 'react';
import Day from './Day';
import { useAuth } from '../contexts/AuthContext';
import {
    Booking,
    slotTimes,
    generateWeeks,
    BookingPayload,
} from './utils';
import { fetchAllBookedClasses, bookClass } from '../services/bookingService';

const parseSlotTime = (slot: string) => {
    const [timePart, ampm] = slot.split(' ');
    let [hour, minute] = timePart.split(':').map(Number);
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    return { hour, minute };
};

// LocalDateTime string WITHOUT Z
const pad = (n: number) => String(n).padStart(2, '0');
const toLocalDateTimeString = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

const Schedule: React.FC = () => {
    const { user, token } = useAuth();

    const weeks = useMemo(() => generateWeeks(), []);
    const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

    const [bookings, setBookings] = useState<
        Record<number, Record<string, (Booking | null)[]>>
    >({});

    // Load booked classes
    useEffect(() => {
        if (!token || !user) return;
        (async () => {
            try {
                const from = weeks[0][0];
                const lastWeek = weeks[weeks.length - 1];
                const to = lastWeek[lastWeek.length - 1];

                const allBooked = await fetchAllBookedClasses(token, from, to);
                const newBookings: Record<number, Record<string, (Booking | null)[]>> = {};

                weeks.forEach((week, weekIndex) => {
                    const weekBookings: Record<string, (Booking | null)[]> = {};
                    week.forEach((day) => {
                        const dayStr = day.toDateString();
                        weekBookings[dayStr] = Array(slotTimes.length).fill(null);
                    });
                    newBookings[weekIndex] = weekBookings;
                });

                allBooked.forEach((booked) => {
                    const bookingDate = new Date(booked.date); // backend sends LocalDateTime (no Z)
                    const dayStr = bookingDate.toDateString();
                    const slotIndex = slotTimes.findIndex((slot) => {
                        const { hour, minute } = parseSlotTime(slot);
                        return bookingDate.getHours() === hour && bookingDate.getMinutes() === minute;
                    });
                    if (slotIndex !== -1) {
                        for (let i = 0; i < weeks.length; i++) {
                            if (weeks[i].some((d) => d.toDateString() === dayStr)) {
                                newBookings[i][dayStr][slotIndex] = booked;
                                break;
                            }
                        }
                    }
                });

                setBookings(newBookings);
            } catch (error) {
                console.error('Failed to load booked classes:', error);
            }
        })();
    }, [token, user, weeks]);

    const handleSlotToggle = async (dayStr: string, slotIndex: number) => {
        const selectedDay = new Date(dayStr);
        const selectedTime = slotTimes[slotIndex];
        const localDateTime = new Date(
            selectedDay.getFullYear(),
            selectedDay.getMonth(),
            selectedDay.getDate(),
            parseInt(selectedTime.split(':')[0]) + (selectedTime.includes('PM') && !selectedTime.startsWith('12') ? 12 : 0),
            parseInt(selectedTime.split(':')[1].split(' ')[0]),
            0
        );

        if (!user || !token) {
            console.error('User or token is missing.');
            return;
        }
        const learnerId = user.learner?.id;
        if (!learnerId) {
            console.error('Signed-in user has no learner profile.');
            return;
        }

        const payload: BookingPayload = {
            date: toLocalDateTimeString(localDateTime),
            teacher: 'Jiří Volkán',
            car: 'Skoda Camiq',
            learnerId,
        };

        try {
            const response = await bookClass(token, payload);
            if (!response) return;

            setBookings((prev) => {
                const updated = { ...prev };
                if (!updated[currentWeekIndex]) updated[currentWeekIndex] = {};
                if (!updated[currentWeekIndex][dayStr]) {
                    updated[currentWeekIndex][dayStr] = Array(slotTimes.length).fill(null);
                }
                updated[currentWeekIndex][dayStr][slotIndex] = response;
                return updated;
            });
        } catch (error) {
            console.error('Error booking class:', error);
        }
    };

    return (
        <div>
            <div className="week-navigation mb-3">
                <button
                    className="btn btn-outline-secondary me-2"
                    onClick={() => setCurrentWeekIndex((prev) => Math.max(prev - 1, 0))}
                    disabled={currentWeekIndex === 0}
                >
                    ◀ Previous
                </button>
                <span className="fw-bold">
          {currentWeekIndex === 0 ? 'This Week' : currentWeekIndex === 1 ? 'Next Week' : 'Week After'}
        </span>
                <button
                    className="btn btn-outline-secondary ms-2"
                    onClick={() => setCurrentWeekIndex((prev) => Math.min(prev + 1, 2))}
                    disabled={currentWeekIndex === 2}
                >
                    Next ▶
                </button>
            </div>

            <div className="row row-cols-1 row-cols-md-5 g-3 align-items-stretch">
                {weeks[currentWeekIndex].map((day: Date) => (
                    <div className="col d-flex" key={day.toDateString()}>
                        <Day
                            date={day}
                            dayBookings={
                                bookings[currentWeekIndex]?.[day.toDateString()] ?? Array(slotTimes.length).fill(null)
                            }
                            toggleSlot={handleSlotToggle}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Schedule;