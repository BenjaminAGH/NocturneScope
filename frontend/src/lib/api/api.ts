const ORIGIN = (process.env.NEXT_PUBLIC_API_URL || "https://api.nocturnesec.cl/").replace(/\/+$/, "");
const BASE = `${ORIGIN}/api`;

function pickString(...vals: any[]) {
  return vals.find((v) => typeof v === "string" && v.trim()) as string | undefined;
}


async function refreshAccessToken(): Promise<string | null> {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) return null;

  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });

    if (res.ok) {
      const data = await res.json();
      const newAccess = data.access_token || data.accessToken || data.token;
      const newRefresh = data.refresh_token || data.refreshToken;

      if (newAccess) {
        saveTokens(newAccess, newRefresh);
        return newAccess;
      }
    }
  } catch (e) {
    console.error("Token refresh failed", e);
  }

  clearTokens();
  return null;
}

async function apiFetch(url: string, options: RequestInit = {}, token?: string) {
  let currentToken = token;

  const makeHeaders = (t?: string) => {
    const h: any = { ...options.headers };
    if (t) h.Authorization = `Bearer ${t}`;
    return h;
  };

  let res = await fetch(url, {
    ...options,
    headers: makeHeaders(currentToken),
  });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      currentToken = newToken;
      res = await fetch(url, {
        ...options,
        headers: makeHeaders(currentToken),
      });
    }
  }

  return handle(res);
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
  return apiFetch(`${BASE}/users/me`, { cache: "no-store" }, jwt);
}

export interface APIToken {
  ID: number;
  Name: string;
  TokenHash: string;
  DeviceName: string;
  GroupID?: number;
  CreatedAt: string;
  Status: string;
}

export async function listApiTokens(jwt: string) {
  return apiFetch(`${BASE}/api-tokens`, { cache: "no-store" }, jwt);
}

export async function createApiToken(jwt: string, name: string, deviceName: string, groupId?: number) {
  return apiFetch(`${BASE}/api-tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, device_name: deviceName, group_id: groupId }),
  }, jwt);
}

export async function deleteApiToken(jwt: string, id: number) {
  // Special case for 204
  const res = await fetch(`${BASE}/api-tokens/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${jwt}` },
  });
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryRes = await fetch(`${BASE}/api-tokens/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${newToken}` },
      });
      if (retryRes.status === 204) return true;
      return handle(retryRes);
    }
  }
  if (res.status === 204) return true;
  return handle(res);
}

export async function deleteDevice(jwt: string, name: string) {
  return apiFetch(`${BASE}/metrics/devices/${encodeURIComponent(name)}`, {
    method: "DELETE",
  }, jwt);
}

export async function getDevices(jwt: string, groupId?: number) {
  let url = `${BASE}/metrics/devices`;
  if (groupId) {
    url += `?group_id=${groupId}`;
  }
  const data = await apiFetch(url, { cache: "no-store" }, jwt);
  return (Array.isArray(data) ? data : []) as string[];
}

export async function getLastStats(jwt: string, device: string) {
  return apiFetch(`${BASE}/metrics/last?device=${encodeURIComponent(device)}`, { cache: "no-store" }, jwt) as Promise<Record<string, any>>;
}

export async function getTimeseries(
  jwt: string,
  params: { device: string; field: string; range?: string; agg: string; interval: string; start?: string; stop?: string }
) {
  const q = new URLSearchParams(params as any).toString();
  return apiFetch(`${BASE}/metrics/timeseries?${q}`, { cache: "no-store" }, jwt) as Promise<{ points: { t: string; v: number }[] }>;
}

export async function getHistory(jwt: string, device: string, range: string) {
  const q = new URLSearchParams({ device, range }).toString();
  return apiFetch(`${BASE}/metrics/history?${q}`, { cache: "no-store" }, jwt) as Promise<any[]>;
}

export async function getNotifications(jwt: string, limit: number = 50) {
  return apiFetch(`${BASE}/notifications?limit=${limit}`, { cache: "no-store" }, jwt) as Promise<any[]>;
}

export async function getRecentAlerts(jwt: string) {
  const data = await apiFetch(`${BASE}/alerts/recent`, { cache: "no-store" }, jwt);
  return (data.recent_alerts || []) as string[];
}

export async function sendTestEmail(jwt: string, email: string) {
  return apiFetch(`${BASE}/alerts/test-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  }, jwt);
}

export async function sendCustomEmail(jwt: string, to: string, subject: string, body: string) {
  return apiFetch(`${BASE}/alerts/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, subject, body }),
  }, jwt);
}

export async function updateLastTopology(jwt: string, topologyId: number) {
  // updateLastTopology returns void/error, so we can use apiFetch but ignore result or check if it throws
  await apiFetch(`${BASE}/users/me/last-topology`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topology_id: topologyId }),
  }, jwt);
}

export async function deleteTopology(jwt: string, id: number) {
  // deleteTopology returns void/error
  await apiFetch(`${BASE}/topologies/${id}`, {
    method: "DELETE",
  }, jwt);
}

export async function updateTopology(jwt: string, id: number, name: string, data: any) {
  return apiFetch(`${BASE}/topologies/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, data }),
  }, jwt);
}

export async function getTopologies(jwt: string) {
  return apiFetch(`${BASE}/topologies`, {}, jwt);
}

export async function getTopology(jwt: string, id: number) {
  return apiFetch(`${BASE}/topologies/${id}`, {}, jwt);
}

export async function createTopology(jwt: string, name: string, data: any) {
  return apiFetch(`${BASE}/topologies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, data }),
  }, jwt);
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
  return apiFetch(`${BASE}/users/me`, {}, jwt);
}

export async function getNetworkTraffic(jwt: string, deviceName: string) {
  return apiFetch(`${BASE}/network-traffic?device=${encodeURIComponent(deviceName)}`, { cache: "no-store" }, jwt) as Promise<any[]>;
}
export async function updateUser(jwt: string, id: number, data: { username?: string; email?: string; password?: string }) {
  return apiFetch(`${BASE}/users/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }, jwt);
}

export async function getGroups(jwt: string) {
  return apiFetch(`${BASE}/device-groups`, { cache: "no-store" }, jwt);
}
