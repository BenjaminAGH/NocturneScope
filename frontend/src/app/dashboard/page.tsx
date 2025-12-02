"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Label,
} from "recharts";
import {
  getDevices,
  getLastStats,
  getTimeseries,
} from "@/lib/api/api";
import { formatCL, formatTickCL } from "@/lib/time";
import LogViewer from "@/components/LogViewer";
import NetworkTrafficLog from "@/components/dashboard/NetworkTrafficLog";
import {
  ComputerDesktopIcon,
  CpuChipIcon,
  ServerIcon,
  SignalIcon,
  ClockIcon,
  GlobeAltIcon,
  CircleStackIcon,
  FireIcon
} from "@heroicons/react/24/outline";

type Point = { t: string; v: number };

const FIELD_OPTIONS = [
  { v: "cpu", l: "CPU (%)" },
  { v: "ram", l: "RAM (%)" },
  { v: "disk", l: "DISK (%)" },
  { v: "net_rx", l: "Net RX (B/s)" },
  { v: "net_tx", l: "Net TX (B/s)" },
  { v: "temp", l: "Temp (°C)" },
  { v: "uptime", l: "Uptime (s)" },
];

const RANGE_OPTIONS = ["30m", "1h", "6h", "24h", "7d"];
const INTERVAL_OPTIONS = ["1m", "5m", "15m", "1h"];
const AGG_OPTIONS = ["mean", "min", "max", "last"];

