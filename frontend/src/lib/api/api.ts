const ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "https://api.nocturnesec.cl/").replace(/\/+$/, "");
const BASE = `${ORIGIN}/api`;

function pickString(...vals: any[]) {
  return vals.find((v) => typeof v === "string" && v.trim()) as string | undefined;
}

async function handle(res: Response) {
  if (res.status === 401) {
    clearTokens();
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
  if (access) {
    localStorage.setItem("jwt", access);
    // También guardar en cookies para el middleware
    if (typeof document !== "undefined") {
      document.cookie = `jwt=${access}; path=/; max-age=${7 * 24 * 60 * 60}`; // 7 días
    }
  }
  if (refresh) localStorage.setItem("refresh", refresh);
}
export function getAccessToken(): string | null {
  return localStorage.getItem("jwt");
}
export function clearTokens() {
  localStorage.removeItem("jwt");
  localStorage.removeItem("refresh");
  if (typeof document !== "undefined") {
    document.cookie = "jwt=; path=/; max-age=0";
  }
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

export async function createApiToken(jwt: string, name: string, deviceName: string, groupId?: number) {
  const res = await fetch(`${BASE}/api-tokens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ name, device_name: deviceName, group_id: groupId }),
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

export async function getDevices(jwt: string, groupId?: number) {
  let url = `${BASE}/metrics/devices`;
  if (groupId) {
    url += `?group_id=${groupId}`;
  }
  const res = await fetch(url, {
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

export async function sendTestEmail(jwt: string, email: string) {
  const res = await fetch(`${BASE}/alerts/test-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ email }),
  });
  return handle(res);
}

export async function sendCustomEmail(jwt: string, to: string, subject: string, body: string) {
  const res = await fetch(`${BASE}/alerts/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ to, subject, body }),
  });
  return handle(res);
}

export async function updateLastTopology(jwt: string, topologyId: number) {
  const res = await fetch(`${BASE}/users/me/last-topology`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${jwt}`,
    },
    body: JSON.stringify({ topology_id: topologyId }),
  });
  if (!res.ok) throw new Error("Failed to update last topology");
}

export async function deleteTopology(jwt: string, id: number) {
  const res = await fetch(`${BASE}/topologies/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (!res.ok) throw new Error("Failed to delete topology");
}

export async function updateTopology(jwt: string, id: number, name: string, data: any) {
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

export async function getTopologies(jwt: string) {
  const res = await fetch(`${BASE}/topologies`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  return handle(res);
}

export async function getTopology(jwt: string, id: number) {
  const res = await fetch(`${BASE}/topologies/${id}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  return handle(res);
}

export async function createTopology(jwt: string, name: string, data: any) {
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

export async function getUser(jwt: string) {
  // Assuming there's a /users/me endpoint or similar to get user details including LastTopologyID
  // If not, we might need to add it or use an existing one.
  // Let's check if there is a 'me' endpoint.
  // Based on routes, there is RegisterUserRoutes(protected, userService).
  // Let's assume there is a GET /users/me or similar.
  // Actually, looking at user_handlers.go, there is Get(id).
  // We need a way to get the current user.
  // For now, let's assume we can get it via ID if we decode the token, OR add a /users/me endpoint.
  // Let's add a /users/me endpoint in the backend first if it doesn't exist.
  // Wait, I can just use the ID from the token in the frontend if I decode it, but better to have an endpoint.
  // Let's check user_routes.go if it exists.
  const res = await fetch(`${BASE}/users/me`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  return handle(res);
}

export async function getNetworkTraffic(jwt: string, deviceName: string) {
  const res = await fetch(`${BASE}/network-traffic?device=${encodeURIComponent(deviceName)}`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });
  return handle(res) as Promise<any[]>;
}
