import {apiFetch, HttpError} from './api';

export type BookedClass = {
    id: string;
    start: string;
    end: string;
    instructorId: string;
    learnerId: string | null;
    cancelled: boolean;
    note?: string;
    type: 'Získání nového ŘP' | 'Kondiční jízdy' | 'Jiné';
    learnerFirstName?: string | null;
    learnerLastName?: string | null;
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
    const body = {
        instructorId,
        start: startISO,
        end: endISO,
        learnerId: opts.learnerId,
        vacation: !!opts.vacation,
    };

    const res = await fetch(`/api/classes/book`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify(body),
    });

    if (res.status === 409) {
        // Expecting { code, message, classId, startsAt, endsAt }
        const err = await res.json().catch(() => null as any);
        const when =
            err?.startsAt && err?.endsAt ? ` (${err.startsAt}–${err.endsAt})` : "";
        const msg =
            err?.code === "LEARNER_ALREADY_BOOKED"
                ? `You already have a future booking${when}.`
                : err?.message || "You already have a future booking.";
        throw new HttpError(409, msg);
    }

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new HttpError(
            res.status,
            text ? `Booking failed: ${text}` : `Booking failed (${res.status})`
        );
    }

    const text = await res.text();
    return text ? (JSON.parse(text) as BookedClass) : (undefined as any);
}

export async function cancelClass(token: string, classId: string) {
    const res = await fetch(`/api/classes/${classId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        credentials: "include",
    });

    if (res.status === 409) {
        const err = await res.json().catch(() => null as any);
        const msg =
            err?.code === "LATE_CANCELLATION_NOT_ALLOWED"
                ? "You cannot cancel less than 12 hours before start."
                : err?.message || "Cancellation not allowed.";
        throw new HttpError(409, msg);
    }

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new HttpError(res.status, text || `Cancel failed (${res.status})`);
    }
}