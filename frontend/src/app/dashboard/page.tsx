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
  FireIcon,
  ArrowDownIcon,
  ArrowUpIcon
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
        const sortedPoints = (ts.points || []).sort((a: Point, b: Point) =>
          new Date(a.t).getTime() - new Date(b.t).getTime()
        );
        setPoints(sortedPoints);
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
              {last?.os || last?.os_name || last?.platform || "Sistema Desconocido"} {last?.os_version || ""}
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
          <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
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
                      className={`aspect-square rounded-sm ${bgColor} transition-colors duration-500 flex items-center justify-center relative cursor-default`}
                      title={`Core ${core.id.replace('cpu_core_', '')}: ${val.toFixed(1)}%`}
                    >
                      <span className="text-[9px] font-mono text-white font-bold leading-none select-none">
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
          <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
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

        {/* Disk Card - Overview */}
        <div className="rounded-xl bg-card text-card-foreground p-4 ring-1 ring-border/50 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CircleStackIcon className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-medium text-muted-foreground">Almacenamiento</span>
            </div>
            {/* Calculate total usage percent based on sum of partitions if available */}
            {(() => {
              if (!last) return <span className="text-xl font-bold">0%</span>;
              const partitions = Object.keys(last)
                .filter(k => k.startsWith('disk_usage_'))
                .map(k => ({
                  total: last[k.replace('usage', 'total')],
                  used: last[k.replace('usage', 'used')]
                }));
              const total = partitions.reduce((acc, p) => acc + (p.total || 0), 0);
              const used = partitions.reduce((acc, p) => acc + (p.used || 0), 0);
              const percent = total > 0 ? (used / total) * 100 : 0;
              return <span className="text-xl font-bold">{percent.toFixed(1)}%</span>;
            })()}
          </div>

          {(() => {
            if (!last) return null;
            const partitions = Object.keys(last)
              .filter(k => k.startsWith('disk_usage_'))
              .map(k => {
                const displayMount = k.replace('disk_usage_', '').replace('_root', '/');
                return {
                  id: k,
                  mount: displayMount,
                  usage: last[k],
                  total: last[k.replace('usage', 'total')],
                  used: last[k.replace('usage', 'used')]
                };
              })
              .sort((a, b) => a.mount.localeCompare(b.mount));

            // Calculate total disk size from partitions for the bar
            const totalDiskSize = partitions.reduce((acc, p) => acc + (p.total || 0), 0);
            const totalDiskUsed = partitions.reduce((acc, p) => acc + (p.used || 0), 0);

            // Colors for partitions
            const colors = [
              "bg-emerald-500",
              "bg-blue-500",
              "bg-purple-500",
              "bg-orange-500",
              "bg-pink-500",
              "bg-cyan-500",
            ];

            return (
              <>
                <div className="w-full bg-muted/30 rounded-full h-4 overflow-hidden flex mt-2 ring-1 ring-border/20">
                  {partitions.map((p, i) => {
                    // Calculate width relative to TOTAL disk size
                    const width = totalDiskSize > 0 ? (p.used / totalDiskSize) * 100 : 0;
                    return (
                      <div
                        key={p.id}
                        className={`${colors[i % colors.length]} h-full transition-all duration-500 hover:opacity-80`}
                        style={{ width: `${width}%` }}
                        title={`${p.mount}: ${formatBytes(p.used)} (${p.usage?.toFixed(1)}%)`}
                      />
                    );
                  })}
                </div>

                <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                  <span>Usado: {formatBytes(totalDiskUsed)}</span>
                  <span>Total: {formatBytes(totalDiskSize)}</span>
                </div>
              </>
            );
          })()}
        </div>

        {/* Partition Details Card */}
        <div className="rounded-xl bg-card text-card-foreground p-4 ring-1 ring-border/50 flex flex-col h-full overflow-y-auto max-h-[200px] scrollbar-thin scrollbar-thumb-border">
          <div className="flex items-center gap-2 mb-3 sticky top-0 bg-card z-10 pb-2 border-b border-border/50">
            <CircleStackIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Detalle Particiones</span>
          </div>
          {(() => {
            if (!last) return null;
            const partitions = Object.keys(last)
              .filter(k => k.startsWith('disk_usage_'))
              .map(k => {
                const displayMount = k.replace('disk_usage_', '').replace('_root', '/');
                return {
                  id: k,
                  mount: displayMount,
                  usage: last[k],
                  total: last[k.replace('usage', 'total')],
                  used: last[k.replace('usage', 'used')]
                };
              })
              .sort((a, b) => a.mount.localeCompare(b.mount));

            const colors = [
              "bg-emerald-500",
              "bg-blue-500",
              "bg-purple-500",
              "bg-orange-500",
              "bg-pink-500",
              "bg-cyan-500",
            ];

            return (
              <div className="grid grid-cols-1 gap-3">
                {partitions.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between text-xs group">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className={`w-2 h-2 rounded-full ${colors[i % colors.length]}`} />
                      <span className="font-mono text-[11px] truncate max-w-[80px]" title={p.mount}>{p.mount}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="font-mono text-[10px]">{formatBytes(p.used)} / {formatBytes(p.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        <div className="rounded-xl bg-card text-card-foreground p-4 ring-1 ring-border/50 flex flex-col justify-between h-fit">
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
        <div className="rounded-xl bg-card text-card-foreground p-4 ring-1 ring-border/50">
          <div className="flex items-center gap-2 mb-4">
            <SignalIcon className="w-5 h-5 text-indigo-500" />
            <span className="text-sm font-medium text-muted-foreground">Tráfico</span>
          </div>
          <div className="flex flex-col gap-3">
            <div className="relative overflow-hidden rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 flex items-center gap-3">
              <div className="p-1.5 bg-blue-500/20 rounded-full">
                <ArrowDownIcon className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <div className="text-[10px] font-medium text-blue-500 mb-0.5">RX</div>
                <div className="text-sm font-bold font-mono text-foreground">
                  {last?.net_rx ? formatBytes(last.net_rx) : "0 B"}/s
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-lg border border-indigo-500/20 bg-indigo-500/10 p-3 flex items-center gap-3">
              <div className="p-1.5 bg-indigo-500/20 rounded-full">
                <ArrowUpIcon className="w-4 h-4 text-indigo-500" />
              </div>
              <div>
                <div className="text-[10px] font-medium text-indigo-500 mb-0.5">TX</div>
                <div className="text-sm font-bold font-mono text-foreground">
                  {last?.net_tx ? formatBytes(last.net_tx) : "0 B"}/s
                </div>
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
