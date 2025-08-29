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

export class HttpError extends Error {
    status: number;
    body: any;
    constructor(message: string, status: number, body?: any) {
        super(message);
        this.status = status;
        this.body = body;
    }
}

export async function apiFetch<T = unknown>(
    path: string,
    opts: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
    const headers = new Headers(opts.headers || {});
    if (!headers.has("Authorization")) {
        throw new HttpError("No Authorization header provided. Please log in.", 401);
    }
    if (opts.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

    const res = await fetch(url, { ...opts, headers });

    if (res.status === 204) return undefined as T;

    const text = await res.text();
    let data: any = undefined;
    try { data = text ? JSON.parse(text) : undefined; } catch {}

    if (!res.ok) {
        // Friendly 409 message (e.g., duplicate email on POST /api/learners)
        if (res.status === 409) {
            const friendly = (data && (data.message || data.error)) || "Email must be unique. This email is already in use.";
            throw new HttpError(friendly, 409, data);
        }
        const msg = (data && (data.message || data.error)) || res.statusText || "Request failed";
        throw new HttpError(`${opts.method || "GET"} ${path} -> ${res.status} ${msg}`, res.status, data);
    }

    return data as T;
}