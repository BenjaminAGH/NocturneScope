"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { ClockIcon } from "@heroicons/react/24/outline";

export interface DelayNodeData extends Record<string, unknown> {
    delay?: number; // in milliseconds
    isActive?: boolean;
    isWaiting?: boolean;
}

function DelayNode({ data, selected }: NodeProps) {
    const { delay = 0, isActive, isWaiting } = data as DelayNodeData;

    // Format delay for display
    const formatDelay = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h`;
    };

    return (
        <div
            className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center border-2 transition-all relative bg-card
                ${selected ? "border-primary ring-2 ring-primary/20" : "border-border"}
                ${isActive ? "border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]" : ""}
                ${isWaiting ? "border-yellow-500 animate-pulse" : ""}
            `}
        >
            <Handle type="target" position={Position.Left} className="!bg-primary" />
            <Handle type="source" position={Position.Right} className="!bg-primary" />

            <div className="flex flex-col items-center justify-center">
                <ClockIcon className={`w-6 h-6 ${isActive ? "text-green-500" : isWaiting ? "text-yellow-500" : "text-muted-foreground"}`} />
                <span className="text-[10px] font-medium mt-0.5">{formatDelay(delay)}</span>
            </div>
        </div>
    );
}

export default memo(DelayNode);
