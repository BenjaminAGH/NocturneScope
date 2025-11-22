"use client";

import { memo, useState, useEffect } from "react";
import { Handle, Position, NodeProps, useReactFlow } from "@xyflow/react";
import { EnvelopeIcon } from "@heroicons/react/24/outline";

export interface EmailNodeData extends Record<string, unknown> {
    subject?: string;
    body?: string;
    to?: string;
    cooldown?: string; // e.g., "5m", "1h"
    isActive?: boolean;
    connectedDevice?: string;
}

function EmailNode({ id, data, selected }: NodeProps) {
    const typedData = data as EmailNodeData;
    const { isActive, to } = typedData;

    return (
        <div
            className={`min-w-[150px] bg-card border-2 rounded-lg shadow-lg flex flex-col overflow-hidden transition-all ${selected ? "border-primary ring-2 ring-primary/20" : "border-border"
                } ${isActive ? "shadow-[0_0_15px_rgba(59,130,246,0.5)] border-blue-500" : ""}`}
        >
            {/* Input Handle (from Action) */}
            <Handle
                type="target"
                position={Position.Left}
                id="t-in"
                className="w-3 h-3 !bg-primary"
            />

            {/* Header */}
            <div className={`px-3 py-2 flex justify-between items-center ${isActive ? "bg-blue-500/10" : "bg-muted/50"}`}>
                <div className="flex items-center gap-2">
                    <EnvelopeIcon className={`w-5 h-5 ${isActive ? "text-blue-500 animate-pulse" : "text-muted-foreground"}`} />
                    <span className="font-medium text-sm">Send Email</span>
                </div>
            </div>

            {/* Status Indicator */}
            <div className="px-3 py-2 space-y-1 border-t border-border/50">
                {typedData.connectedDevice && (
                    <div className="text-xs text-primary font-medium truncate">
                        {typedData.connectedDevice}
                    </div>
                )}
                {to && (
                    <div className="text-xs text-muted-foreground truncate">
                        To: {to}
                    </div>
                )}
            </div>
        </div>
    );
}

export default memo(EmailNode);
