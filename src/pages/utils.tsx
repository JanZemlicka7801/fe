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

/**
 * Calculates the Monday of the week for a given date.
 * @param date The date to start from.
 * @returns The date object for the Monday of that week.
 */
export const getMonday = (date: Date): Date => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
};

/**
 * Generates an array of weeks, with each week being an array of Date objects for each day.
 * It creates three weeks: the current week, the next week, and the week after that.
 * @returns An array of weeks, where each week is an array of Date objects.
 */
export const generateWeeks = (): Date[][] => {
    const weeks: Date[][] = [];
    let monday = getMonday(new Date());

    for (let i = 0; i < 3; i++) {
        const weekDays: Date[] = [];
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

export interface BookingPayload {
    date: string;
    teacher: string;
    car: string;
    learnerId: string;
}

export interface Booking {
    id: string;
    date: string;
    teacher: string;
    car: string;
    learnerId: string;
    learnerFirstName: string;
    learnerLastName: string;
}

export interface StudentCreateDTO {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
}

export type BookedClassesResponse = Booking[];

export const ADMIN_LEARNER_ID = '00000000-0000-0000-0000-000000000000';