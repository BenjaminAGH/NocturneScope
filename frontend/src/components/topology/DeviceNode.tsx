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
    os?: string;
    color?: string;
}

function getOSIcon(os: string) {
    const lowerOS = os?.toLowerCase() || "";
    if (lowerOS.includes("windows")) {
        return (
            <svg viewBox="0 0 88 88" className="w-5 h-5" fill="currentColor">
                <path fill="#00ADEF" d="M0,12.402l35.687-4.86l0.015,34.423H0V12.402z M35.67,47.284L0,47.299v29.58l35.67-4.877V47.284z M41.006,4.539 L87.342,0v41.965H41.006V4.539z M87.342,47.284H41.006v37.132l46.336-6.591V47.284z" />
            </svg>
        );
    }
    if (lowerOS.includes("linux") || lowerOS.includes("ubuntu") || lowerOS.includes("debian")) {
        return (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="none" />
                <path d="M18.14 14.93c-1.09-2.18-2.61-2.93-2.61-2.93.33-.33.76-.65 1.31-.87 0 0-.66-1.09-2.29-.65-.65.22-1.2.65-1.53 1.09-.32-.11-.76-.22-1.09-.22-.43 0-.76.11-1.2.22-.32-.44-.87-.87-1.52-1.09-1.63-.44-2.29.65-2.29.65.55.22.98.54 1.31.87 0 0-1.52.76-2.61 2.93-.98 1.96-.44 3.92.33 4.57.33.33.76.44 1.09.44 1.2 0 2.07-1.09 2.5-2.07.44.76 1.2 1.31 2.07 1.31.87 0 1.63-.55 2.07-1.31.44.98 1.31 2.07 2.5 2.07.33 0 .76-.11 1.09-.44.77-.65 1.31-2.61.33-4.57z" />
            </svg>
        );
    }
    if (lowerOS.includes("darwin") || lowerOS.includes("mac") || lowerOS.includes("apple")) {
        return (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.8-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.55-.67.92-1.56.92-2.5-1.54.06-3.4 1.03-4.08 2.48-.48.99-.89 2.47.92 2.47.08 0 1.69-.18 2.24-2.45z" />
            </svg>
        );
    }
    // Default or unknown
    return <ComputerDesktopIcon className="w-6 h-6" />;
}

function DeviceNode({ data }: NodeProps) {
    const typedData = data as DeviceNodeData;
    const status = typedData.status || "unknown";
    const label = typedData.label || typedData.deviceName;
    const ip = typedData.ip || "—";
    const notifications = typedData.notifications || 0;
    const os = typedData.os || "";
    const color = typedData.color || "#c4a7e7"; // Default Rose Pine Iris

    const statusColors = {
        online: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]",
        offline: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]",
        unknown: "bg-gray-400",
    };

    const statusLabels = {
        online: "Online",
        offline: "Offline",
        unknown: "Unknown",
    };

    return (
        <div
            className="min-w-[220px] rounded-xl bg-card border-2 shadow-sm transition-all duration-300 hover:shadow-md relative overflow-hidden group"
            style={{
                borderColor: color
            }}
        >
            {/* Top Border Accent */}
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: color }} />

            {/* Input */}
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3 !bg-background !border-2 !border-primary"
            />

            {/* Outputs */}
            <Handle
                type="source"
                position={Position.Right}
                id="s-right"
                className="w-3 h-3 !bg-background !border-2 !border-primary"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="s-bottom"
                className="w-3 h-3 !bg-background !border-2 !border-primary"
            />
            <Handle
                type="source"
                position={Position.Left}
                id="s-left"
                className="w-3 h-3 !bg-background !border-2 !border-primary"
            />

            <div className="p-4 space-y-3 relative z-10">
                {/* Header con icono y nombre */}
                <div className="flex items-center gap-3">
                    <div
                        className="p-2 rounded-lg bg-white/5 border border-white/10 shadow-inner text-foreground"
                        style={{ color: color }}
                    >
                        {getOSIcon(os)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm truncate text-foreground/90">{label}</div>
                        <div className="text-[10px] text-muted-foreground font-mono truncate opacity-70">{typedData.deviceName}</div>
                    </div>
                </div>

                {/* Estado */}
                <div className="flex items-center gap-2 bg-black/20 rounded-md px-2 py-1.5 justify-center">
                    <div className={`w-2 h-2 rounded-full ${statusColors[status]} ${status === "online" ? "animate-pulse" : ""}`} />
                    <span className="text-[10px] font-medium text-muted-foreground/90">{statusLabels[status]}</span>
                </div>
            </div>
        </div>
    );
}

export default memo(DeviceNode);
