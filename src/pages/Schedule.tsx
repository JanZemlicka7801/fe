import React, { useEffect, useMemo, useState } from 'react';
import Day from './Day';
import { useAuth } from '../contexts/AuthContext';
import { Booking, slotTimes, generateWeeks } from './utils';
import { fetchAllBookedClasses, bookClass, cancelClass } from '../services/bookingService';

declare global { interface Window { __ENV__?: Record<string, string>; } }

const parseSlotTime = (slot: string) => {
    const [timePart, ampm] = slot.split(' ');
    let [hour, minute] = timePart.split(':').map(Number);
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    return { hour, minute };
};
const pad = (n: number) => String(n).padStart(2, '0');
const toLocalDateTimeString = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

const SLOT_MINUTES = 45;
const ENV: Record<string, string> =
    ((typeof import.meta !== 'undefined' && (import.meta as any).env) || {}) as any;
const DEFAULT_INSTRUCTOR_ID =
    ENV.VITE_DEFAULT_INSTRUCTOR_ID ||
    (window.__ENV__ && window.__ENV__.VITE_DEFAULT_INSTRUCTOR_ID) ||
    '11111111-1111-1111-1111-111111111111';

type ApiBooked = {
    id: string;
    start: string;
    end: string;
    instructorId: string;
    learnerId: string | null;
    cancelled?: boolean;
};

const toUIBooking = (api: ApiBooked): Booking => {
    const base: Booking = {
        id: api.id,
        date: api.start,
        teacher: '',
        car: '',
        learnerId: api.learnerId ?? '',
        learnerFirstName: (api as any).learnerFirstName ?? '',
        learnerLastName: (api as any).learnerLastName ?? '',
    };
    (base as any).cancelled = !!(api as any).cancelled;
    (base as any).instructorId = api.instructorId;
    return base;
};

type BookingsGrid = Record<number, Record<string, (Booking | null)[]>>;

