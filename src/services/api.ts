// api.ts
import { authEvents } from './authEvents';

type AnyEnv = Record<string, string | undefined>;

function readEnv(): AnyEnv {
    const g: any = typeof globalThis !== 'undefined' ? globalThis : {};
    const vite = (g.import?.meta?.env ?? (typeof import.meta !== 'undefined' ? (import.meta as any).env : {})) || {};
    const cra  = (typeof g.process !== 'undefined' ? g.process.env : {}) || {};
    const win  = (typeof g.window !== 'undefined' ? g.window.__ENV__ : {}) || {};
    return { ...vite, ...cra, ...win };
}

const ENV = readEnv();

const API_BASE =
    ENV.VITE_BACKEND_ROOT ||
    ENV.REACT_APP_BACKEND_ROOT ||
    '';

export class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
    }
}

type ApiOpts = Omit<RequestInit, 'headers' | 'body'> & {
    token?: string;
    headers?: HeadersInit;
    body?: unknown;
};

function normalizePath(path: string): string {
    if (/^https?:\/\//i.test(path)) return path;
    if (path.startsWith('/api/')) return path;
    const clean = path.replace(/^\/+/, '');
    return `/api/${clean}`;
}

function isFormData(x: unknown): x is FormData {
    return typeof FormData !== 'undefined' && x instanceof FormData;
}
function isBlob(x: unknown): x is Blob {
    return typeof Blob !== 'undefined' && x instanceof Blob;
}
function isURLSearchParams(x: unknown): x is URLSearchParams {
    return typeof URLSearchParams !== 'undefined' && x instanceof URLSearchParams;
}

function shouldAutoJson(body: unknown): boolean {
    if (body == null) return false;
    if (typeof body === 'string') return false; // do not auto-set JSON for raw strings
    if (isFormData(body) || isBlob(body) || isURLSearchParams(body)) return false;
    // objects or arrays -> JSON
    if (typeof body === 'object') return true;
    // numbers, booleans -> JSON
    if (typeof body === 'number' || typeof body === 'boolean') return true;
    return false;
}

function joinBase(base: string, path: string): string {
    if (!base) return normalizePath(path);
    if (/^https?:\/\//i.test(path)) return path;
    const left = base.replace(/\/+$/, '');
    const right = normalizePath(path).replace(/^\/+/, '/');
    return `${left}${right}`;
}

export async function apiFetch<T = any>(path: string, opts: ApiOpts = {}): Promise<T> {
    const { token, headers: hdrs, body, ...rest } = opts;

    const headers = new Headers(hdrs || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    if (!headers.has('Accept')) headers.set('Accept', 'application/json, text/plain;q=0.9,*/*;q=0.8');

    let finalBody: BodyInit | undefined;

    if (shouldAutoJson(body)) {
        if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
        finalBody = JSON.stringify(body);
    } else {
        // Respect caller-provided Content-Type for strings or other bodies.
        finalBody = body as BodyInit | undefined;
    }

    // Never set Content-Type for FormData; the browser will handle boundary.
    if (isFormData(body)) {
        headers.delete('Content-Type');
    }

    const url = joinBase(API_BASE || '', path);

    const res = await fetch(url, { ...rest, headers, body: finalBody });

    if (res.status === 401) {
        authEvents.emitTokenExpired();
        throw new HttpError(401, 'Unauthorized');
    }

    if (!res.ok) {
        let msg = '';
        try {
            // Try JSON error payload first
            const ct = res.headers.get('content-type') || '';
            if (ct.includes('application/json')) {
                const j = await res.json().catch(() => null);
                msg = j && typeof j === 'object' ? JSON.stringify(j) : '';
            }
            if (!msg) msg = await res.text();
        } catch {
            /* ignore */
        }
        throw new HttpError(res.status, msg || res.statusText);
    }

    if (res.status === 204 || res.status === 205) return undefined as T;

    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
        return (await res.json()) as T;
    }
    return (await res.text()) as unknown as T;
}