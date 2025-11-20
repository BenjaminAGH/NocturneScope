"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

export interface RouterNodeData extends Record<string, unknown> {
    gatewayIP: string;
    label?: string;
    deviceCount?: number;
}

function RouterNode({ data }: NodeProps) {
    const typedData = data as RouterNodeData;
    const label = typedData.label || `Router ${typedData.gatewayIP}`;
    const deviceCount = typedData.deviceCount || 0;

    return (
        <div className="min-w-[220px] rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500 shadow-lg hover:shadow-xl transition-shadow">
            <div className="p-4 space-y-2">
                {/* Header con icono de router */}
                <div className="flex items-center gap-2">
                    <span className="text-3xl">🌐</span>
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
                        <span>🔗</span>
                        <span>{deviceCount} {deviceCount === 1 ? "dispositivo" : "dispositivos"}</span>
                    </div>
                )}
            </div>

            <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
        </div>
    );
}

export default memo(RouterNode);
