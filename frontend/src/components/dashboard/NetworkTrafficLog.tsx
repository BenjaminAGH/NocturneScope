import { useEffect, useState, useMemo } from "react";
import { getNetworkTraffic, NetworkTraffic } from "@/lib/api/network_traffic";
import { formatCL } from "@/lib/time";

type NetworkTrafficLogProps = {
    device: string;
};

export default function NetworkTrafficLog({ device }: NetworkTrafficLogProps) {
    const [logs, setLogs] = useState<NetworkTraffic[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [isPaused, setIsPaused] = useState(false);
    const [page, setPage] = useState(0);
    const [sortConfig, setSortConfig] = useState<{ key: keyof NetworkTraffic; direction: "asc" | "desc" } | null>(null);
    const PAGE_SIZE = 10;

    const fetchLogs = () => {
        if (isPaused) return;
        // No set loading to true on background updates to avoid flickering
        if (logs.length === 0) setLoading(true);

        setError("");
        getNetworkTraffic(device)
            .then((data) => setLogs(data || []))
            .catch((e) => setError(e.message || "Error cargando tráfico"))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (!device) return;
        fetchLogs();
        const intervalId = window.setInterval(fetchLogs, 5000);
        return () => window.clearInterval(intervalId);
    }, [device, isPaused]);

    // Sorting logic
    const sortedLogs = useMemo(() => {
        if (!sortConfig) return logs;
        return [...logs].sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === "asc" ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === "asc" ? 1 : -1;
            }
            return 0;
        });
    }, [logs, sortConfig]);

    // Pagination logic
    const totalPages = Math.ceil(sortedLogs.length / PAGE_SIZE);
    const displayedLogs = sortedLogs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    const handlePrev = () => setPage((p) => Math.max(0, p - 1));
    const handleNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));

    const handleSort = (key: keyof NetworkTraffic) => {
        let direction: "asc" | "desc" = "desc";
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "desc") {
            direction = "asc";
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ column }: { column: keyof NetworkTraffic }) => {
        if (sortConfig?.key !== column) return <span className="text-muted-foreground/30 ml-1">↕</span>;
        return <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>;
    };

    if (!device) return null;

    return (
        <div className="rounded-xl bg-card text-card-foreground p-4 ring-1 ring-border/50 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Tráfico de Red</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        className={`px-3 py-1 text-xs rounded border ${isPaused
                            ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/50"
                            : "bg-green-500/10 text-green-500 border-green-500/50"
                            }`}
                    >
                        {isPaused ? "⏸ Pausado" : "▶ En vivo"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="text-destructive text-sm bg-destructive/10 p-2 rounded">
                    {error}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-muted-foreground border-b border-border/50">
                        <tr>
                            <th className="py-2 px-2 cursor-pointer hover:text-foreground" onClick={() => handleSort("timestamp")}>
                                Tiempo <SortIcon column="timestamp" />
                            </th>
                            <th className="py-2 px-2 cursor-pointer hover:text-foreground" onClick={() => handleSort("protocol")}>
                                Protocolo <SortIcon column="protocol" />
                            </th>
                            <th className="py-2 px-2 cursor-pointer hover:text-foreground" onClick={() => handleSort("source_ip")}>
                                Origen <SortIcon column="source_ip" />
                            </th>
                            <th className="py-2 px-2 cursor-pointer hover:text-foreground" onClick={() => handleSort("destination_port")}>
                                Puerto Dest <SortIcon column="destination_port" />
                            </th>
                            <th className="py-2 px-2 cursor-pointer hover:text-foreground" onClick={() => handleSort("connection_state")}>
                                Estado <SortIcon column="connection_state" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && logs.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-4 text-center text-muted-foreground">
                                    Cargando...
                                </td>
                            </tr>
                        )}
                        {!loading && logs.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-4 text-center text-muted-foreground">
                                    Sin datos recientes
                                </td>
                            </tr>
                        )}
                        {displayedLogs.map((log, i) => (
                            <tr key={i} className="border-b border-border/10 hover:bg-muted/50">
                                <td className="py-2 px-2 whitespace-nowrap">
                                    {formatCL(log.timestamp)}
                                </td>
                                <td className="py-2 px-2">{log.protocol}</td>
                                <td className="py-2 px-2">{log.source_ip}</td>
                                <td className="py-2 px-2">{log.destination_port}</td>
                                <td className="py-2 px-2">{log.connection_state}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {logs.length > PAGE_SIZE && (
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div>
                        Página {page + 1} de {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrev}
                            disabled={page === 0}
                            className="px-3 py-1 rounded border border-border/50 disabled:opacity-50 hover:bg-muted"
                        >
                            ← Anterior
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={page >= totalPages - 1}
                            className="px-3 py-1 rounded border border-border/50 disabled:opacity-50 hover:bg-muted"
                        >
                            Siguiente →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
