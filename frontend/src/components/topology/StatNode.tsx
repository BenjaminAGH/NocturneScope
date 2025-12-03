"use client";

import { memo, useEffect, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { getTimeseries } from "@/lib/api/api";
import {
    CpuChipIcon,
    ServerIcon,
    CircleStackIcon,
    GlobeAltIcon,
    BoltIcon
} from "@heroicons/react/24/outline";

export interface StatNodeData extends Record<string, unknown> {
    jwt?: string;
    connectedDevice?: string;
    metric?: string;
    label?: string;
    color?: string;
}

const METRIC_CONFIG: Record<string, { icon: any, color: string, unit: string }> = {
    cpu: { icon: CpuChipIcon, color: "#ef4444", unit: "%" },
    ram: { icon: ServerIcon, color: "#eab308", unit: "%" },
    disk: { icon: CircleStackIcon, color: "#a855f7", unit: "%" },
    net_rx: { icon: GlobeAltIcon, color: "#3b82f6", unit: "KB/s" },
    net_tx: { icon: GlobeAltIcon, color: "#10b981", unit: "KB/s" },
    temp: { icon: BoltIcon, color: "#f97316", unit: "°C" },
};

function StatNode({ id, data, selected }: NodeProps) {
    const typedData = data as StatNodeData;
    const {
        jwt,
        connectedDevice,
        metric = "cpu",
        label = "Metric"
    } = typedData;

    const [points, setPoints] = useState<{ t: string; v: number }[]>([]);
    const [currentValue, setCurrentValue] = useState<number | null>(null);

    const config = METRIC_CONFIG[metric] || { icon: BoltIcon, color: "#8884d8", unit: "" };
    const Icon = config.icon;

    useEffect(() => {
        if (!jwt || !connectedDevice) {
            setPoints([]);
            setCurrentValue(null);
            return;
        }

        const fetchData = async () => {
            try {
                // Fetch last 15 minutes for sparkline
                const ts = await getTimeseries(jwt, {
                    device: connectedDevice,
                    field: metric,
                    range: "15m",
                    agg: "mean",
                    interval: "1m",
                });
                const newPoints = ts.points || [];
                setPoints(newPoints);
                if (newPoints.length > 0) {
                    setCurrentValue(newPoints[newPoints.length - 1].v);
                }
            } catch (e) {
                console.error("Error fetching stat data:", e);
            }
        };

        fetchData();
        const intervalId = setInterval(fetchData, 5000);
        return () => clearInterval(intervalId);
    }, [jwt, connectedDevice, metric, id]);

    return (
        <div
            className={`w-40 h-24 bg-card border rounded-xl shadow-sm flex flex-col overflow-hidden transition-all duration-300 ${selected ? "border-primary ring-2 ring-primary/20 shadow-md" : "border-border"
                }`}
        >
            <Handle
                type="target"
                position={Position.Left}
                className="w-2 h-2 !bg-muted-foreground"
                isConnectable={!connectedDevice}
            />

            {/* Content */}
            <div className="flex-1 p-3 flex flex-col justify-between relative z-10">
                <div className="flex items-center justify-between">
                    <div className="p-1.5 rounded-md bg-muted/50">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                        {label}
                    </span>
                </div>

                <div className="mt-1">
                    <div className="text-2xl font-bold tracking-tight">
                        {currentValue !== null ? (
                            <>
                                {currentValue.toFixed(1)}
                                <span className="text-xs font-normal text-muted-foreground ml-1">
                                    {config.unit}
                                </span>
                            </>
                        ) : (
                            <span className="text-muted-foreground text-sm">--</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Sparkline Background */}
            <div className="absolute bottom-0 left-0 right-0 h-12 opacity-20 pointer-events-none">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={points}>
                        <Area
                            type="monotone"
                            dataKey="v"
                            stroke={config.color}
                            fill={config.color}
                            strokeWidth={2}
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default memo(StatNode);
