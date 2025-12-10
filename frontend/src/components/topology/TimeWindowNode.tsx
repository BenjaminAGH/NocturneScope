"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { ClockIcon } from "@heroicons/react/24/outline";
import { useLanguage } from "@/context/LanguageContext";

export interface TimeWindowNodeData extends Record<string, unknown> {
    startTime?: string; // HH:mm
    endTime?: string;   // HH:mm
    isActive?: boolean;
}

function TimeWindowNode({ id, data, selected }: NodeProps) {
    const { t } = useLanguage();
    const typedData = data as TimeWindowNodeData;
    const { startTime = "09:00", endTime = "17:00", isActive } = typedData;

    return (
        <div
            className={`min-w-[180px] bg-card border-2 rounded-lg shadow-lg flex flex-col overflow-hidden transition-all ${selected ? "border-primary ring-2 ring-primary/20" : "border-border"
                } ${isActive ? "shadow-[0_0_15px_rgba(34,197,94,0.5)] border-green-500" : ""}`}
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
            <div className={`px-3 py-2 flex justify-between items-center ${isActive ? "bg-green-500/10" : "bg-muted/50"}`}>
                <div className="flex items-center gap-2">
                    <ClockIcon className={`w-5 h-5 ${isActive ? "text-green-500" : "text-muted-foreground"}`} />
                    <span className="font-medium text-sm">{t('timeWindowTitle')}</span>
                </div>
            </div>

            {/* Content */}
            <div className="p-3 space-y-2 bg-card">
                <div className="flex items-center justify-between text-xs bg-muted/30 p-2 rounded border border-border/50">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] text-muted-foreground uppercase">{t('startLabel')}</span>
                        <span className="font-mono font-semibold">{startTime}</span>
                    </div>
                    <div className="h-full w-px bg-border/50 mx-2"></div>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] text-muted-foreground uppercase">{t('endLabel')}</span>
                        <span className="font-mono font-semibold">{endTime}</span>
                    </div>
                </div>

                <div className={`text-xs text-center font-medium ${isActive ? "text-green-600" : "text-muted-foreground"}`}>
                    {isActive ? t('stateActive') : t('stateInactive')}
                </div>
            </div>
        </div>
    );
}

export default memo(TimeWindowNode);
