"use client";

import { memo } from "react";
import { NodeProps } from "@xyflow/react";
import MonitoringNode from "./MonitoringNode";

// Wrapper for CPU Node
export const CpuNode = memo((props: NodeProps) => {
    const data = {
        ...props.data,
        metric: "cpu",
        label: "CPU Usage"
    };
    return <MonitoringNode {...props} data={data} />;
});

// Wrapper for RAM Node
export const RamNode = memo((props: NodeProps) => {
    const data = {
        ...props.data,
        metric: "ram",
        label: "RAM Usage"
    };
    return <MonitoringNode {...props} data={data} />;
});

// Wrapper for Disk Node
export const DiskNode = memo((props: NodeProps) => {
    const data = {
        ...props.data,
        metric: "disk",
        label: "Disk Usage"
    };
    return <MonitoringNode {...props} data={data} />;
});

// Wrapper for Network Node
export const NetworkNode = memo((props: NodeProps) => {
    const data = {
        ...props.data,
        metric: "net_rx", // Default to RX, users can switch or we can make a combined one later
        label: "Network Traffic"
    };
    return <MonitoringNode {...props} data={data} />;
});
