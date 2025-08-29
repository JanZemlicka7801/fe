import { Booking, BookingPayload } from '../pages/utils';
import { apiFetch } from './api';

// fetch all booked classes
export async function fetchAllBookedClasses(
    token: string,
    from: Date,
    to: Date
): Promise<Booking[]> {
    return apiFetch<Booking[]>(`/api/classes/booked?from=${from.toISOString()}&to=${to.toISOString()}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
}

// book a new class
export async function bookClass(
    token: string,
    payload: BookingPayload
): Promise<Booking> {
    return apiFetch<Booking>('/api/classes/book', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
}

// cancel an existing class
export async function cancelClass(
    token: string,
    bookingId: string
): Promise<void> {
    return apiFetch<void>(`/api/classes/${bookingId}/cancel`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
    });
}