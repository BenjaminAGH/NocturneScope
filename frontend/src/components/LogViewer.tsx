import { useEffect, useState, useMemo } from "react";
import { getHistory } from "@/lib/api/api";
import { formatCL } from "@/lib/time";

type LogViewerProps = {
    jwt: string;
    device: string;
    range: string;
};

export default function LogViewer({ jwt, device, range }: LogViewerProps) {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [isPaused, setIsPaused] = useState(false);
    const [page, setPage] = useState(0);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
    const PAGE_SIZE = 10;

    const fetchLogs = () => {
        if (isPaused) return;
        // No set loading to true on background updates to avoid flickering
        if (logs.length === 0) setLoading(true);

        setError("");
        getHistory(jwt, device, range)
            .then((data) => setLogs(data || []))
            .catch((e) => setError(e.message || "Error cargando logs"))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (!jwt || !device) return;
        fetchLogs();
        const intervalId = window.setInterval(fetchLogs, 5000);
        return () => window.clearInterval(intervalId);
    }, [jwt, device, range, isPaused]); // Re-create interval if pause state changes (or just let the check inside handle it)

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

    const handleSort = (key: string) => {
        let direction: "asc" | "desc" = "desc";
        if (sortConfig && sortConfig.key === key && sortConfig.direction === "desc") {
            direction = "asc";
        }
        setSortConfig({ key, direction });
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortConfig?.key !== column) return <span className="text-muted-foreground/30 ml-1">↕</span>;
        return <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>;
    };

    if (!device) return null;

    return (
        <div className="rounded-xl bg-card text-card-foreground p-4 ring-1 ring-border/50 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Logs del Sistema ({range})</h2>
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
                            <th className="py-2 px-2 cursor-pointer hover:text-foreground" onClick={() => handleSort("time")}>
                                Tiempo <SortIcon column="time" />
                            </th>
                            <th className="py-2 px-2 cursor-pointer hover:text-foreground" onClick={() => handleSort("cpu")}>
                                CPU (%) <SortIcon column="cpu" />
                            </th>
                            <th className="py-2 px-2 cursor-pointer hover:text-foreground" onClick={() => handleSort("ram")}>
                                RAM (%) <SortIcon column="ram" />
                            </th>
                            <th className="py-2 px-2 cursor-pointer hover:text-foreground" onClick={() => handleSort("disk")}>
                                Disk (%) <SortIcon column="disk" />
                            </th>
                            <th className="py-2 px-2 cursor-pointer hover:text-foreground" onClick={() => handleSort("temp")}>
                                Temp (°C) <SortIcon column="temp" />
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
                                    {formatCL(log.time)}
                                </td>
                                <td className={`py-2 px-2 ${log.cpu > 80 ? "text-red-500 font-bold" : ""}`}>
                                    {log.cpu?.toFixed(1)}
                                </td>
                                <td className={`py-2 px-2 ${log.ram > 80 ? "text-yellow-500 font-bold" : ""}`}>
                                    {log.ram?.toFixed(1)}
                                </td>
                                <td className="py-2 px-2">{log.disk?.toFixed(1)}</td>
                                <td className={`py-2 px-2 ${log.temp > 75 ? "text-orange-500" : ""}`}>
                                    {log.temp?.toFixed(1)}
                                </td>
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
