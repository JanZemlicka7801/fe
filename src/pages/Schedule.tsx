import React, { useEffect, useMemo, useState } from 'react';
import Day, { parseSlotTime } from './Day';
import { useAuth } from '../contexts/AuthContext';
import { Booking, slotTimes, generateWeeks } from './utils';
import {
    fetchAllBookedClasses,
    bookClass,
    cancelClass
} from '../services/bookingService';
import { HttpError } from '../services/api';

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
const isFridayAfter5 = () => { const now = new Date(); return now.getDay() === 5 && now.getHours() >= 17; };
const shiftWeeksView = (weeksRaw: Date[][], want: number) => {
    const dropped = weeksRaw.slice(1);
    const last = dropped[dropped.length - 1] ?? weeksRaw[weeksRaw.length - 1];
    const nextWeek = last.map((d) => addDays(d, 7));
    return [...dropped, nextWeek].slice(0, want);
};

function Banner({ text, kind = 'info', onClose }:{
    text: string; kind?: 'info'|'warning'|'error'; onClose?: () => void;
}) {
    if (!text) return null;
    const cls = kind === 'warning' ? 'banner warning' : kind === 'error' ? 'banner error' : 'banner info';
    return (
        <div className={cls} role="status" aria-live="polite">
            <span>{text}</span>
            <button aria-label="Close notification" onClick={onClose}>×</button>
        </div>
    );
}

type ApiBooked = {
    id: string; start: string; end: string;
    instructorId: string; learnerId: string | null; cancelled?: boolean;
};

const toUIBooking = (api: ApiBooked): Booking => {
    const base: Booking = {
        id: api.id, date: api.start, teacher: '', car: '',
        learnerId: api.learnerId ?? '', learnerFirstName: (api as any).learnerFirstName ?? '',
        learnerLastName: (api as any).learnerLastName ?? '',
    };
    (base as any).cancelled = !!(api as any).cancelled;
    (base as any).instructorId = api.instructorId;
    return base;
};

type BookingsGrid = Record<number, Record<string, (Booking | null)[]>>;

