"use client";

import { memo, useState, useEffect } from "react";
import { Handle, Position, NodeProps, useReactFlow } from "@xyflow/react";
import { BoltIcon } from "@heroicons/react/24/outline";

export interface ActionNodeData extends Record<string, unknown> {
    metric?: string;
    operator?: string;
    threshold?: number;
    connectedDevice?: string;
    isActive?: boolean;
}

const METRICS = [
    { value: "cpu", label: "CPU Usage" },
    { value: "ram", label: "RAM Usage" },
    { value: "disk", label: "Disk Usage" },
    { value: "temp", label: "Temperature" },
];

const OPERATORS = [
    { value: ">", label: ">" },
    { value: ">=", label: ">=" },
    { value: "<", label: "<" },
    { value: "<=", label: "<=" },
    { value: "==", label: "=" },
];

function ActionNode({ id, data, selected }: NodeProps) {
    const typedData = data as ActionNodeData;
    const { connectedDevice, metric = "cpu", operator = ">=", threshold = 70, isActive } = typedData;

    return (
        <div
            className={`min-w-[200px] bg-card border-2 rounded-lg shadow-lg flex flex-col overflow-hidden transition-all ${selected ? "border-primary ring-2 ring-primary/20" : "border-border"
                } ${isActive ? "shadow-[0_0_15px_rgba(234,179,8,0.5)] border-yellow-500" : ""}`}
        >
            {/* Input Handle (from Device) */}
            <Handle
                type="target"
                position={Position.Left}
                id="t-in"
                className="w-3 h-3 !bg-primary"
            />

            {/* Output Handle (to Reaction) */}
            <Handle
                type="source"
                position={Position.Right}
                id="s-out"
                className="w-3 h-3 !bg-primary"
            />

            {/* Header */}
            <div className={`px-3 py-2 flex justify-between items-center ${isActive ? "bg-yellow-500/10" : "bg-muted/50"}`}>
                <div className="flex items-center gap-2">
                    <BoltIcon className={`w-5 h-5 ${isActive ? "text-yellow-500 animate-pulse" : "text-muted-foreground"}`} />
                    <span className="font-medium text-sm">Trigger Rule</span>
                </div>
            </div>

            {/* Content */}
            <div className="p-3 space-y-2 bg-card">
                {connectedDevice ? (
                    <div className="text-xs font-medium truncate">
                        {connectedDevice}
                    </div>
                ) : (
                    <div className="text-xs text-muted-foreground italic">
                        No device connected
                    </div>
                )}

                <div className="flex items-center gap-2 text-xs bg-muted/30 p-2 rounded border border-border/50">
                    <span className="font-mono font-semibold uppercase">{metric}</span>
                    <span className="text-muted-foreground">{operator}</span>
                    <span className="font-mono font-semibold">{threshold}</span>
                </div>
            </div>
        </div>
    );
}

export default memo(ActionNode);