import { useGroup } from "@/context/GroupContext";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedGroup, initialized } = useGroup();

  const [jwt, setJwt] = useState<string | null>(null);
  const [devices, setDevices] = useState<string[]>([]);
  const [device, setDevice] = useState<string>("");
  const [field, setField] = useState<string>("cpu");
  const [range, setRange] = useState<string>("1h");
  const [interval, setInterval] = useState<string>("1m");
  const [agg, setAgg] = useState<string>("mean");

  const [points, setPoints] = useState<Point[]>([]);
  const [last, setLast] = useState<Record<string, any> | null>(null);

  const [loadingDevices, setLoadingDevices] = useState(false);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [err, setErr] = useState<string>("");

  // Lee JWT y redirige si falta
  useEffect(() => {
    const t = localStorage.getItem("jwt");
    if (!t) {
      router.replace("/auth/login");
      return;
    }
    setJwt(t);
  }, [router]);

  // Verificar grupo seleccionado (solo después de inicializar)
  useEffect(() => {
    if (initialized && !selectedGroup) {
      router.replace("/groups");
    }
  }, [initialized, selectedGroup, router]);

  // Carga lista de dispositivos
  useEffect(() => {
    if (!jwt || !selectedGroup) return;
    setLoadingDevices(true);
    setErr("");
    (async () => {
      try {
        const devs = await getDevices(jwt, selectedGroup.ID);
        setDevices(devs);

        const deviceQuery = searchParams.get('device');
        if (deviceQuery && devs.includes(deviceQuery)) {
          setDevice(deviceQuery);
        } else if (!device && devs.length) {
          setDevice(devs[0]);
        }
      } catch (e: any) {
        setErr(e?.message || "Error cargando dispositivos");
      } finally {
        setLoadingDevices(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jwt, selectedGroup, searchParams]);

  useEffect(() => {
    if (!jwt || !device) return;
    setLoadingSeries(true);
    setErr("");
    const fetchMetrics = async () => {
      try {
        const [lastStats, ts] = await Promise.all([
          getLastStats(jwt, device),
          getTimeseries(jwt, { device, field, range, agg, interval }),
        ]);
        setLast(lastStats);
        setPoints(ts.points || []);
      } catch (e: any) {
        setErr(e?.message || "Error cargando métricas");
      } finally {
        setLoadingSeries(false);
      }
    };

    fetchMetrics();
    const intervalId = window.setInterval(fetchMetrics, 5000);
    return () => window.clearInterval(intervalId);
  }, [jwt, device, field, range, agg, interval]);

  const subtitle = useMemo(() => {
    const f = FIELD_OPTIONS.find(x => x.v === field)?.l ?? field;
    return `${device ? device : "—"} • ${f} • ${range} • ${agg.toUpperCase()}`;
  }, [device, field, range, agg]);

  // Helper for CPU Cores
  const getCpuCores = () => {
    if (!last) return [];
    const cores = Object.keys(last)
      .filter(k => k.startsWith('cpu_core_'))
      .sort((a, b) => {
        const numA = parseInt(a.replace('cpu_core_', ''));
        const numB = parseInt(b.replace('cpu_core_', ''));
        return numA - numB;
      })
      .map(k => ({ id: k, val: last[k] }));
    return cores;
  };
  const cpuCores = getCpuCores();

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!selectedGroup) return null;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <header className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <span className="text-muted-foreground">/</span>
          <span className="text-primary font-medium">{selectedGroup.Name}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Tiempos mostrados en <strong>America/Santiago</strong> (almacenado en UTC).
        </p>
      </header>

      <div className="rounded-xl bg-card text-card-foreground p-4 ring-1 ring-border/50">
        <div className="grid gap-3 grid-cols-1 md:grid-cols-5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Dispositivo</label>
            <select
              className="w-full bg-background border rounded px-3 py-2 text-sm"
              value={device}
              onChange={(e) => setDevice(e.target.value)}
              disabled={loadingDevices || !devices.length}
            >
              {!devices.length ? (
                <option value="">Sin dispositivos</option>
              ) : null}
              {devices.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Métrica</label>
            <select
              className="w-full bg-background border rounded px-3 py-2 text-sm"
              value={field}
              onChange={(e) => setField(e.target.value)}
            >
              {FIELD_OPTIONS.map((f) => (
                <option key={f.v} value={f.v}>
                  {f.l}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Rango de Tiempo</label>
            <select
              className="w-full bg-background border rounded px-3 py-2 text-sm"
              value={range}
              onChange={(e) => setRange(e.target.value)}
            >
              {RANGE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Intervalo</label>
            <select
              className="w-full bg-background border rounded px-3 py-2 text-sm"
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
            >
              {INTERVAL_OPTIONS.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Agregación</label>
            <select
              className="w-full bg-background border rounded px-3 py-2 text-sm"
              value={agg}
              onChange={(e) => setAgg(e.target.value)}
            >
              {AGG_OPTIONS.map((a) => (
                <option key={a} value={a}>
                  {a.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Errores */}
      {err ? (
        <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-3">
          {err}
        </div>
      ) : null}

      {/* Últimos valores */}
      <section className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {/* Status Card */}
        <div className="rounded-xl bg-card text-card-foreground p-4 ring-1 ring-border/50 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ComputerDesktopIcon className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Estado</span>
            </div>
            {last && (
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${((Date.now() / 1000) - (last.timestamp ? new Date(last.timestamp).getTime() / 1000 : 0) < 300) ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                <span className={`text-xs font-medium ${((Date.now() / 1000) - (last.timestamp ? new Date(last.timestamp).getTime() / 1000 : 0) < 300) ? "text-green-600" : "text-red-600"}`}>
                  {((Date.now() / 1000) - (last.timestamp ? new Date(last.timestamp).getTime() / 1000 : 0) < 300) ? "Online" : "Offline"}
                </span>
              </div>
            )}
          </div>
          <div className="mt-4 space-y-1">
            <div className="text-2xl font-bold truncate" title={device}>{device || "—"}</div>
            <div className="text-xs text-muted-foreground truncate">
              {last?.os_name || last?.platform || "Sistema Desconocido"} {last?.os_version || ""}
            </div>
          </div>
        </div>

        {/* Network Card */}
        <div className="rounded-xl bg-card text-card-foreground p-4 ring-1 ring-border/50 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <GlobeAltIcon className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-muted-foreground">Red</span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">IP Address</div>
              <div className="font-mono text-sm">{last?.ip || "—"}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-muted-foreground">Gateway</div>
              <div className="font-mono text-sm">{last?.gateway || "—"}</div>
            </div>
          </div>
        </div>

        {/* CPU Card */}
        <div className="rounded-xl bg-card text-card-foreground p-4 ring-1 ring-border/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CpuChipIcon className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-medium text-muted-foreground">CPU</span>
            </div>
            <span className="text-xl font-bold">{last?.cpu?.toFixed(1) || "0"}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div
              className="bg-purple-500 h-full transition-all duration-500"
              style={{ width: `${Math.min(last?.cpu || 0, 100)}%` }}
            />
          </div>

          {/* CPU Cores Grid */}
          {cpuCores.length > 0 ? (
            <div className="mt-3 space-y-1">
              <div className="text-[10px] text-muted-foreground uppercase">Núcleos ({cpuCores.length})</div>
              <div className="grid grid-cols-8 gap-1">
                {cpuCores.map((core) => {
                  const val = core.val || 0;
                  let bgColor = "bg-muted"; // Gray
                  if (val >= 90) bgColor = "bg-red-500";
                  else if (val > 5) bgColor = "bg-green-500";

                  return (
                    <div
                      key={core.id}
                      className={`aspect-square rounded-sm ${bgColor} transition-colors duration-500 flex items-center justify-center relative cursor-help`}
                      title={`Core ${core.id.replace('cpu_core_', '')}: ${val.toFixed(1)}%`}
                    >
                      <span className="text-[6px] font-mono text-white font-bold leading-none">
                        {val.toFixed(0)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-2 text-xs text-muted-foreground flex justify-between">
              <span>Uso actual</span>
              <span>{last?.cpu_count || 1} Cores</span>
            </div>
          )}
        </div>

        {/* RAM Card */}
        <div className="rounded-xl bg-card text-card-foreground p-4 ring-1 ring-border/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ServerIcon className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-medium text-muted-foreground">RAM</span>
            </div>
            <span className="text-xl font-bold">{last?.ram?.toFixed(1) || "0"}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div
              className="bg-orange-500 h-full transition-all duration-500"
              style={{ width: `${Math.min(last?.ram || 0, 100)}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-muted-foreground flex justify-between">
            <span>Usado: {last?.ram_used ? formatBytes(last.ram_used) : "0 B"}</span>
            <span>Total: {last?.ram_total ? formatBytes(last.ram_total) : "0 B"}</span>
          </div>
        </div>

        {/* Disk & Temp Row */}
        <div className="rounded-xl bg-card text-card-foreground p-4 ring-1 ring-border/50 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <CircleStackIcon className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-medium text-muted-foreground">Almacenamiento</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold">{last?.disk?.toFixed(1) || "0"}%</div>
              <div className="text-xs text-muted-foreground">Usado</div>
            </div>
            <div className="h-10 w-1 bg-secondary rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 w-full transition-all duration-500"
                style={{ height: `${Math.min(last?.disk || 0, 100)}%`, marginTop: `${100 - Math.min(last?.disk || 0, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-card text-card-foreground p-4 ring-1 ring-border/50 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <FireIcon className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-muted-foreground">Temperatura</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold">{last?.temp?.toFixed(1) || "—"}°C</div>
              <div className="text-xs text-muted-foreground">Core Temp</div>
            </div>
          </div>
        </div>

        {/* Network Traffic */}
        <div className="col-span-1 md:col-span-2 rounded-xl bg-card text-card-foreground p-4 ring-1 ring-border/50">
          <div className="flex items-center gap-2 mb-4">
            <SignalIcon className="w-5 h-5 text-indigo-500" />
            <span className="text-sm font-medium text-muted-foreground">Tráfico de Red</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-secondary/50 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Descarga (RX)</div>
              <div className="text-lg font-mono font-semibold">
                {last?.net_rx ? (last.net_rx / 1024).toFixed(2) : "0"} KB/s
              </div>
            </div>
            <div className="p-3 bg-secondary/50 rounded-lg">
              <div className="text-xs text-muted-foreground mb-1">Subida (TX)</div>
              <div className="text-lg font-mono font-semibold">
                {last?.net_tx ? (last.net_tx / 1024).toFixed(2) : "0"} KB/s
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gráfico */}
      <section className="rounded-xl bg-card text-card-foreground p-4 ring-1 ring-border/50">
        <div className="mb-2 text-sm text-muted-foreground">{subtitle}</div>
        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points}>
              <defs>
                <linearGradient id="metricFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopOpacity={0.5} />
                  <stop offset="95%" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="t"
                minTickGap={24}
                tickFormatter={(v) => formatTickCL(v)}
              >
                <Label value="Tiempo" offset={-5} position="insideBottomRight" className="fill-muted-foreground text-xs" />
              </XAxis>
              <YAxis>
                <Label
                  value={FIELD_OPTIONS.find(x => x.v === field)?.l ?? field}
                  angle={-90}
                  position="insideLeft"
                  style={{ textAnchor: 'middle' }}
                  className="fill-muted-foreground text-xs"
                />
              </YAxis>
              <Tooltip
                labelFormatter={(v) => formatCL(v)}
                formatter={(value: any) => [
                  typeof value === "number" ? value.toFixed(2) : value,
                  "valor",
                ]}
              />
              <Area
                type="monotone"
                dataKey="v"
                strokeOpacity={1}
                strokeWidth={2}
                fill="url(#metricFill)"
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          {points.length
            ? `Último punto: ${formatCL(points[points.length - 1].t)}`
            : loadingSeries
              ? "Cargando…"
              : "Sin datos en el rango seleccionado"}
        </div>
      </section>

      {/* Logs */}
      {jwt && device && (
        <div className="grid gap-6 grid-cols-1 xl:grid-cols-2">
          <LogViewer jwt={jwt} device={device} range={range} />
          <NetworkTrafficLog device={device} />
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center">Cargando Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
