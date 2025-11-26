import { getAccessToken } from "./api";

const ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "https://api.nocturnesec.cl/").replace(/\/+$/, "");
const BASE = `${ORIGIN}/api`;

async function handle(res: Response) {
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || res.statusText);
    }
    const ct = res.headers.get("content-type") || "";
    return ct.includes("application/json") ? res.json() : res.text();
}

export interface NetworkTraffic {
    id: number;
    device_id: number;
    protocol: string;
    source_ip: string;
    destination_port: number;
    connection_state: string;
    threat_level: string;
    duration: number;
    timestamp: string;
}

export async function getNetworkTraffic(device: string): Promise<NetworkTraffic[]> {
    const jwt = getAccessToken();
    if (!jwt) throw new Error("No access token");

    const res = await fetch(`${BASE}/network-traffic?device=${encodeURIComponent(device)}`, {
        headers: { Authorization: `Bearer ${jwt}` },
        cache: "no-store",
    });
    return handle(res) as Promise<NetworkTraffic[]>;
}
