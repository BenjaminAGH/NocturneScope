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

export interface Topology {
    ID: number;
    UserID: number;
    Name: string;
    Data: string;
    CreatedAt: string;
    UpdatedAt: string;
}

export interface TopologyData {
    nodes: any[];
    edges: any[];
}

export async function saveTopology(
    jwt: string,
    name: string,
    data: TopologyData
): Promise<Topology> {
    const res = await fetch(`${BASE}/topologies`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ name, data }),
    });
    return handle(res);
}

export async function getTopologies(jwt: string): Promise<Topology[]> {
    const res = await fetch(`${BASE}/topologies`, {
        headers: { Authorization: `Bearer ${jwt}` },
        cache: "no-store",
    });
    return handle(res);
}

export async function getTopology(jwt: string, id: number): Promise<Topology> {
    const res = await fetch(`${BASE}/topologies/${id}`, {
        headers: { Authorization: `Bearer ${jwt}` },
        cache: "no-store",
    });
    return handle(res);
}

export async function updateTopology(
    jwt: string,
    id: number,
    name: string,
    data: TopologyData
): Promise<Topology> {
    const res = await fetch(`${BASE}/topologies/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ name, data }),
    });
    return handle(res);
}

export async function deleteTopology(jwt: string, id: number): Promise<boolean> {
    const res = await fetch(`${BASE}/topologies/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${jwt}` },
    });
    if (res.status === 204) return true;
    return handle(res);
}
