"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import DeviceDetails from "./DeviceDetails";
import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import { useLanguage } from "@/context/LanguageContext";

export interface DeviceDetailsNodeData extends Record<string, unknown> {
    connectedDevice?: string;
    jwt?: string;
}

function DeviceDetailsNode({ data }: NodeProps) {
    const { t } = useLanguage();
    const typedData = data as DeviceDetailsNodeData;
    const { connectedDevice, jwt } = typedData;

    return (
        <div className="min-w-[300px] bg-card border-2 border-border rounded-lg shadow-lg relative overflow-hidden">
            <Handle
                type="target"
                position={Position.Top}
                className="w-3 h-3"
            />

            <div className="p-3 border-b border-border bg-muted/20 flex items-center gap-2">
                <ClipboardDocumentListIcon className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold">{t('deviceDetailsTitle')}</span>
            </div>

            <div className="p-4">
                {connectedDevice && jwt ? (
                    <DeviceDetails deviceId={connectedDevice} jwt={jwt} />
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                        <ClipboardDocumentListIcon className="w-8 h-8 opacity-50" />
                        <span className="text-xs text-center">{t('connectNodeHint')}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default memo(DeviceDetailsNode);
