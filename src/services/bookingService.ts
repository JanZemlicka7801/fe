import { apiFetch } from './api';

export type BookedClass = {
    id: string;
    start: string;
    end: string;
    instructorId: string;
    learnerId: string | null;
    cancelled: boolean;
};

export async function fetchAllBookedClasses(token: string, fromISO: string, toISO: string) {
    const qs = `?from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}`;
    return apiFetch<BookedClass[]>(`/api/classes/booked${qs}`, { token });
}

type BookOpts = { learnerId?: string; vacation?: boolean };

export async function bookClass(
    token: string,
    instructorId: string,
    startISO: string,
    endISO: string,
    opts: BookOpts = {}
) {
    const body = { instructorId, start: startISO, end: endISO, learnerId: opts.learnerId, vacation: !!opts.vacation };
    return apiFetch<BookedClass>(`/api/classes/book`, { method: 'POST',
        headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
}

export async function cancelClass(token: string, id: string) {
    return apiFetch(`/api/classes/${id}`, { method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` } });
}