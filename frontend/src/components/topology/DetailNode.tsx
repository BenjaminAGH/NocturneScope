"use client";

import { memo, useEffect, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { getTimeseries } from "@/lib/api/api";

export interface DetailNodeData extends Record<string, unknown> {
    jwt?: string;
    connectedDevice?: string;
    selectedMetrics?: string[]; // Array of metric keys like 'cpu', 'ram'
}

const METRIC_LABELS: Record<string, string> = {
    cpu: "CPU",
    ram: "RAM",
    disk: "Disk",
    net_rx: "Net RX",
    net_tx: "Net TX",
    temp: "Temp",
};

const METRIC_UNITS: Record<string, string> = {
    cpu: "%",
    ram: "%",
    disk: "%",
    net_rx: "KB/s",
    net_tx: "KB/s",
    temp: "°C",
};

function DetailNode({ id, data, selected }: NodeProps) {
    const typedData = data as DetailNodeData;
    const {
        jwt,
        connectedDevice,
        selectedMetrics = ["cpu", "ram", "disk"],
    } = typedData;

    const [values, setValues] = useState<Record<string, number>>({});

    useEffect(() => {
        if (!jwt || !connectedDevice) {
            setValues({});
            return;
        }

        const fetchData = async () => {
            try {
                const newValues: Record<string, number> = {};

                // Fetch all selected metrics in parallel
                await Promise.all(selectedMetrics.map(async (metric) => {
                    try {
                        const ts = await getTimeseries(jwt, {
                            device: connectedDevice,
                            field: metric,
                            range: "1m",
                            agg: "last",
                            interval: "1m",
                        });
                        if (ts.points && ts.points.length > 0) {
                            newValues[metric] = ts.points[ts.points.length - 1].v;
                        }
                    } catch (e) {
                        console.error(`Error fetching ${metric}:`, e);
                    }
                }));

                setValues(newValues);
            } catch (e) {
                console.error("Error fetching detail data:", e);
            }
        };

        fetchData();
        const intervalId = setInterval(fetchData, 5000);
        return () => clearInterval(intervalId);
    }, [jwt, connectedDevice, JSON.stringify(selectedMetrics)]);

    return (
        <div
            className={`min-w-[180px] bg-card border rounded-lg shadow-sm flex flex-col overflow-hidden transition-all duration-200 ${selected ? "ring-2 ring-primary/50 border-primary" : "border-border"
                }`}
        >
            <Handle
                type="target"
                position={Position.Left}
                id="t-left"
                className="w-2 h-2 !bg-muted-foreground"
                isConnectable={!connectedDevice}
            />

            <div className="bg-muted/30 px-3 py-2 border-b border-border/50">
                <span className="text-xs font-semibold text-foreground">Detalles</span>
            </div>

            <div className="p-2 space-y-1">
                {selectedMetrics.length === 0 && (
                    <div className="text-[10px] text-muted-foreground italic p-1">
                        No metrics selected
                    </div>
                )}
                {selectedMetrics.map((metric) => (
                    <div key={metric} className="flex items-center justify-between px-2 py-1 rounded hover:bg-muted/50 transition-colors">
                        <span className="text-xs text-muted-foreground font-medium">
                            {METRIC_LABELS[metric] || metric}
                        </span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xs font-mono font-bold text-foreground">
                                {values[metric] !== undefined ? values[metric].toFixed(1) : "--"}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                                {METRIC_UNITS[metric] || ""}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default memo(DetailNode);
