"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { HashtagIcon } from "@heroicons/react/24/outline";
import { useLanguage } from "@/context/LanguageContext";

export interface ThresholdNodeData extends Record<string, unknown> {
    threshold?: number;
    timeWindow?: number; // seconds
    currentCount?: number;
    isActive?: boolean;
}

function ThresholdNode({ id, data, selected }: NodeProps) {
    const { t } = useLanguage();
    const typedData = data as ThresholdNodeData;
    const { threshold = 3, timeWindow = 60, currentCount = 0, isActive } = typedData;

    // Calculate progress percentage for visual bar
    const progress = Math.min((currentCount / threshold) * 100, 100);

    return (
        <div
            className={`min-w-[180px] bg-card border-2 rounded-lg shadow-lg flex flex-col overflow-hidden transition-all ${selected ? "border-primary ring-2 ring-primary/20" : "border-border"
                } ${isActive ? "shadow-[0_0_15px_rgba(239,68,68,0.5)] border-red-500" : ""}`}
        >
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Left}
                id="t-in"
                className="w-3 h-3 !bg-primary"
            />

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                id="s-out"
                className="w-3 h-3 !bg-primary"
            />

            {/* Header */}
            <div className={`px-3 py-2 flex justify-between items-center ${isActive ? "bg-red-500/10" : "bg-muted/50"}`}>
                <div className="flex items-center gap-2">
                    <HashtagIcon className={`w-5 h-5 ${isActive ? "text-red-500 animate-pulse" : "text-muted-foreground"}`} />
                    <span className="font-medium text-sm">{t('thresholdNode')}</span>
                </div>
            </div>

            {/* Content */}
            <div className="p-3 space-y-3 bg-card">
                <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{t('countLabel')}:</span>
                    <span className="font-mono font-bold">{currentCount} / {threshold}</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${isActive ? "bg-red-500" : "bg-primary"}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="text-[10px] text-muted-foreground text-center">
                    {t('resetWindow')} {timeWindow}s
                </div>
            </div>
        </div>
    );
}

export default memo(ThresholdNode);
