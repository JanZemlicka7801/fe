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
    "";

export class HttpError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.name = "HttpError";
        this.status = status;
    }
}

type ApiOpts = RequestInit & { token?: string };

function normalizePath(path: string): string {
    if (/^https?:\/\//i.test(path)) return path;
    if (path.startsWith("/api/")) return path;
    const clean = path.replace(/^\/+/, "");
    return `/api/${clean}`;
}

function shouldAutoJson(body: unknown): boolean {
    if (!body) return false;
    if (typeof body === "string") return false;
    if (body instanceof FormData) return false;
    if (body instanceof Blob) return false;
    if (body instanceof URLSearchParams) return false;
    return true;
}

export async function apiFetch(path: string, opts: ApiOpts = {}): Promise<any> {
    const { token, headers: hdrs, body, ...rest } = opts;

    const headers = new Headers(hdrs || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);

    let finalBody = body as BodyInit | undefined;

    if (shouldAutoJson(body)) {
        if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
        finalBody = JSON.stringify(body);
    } else if (body && !headers.has("Content-Type") && typeof body === "string") {
        headers.set("Content-Type", "application/json");
    }

    const url = API_BASE
        ? `${API_BASE.replace(/\/+$/, "")}${normalizePath(path)}`
        : normalizePath(path);

    const res = await fetch(url, { ...rest, headers, body: finalBody });

    if (res.status === 401) throw new HttpError(401, "Unauthorized");
    if (!res.ok) {
        let msg = "";
        try { msg = await res.text(); } catch {}
        throw new HttpError(res.status, msg || res.statusText);
    }
    if (res.status === 204) return undefined;

    const ct = res.headers.get("content-type") || "";
    return ct.includes("application/json") ? await res.json() : await res.text();
}