const Schedule: React.FC = () => {
    const { user, token } = useAuth() as any;

    const roleRaw = String(user?.role ?? '');
    const isStudentView = /^(student|learner)$/i.test(roleRaw);
    const wantWeeks = isStudentView ? 2 : 3;

    const allWeeks = useMemo(() => generateWeeks(), []);
    const weeks = useMemo(() => {
        const raw = allWeeks as Date[][];
        return isFridayAfter5() ? shiftWeeksView(raw, wantWeeks) : raw.slice(0, wantWeeks);
    }, [allWeeks, wantWeeks]);

    const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
    const [bookings, setBookings] = useState<BookingsGrid>({});
    const [busy, setBusy] = useState<Record<string, boolean>>({});
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

    useEffect(() => { setCurrentWeekIndex((i) => Math.min(i, weeks.length - 1)); }, [weeks.length]);

    useEffect(() => {
        if (!token) return;
        const grid = buildEmptyGrid();

        const firstCell: any = weeks[0][0];
        const lastRow = weeks[weeks.length - 1];
        const lastCell: any = lastRow[lastRow.length - 1];

        const from = new Date(firstCell?.date ?? firstCell); from.setHours(0, 0, 0, 0);
        const to = new Date(lastCell?.date ?? lastCell);     to.setHours(23, 59, 59, 999);

        (async () => {
            try {
                const all = (await fetchAllBookedClasses(
                    token, toLocalDateTimeString(from), toLocalDateTimeString(to)
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
                setNoticeKind('error'); setNotice('Failed to load schedule.');
            }
        })();
    }, [token, weeks]);

    useEffect(() => {
        if (!notice) return;
        const t = setTimeout(() => setNotice(null), 6000);
        return () => clearTimeout(t);
    }, [notice]);

    const handleBlockDay = async (day: Date) => {
        if (!token || !user) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const blockDay = new Date(day);
        blockDay.setHours(0, 0, 0, 0);
        if (blockDay < today) {
            setNoticeKind("warning");
            setNotice("You cannot block a day in the past.");
            return;
        } else if (blockDay.getTime() === today.getTime() && new Date().getHours() >= 17) {
            setNoticeKind("warning");
            setNotice("You cannot block the rest of today after 5 PM.");
            return;
        }

        const isAdmin = user.role === "ADMIN";
        const isInstructor = user.role === "INSTRUCTOR";
        if (!(isAdmin || isInstructor)) return;

        if (!window.confirm("Block this entire day?")) return;

        const instructorId = String(isInstructor ? user.id : DEFAULT_INSTRUCTOR_ID);
        const requests: Array<Promise<any>> = [];

        for (const s of slotTimes) {
            const tm = parseSlotTime(s);
            if (!tm) continue;
            const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), tm.hour, tm.minute, 0);
            const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);

            requests.push(
                bookClass(token, instructorId, toLocalDateTimeString(start), toLocalDateTimeString(end), {
                    vacation: true,
                })
            );
        }

        try {
            const results = await Promise.allSettled(requests);
            const okCount = results.filter((r) => r.status === "fulfilled").length;
            const fail = results.find((r) => r.status === "rejected");

            const firstDay = weeks[currentWeekIndex][0];
            const lastDay = weeks[currentWeekIndex][weeks[currentWeekIndex].length - 1];
            const from = new Date(firstDay);
            from.setHours(0, 0, 0, 0);
            const to = new Date(lastDay);
            to.setHours(23, 59, 59, 999);

            const fresh = (await fetchAllBookedClasses(
                token,
                toLocalDateTimeString(from),
                toLocalDateTimeString(to)
            )) as any[];

            const filled = buildEmptyGrid();
            fresh.forEach((bc) => {
                const dt = new Date(bc.start);
                const dayStr = dt.toDateString();
                const slotIdx = slotTimes.findIndex((s) => {
                    const { hour, minute } = parseSlotTime(s) || {};
                    return dt.getHours() === hour && dt.getMinutes() === minute;
                });
                if (slotIdx >= 0) filled[currentWeekIndex][dayStr][slotIdx] = toUIBooking(bc);
            });

            setBookings(filled);
            setNoticeKind(fail ? "warning" : "info");
            setNotice(
                fail
                    ? `Blocked ${okCount} slots. Some could not be booked.`
                    : "Day successfully blocked."
            );
        } catch (e: any) {
            setNoticeKind("error");
            setNotice(e?.message || "Failed to block day.");
        }
    };

    const handleSlotToggle = async (dayStr: string, slotIndex: number) => {
        if (!token || !user) { setNoticeKind('error'); setNotice('You must be signed in to book.'); return; }

        const isAdmin = user.role === 'ADMIN';
        const isInstructor = user.role === 'INSTRUCTOR';
        const isStudent = /^(student|learner)$/i.test(String(user.role ?? ''));
        const current = bookings[currentWeekIndex]?.[dayStr]?.[slotIndex] ?? null;

        if (current) {
            const mine = !!current && (current.learnerId === user?.id || current.learnerId === user?.learner?.id);
            const canCancel = isAdmin || isInstructor || mine;
            if (!canCancel) { setNoticeKind('warning'); setNotice('You cannot cancel this class.'); return; }

            if (busy[current.id]) return;
            setBusy((b) => ({ ...b, [current.id]: true }));
            try {
                // Pass user role information to cancelClass
                await cancelClass(token, current.id, { 
                    isAdmin, 
                    isInstructor 
                });
                setBookings((prev) => {
                    const copy = { ...prev };
                    const arr = [...(copy[currentWeekIndex][dayStr] ?? Array(slotTimes.length).fill(null))];
                    arr[slotIndex] = null;
                    copy[currentWeekIndex] = { ...copy[currentWeekIndex], [dayStr]: arr };
                    return copy;
                });
                setNoticeKind('info'); setNotice('Class canceled.');
            } catch (e:any) {
                setNoticeKind('error'); setNotice(e?.message || 'Cancel failed.');
            } finally {
                setBusy((b) => { const c = { ...b }; delete c[current.id]; return c; });
            }
            return;
        }

        const day = new Date(dayStr);
        const { hour, minute } = parseSlotTime(slotTimes[slotIndex]);
        const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, 0);
        const end = new Date(start.getTime() + SLOT_MINUTES * 60 * 1000);
        const instructorId = String(isInstructor ? user.id : DEFAULT_INSTRUCTOR_ID);

        try {
            const apiBooked = await bookClass(token, instructorId, toLocalDateTimeString(start), toLocalDateTimeString(end));
            const booked = toUIBooking(apiBooked as any);
            setBookings((prev) => {
                const copy = { ...prev };
                const arr = [...(copy[currentWeekIndex][dayStr] ?? Array(slotTimes.length).fill(null))];
                arr[slotIndex] = booked;
                copy[currentWeekIndex] = { ...copy[currentWeekIndex], [dayStr]: arr };
                return copy;
            });
            setNoticeKind('info'); setNotice('Class booked.');
        } catch (e:any) {
            if (e instanceof HttpError && e.status === 409) { setNoticeKind('warning'); setNotice(e.message); return; }
            setNoticeKind('error'); setNotice(e?.message || 'Booking failed.');
        }
    };

    return (
        <div className="page-container">
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
                    const dayKey = day.toDateString();
                    return (
                        <div className="col d-flex flex-column" key={dayKey}>
                            <div className="card h-100 d-flex flex-column">
                                    <Day
                                        date={day}
                                        dayBookings={bookings[currentWeekIndex]?.[dayKey] ?? Array(slotTimes.length).fill(null)}
                                        toggleSlot={handleSlotToggle}
                                    />

                                    {(user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') && (
                                        <button
                                            className="btn btn-outline-danger w-100 align-self-end"
                                            onClick={() => handleBlockDay(day)}
                                        >
                                            <strong>Block Day</strong>
                                        </button>
                                    )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Schedule;

