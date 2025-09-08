import { apiFetch } from './api';

export type AdminStats = {
    students: number;
    instructors: number;
    classesThisWeek: number;
    weekStart: string;
    weekEnd: string;
};

export async function fetchAdminStats(token: string, weekStart?: string): Promise<AdminStats> {
    const qs = weekStart ? `?weekStart=${encodeURIComponent(weekStart)}` : '';
    return (await apiFetch(`admin/stats${qs}`, { token })) as AdminStats;
}