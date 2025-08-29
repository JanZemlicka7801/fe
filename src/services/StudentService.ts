import {apiFetch, HttpError} from './api';

export type StudentCreateDTO = {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
};

export type Student = {
    id: string;
    name: string;
    email: string;
    phone: string;
    progress: number;
    lastLesson: string | null;
    nextLesson: string | null;
};

type LearnerUserCreateResponseDTO = {
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

export async function fetchStudents(token: string): Promise<Student[]> {
    return apiFetch<Student[]>('/api/learners', {
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function addStudent(dto: StudentCreateDTO, token: string): Promise<Student> {
    try {
        const res = await apiFetch<LearnerUserCreateResponseDTO>('/api/learners', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dto),
        });

        return {
            id: res.learnerId,
            name: `${res.firstName} ${res.lastName}`,
            email: res.email,
            phone: res.phone,
            progress: 0,
            lastLesson: null,
            nextLesson: null,
        };
    } catch (err: any) {
        if (err instanceof HttpError && err.status === 409) {
            throw new Error('Email must be unique. This email is already in use.');
        }
        throw err;
    }
}

export type AppUser = {
    id: string;
    username: string;
    email: string;
    validated: boolean;
    role: 'LEARNER' | 'INSTRUCTOR' | 'ADMIN';
    createdAt: string;
};

export async function fetchUsersByRoles(
    token: string,
    roles: Array<'LEARNER' | 'INSTRUCTOR'> = ['LEARNER', 'INSTRUCTOR'],
): Promise<AppUser[]> {
    const qs = `roles=${roles.join(',')}`;
    return apiFetch<AppUser[]>(`/api/users?${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
}

export async function deleteStudent(learnerId: string, token: string): Promise<void> {
    return apiFetch<void>(`/api/learners/${learnerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
}