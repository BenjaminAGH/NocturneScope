const ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "https://api.nocturnesec.cl").replace(/\/+$/, "");
const API = `${ORIGIN}/api`;

export interface APIToken {
    ID: number;
    Name: string;
    TokenHash: string;
    UserID: number;
    DeviceName: string;
    CreatedAt: string;
    RevokedAt?: string;
}

export async function createAPIToken(jwt: string, name: string, deviceName: string): Promise<{ token: string }> {
    const res = await fetch(`${API}/api-tokens`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ name, device_name: deviceName }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create token");
    }

    return res.json();
}

export async function getAPITokens(jwt: string): Promise<APIToken[]> {
    const res = await fetch(`${API}/api-tokens`, {
        headers: {
            Authorization: `Bearer ${jwt}`,
        },
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to fetch tokens");
    }

    return res.json();
}

export async function deleteAPIToken(jwt: string, tokenId: number): Promise<void> {
    const res = await fetch(`${API}/api-tokens/${tokenId}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${jwt}`,
        },
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to delete token");
    }
}
