"use client";

import { useEffect, useState } from "react";
import { getLastStats } from "@/lib/api/api";
import {
    ComputerDesktopIcon,
    CpuChipIcon,
    ServerIcon,
    SignalIcon,
    ClockIcon,
    GlobeAltIcon
} from "@heroicons/react/24/outline";

interface DeviceDetailsProps {
    deviceId: string;
    jwt: string;
}

export default function DeviceDetails({ deviceId, jwt }: DeviceDetailsProps) {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchStats = async () => {
            if (!deviceId || !jwt) return;

            setLoading(true);
            setError(null);
            try {
                const data = await getLastStats(jwt, deviceId);
                if (isMounted) {
                    setStats(data);
                }
            } catch (err: any) {
                console.error("Error fetching device stats:", err);
                if (isMounted) {
                    setError("Error al cargar datos del dispositivo");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchStats();

        // Poll every 10 seconds
        const interval = setInterval(fetchStats, 10000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [deviceId, jwt]);

    if (!deviceId) return null;

    if (loading && !stats) {
        return <div className="p-4 text-center text-sm text-muted-foreground">Cargando detalles...</div>;
    }

    if (error) {
        return <div className="p-4 text-center text-sm text-destructive">{error}</div>;
    }

    if (!stats) {
        return <div className="p-4 text-center text-sm text-muted-foreground">No hay datos disponibles</div>;
    }

    // Calculate status based on timestamp
    const now = Date.now() / 1000;
    const lastSeen = stats.timestamp ? new Date(stats.timestamp).getTime() / 1000 : 0;
    const isOnline = (now - lastSeen) < 300; // 5 minutes

    const formatTime = (isoString: string) => {
        if (!isoString) return "Nunca";
        return new Date(isoString).toLocaleString('es-CL');
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Helper for CPU Cores
    const getCpuCores = () => {
        if (!stats) return [];
        const cores = Object.keys(stats)
            .filter(k => k.startsWith('cpu_core_'))
            .sort((a, b) => {
                const numA = parseInt(a.replace('cpu_core_', ''));
                const numB = parseInt(b.replace('cpu_core_', ''));
                return numA - numB;
            })
            .map(k => ({ id: k, val: stats[k] }));
        return cores;
    };
    const cpuCores = getCpuCores();

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
                <ComputerDesktopIcon className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-sm truncate">{deviceId}</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* Status */}
                <div className="col-span-2 flex items-center justify-between p-2 bg-muted/30 rounded border border-border">
                    <span className="text-xs text-muted-foreground">Estado</span>
                    <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                        <span className={`text-xs font-medium ${isOnline ? "text-green-600" : "text-red-600"}`}>
                            {isOnline ? "Online" : "Offline"}
                        </span>
                    </div>
                </div>

                {/* IP Address */}
                <div className="p-2 bg-muted/30 rounded border border-border space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <GlobeAltIcon className="w-3 h-3" />
                        <span className="text-[10px] uppercase">IP Address</span>
                    </div>
                    <div className="text-xs font-mono truncate" title={stats.ip}>
                        {stats.ip || "—"}
                    </div>
                </div>

                {/* Gateway */}
                <div className="p-2 bg-muted/30 rounded border border-border space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <ServerIcon className="w-3 h-3" />
                        <span className="text-[10px] uppercase">Gateway</span>
                    </div>
                    <div className="text-xs font-mono truncate" title={stats.gateway}>
                        {stats.gateway || "—"}
                    </div>
                </div>

                {/* OS / Platform */}
                <div className="col-span-2 p-2 bg-muted/30 rounded border border-border space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <ComputerDesktopIcon className="w-3 h-3" />
                        <span className="text-[10px] uppercase">Sistema Operativo</span>
                    </div>
                    <div className="text-xs truncate">
                        {stats.os_name || stats.platform || "Desconocido"} {stats.os_version || ""}
                    </div>
                </div>

                {/* Last Seen */}
                <div className="col-span-2 p-2 bg-muted/30 rounded border border-border space-y-1">
                    <div className="flex items-center gap-1 text-muted-foreground">
                        <ClockIcon className="w-3 h-3" />
                        <span className="text-[10px] uppercase">Última Actividad</span>
                    </div>
                    <div className="text-xs">
                        {formatTime(stats.timestamp)}
                    </div>
                </div>
            </div>

            {/* Resources */}
            <div className="space-y-2">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recursos</h4>

                {/* CPU */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className="flex items-center gap-1">
                            <CpuChipIcon className="w-3 h-3" /> CPU
                        </span>
                        <span>{stats.cpu?.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${Math.min(stats.cpu || 0, 100)}%` }}
                        />
                    </div>
                </div>

                {/* CPU Cores (Collapsible or just list) */}
                {cpuCores.length > 0 && (
                    <div className="space-y-1 pt-1">
                        <div className="text-[10px] text-muted-foreground uppercase">Núcleos ({cpuCores.length})</div>
                        <div className="grid grid-cols-4 gap-1">
                            {cpuCores.map((core) => (
                                <div key={core.id} className="bg-muted/20 rounded p-1 text-center" title={`Core ${core.id.replace('cpu_core_', '')}`}>
                                    <div className="h-8 w-full bg-secondary rounded-sm relative overflow-hidden flex items-end justify-center">
                                        <div
                                            className="absolute bottom-0 left-0 right-0 bg-blue-400/50 transition-all duration-500"
                                            style={{ height: `${Math.min(core.val || 0, 100)}%` }}
                                        />
                                        <span className="relative z-10 text-[9px] font-mono">{core.val?.toFixed(0)}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* RAM */}
                <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                        <span className="flex items-center gap-1">
                            <ServerIcon className="w-3 h-3" /> RAM
                        </span>
                        <span>{stats.ram?.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-purple-500 transition-all duration-500"
                            style={{ width: `${Math.min(stats.ram || 0, 100)}%` }}
                        />
                    </div>
                    {stats.ram_total > 0 && (
                        <div className="flex justify-between text-[10px] text-muted-foreground pt-0.5">
                            <span>Usado: {formatBytes(stats.ram_used)}</span>
                            <span>Total: {formatBytes(stats.ram_total)}</span>
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-1.5 bg-muted/20 rounded border border-border text-center">
                        <div className="text-[10px] text-muted-foreground">Net RX</div>
                        <div className="text-xs font-mono">{formatBytes(stats.net_rx || 0)}/s</div>
                    </div>
                    <div className="p-1.5 bg-muted/20 rounded border border-border text-center">
                        <div className="text-[10px] text-muted-foreground">Net TX</div>
                        <div className="text-xs font-mono">{formatBytes(stats.net_tx || 0)}/s</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
