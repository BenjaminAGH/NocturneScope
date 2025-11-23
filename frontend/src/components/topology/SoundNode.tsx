"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { SpeakerWaveIcon } from "@heroicons/react/24/outline";
import { SOUND_OPTIONS, SoundType } from "@/lib/soundPlayer";

export interface SoundNodeData extends Record<string, unknown> {
    sound?: SoundType;
    isActive?: boolean;
}

function SoundNode({ data, selected }: NodeProps) {
    const { sound = 'beep', isActive } = data as SoundNodeData;

    const soundLabel = SOUND_OPTIONS.find(opt => opt.value === sound)?.label || "Sonido";

    return (
        <div
            className={`w-16 h-16 rounded-full shadow-lg flex items-center justify-center border-2 transition-all relative bg-card
                ${selected ? "border-primary ring-2 ring-primary/20" : "border-border"}
                ${isActive ? "border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-pulse" : ""}
            `}
        >
            <Handle type="target" position={Position.Left} className="!bg-primary" />

            <div className="flex flex-col items-center justify-center">
                <SpeakerWaveIcon className={`w-6 h-6 ${isActive ? "text-blue-500" : "text-muted-foreground"}`} />
                <span className="text-[9px] font-medium mt-0.5 text-center px-1 truncate max-w-full">
                    {soundLabel.split(' ')[0]}
                </span>
            </div>
        </div>
    );
}

export default memo(SoundNode);
