import { DeviceGroup } from "@/context/GroupContext";

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

export async function getDeviceGroups(jwt: string): Promise<DeviceGroup[]> {
    const res = await fetch(`${BASE}/device-groups`, {
        headers: { Authorization: `Bearer ${jwt}` },
        cache: "no-store",
    });
    return handle(res);
}

export async function createDeviceGroup(jwt: string, name: string, description: string): Promise<DeviceGroup> {
    const res = await fetch(`${BASE}/device-groups`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ name, description }),
    });
    return handle(res);
}

export async function updateDeviceGroup(jwt: string, id: number, name: string, description: string): Promise<void> {
    const res = await fetch(`${BASE}/device-groups/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ name, description }),
    });
    return handle(res);
}

export async function deleteDeviceGroup(jwt: string, id: number): Promise<void> {
    const res = await fetch(`${BASE}/device-groups/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${jwt}` },
    });
    if (res.status === 204) return;
    return handle(res);
}
