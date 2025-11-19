"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
export type Point = { t: string; v: number };
export default function MetricChart({ data, label }:{ data: Point[]; label: string }) {
  const series = data.map(d => ({ time: new Date(d.t).toISOString().slice(11,19), value: d.v }));
  return (
    <div className="rounded-lg bg-card text-card-foreground p-4 shadow">
      <div className="mb-2 text-sm text-muted-foreground">{label}</div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" minTickGap={32}/>
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" dot={false} strokeWidth={2}/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
