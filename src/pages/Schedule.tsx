import React, { useEffect, useMemo, useState } from 'react';
import Day from './Day';
import { useAuth } from '../contexts/AuthContext';
import { Booking, slotTimes, generateWeeks } from './utils';
import { fetchAllBookedClasses, bookClass, cancelClass } from '../services/bookingService';
import { HttpError } from '../services/api';
import { parseSlotTime } from './Day';

declare global { interface Window { __ENV__?: Record<string, string>; } }

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

const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const isFridayAfter5 = () => {
    const now = new Date();
    return now.getDay() === 5 && now.getHours() >= 17;
};
const shiftWeeksView = (weeksRaw: Date[][], want: number) => {
    const dropped = weeksRaw.slice(1);
    const last = dropped[dropped.length - 1] ?? weeksRaw[weeksRaw.length - 1];
    const nextWeek = last.map((d) => addDays(d, 7));
    const extended = [...dropped, nextWeek];
    return extended.slice(0, want);
};

function Banner({
                    text,
                    kind = 'info',
                    onClose,
                }: {
    text: string;
    kind?: 'info' | 'warning' | 'error';
    onClose?: () => void;
}) {
    if (!text) return null;
    const cls =
        kind === 'warning' ? 'banner warning' : kind === 'error' ? 'banner error' : 'banner info';
    return (
        <div className={cls} role="status" aria-live="polite">
            <span>{text}</span>
            <button aria-label="Close notification" onClick={onClose}>
                ×
            </button>
        </div>
    );
}

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
    const wantWeeks = isStudentView ? 2 : 3;
    const allWeeks = useMemo(() => generateWeeks(), []);
    const weeks = useMemo(() => {
        const raw = allWeeks as Date[][];
        if (isFridayAfter5()) {
            return shiftWeeksView(raw, wantWeeks);
        }
        return raw.slice(0, wantWeeks);
    }, [allWeeks, wantWeeks]);
    const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
    const [bookings, setBookings] = useState<BookingsGrid>({});

    const [notice, setNotice] = useState<string | null>(null);
    const [noticeKind, setNoticeKind] = useState<'info' | 'warning' | 'error'>('info');

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
        setCurrentWeekIndex((i) => Math.min(i, weeks.length - 1));
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
                setNoticeKind('error');
                setNotice('Failed to load schedule.');
            }
        })();
    }, [token, weeks]);

    useEffect(() => {
        if (!notice) return;
        const t = setTimeout(() => setNotice(null), 6000);
        return () => clearTimeout(t);
    }, [notice]);

    const handleSlotToggle = async (dayStr: string, slotIndex: number) => {
        if (!token || !user) {
            setNoticeKind('error');
            setNotice('You must be signed in to book.');
            return;
        }

        const isAdmin = user.role === 'ADMIN';
        const isInstructor = user.role === 'INSTRUCTOR';
        const isStudent = /^(student|learner)$/i.test(String(user.role ?? ''));
        const current = bookings[currentWeekIndex]?.[dayStr]?.[slotIndex] ?? null;

        // CANCEL existing booking
        if (current) {
            const isVacation = Boolean((current as any)?.cancelled);
            const madeByThisInstructor = (current as any)?.instructorId === user.id;
            const mine = !!current && (current.learnerId === user?.id || current.learnerId === user?.learner?.id);

            const canCancel =
                isAdmin ||
                (isInstructor && (isVacation ? madeByThisInstructor : true)) || // instructors can cancel their own; adjust if needed
                (!isVacation && mine);

            if (!canCancel) {
                setNoticeKind('warning');
                setNotice('You cannot cancel this class.');
                return;
            }

            // 12h cutoff applies to LEARNERS only
            if (!isAdmin && !isInstructor && mine) {
                const startsAtISO = (current as any)?.start || (current as any)?.date;
                const startsAt = new Date(startsAtISO);
                const diffMs = startsAt.getTime() - Date.now();
                if (!(startsAt instanceof Date && !isNaN(startsAt.getTime()))) {
                    setNoticeKind('error');
                    setNotice('Cannot determine class start time.');
                    return;
                }
                if (diffMs < 12 * 60 * 60 * 1000) {
                    setNoticeKind('warning');
                    setNotice('You cannot cancel less than 12 hours before start.');
                    return;
                }
            }

            try {
                await cancelClass(token, current.id);
                setBookings((prev) => {
                    const copy = { ...prev };
                    const arr = [...(copy[currentWeekIndex][dayStr] ?? Array(slotTimes.length).fill(null))];
                    arr[slotIndex] = null;
                    copy[currentWeekIndex] = { ...copy[currentWeekIndex], [dayStr]: arr };
                    return copy;
                });
                setNoticeKind('info');
                setNotice('Class canceled.');
            } catch (e: any) {
                if (e instanceof HttpError && e.status === 409) {
                    setNoticeKind('warning');
                    setNotice(e.message);
                    return;
                }
                setNoticeKind('error');
                setNotice(e?.message ? String(e.message) : 'Cancel failed.');
            }
            return;
        }

        // BOOK new slot
        const day = new Date(dayStr);
        const { hour, minute } = parseSlotTime(slotTimes[slotIndex]);
        const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, 0);
        const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);
        const existingDay = bookings[currentWeekIndex]?.[dayStr] ?? [];
        const inferred = (existingDay.find((b) => !!b) as any)?.instructorId;
        const instructorId = String(isInstructor ? user.id : inferred || DEFAULT_INSTRUCTOR_ID);

        try {
            let apiBooked;
            if (isAdmin || isInstructor) {
                apiBooked = await bookClass(
                    token, instructorId, toLocalDateTimeString(start), toLocalDateTimeString(end), { vacation: true }
                );
            } else if (isStudent) {
                apiBooked = await bookClass(
                    token, instructorId, toLocalDateTimeString(start), toLocalDateTimeString(end)
                );
            } else {
                setNoticeKind('error');
                setNotice('Unknown role.');
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
            setNoticeKind('info');
            setNotice('Class booked.');
        } catch (e: any) {
            if (e instanceof HttpError && e.status === 409) {
                setNoticeKind('warning');
                setNotice(e.message);
                return;
            }
            console.error('Booking failed:', e);
            setNoticeKind('error');
            setNotice(e?.message ? String(e.message) : 'Booking failed.');
        }
    };

    return (
        <div>
            <Banner text={notice ?? ''} kind={noticeKind} onClose={() => setNotice(null)} />

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
