"use client";

import { memo, useEffect, useState } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { GlobeAltIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";
import { getNetworkTraffic } from "@/lib/api/api";

export interface TrafficNodeData extends Record<string, unknown> {
    jwt?: string;
    connectedDevice?: string;
    label?: string;
}

interface TrafficLog {
    id: number;
    source_ip: string;
    destination_port: number;
    protocol: string;
    threat_level: string;
    timestamp: string;
}

function TrafficNode({ id, data, selected }: NodeProps) {
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
            // Avoid setting loading true on every poll to prevent flickering
            // setLoading(true); 
            try {
                const data = await getNetworkTraffic(jwt, connectedDevice);
                // Assuming the API returns an array of logs directly or wrapped
                // Adjust based on actual API response structure if needed
                if (Array.isArray(data)) {
                    setLogs(data);
                } else if ((data as any).data && Array.isArray((data as any).data)) {
                    setLogs((data as any).data);
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

    const getThreatColor = (level: string) => {
        switch (level?.toLowerCase()) {
            case "high": return "text-red-500 font-bold";
            case "medium": return "text-orange-500";
            case "low": return "text-yellow-500";
            default: return "text-muted-foreground";
        }
    };

    return (
        <div
            className={`min-w-[350px] bg-card border-2 rounded-lg shadow-lg flex flex-col overflow-hidden transition-colors ${selected ? "border-primary ring-2 ring-primary/20" : "border-border"
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

            {/* Header */}
            <div className="px-3 py-2 border-b border-border bg-muted/50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <GlobeAltIcon className="w-5 h-5 text-blue-500" />
                    <span className="font-medium text-sm">
                        {connectedDevice ? `Tráfico: ${connectedDevice}` : "Sin conexión"}
                    </span>
                </div>
                {logs.length > 0 && (
                    <span className="text-xs bg-background px-2 py-0.5 rounded border text-muted-foreground">
                        {logs.length} eventos
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="p-0 max-h-[250px] overflow-y-auto bg-background/50">
                {!connectedDevice ? (
                    <div className="flex flex-col items-center justify-center p-8 text-muted-foreground text-xs text-center">
                        <GlobeAltIcon className="w-8 h-8 mb-2 opacity-20" />
                        <span>Conecta este nodo a un dispositivo<br />para ver su tráfico de red</span>
                    </div>
                ) : loading && logs.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">Cargando...</div>
                ) : logs.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">No hay registros de tráfico recientes</div>
                ) : (
                    <table className="w-full text-xs text-left">
                        <thead className="bg-muted/30 sticky top-0 backdrop-blur-sm">
                            <tr>
                                <th className="p-2 font-medium text-muted-foreground">Origen</th>
                                <th className="p-2 font-medium text-muted-foreground">Puerto</th>
                                <th className="p-2 font-medium text-muted-foreground">Proto</th>
                                <th className="p-2 font-medium text-muted-foreground">Amenaza</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {logs.map((log, i) => (
                                <tr key={log.id || i} className="hover:bg-muted/20 transition-colors">
                                    <td className="p-2 font-mono">{log.source_ip}</td>
                                    <td className="p-2 font-mono">{log.destination_port}</td>
                                    <td className="p-2 uppercase">{log.protocol}</td>
                                    <td className={`p-2 flex items-center gap-1 ${getThreatColor(log.threat_level)}`}>
                                        {log.threat_level === "high" && <ShieldExclamationIcon className="w-3 h-3" />}
                                        {log.threat_level || "None"}
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
