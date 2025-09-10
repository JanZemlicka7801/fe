import { apiFetch } from './api';

/**
 * Sends an SMS notification to the specified phone number
 * @param token Authentication token
 * @param phoneNumber The recipient's phone number
 * @param message The message content
 * @returns Promise that resolves when the notification is sent
 */
export async function sendNotification(token: string, phoneNumber: string, message: string): Promise<string> {
    const params = new URLSearchParams();
    params.append('phoneNumber', phoneNumber);
    params.append('message', message);

    return await apiFetch(`notifications/notify?${params.toString()}`, {
        method: 'POST',
        token
    });
}