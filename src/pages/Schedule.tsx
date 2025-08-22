import React, { useState, useEffect } from 'react';
import Day from './Day';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Booking, BookingPayload } from './utils';
import { fetchAllBookedClasses } from '../services/bookingService';

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

export const slotTimes = [
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

const Schedule: React.FC = () => {
    const { user, token } = useAuth();
    const weeks = generateWeeks();
    const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
    const [bookings, setBookings] = useState<Record<number, Record<string, boolean[]>>>({});
    const [userBookings, setUserBookings] = useState<Record<number, Record<string, boolean[]>>>({});

    const isAuthReady = Boolean(
        user &&
        token &&
        user.learner &&
        user.learner.id
    );

    useEffect(() => {
        const fetchBookedClasses = async () => {
            if (!isAuthReady || !user || !user.learner || !token) {
                console.warn('Auth not ready or missing info, skipping fetch.');
                return;
            }

            const currentWeekDays = weeks[currentWeekIndex];
            const startDate = new Date(currentWeekDays[0]);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(currentWeekDays[currentWeekDays.length - 1]);
            endDate.setHours(23, 59, 59, 999);

            try {
                const bookedClasses = await fetchAllBookedClasses (
                    token,
                    startDate,
                    endDate
                );
                updateBookings(bookedClasses);
            } catch (error) {
                console.error('Error fetching booked classes:', error);
            }
        };

        fetchBookedClasses();
    }, [token, user, isAuthReady, currentWeekIndex]);

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

        if (!user || !user.learner) {
            console.error('User or learner information is missing.');
            return;
        }

        const newBooking: BookingPayload = {
            time: localDateTime.toISOString(),
            date: selectedDay.toISOString().split('T')[0],
            groupName: 'DefaultGroup',
            learnerId: user.learner.id
        };

        try {
            const response = await axios.post(`http://localhost:8080/api/classes/book`, newBooking, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log('Booking successful:', response.data);

            const updatedBookings = { ...bookings };
            const updatedUserBookings = { ...userBookings };

            if (!updatedBookings[currentWeekIndex]) {
                updatedBookings[currentWeekIndex] = {};
            }
            if (!updatedBookings[currentWeekIndex][dayStr]) {
                updatedBookings[currentWeekIndex][dayStr] = Array(11).fill(false);
            }
            updatedBookings[currentWeekIndex][dayStr][slotIndex] = true;

            if (!updatedUserBookings[currentWeekIndex]) {
                updatedUserBookings[currentWeekIndex] = {};
            }
            if (!updatedUserBookings[currentWeekIndex][dayStr]) {
                updatedUserBookings[currentWeekIndex][dayStr] = Array(11).fill(false);
            }
            updatedUserBookings[currentWeekIndex][dayStr][slotIndex] = true;

            setBookings(updatedBookings);
            setUserBookings(updatedUserBookings);

        } catch (error) {
            console.error('Error booking class:', error);
        }
    };

    const updateBookings = (bookedClasses: Booking[]) => {
        const newBookings: Record<number, Record<string, boolean[]>> = {};
        const newUserBookings: Record<number, Record<string, boolean[]>> = {};

        bookedClasses.forEach(bookedClass => {
            const date = new Date(bookedClass.date);
            const week = weeks.find(w => w.some(day => day.toDateString() === date.toDateString()));
            if (!week) return;

            const weekIndex = weeks.findIndex(w => w[0].toDateString() === week[0].toDateString());
            const dayStr = date.toDateString();

            if (!newBookings[weekIndex]) {
                newBookings[weekIndex] = {};
            }
            if (!newBookings[weekIndex][dayStr]) {
                newBookings[weekIndex][dayStr] = Array(11).fill(false);
            }

            const time = new Date(bookedClass.time);
            const slotIndex = slotTimes.findIndex(slot => {
                const [timePart, ampm] = slot.split(' ');
                let [hour, minute] = timePart.split(':').map(Number);
                if (ampm === 'PM' && hour !== 12) hour += 12;
                if (ampm === 'AM' && hour === 12) hour = 0;
                return time.getHours() === hour && time.getMinutes() === minute;
            });

            if (slotIndex !== -1) {
                newBookings[weekIndex][dayStr][slotIndex] = true;

                if (user && bookedClass.learnerId === user.learner.id) {
                    if (!newUserBookings[weekIndex]) {
                        newUserBookings[weekIndex] = {};
                    }
                    if (!newUserBookings[weekIndex][dayStr]) {
                        newUserBookings[weekIndex][dayStr] = Array(11).fill(false);
                    }
                    newUserBookings[weekIndex][dayStr][slotIndex] = true;
                }
            }
        });

        setBookings(prev => ({ ...prev, ...newBookings }));
        setUserBookings(prev => ({ ...prev, ...newUserBookings }));
    };

    return (
        <div>
            <div className="week-navigation mb-3">
                <button
                    className="btn btn-outline-secondary me-2"
                    onClick={() => setCurrentWeekIndex(prev => Math.max(prev - 1, 0))}
                    disabled={currentWeekIndex === 0}
                >
                    ◀ Previous
                </button>
                <span className="fw-bold">
                    {currentWeekIndex === 0 ? 'This Week' : currentWeekIndex === 1 ? 'Next Week' : 'Week After'}
                </span>
                <button
                    className="btn btn-outline-secondary ms-2"
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
                            dayBookings={(bookings[currentWeekIndex]?.[day.toDateString()] ?? Array(11).fill(false))}
                            hasUserBooked={(userBookings[currentWeekIndex]?.[day.toDateString()] ?? Array(11).fill(false))}
                            toggleSlot={handleSlotToggle}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Schedule;