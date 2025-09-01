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
    status: 'active' | 'inactive' | 'completed';
};

type StudentPayload = {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phoneNumber: string | null;
    lessons: number;
    pastClassesCount: number;
    previousClass: string | null;
    nextClass: string | null;
    validated: boolean;                 // <- must be present
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

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : null);

export async function fetchStudents(token: string): Promise<Student[]> {
    const rows = await apiFetch<StudentPayload[]>('/api/learners', {
        headers: { Authorization: `Bearer ${token}` },
    });

    return rows.map(r => ({
        id: r.id,
        name: `${r.firstName} ${r.lastName}`.trim(),
        email: r.email ?? '',
        phone: r.phoneNumber ?? '',
        progress: r.lessons ? Math.round((r.pastClassesCount / r.lessons) * 100) : 0,
        status: r.validated ? 'active' : 'inactive',     // ← lowercase
        lastLesson: fmt(r.previousClass),
        nextLesson: fmt(r.nextClass),
    }));
}

export async function addStudent(dto: StudentCreateDTO, token: string): Promise<Student> {
    const res = await apiFetch<LearnerUserCreateResponseDTO>('/api/learners', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
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
        status: res.validated ? 'active' : 'inactive',   // ← add
    };
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