"use client";

import { memo, useEffect, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { getLastStats } from "@/lib/api/api";
import {
    CpuChipIcon,
    ServerIcon,
    CircleStackIcon,
    GlobeAltIcon,
    BoltIcon,
    ArrowDownIcon,
    ArrowUpIcon,
    FireIcon
} from "@heroicons/react/24/outline";

export interface StatNodeData extends Record<string, unknown> {
    jwt?: string;
    connectedDevice?: string;
    metric?: string; // 'cpu', 'ram', 'disk', 'net_rx' (for network), 'temp'
    label?: string;
}

function StatNode({ id, data, selected }: NodeProps) {
    const typedData = data as StatNodeData;
    const {
        jwt,
        connectedDevice,
        metric = "cpu",
        label = "Metric"
    } = typedData;

    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!jwt || !connectedDevice) {
            setStats(null);
            return;
        }

        const fetchData = async () => {
            try {
                // We use getLastStats to get the full picture (partitions, cores, etc.)
                const data = await getLastStats(jwt, connectedDevice);
                setStats(data);
            } catch (e) {
                console.error("Error fetching stat data:", e);
            }
        };

        fetchData();
        const intervalId = setInterval(fetchData, 5000);
        return () => clearInterval(intervalId);
    }, [jwt, connectedDevice, metric, id]);

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // --- Render Variants ---

    // 1. CPU Card
    if (metric === 'cpu') {
        const val = stats?.cpu || 0;
        return (
            <div className={`w-48 bg-card border rounded-xl shadow-sm flex flex-col p-3 transition-all duration-300 ${selected ? "border-primary ring-2 ring-primary/20 shadow-md" : "border-border"}`}>
                <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-muted-foreground" isConnectable={!connectedDevice} />
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <CpuChipIcon className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-medium text-muted-foreground">CPU</span>
                    </div>
                    <span className="text-lg font-bold">{val.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-muted/30 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${Math.min(val, 100)}%` }} />
                </div>
                <div className="mt-2 text-[10px] text-muted-foreground flex justify-between">
                    <span>Uso actual</span>
                    <span>{stats?.cpu_count || 1} Cores</span>
                </div>
            </div>
        );
    }

    // 2. RAM Card
    if (metric === 'ram') {
        const val = stats?.ram || 0;
        return (
            <div className={`w-48 bg-card border rounded-xl shadow-sm flex flex-col p-3 transition-all duration-300 ${selected ? "border-primary ring-2 ring-primary/20 shadow-md" : "border-border"}`}>
                <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-muted-foreground" isConnectable={!connectedDevice} />
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <ServerIcon className="w-4 h-4 text-orange-500" />
                        <span className="text-xs font-medium text-muted-foreground">RAM</span>
                    </div>
                    <span className="text-lg font-bold">{val.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-muted/30 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-orange-500 h-full transition-all duration-500" style={{ width: `${Math.min(val, 100)}%` }} />
                </div>
                <div className="mt-2 text-[10px] text-muted-foreground flex justify-between">
                    <span>{stats?.ram_used ? formatBytes(stats.ram_used) : "0 B"}</span>
                    <span>{stats?.ram_total ? formatBytes(stats.ram_total) : "0 B"}</span>
                </div>
            </div>
        );
    }

    // 3. Disk Card
    if (metric === 'disk') {
        // Calculate total usage
        let totalPercent = 0;
        let totalSize = 0;
        let totalUsed = 0;
        let partitions: any[] = [];

        if (stats) {
            partitions = Object.keys(stats)
                .filter(k => k.startsWith('disk_usage_'))
                .map(k => ({
                    id: k,
                    mount: k.replace('disk_usage_', '').replace('_root', '/').replace(/_/g, '/'),
                    usage: stats[k],
                    total: stats[k.replace('usage', 'total')],
                    used: stats[k.replace('usage', 'used')]
                }))
                .sort((a, b) => a.mount.localeCompare(b.mount));

            totalSize = partitions.reduce((acc, p) => acc + (p.total || 0), 0);
            totalUsed = partitions.reduce((acc, p) => acc + (p.used || 0), 0);
            totalPercent = totalSize > 0 ? (totalUsed / totalSize) * 100 : 0;
        }

        const colors = ["bg-emerald-500", "bg-blue-500", "bg-purple-500", "bg-orange-500", "bg-pink-500"];

        return (
            <div className={`w-48 bg-card border rounded-xl shadow-sm flex flex-col p-3 transition-all duration-300 ${selected ? "border-primary ring-2 ring-primary/20 shadow-md" : "border-border"}`}>
                <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-muted-foreground" isConnectable={!connectedDevice} />
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <CircleStackIcon className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-medium text-muted-foreground">Disk</span>
                    </div>
                    <span className="text-lg font-bold">{totalPercent.toFixed(1)}%</span>
                </div>

                <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden flex ring-1 ring-border/20">
                    {partitions.map((p, i) => {
                        let width = totalSize > 0 ? (p.used / totalSize) * 100 : 0;
                        if (p.used > 0 && width < 5) width = 5; // Min width for visibility
                        return (
                            <div
                                key={p.id}
                                className={`${colors[i % colors.length]} h-full`}
                                style={{ width: `${width}%` }}
                                title={`${p.mount}: ${formatBytes(p.used)} / ${formatBytes(p.total)}`}
                            />
                        );
                    })}
                </div>

                <div className="mt-2 text-[10px] text-muted-foreground flex justify-between">
                    <span>{formatBytes(totalUsed)}</span>
                    <span>{formatBytes(totalSize)}</span>
                </div>
            </div>
        );
    }

    // 4. Network Card (RX/TX)
    if (metric === 'net_rx' || metric === 'net_tx' || metric === 'network') {
        return (
            <div className={`w-56 bg-card border rounded-xl shadow-sm flex flex-col p-3 transition-all duration-300 ${selected ? "border-primary ring-2 ring-primary/20 shadow-md" : "border-border"}`}>
                <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-muted-foreground" isConnectable={!connectedDevice} />
                <div className="flex items-center gap-2 mb-3">
                    <GlobeAltIcon className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-medium text-muted-foreground">Tráfico de Red</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {/* RX */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 flex flex-col">
                        <div className="flex items-center gap-1 mb-1">
                            <ArrowDownIcon className="w-3 h-3 text-blue-500" />
                            <span className="text-[9px] font-medium text-blue-500">RX</span>
                        </div>
                        <span className="text-xs font-bold font-mono">
                            {stats?.net_rx ? formatBytes(stats.net_rx) : "0 B"}/s
                        </span>
                    </div>
                    {/* TX */}
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-2 flex flex-col">
                        <div className="flex items-center gap-1 mb-1">
                            <ArrowUpIcon className="w-3 h-3 text-indigo-500" />
                            <span className="text-[9px] font-medium text-indigo-500">TX</span>
                        </div>
                        <span className="text-xs font-bold font-mono">
                            {stats?.net_tx ? formatBytes(stats.net_tx) : "0 B"}/s
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // 5. Temperature Card (Fallback or specific)
    if (metric === 'temp') {
        return (
            <div className={`w-40 bg-card border rounded-xl shadow-sm flex flex-col p-3 transition-all duration-300 ${selected ? "border-primary ring-2 ring-primary/20 shadow-md" : "border-border"}`}>
                <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-muted-foreground" isConnectable={!connectedDevice} />
                <div className="flex items-center gap-2 mb-2">
                    <FireIcon className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-medium text-muted-foreground">Temp</span>
                </div>
                <div className="text-2xl font-bold">{stats?.temp?.toFixed(1) || "—"}°C</div>
                <div className="text-[10px] text-muted-foreground mt-1">Core Temp</div>
            </div>
        );
    }

    // Default / Fallback
    return (
        <div className={`w-40 bg-card border rounded-xl shadow-sm flex flex-col p-3 transition-all duration-300 ${selected ? "border-primary ring-2 ring-primary/20 shadow-md" : "border-border"}`}>
            <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-muted-foreground" isConnectable={!connectedDevice} />
            <div className="flex items-center gap-2 mb-2">
                <BoltIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase">{label}</span>
            </div>
            <div className="text-xl font-bold">
                {stats && stats[metric] !== undefined ? stats[metric].toFixed(1) : "—"}
            </div>
        </div>
    );
}

export default memo(StatNode);
