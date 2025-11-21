"use client";

import { memo, useEffect, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { PresentationChartLineIcon } from "@heroicons/react/24/outline";
import { getTimeseries } from "@/lib/api/api";
import { formatTickCL } from "@/lib/time";

export interface MonitoringNodeData extends Record<string, unknown> {
    jwt?: string;
    connectedDevice?: string;
    metric?: string;
    range?: string;
    interval?: string;
    agg?: string;
    label?: string;
}

const METRIC_COLORS: Record<string, string> = {
    cpu: "#ef4444", // red-500
    ram: "#eab308", // yellow-500
    disk: "#a855f7", // purple-500
    net_rx: "#3b82f6", // blue-500
    net_tx: "#10b981", // green-500
    temp: "#f97316", // orange-500
};

function MonitoringNode({ id, data, selected }: NodeProps) {
    const typedData = data as MonitoringNodeData;
    const {
        jwt,
        connectedDevice,
        metric = "cpu",
        range = "1h",
        interval = "1m",
        agg = "mean"
    } = typedData;

    const [points, setPoints] = useState<{ t: string; v: number }[]>([]);

    useEffect(() => {
        if (!jwt || !connectedDevice) {
            setPoints([]);
            return;
        }

        const fetchData = async () => {
            try {
                const ts = await getTimeseries(jwt, {
                    device: connectedDevice,
                    field: metric,
                    range,
                    agg,
                    interval,
                });
                setPoints(ts.points || []);
            } catch (e) {
                console.error("Error fetching monitoring data:", e);
            }
        };

        fetchData();
        const intervalId = setInterval(fetchData, 5000);
        return () => clearInterval(intervalId);
    }, [jwt, connectedDevice, metric, range, interval, agg, id]);

    const color = METRIC_COLORS[metric] || "#8884d8";
    const gradientId = `fill-${id}-${metric}`;

    return (
        <div
            className={`min-w-[400px] h-[300px] bg-card border-2 rounded-lg shadow-lg flex flex-col overflow-hidden transition-colors ${selected ? "border-primary ring-2 ring-primary/20" : "border-border"
                }`}
        >
            <Handle
                type="target"
                position={Position.Left}
                id="t-left"
                className="w-3 h-3 !bg-primary"
                isConnectable={!connectedDevice}
            />
            <Handle
                type="target"
                position={Position.Right}
                id="t-right"
                className="w-3 h-3 !bg-primary"
                isConnectable={!connectedDevice}
            />

            {/* Header */}
            <div className="px-3 py-2 border-b border-border bg-muted/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <PresentationChartLineIcon className="w-5 h-5" />
                    <span className="font-medium text-sm">
                        {connectedDevice ? connectedDevice : "Sin conexión"}
                    </span>
                </div>
                <div className="flex gap-2">
                    <span className="text-xs font-mono uppercase bg-background px-2 py-0.5 rounded border">
                        {metric}
                    </span>
                    <span className="text-xs font-mono bg-background px-2 py-0.5 rounded border text-muted-foreground">
                        {agg} • {range}
                    </span>
                </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 p-2 relative min-h-0 nodrag">
                {!connectedDevice ? (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs text-center p-4">
                        Conecta este nodo a un dispositivo para ver datos
                    </div>
                ) : (
                    <div className="w-full h-full text-xs">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={points} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                        <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                <XAxis
                                    dataKey="t"
                                    tickFormatter={formatTickCL}
                                    minTickGap={30}
                                    tick={{ fill: 'currentColor', opacity: 0.5 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    domain={['auto', 'auto']}
                                    tick={{ fill: 'currentColor', opacity: 0.5 }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={40}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--popover))",
                                        borderColor: "hsl(var(--border))",
                                        fontSize: "12px",
                                        padding: "4px 8px",
                                        borderRadius: "var(--radius)"
                                    }}
                                    labelFormatter={(v) => formatTickCL(v)}
                                    formatter={(val: number) => [val.toFixed(2), metric]}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="v"
                                    stroke={color}
                                    fill={`url(#${gradientId})`}
                                    strokeWidth={2}
                                    isAnimationActive={false}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>
        </div>
    );
}

export default memo(MonitoringNode);
