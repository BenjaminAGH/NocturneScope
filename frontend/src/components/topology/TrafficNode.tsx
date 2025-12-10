"use client";

import { memo, useEffect, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { GlobeAltIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";
import { getNetworkTraffic } from "@/lib/api/api";
import { useLanguage } from "@/context/LanguageContext";

export interface TrafficNodeData extends Record<string, unknown> {
    jwt?: string;
    connectedDevice?: string;
    label?: string;
}

interface TrafficLog {
    id: number;
    source_ip: string;
    destination_ip: string;
    destination_port: number;
    protocol: string;
    connection_state: string;
    timestamp: string;
}

function TrafficNode({ id, data, selected }: NodeProps) {
    const { t } = useLanguage();
    const typedData = data as TrafficNodeData;
    const { jwt, connectedDevice } = typedData;

    const [logs, setLogs] = useState<TrafficLog[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!jwt || !connectedDevice) {
            setLogs([]);
            return;
        }

        const fetchData = async () => {
            try {
                const data = await getNetworkTraffic(jwt, connectedDevice);
                if (Array.isArray(data)) {
                    const sorted = sortLogs(data);
                    setLogs(sorted);
                } else if ((data as any).data && Array.isArray((data as any).data)) {
                    const sorted = sortLogs((data as any).data);
                    setLogs(sorted);
                }
            } catch (e) {
                console.error("Error fetching traffic data:", e);
            } finally {
                setLoading(false);
            }
        };

        setLoading(true);
        fetchData();
        const intervalId = setInterval(fetchData, 5000);
        return () => clearInterval(intervalId);
    }, [jwt, connectedDevice, id]);

    const sortLogs = (logs: TrafficLog[]) => {
        return [...logs].sort((a, b) => {
            // 1. Timestamp (Newest first)
            const timeA = new Date(a.timestamp).getTime();
            const timeB = new Date(b.timestamp).getTime();
            if (timeA !== timeB) return timeB - timeA;

            // 2. State Score
            const scoreA = getSortScore(a);
            const scoreB = getSortScore(b);
            return scoreB - scoreA;
        });
    };

    const getSortScore = (log: TrafficLog) => {
        let score = 0;
        // State
        if (log.connection_state === "ESTABLISHED") score += 50;
        else if (log.connection_state?.includes("SYN")) score += 40;

        return score;
    };

    const getRowColor = (index: number) => {
        return index % 2 === 0 ? "bg-background" : "bg-muted/20";
    };

    const formatTime = (ts: string) => {
        if (!ts) return "";
        return new Date(ts).toLocaleTimeString('es-CL', { hour12: false });
    };

    return (
        <div
            className={`min-w-[500px] bg-card border rounded-lg shadow-xl flex flex-col overflow-hidden transition-all ${selected ? "border-primary ring-1 ring-primary" : "border-border"
                }`}
        >
            <Handle
                type="target"
                position={Position.Left}
                id="t-left"
                className="w-3 h-3 !bg-primary"
                isConnectable={!connectedDevice}
            />
            <Handle
                type="target"
                position={Position.Right}
                id="t-right"
                className="w-3 h-3 !bg-primary"
                isConnectable={!connectedDevice}
            />

            {/* Header - Wireshark Style */}
            <div className="px-2 py-1 bg-muted border-b border-border flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                    <GlobeAltIcon className="w-4 h-4 text-blue-500" />
                    <span className="font-semibold text-foreground">
                        {connectedDevice ? `${t('capture')}: ${connectedDevice}` : t('noSource')}
                    </span>
                </div>
                <span className="text-muted-foreground font-mono">
                    {logs.length} {t('packets')}
                </span>
            </div>

            {/* Content - Packet List */}
            <div className="h-[300px] overflow-auto bg-background font-mono text-[10px]">
                {!connectedDevice ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <GlobeAltIcon className="w-8 h-8 mb-2 opacity-20" />
                        <span>{t('waitingConnection')}</span>
                    </div>
                ) : loading && logs.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">{t('loadingPackets')}</div>
                ) : logs.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">{t('noTrafficCaptured')}</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-muted text-muted-foreground sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-2 py-1 border-r border-border/50 w-16" title="Hora del evento registrado">{t('tableTime')}</th>
                                <th className="px-2 py-1 border-r border-border/50 w-28" title="Dirección IP de origen del paquete">{t('tableSource')}</th>
                                <th className="px-2 py-1 border-r border-border/50 w-16" title="Protocolo de transporte (TCP/UDP)">{t('tableProto')}</th>
                                <th className="px-2 py-1 border-r border-border/50 w-16" title="Puerto de destino">{t('tablePort')}</th>
                                <th className="px-2 py-1" title="Información adicional (Estado)">{t('tableInfo')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log, i) => (
                                <tr key={log.id || i} className={`hover:bg-accent/50 cursor-pointer ${getRowColor(i)}`}>
                                    <td className="px-2 py-0.5 border-r border-border/30 whitespace-nowrap text-muted-foreground">{formatTime(log.timestamp)}</td>
                                    <td className="px-2 py-0.5 border-r border-border/30 truncate max-w-[100px]">{log.source_ip}</td>
                                    <td className="px-2 py-0.5 border-r border-border/30 text-blue-400">{log.protocol}</td>
                                    <td className="px-2 py-0.5 border-r border-border/30">{log.destination_port}</td>
                                    <td className="px-2 py-0.5 truncate max-w-[150px]">
                                        <span className="opacity-80">{log.connection_state}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default memo(TrafficNode);
