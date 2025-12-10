"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { BoltIcon, FunnelIcon } from "@heroicons/react/24/outline";
import { useLanguage } from "@/context/LanguageContext";

export interface TrafficTriggerNodeData extends Record<string, unknown> {
    ruleType?: 'threat_level' | 'port' | 'protocol' | 'ip';
    operator?: 'is' | 'contains' | '>' | '<';
    value?: string | number;
    connectedDevice?: string;
    isActive?: boolean;
}

const RULE_TYPES = [
    { value: "threat_level", label: "Threat Level" },
    { value: "port", label: "Port" },
    { value: "protocol", label: "Protocol" },
    { value: "ip", label: "IP Address" },
];

const OPERATORS = [
    { value: "is", label: "Is" },
    { value: "contains", label: "Contains" },
    { value: ">", label: ">" },
    { value: "<", label: "<" },
];

function TrafficTriggerNode({ id, data, selected }: NodeProps) {
    const { t } = useLanguage();
    const typedData = data as TrafficTriggerNodeData;
    const {
        connectedDevice,
        ruleType = "threat_level",
        operator = "is",
        value = "HIGH",
        isActive
    } = typedData;

    return (
        <div
            className={`min-w-[220px] bg-card border-2 rounded-lg shadow-lg flex flex-col overflow-hidden transition-all ${selected ? "border-primary ring-2 ring-primary/20" : "border-border"
                } ${isActive ? "shadow-[0_0_15px_rgba(239,68,68,0.5)] border-red-500" : ""}`}
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
            <div className={`px-3 py-2 flex justify-between items-center ${isActive ? "bg-red-500/10" : "bg-muted/50"}`}>
                <div className="flex items-center gap-2">
                    <FunnelIcon className={`w-5 h-5 ${isActive ? "text-red-500 animate-pulse" : "text-muted-foreground"}`} />
                    <span className="font-medium text-sm">{t('trafficTriggerTitle')}</span>
                </div>
            </div>

            {/* Content */}
            <div className="p-3 space-y-2 bg-card">
                {connectedDevice ? (
                    <div className="text-xs font-medium truncate flex items-center gap-1">
                        <span className="text-muted-foreground">{t('sourceLabel')}:</span>
                        {connectedDevice}
                    </div>
                ) : (
                    <div className="text-xs text-muted-foreground italic">
                        {t('noDeviceConnected')}
                    </div>
                )}

                <div className="flex flex-col gap-1 text-xs bg-muted/30 p-2 rounded border border-border/50">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{t('ruleLabel')}:</span>
                        <span className="font-mono font-semibold uppercase">{ruleType.replace('_', ' ')}</span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{t('valueLabel')}:</span>
                        <span className="font-mono font-semibold text-primary">{value}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default memo(TrafficTriggerNode);
