const ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "https://api.nocturnesec.cl/").replace(/\/+$/, "");
const BASE = `${ORIGIN}/api`;

function pickString(...vals: any[]) {
  return vals.find((v) => typeof v === "string" && v.trim()) as string | undefined;
}

async function handle(res: Response) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || res.statusText);
  }
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

export async function login(email: string, password: string): Promise<{
  accessToken: string;
  refreshToken?: string;
  raw: any;
}> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data: any = await res.json();

  // tolera múltiples formatos
  const access =
    pickString(
      data?.access_token,
      data?.accessToken,
      data?.token,
      data?.jwt,
      data?.AccessToken,
    ) || "";

  const refresh =
    pickString(
      data?.refresh_token,
      data?.refreshToken,
      data?.RefreshToken,
    );

  if (!access) {

    console.error("Respuesta /auth/login:", data);
    throw new Error("Login OK pero no vino access_token/token/jwt");
  }

  return { accessToken: access.trim(), refreshToken: refresh?.trim(), raw: data };
}

export function saveTokens(access: string, refresh?: string) {
  if (access) localStorage.setItem("jwt", access);
  if (refresh) localStorage.setItem("refresh", refresh);
}
export function getAccessToken(): string | null {
  return localStorage.getItem("jwt");
}
export function clearTokens() {
  localStorage.removeItem("jwt");
  localStorage.removeItem("refresh");
}

export async function getUserProfile(jwt: string) {
  const res = await fetch(`${BASE}/users/me`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });
  return handle(res);
}

export async function listApiTokens(jwt: string) {
  const res = await fetch(`${BASE}/api-tokens`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });
  return handle(res);
}

export async function createApiToken(jwt: string, name: string) {
  const res = await fetch(`${BASE}/api-tokens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ name }),
  });
  return handle(res);
}

export async function deleteApiToken(jwt: string, id: number) {
  const res = await fetch(`${BASE}/api-tokens/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (res.status === 204) return true;
  return handle(res);
}

export async function getDevices(jwt: string) {
  const res = await fetch(`${BASE}/metrics/devices`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });
  const data = await handle(res);
  return (Array.isArray(data) ? data : []) as string[];
}

export async function getLastStats(jwt: string, device: string) {
  const res = await fetch(`${BASE}/metrics/last?device=${encodeURIComponent(device)}`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });
  return handle(res) as Promise<Record<string, any>>;
}

export async function getTimeseries(
  jwt: string,
  params: { device: string; field: string; range: string; agg: string; interval: string }
) {
  const q = new URLSearchParams(params as any).toString();
  const res = await fetch(`${BASE}/metrics/timeseries?${q}`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });
  return handle(res) as Promise<{ points: { t: string; v: number }[] }>;
}

export async function getHistory(jwt: string, device: string, range: string) {
  const q = new URLSearchParams({ device, range }).toString();
  const res = await fetch(`${BASE}/metrics/history?${q}`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });
  return handle(res) as Promise<any[]>;
}

export async function getRecentAlerts(jwt: string) {
  const res = await fetch(`${BASE}/alerts/recent`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });
  const data = await handle(res);
  return (data.recent_alerts || []) as string[];
}
