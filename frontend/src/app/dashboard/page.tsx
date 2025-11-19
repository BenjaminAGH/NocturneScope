"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  getDevices,
  getLastStats,
  getTimeseries,
} from "@/lib/api/api";
import { formatCL, formatTickCL } from "@/lib/time";
import LogViewer from "@/components/LogViewer";

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

export default function DashboardPage() {
  const router = useRouter();

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
      router.replace("/login");
      return;
    }
    setJwt(t);
  }, [router]);

  // Carga lista de dispositivos
  useEffect(() => {
    if (!jwt) return;
    setLoadingDevices(true);
    setErr("");
    (async () => {
      try {
        const devs = await getDevices(jwt);
        setDevices(devs);
        if (!device && devs.length) setDevice(devs[0]);
      } catch (e: any) {
        setErr(e?.message || "Error cargando dispositivos");
      } finally {
        setLoadingDevices(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jwt]);

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

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
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
      <section className="grid gap-3 grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
        {[
          ["cpu", "CPU (%)"],
          ["ram", "RAM (%)"],
          ["disk", "DISK (%)"],
          ["net_rx", "Net RX (B/s)"],
          ["net_tx", "Net TX (B/s)"],
          ["temp", "Temp (°C)"],
          ["uptime", "Uptime (s)"],
        ].map(([k, label]) => (
          <div
            key={k}
            className="rounded-lg bg-card text-card-foreground p-4 ring-1 ring-border/50"
          >
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-2xl font-semibold">
              {last && typeof last[k] === "number" ? last[k].toFixed(2) : "—"}
            </div>
          </div>
        ))}

        {/* Info Dispositivo */}
        <div className="rounded-lg bg-card text-card-foreground p-4 ring-1 ring-border/50">
          <div className="text-sm text-muted-foreground">Info Dispositivo</div>
          <div className="text-sm font-semibold mt-1 space-y-1">
            {last ? (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-normal">OS:</span>
                  <span>{last.os || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground font-normal">IP:</span>
                  <span>{last.ip || "—"}</span>
                </div>
              </>
            ) : "—"}
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
              />
              <YAxis />
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
      {jwt && device && <LogViewer jwt={jwt} device={device} range={range} />}
    </div>
  );
}
