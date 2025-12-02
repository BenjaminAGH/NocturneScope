"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { GlobeAltIcon, LinkIcon } from "@heroicons/react/24/outline";

export interface RouterNodeData extends Record<string, unknown> {
    gatewayIP: string;
    label?: string;
    deviceCount?: number;
    rxRate?: number; // Bytes per second
    txRate?: number; // Bytes per second
}

const formatSpeed = (bytesPerSec: number) => {
    if (!bytesPerSec) return "0 B/s";
    if (bytesPerSec < 1024) return `${bytesPerSec.toFixed(1)} B/s`;
    if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
};

function RouterNode({ data }: NodeProps) {
    const typedData = data as RouterNodeData;
    const label = typedData.label || `Router ${typedData.gatewayIP}`;
    const deviceCount = typedData.deviceCount || 0;

    return (
        <div className="min-w-[220px] rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500 shadow-lg hover:shadow-xl transition-shadow">
            <div className="p-4 space-y-2">
                {/* Header con icono de router */}
                <div className="flex items-center gap-2">
                    <GlobeAltIcon className="w-8 h-8" />
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate">{label}</div>
                    </div>
                </div>

                {/* Gateway IP */}
                <div className="text-xs text-muted-foreground font-mono">
                    Gateway: {typedData.gatewayIP}
                </div>

                {/* Dispositivos conectados */}
                {deviceCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                        <LinkIcon className="w-4 h-4" />
                        <span>{deviceCount} {deviceCount === 1 ? "dispositivo" : "dispositivos"}</span>
                    </div>
                )}

                {/* Traffic Stats */}
                {(typedData.rxRate !== undefined || typedData.txRate !== undefined) && (
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-500/30">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground uppercase">Bajada</span>
                            <span className="text-xs font-mono font-medium text-green-600 dark:text-green-400">
                                ↓ {formatSpeed(typedData.rxRate || 0)}
                            </span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-muted-foreground uppercase">Subida</span>
                            <span className="text-xs font-mono font-medium text-blue-600 dark:text-blue-400">
                                ↑ {formatSpeed(typedData.txRate || 0)}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
        </div>
    );
}

export default memo(RouterNode);
