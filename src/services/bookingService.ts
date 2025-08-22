import { Booking } from '../pages/utils';

export async function fetchAllBookedClasses(
    token: string,
    startDate: Date,
    endDate: Date
): Promise<Booking[]> {
    try {
        const response = await fetch(
            `http://localhost:8080/api/classes/booked/learner?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
            {
                method: 'GET',
                mode: 'cors',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API request failed: ${response.status} - ${errorText}`);
        }

        const contentType = response.headers.get('Content-Type') || '';
        if (response.status === 204 || contentType.includes('text/plain')) {
            return [];
        }

        const bookedClasses: Booking[] = await response.json();
        return bookedClasses;
    } catch (error) {
        console.error('Error fetching all booked classes:', error);
        return [];
    }
}