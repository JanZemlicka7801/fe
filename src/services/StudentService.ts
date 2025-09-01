import {apiFetch, HttpError} from './api';
import {Student, StudentPayload, StudentCreateDTO, LearnerUserCreateResponseDTO, LearnerUpdateDTO, LearnerResponseDTO} from "../pages/utils";

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : null);

const toPlusCz = (p?: string | null) => {
    if (!p) return '';
    const digits = p.replace(/\D/g, '');
    const core = digits.endsWith('420') ? '' : digits.replace(/^00?/, '');
    const m = digits.match(/^(?:00|)?420?(\d{3})(\d{3})(\d{3})$/) || digits.match(/^420(\d{3})(\d{3})(\d{3})$/);
    if (m) return `+420 ${m[1]} ${m[2]} ${m[3]}`;
    return p;
};

export async function checkLearnerPhoneExists(phone: string, token: string) {
    const res = await apiFetch<{ exists: boolean }>(
        `/api/learners/exists-phone?phone=${encodeURIComponent(phone)}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return !!res.exists;
}

export async function fetchStudents(token: string): Promise<Student[]> {
    const rows = await apiFetch<StudentPayload[]>('/api/learners', {
        headers: { Authorization: `Bearer ${token}` },
    });
    return rows.map(r => ({
        id: r.id,
        name: `${r.firstName} ${r.lastName}`.trim(),
        email: r.email ?? '',
        phone: toPlusCz(r.phoneNumber),
        progress: r.lessons ? Math.round((r.pastClassesCount / r.lessons) * 100) : 0,
        status: r.validated ? 'active' : 'inactive',
        lastLesson: fmt(r.previousClass),
        nextLesson: fmt(r.nextClass),
    }));
}

export async function addStudent(dto: StudentCreateDTO, token: string): Promise<Student> {
    try {
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
            status: res.validated ? 'active' : 'inactive',
        };
    } catch (e: any) {
        if (e instanceof HttpError && e.status === 409) {
            const msg = (e.message || '').toLowerCase();
            throw new Error(msg.includes('phone') ? 'Phone already in use.' : 'Email already in use.');
        }
        throw e;
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

const displayPhone = (p: string) =>
    p.startsWith('00420') ? p.replace(/^00420/, '+420') : p;

export async function updateStudent(
    id: string,
    dto: LearnerUpdateDTO,
    token: string
): Promise<{ firstName: string; lastName: string; email: string; phone: string }> {
    const res = await apiFetch<LearnerResponseDTO>(`/api/learners/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
    });
    return {
        firstName: res.firstName,
        lastName: res.lastName,
        email: res.email,
        phone: displayPhone(res.phoneNumber),
    };
}

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