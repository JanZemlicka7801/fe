type AnyEnv = Record<string, string | undefined>;

function readEnv(): AnyEnv {
    const vite = (typeof import.meta !== "undefined" && (import.meta as any)?.env) || {};
    const cra  = (typeof process !== "undefined" && (process as any)?.env) || {};
    const win  = (typeof window !== "undefined" && (window as any).__ENV__) || {};
    return { ...vite, ...cra, ...win };
}

const ENV = readEnv();

const API_BASE =
    (ENV.VITE_BACKEND_ROOT as string) ||
    (ENV.REACT_APP_BACKEND_ROOT as string) ||
    "http://localhost:8080";

export class HttpError extends Error { constructor(public status:number, message:string){super(message);} }

export async function apiFetch<T = any>(
    url: string,
    opts: RequestInit & { token?: string } = {}
): Promise<T> {
    const { token, headers, ...rest } = opts;
    const res = await fetch(url, {
        ...rest,
        headers: {
            'Content-Type': 'application/json',
            ...(headers || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
    });
    if (!res.ok) throw new Error(`${url} ${res.status}`);

    const text = await res.text();
    return (text ? JSON.parse(text) : (undefined as any)) as T;
}