const Schedule: React.FC = () => {
    const auth = useAuth() as any;
    const { user, token } = auth;
    const roleRaw = String(user?.role ?? '');
    const isStudentView = /^(student|learner)$/i.test(roleRaw);
    const allWeeks = useMemo(() => generateWeeks(), []);
    const role = user?.role ?? '';
    const isStudent = role === 'STUDENT';
    const weeks = useMemo(() => (isStudentView ? allWeeks.slice(0, 2) : allWeeks), [allWeeks, isStudentView]);
    const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
    const [bookings, setBookings] = useState<BookingsGrid>({});
    const buildEmptyGrid = (): BookingsGrid => {
        const grid: BookingsGrid = {};
        weeks.forEach((week: Date[], wIdx: number) => {
            grid[wIdx] = {};
            week.forEach((cell: any) => {
                const d: Date = new Date(cell?.date ?? cell);
                grid[wIdx][d.toDateString()] = Array(slotTimes.length).fill(null);
            });
        });
        return grid;
    };

    useEffect(() => {
        setCurrentWeekIndex(i => Math.min(i, weeks.length - 1));
    }, [weeks.length]);

    useEffect(() => {
        if (!token) return;

        const grid = buildEmptyGrid();

        const firstCell: any = weeks[0][0];
        const lastRow = weeks[weeks.length - 1];
        const lastCell: any = lastRow[lastRow.length - 1];

        const from = new Date(firstCell?.date ?? firstCell); from.setHours(0, 0, 0, 0);
        const to = new Date(lastCell?.date ?? lastCell); to.setHours(23, 59, 59, 999);

        (async () => {
            try {
                const all = (await fetchAllBookedClasses(
                    token,
                    toLocalDateTimeString(from),
                    toLocalDateTimeString(to)
                )) as ApiBooked[];

                const filled = { ...grid };

                all.forEach((bc) => {
                    const dt = new Date(bc.start);
                    const dayStr = dt.toDateString();
                    const slotIdx = slotTimes.findIndex((s) => {
                        const { hour, minute } = parseSlotTime(s);
                        return dt.getHours() === hour && dt.getMinutes() === minute;
                    });
                    if (slotIdx < 0) return;

                    for (let w = 0; w < weeks.length; w++) {
                        if (weeks[w].some((cell: any) => new Date(cell?.date ?? cell).toDateString() === dayStr)) {
                            if (!filled[w][dayStr]) filled[w][dayStr] = Array(slotTimes.length).fill(null);
                            filled[w][dayStr][slotIdx] = toUIBooking(bc);
                            break;
                        }
                    }
                });

                setBookings(filled);
            } catch (e) {
                console.error('Failed to load booked classes:', e);
            }
        })();
    }, [token, weeks]);

    const handleSlotToggle = async (dayStr: string, slotIndex: number) => {
        if (!token || !user) return;

        const isAdmin = user.role === 'ADMIN';
        const isInstructor = user.role === 'INSTRUCTOR';
        const isStudent = /^(student|learner)$/i.test(String(user.role ?? ''));
        const current = bookings[currentWeekIndex]?.[dayStr]?.[slotIndex] ?? null;

        if (current) {
            const isVacation = Boolean((current as any)?.cancelled);
            const madeByThisInstructor = (current as any)?.instructorId === user.id;
            const mine = !!current && (current.learnerId === user?.id || current.learnerId === user?.learner?.id);

            const canCancel =
                isAdmin ||
                (isVacation && isInstructor && madeByThisInstructor) ||
                (!isVacation && mine);

            if (!canCancel) return;

            try {
                await cancelClass(token, current.id);
                setBookings((prev) => {
                    const copy = { ...prev };
                    const arr = [...(copy[currentWeekIndex][dayStr] ?? Array(slotTimes.length).fill(null))];
                    arr[slotIndex] = null;
                    copy[currentWeekIndex] = { ...copy[currentWeekIndex], [dayStr]: arr };
                    return copy;
                });
            } catch (e) {
                console.error('Cancel failed:', e);
            }
            return;
        }

        const day = new Date(dayStr);
        const { hour, minute } = parseSlotTime(slotTimes[slotIndex]);
        const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, 0);
        const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);
        const existingDay = bookings[currentWeekIndex]?.[dayStr] ?? [];
        const inferred = (existingDay.find(b => !!b) as any)?.instructorId;
        const instructorId = String(isInstructor ? user.id : inferred || DEFAULT_INSTRUCTOR_ID);

        try {
            let apiBooked;
            if (isAdmin || isInstructor) {
                apiBooked = await bookClass(
                    token,
                    instructorId,
                    toLocalDateTimeString(start),
                    toLocalDateTimeString(end),
                    { vacation: true }
                );
            } else if (isStudent) {
                apiBooked = await bookClass(
                    token,
                    instructorId,
                    toLocalDateTimeString(start),
                    toLocalDateTimeString(end)
                );
            } else {
                console.error('Unknown role');
                return;
            }

            const booked = toUIBooking(apiBooked as any);

            setBookings((prev) => {
                const copy = { ...prev };
                const arr = [...(copy[currentWeekIndex][dayStr] ?? Array(slotTimes.length).fill(null))];
                arr[slotIndex] = booked;
                copy[currentWeekIndex] = { ...copy[currentWeekIndex], [dayStr]: arr };
                return copy;
            });
        } catch (e) {
            console.error('Booking failed:', e);
        }
    };

    return (
        <div>
            <div className="week-navigation mb-3 d-flex align-items-center gap-2">
                <button
                    className="btn btn-outline-secondary"
                    onClick={() => setCurrentWeekIndex((i) => Math.max(i - 1, 0))}
                    disabled={currentWeekIndex === 0}
                >
                    ◀ Previous
                </button>
                <span className="fw-bold">
          {currentWeekIndex === 0 ? 'This Week' : currentWeekIndex === 1 ? 'Next Week' : 'Week After'}
        </span>
                <button
                    className="btn btn-outline-secondary"
                    onClick={() => setCurrentWeekIndex((i) => Math.min(i + 1, weeks.length - 1))}
                    disabled={currentWeekIndex === weeks.length - 1}
                >
                    Next ▶
                </button>
            </div>

            <div className="row row-cols-1 row-cols-md-5 g-3 align-items-stretch">
                {weeks[currentWeekIndex].map((cell: any) => {
                    const day: Date = new Date(cell?.date ?? cell);
                    return (
                        <div className="col d-flex" key={day.toDateString()}>
                            <Day
                                date={day}
                                dayBookings={
                                    bookings[currentWeekIndex]?.[day.toDateString()] ?? Array(slotTimes.length).fill(null)
                                }
                                toggleSlot={handleSlotToggle}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Schedule;