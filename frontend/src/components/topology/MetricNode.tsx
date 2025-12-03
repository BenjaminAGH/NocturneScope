"use client";

import { memo, useEffect, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { getTimeseries } from "@/lib/api/api";

export interface MetricNodeData extends Record<string, unknown> {
    jwt?: string;
    connectedDevice?: string;
    metric?: "cpu" | "ram" | "disk" | "net_rx" | "net_tx" | "temp";
    label?: string;
}

const METRIC_CONFIG: Record<string, { label: string; color: string; unit: string }> = {
    cpu: { label: "CPU Usage", color: "#ef4444", unit: "%" },
    ram: { label: "RAM Usage", color: "#eab308", unit: "%" },
    disk: { label: "Disk Usage", color: "#a855f7", unit: "%" },
    net_rx: { label: "Network RX", color: "#3b82f6", unit: "KB/s" },
    net_tx: { label: "Network TX", color: "#10b981", unit: "KB/s" },
    temp: { label: "Temperature", color: "#f97316", unit: "°C" },
};

function MetricNode({ id, data, selected }: NodeProps) {
    const typedData = data as MetricNodeData;
    const {
        jwt,
        connectedDevice,
        metric = "cpu",
    } = typedData;

    const [value, setValue] = useState<number | null>(null);
    const config = METRIC_CONFIG[metric] || METRIC_CONFIG.cpu;

    useEffect(() => {
        if (!jwt || !connectedDevice) {
            setValue(null);
            return;
        }

        const fetchData = async () => {
            try {
                // Fetch last 1 minute to get current value
                const ts = await getTimeseries(jwt, {
                    device: connectedDevice,
                    field: metric,
                    range: "1m",
                    agg: "last",
                    interval: "1m",
                });
                if (ts.points && ts.points.length > 0) {
                    setValue(ts.points[ts.points.length - 1].v);
                }
            } catch (e) {
                console.error("Error fetching metric data:", e);
            }
        };

        fetchData();
        const intervalId = setInterval(fetchData, 5000);
        return () => clearInterval(intervalId);
    }, [jwt, connectedDevice, metric]);

    return (
        <div
            className={`min-w-[140px] bg-card border rounded-lg shadow-sm flex flex-col overflow-hidden transition-all duration-200 ${selected ? "ring-2 ring-primary/50 border-primary" : "border-border"
                }`}
        >
            <Handle
                type="target"
                position={Position.Left}
                id="t-left"
                className="w-2 h-2 !bg-muted-foreground"
                isConnectable={!connectedDevice}
            />

            <div className="p-3 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        {config.label}
                    </span>
                    <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: config.color }}
                    />
                </div>

                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold tabular-nums text-foreground">
                        {value !== null ? value.toFixed(1) : "--"}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                        {config.unit}
                    </span>
                </div>

                {/* Simple progress bar for percentage metrics */}
                {['cpu', 'ram', 'disk'].includes(metric) && (
                    <div className="w-full h-1 bg-muted rounded-full mt-1 overflow-hidden">
                        <div
                            className="h-full transition-all duration-500"
                            style={{
                                width: `${Math.min(value || 0, 100)}%`,
                                backgroundColor: config.color
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default memo(MetricNode);
