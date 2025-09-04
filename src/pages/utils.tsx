export const slotTimes = [
    '9:00 AM',
    '9:45 AM',
    '10:30 AM',
    '10:45 AM',
    '11:30 AM',
    '12:15 PM',
    '1:45 PM',
    '2:30 PM',
    '3:15 PM',
    '3:30 PM',
    '4:15 PM'
];

export type Student = {
    id: string;
    name: string;
    email: string;
    phone: string;
    progress: number;
    lastLesson: string | null;
    nextLesson: string | null;
    status: 'active' | 'inactive' | 'completed';
};

export type LearnerUpdateDTO = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
};

export type StudentPayload = {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phoneNumber: string | null;
    lessons: number;
    pastClassesCount: number;
    previousClass: string | null;
    nextClass: string | null;
    validated: boolean;
};

export type LearnerUserCreateResponseDTO = {
    learnerId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    lessonsRemaining: number;
    userId: string;
    username: string;
    validated: boolean;
    role: 'LEARNER';
    createdAt: string;
    tempPassword: string;
};

export type ClassDTO = {
    id: string;
    learnerId: string;
    instructorId: string;
    startsAt: string;
    endsAt: string;
    note?: string;
    type?: string;
};

export type LessonsResponse = {
    total: number;
    classes: ClassDTO[]
};

export type LearnerResponseDTO = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    lessons: number;
};

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

export const fmt = (iso?: string) => {
    if (!iso) return 'N/A';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'N/A';
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
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