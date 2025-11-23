const ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "https://api.nocturnesec.cl/").replace(/\/+$/, "");
const BASE = `${ORIGIN}/api`;

async function handle(res: Response) {
    if (res.status === 401) {
        if (typeof window !== "undefined") {
            window.location.href = "/auth/login";
        }
        throw new Error("Unauthorized");
    }
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || res.statusText);
    }
    const ct = res.headers.get("content-type") || "";
    return ct.includes("application/json") ? res.json() : res.text();
}

export interface User {
    id: number;
    username: string;
    email: string;
    role: string;
    created_at?: string;
}

export interface CreateUserData {
    username: string;
    email: string;
    role: string;
    password: string;
}

export interface UpdateUserData {
    username?: string;
    email?: string;
    role?: string;
    password?: string;
}

export async function listUsers(jwt: string): Promise<User[]> {
    const res = await fetch(`${BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${jwt}` },
        cache: "no-store",
    });
    return handle(res);
}

export async function createUser(jwt: string, userData: CreateUserData): Promise<User> {
    const res = await fetch(`${BASE}/admin/users`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify(userData),
    });
    return handle(res);
}

export async function updateUser(jwt: string, id: number, userData: UpdateUserData): Promise<User> {
    const res = await fetch(`${BASE}/admin/users/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify(userData),
    });
    return handle(res);
}

export async function deleteUser(jwt: string, id: number): Promise<void> {
    const res = await fetch(`${BASE}/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${jwt}` },
    });
    if (res.status === 204) return;
    return handle(res);
}
