"use client";

import { memo } from "react";
import { NodeProps } from "@xyflow/react";
import StatNode from "./StatNode";

// Wrapper for CPU Node
export const CpuNode = memo((props: NodeProps) => {
    const data = {
        ...props.data,
        metric: "cpu",
        label: "CPU"
    };
    return <StatNode {...props} data={data} />;
});

// Wrapper for RAM Node
export const RamNode = memo((props: NodeProps) => {
    const data = {
        ...props.data,
        metric: "ram",
        label: "RAM"
    };
    return <StatNode {...props} data={data} />;
});

// Wrapper for Disk Node
export const DiskNode = memo((props: NodeProps) => {
    const data = {
        ...props.data,
        metric: "disk",
        label: "Disk"
    };
    return <StatNode {...props} data={data} />;
});

// Wrapper for Network Node
export const NetworkNode = memo((props: NodeProps) => {
    const data = {
        ...props.data,
        metric: "net_rx", // Default to RX
        label: "Net RX"
    };
    return <StatNode {...props} data={data} />;
});
