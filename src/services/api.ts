type AnyEnv = Record<string, string | undefined>;

function readEnv(): AnyEnv {
    const vite = (typeof import.meta !== "undefined" && (import.meta as any)?.env) || {};
    const cra  = (typeof process !== "undefined" && (process as any)?.env) || {};
    const win  = (typeof window !== "undefined" && (window as any).__ENV__) || {};
    return { ...vite, ...cra, ...win };
}

const ENV = readEnv();

// Default to backend root. Paths will include /api.
const API_BASE =
    (ENV.VITE_BACKEND_ROOT as string) ||
    (ENV.REACT_APP_BACKEND_ROOT as string) ||
    "http://localhost:8080";

export class HttpError extends Error { constructor(public status:number, message:string){super(message);} }

export async function apiFetch<T>(url:string, opts: RequestInit = {}): Promise<T> {
    const r = await fetch(url, opts);
    if (!r.ok) {
        let msg = 'Something went wrong.';
        try {
            const body = await r.json();
            msg = body?.message || msg;
        } catch { /* ignore */ }
        if (r.status === 405) msg = 'Request not allowed.';
        if (r.status === 404) msg = 'Resource not found.';
        if (r.status === 401) msg = 'Please sign in.';
        if (r.status === 403) msg = 'You don’t have permission.';
        throw new HttpError(r.status, msg);
    }
    return r.status === 204 ? (undefined as T) : r.json();
}