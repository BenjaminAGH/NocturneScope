"use client";

import { useState } from "react";

interface TopologyControlsProps {
    devices: string[];
    topologies: Array<{ ID: number; Name: string }>;
    selectedTopology: number | null;
    onAddDevice: (deviceName: string) => void;
    onSave: (name: string) => void;
    onLoad: (id: number) => void;
    onNew: () => void;
    onExport: () => void;
    onFitView: () => void;
    onAddMonitoringNode: () => void;
    selectedNode: any;
    onUpdateNodeData: (id: string, data: any) => void;
}

const METRIC_OPTIONS = [
    { value: "cpu", label: "CPU Usage" },
    { value: "ram", label: "RAM Usage" },
    { value: "disk", label: "Disk Usage" },
    { value: "net_rx", label: "Network RX" },
    { value: "net_tx", label: "Network TX" },
    { value: "temp", label: "Temperature" },
];

const RANGE_OPTIONS = [
    { value: "30m", label: "30 Minutos" },
    { value: "1h", label: "1 Hora" },
    { value: "6h", label: "6 Horas" },
    { value: "24h", label: "24 Horas" },
    { value: "7d", label: "7 Días" },
];

const INTERVAL_OPTIONS = [
    { value: "1m", label: "1 Minuto" },
    { value: "5m", label: "5 Minutos" },
    { value: "15m", label: "15 Minutos" },
    { value: "1h", label: "1 Hora" },
];

const AGG_OPTIONS = [
    { value: "mean", label: "Promedio (Mean)" },
    { value: "min", label: "Mínimo" },
    { value: "max", label: "Máximo" },
    { value: "last", label: "Último" },
];

export default function TopologyControls({
    devices,
    topologies,
    selectedTopology,
    onAddDevice,
    onSave,
    onLoad,
    onNew,
    onExport,
    onFitView,
    onAddMonitoringNode,
    selectedNode,
    onUpdateNodeData,
}: TopologyControlsProps) {
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [topologyName, setTopologyName] = useState("");

    const handleSave = () => {
        if (topologyName.trim()) {
            onSave(topologyName.trim());
            setShowSaveDialog(false);
            setTopologyName("");
        }
    };

    return (
        <div className="w-80 bg-card border-l border-border p-4 space-y-4 overflow-y-auto flex flex-col h-full">
            <h2 className="text-lg font-semibold">Controles de Topología</h2>

            {/* Herramientas */}
            <div className="space-y-2">
                <label className="text-sm font-medium">Herramientas</label>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={onAddMonitoringNode}
                        className="flex flex-col items-center justify-center p-3 bg-background hover:bg-accent rounded border border-border transition-colors gap-2"
                    >
                        <span className="text-2xl">📈</span>
                        <span className="text-xs">Gráfico</span>
                    </button>
                </div>
            </div>

            {/* Configuración de Nodo Seleccionado */}
            {selectedNode && selectedNode.type === 'monitoring' && (
                <div className="space-y-2 border-t border-border pt-4 animate-in fade-in slide-in-from-right-4">
                    <label className="text-sm font-medium text-primary">Configuración de Gráfico</label>
                    <div className="space-y-3 bg-muted/30 p-3 rounded-lg border border-border">
                        <div>
                            <label className="text-xs text-muted-foreground">Métrica</label>
                            <select
                                className="w-full mt-1 bg-background border border-border rounded px-2 py-1 text-sm"
                                value={selectedNode.data.metric || 'cpu'}
                                onChange={(e) => onUpdateNodeData(selectedNode.id, { metric: e.target.value })}
                            >
                                {METRIC_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-muted-foreground">Rango de Tiempo</label>
                            <select
                                className="w-full mt-1 bg-background border border-border rounded px-2 py-1 text-sm"
                                value={selectedNode.data.range || '1h'}
                                onChange={(e) => onUpdateNodeData(selectedNode.id, { range: e.target.value })}
                            >
                                {RANGE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-muted-foreground">Intervalo</label>
                            <select
                                className="w-full mt-1 bg-background border border-border rounded px-2 py-1 text-sm"
                                value={selectedNode.data.interval || '1m'}
                                onChange={(e) => onUpdateNodeData(selectedNode.id, { interval: e.target.value })}
                            >
                                {INTERVAL_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs text-muted-foreground">Agregación</label>
                            <select
                                className="w-full mt-1 bg-background border border-border rounded px-2 py-1 text-sm"
                                value={selectedNode.data.agg || 'mean'}
                                onChange={(e) => onUpdateNodeData(selectedNode.id, { agg: e.target.value })}
                            >
                                {AGG_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                            {selectedNode.data.connectedDevice
                                ? `✅ Conectado a: ${selectedNode.data.connectedDevice}`
                                : "⚠️ No conectado a ningún dispositivo"}
                        </div>
                    </div>
                </div>
            )}

            {/* Dispositivos disponibles */}
            <div className="space-y-2 flex-1 min-h-0 flex flex-col">
                <label className="text-sm font-medium">Dispositivos Disponibles</label>
                <div className="space-y-1 overflow-y-auto flex-1 pr-2">
                    {devices.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No hay dispositivos</p>
                    ) : (
                        devices.map((device) => (
                            <button
                                key={device}
                                onClick={() => onAddDevice(device)}
                                className="w-full text-left px-3 py-2 text-sm bg-background hover:bg-accent rounded border border-border transition-colors"
                            >
                                {device}
                            </button>
                        ))
                    )}
                </div>
            </div>

            <div className="border-t border-border pt-4 space-y-2">
                <label className="text-sm font-medium">Topologías Guardadas</label>
                <select
                    className="w-full bg-background border border-border rounded px-3 py-2 text-sm"
                    value={selectedTopology || ""}
                    onChange={(e) => {
                        const id = parseInt(e.target.value);
                        if (!isNaN(id)) onLoad(id);
                    }}
                >
                    <option value="">Seleccionar topología...</option>
                    {topologies.map((t) => (
                        <option key={t.ID} value={t.ID}>
                            {t.Name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Acciones */}
            <div className="border-t border-border pt-4 space-y-2">
                <button
                    onClick={onNew}
                    className="w-full px-4 py-2 bg-background hover:bg-accent border border-border rounded text-sm font-medium transition-colors"
                >
                    Nueva Topología
                </button>

                <button
                    onClick={() => setShowSaveDialog(true)}
                    className="w-full px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-sm font-medium transition-colors"
                >
                    Guardar
                </button>

                <button
                    onClick={onExport}
                    className="w-full px-4 py-2 bg-background hover:bg-accent border border-border rounded text-sm font-medium transition-colors"
                >
                    Exportar JSON
                </button>

                <button
                    onClick={onFitView}
                    className="w-full px-4 py-2 bg-background hover:bg-accent border border-border rounded text-sm font-medium transition-colors"
                >
                    Ajustar Vista
                </button>
            </div>

            {/* Dialog para guardar */}
            {showSaveDialog && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-card border border-border rounded-lg p-6 w-96 space-y-4">
                        <h3 className="text-lg font-semibold">Guardar Topología</h3>
                        <input
                            type="text"
                            placeholder="Nombre de la topología"
                            value={topologyName}
                            onChange={(e) => setTopologyName(e.target.value)}
                            className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleSave();
                                if (e.key === "Escape") setShowSaveDialog(false);
                            }}
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowSaveDialog(false)}
                                className="flex-1 px-4 py-2 bg-background hover:bg-accent border border-border rounded text-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-sm"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
