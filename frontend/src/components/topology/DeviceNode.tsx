"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { ComputerDesktopIcon, BellAlertIcon } from "@heroicons/react/24/outline";

export interface DeviceNodeData extends Record<string, unknown> {
    deviceName: string;
    label?: string;
    status?: "online" | "offline" | "unknown";
    ip?: string;
    notifications?: number;
    diskPartitions?: any[];
}

function DeviceNode({ data }: NodeProps) {
    const typedData = data as DeviceNodeData;
    const status = typedData.status || "unknown";
    const label = typedData.label || typedData.deviceName;
    const ip = typedData.ip || "—";
    const notifications = typedData.notifications || 0;

    const statusColors = {
        online: "bg-green-500",
        offline: "bg-red-500",
        unknown: "bg-gray-400",
    };

    const statusLabels = {
        online: "Online",
        offline: "Offline",
        unknown: "Unknown",
    };

    return (
        <div className="min-w-[200px] rounded-lg bg-card border-2 border-border shadow-lg hover:shadow-xl transition-shadow relative">
            {/* Input */}
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3"
            />

            {/* Outputs */}
            <Handle
                type="source"
                position={Position.Right}
                id="s-right"
                className="w-3 h-3"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="s-bottom"
                className="w-3 h-3"
            />
            <Handle
                type="source"
                position={Position.Left}
                id="s-left"
                className="w-3 h-3"
            />

            <div className="p-4 space-y-2">
                {/* Header con icono y nombre */}
                <div className="flex items-center gap-2">
                    <ComputerDesktopIcon className="w-6 h-6" />
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{label}</div>
                    </div>
                </div>

                {/* Estado */}
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${statusColors[status]} ${status === "online" ? "animate-pulse" : ""}`} />
                    <span className="text-xs text-muted-foreground">{statusLabels[status]}</span>
                </div>

                {/* IP */}
                <div className="text-xs text-muted-foreground font-mono">
                    {ip}
                </div>

                {/* Notificaciones */}
                {notifications > 0 && (
                    <div className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                        <BellAlertIcon className="w-4 h-4" />
                        <span>{notifications} {notifications === 1 ? "alerta" : "alertas"}</span>
                    </div>
                )}

                {/* Particiones de Disco */}
                {typedData.diskPartitions && typedData.diskPartitions.length > 0 && (
                    <div className="pt-2 border-t border-border/50 space-y-1">
                        <div className="text-[10px] text-muted-foreground uppercase">Particiones</div>
                        <div className="space-y-1">
                            {typedData.diskPartitions.map((p: any) => (
                                <div key={p.id} className="flex items-center justify-between text-xs">
                                    <span className="font-mono text-[10px] truncate max-w-[60px]" title={p.mount}>{p.mount}</span>
                                    <div className="flex items-center gap-1 flex-1 ml-2">
                                        <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className={`h-full ${p.usage > 90 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                                style={{ width: `${Math.min(p.usage || 0, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default memo(DeviceNode);
