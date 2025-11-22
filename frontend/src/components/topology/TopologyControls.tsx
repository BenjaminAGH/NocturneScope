"use client";

import { useState } from "react";
import { ChartBarIcon, CheckCircleIcon, ExclamationTriangleIcon, BoltIcon, EnvelopeIcon, ChevronRightIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";

interface TopologyControlsProps {
    devices: string[];
    topologies: Array<{ ID: number; Name: string }>;
    selectedTopology: number | null;
    onAddDevice: (deviceName: string) => void;
    onSave: (name: string) => void;
    onLoad: (id: number) => void;
    onNew: () => void;
    onExport: () => void;
    onAddMonitoringNode: () => void;
    onAddActionNode: () => void;
    onAddEmailNode: () => void;
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
    onAddMonitoringNode,
    onAddActionNode,
    onAddEmailNode,
    selectedNode,
    onUpdateNodeData,
}: TopologyControlsProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [topologyName, setTopologyName] = useState("");

    const handleSaveClick = () => {
        if (selectedTopology) {
            // Si ya existe, guardar directamente con el nombre actual
            // Buscamos el nombre actual en la lista de topologías
            const currentTopo = topologies.find(t => t.ID === selectedTopology);
            if (currentTopo) {
                onSave(currentTopo.Name);
                return;
            }
        }
        setShowSaveDialog(true);
    };

    const handleSaveConfirm = () => {
        if (topologyName.trim()) {
            onSave(topologyName.trim());
            setShowSaveDialog(false);
            setTopologyName("");
        }
    };

    return (
        <div
            className={`absolute right-0 top-0 h-full w-80 transition-transform duration-300 ease-in-out z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
        >
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="absolute -left-8 top-4 bg-card/90 backdrop-blur-sm border border-r-0 border-border p-1.5 rounded-l-lg shadow-lg hover:bg-accent transition-colors"
                title={isOpen ? "Ocultar panel" : "Mostrar panel"}
            >
                {isOpen ? (
                    <ChevronRightIcon className="w-5 h-5" />
                ) : (
                    <ChevronLeftIcon className="w-5 h-5" />
                )}
            </button>

            {/* Main Content */}
            <div className="w-full h-full bg-card/80 backdrop-blur-md border-l border-border p-4 space-y-4 overflow-y-auto flex flex-col shadow-2xl">
                <h2 className="text-lg font-semibold">Controles de Topología</h2>

                {/* Herramientas */}
                <div className="space-y-2">
                    <label className="text-sm font-medium">Herramientas</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={onAddMonitoringNode}
                            className="flex flex-col items-center justify-center p-3 bg-background/50 hover:bg-accent rounded border border-border transition-colors gap-2"
                        >
                            <ChartBarIcon className="w-6 h-6" />
                            <span className="text-xs">Gráfico</span>
                        </button>
                        <button
                            onClick={onAddActionNode}
                            className="flex flex-col items-center justify-center p-3 bg-background/50 hover:bg-accent rounded border border-border transition-colors gap-2"
                        >
                            <BoltIcon className="w-6 h-6" />
                            <span className="text-xs">Acción</span>
                        </button>
                        <button
                            onClick={onAddEmailNode}
                            className="flex flex-col items-center justify-center p-3 bg-background/50 hover:bg-accent rounded border border-border transition-colors gap-2"
                        >
                            <EnvelopeIcon className="w-6 h-6" />
                            <span className="text-xs">Email</span>
                        </button>
                    </div>
                </div>

                {/* Configuración de Nodo Seleccionado */}
                {selectedNode && (
                    <div className="space-y-2 border-t border-border pt-4 animate-in fade-in slide-in-from-right-4">
                        <label className="text-sm font-medium text-primary">
                            {selectedNode.type === 'monitoring' && "Configuración de Gráfico"}
                            {selectedNode.type === 'action' && "Regla de Disparo"}
                            {selectedNode.type === 'email' && "Configuración de Email"}
                        </label>

                        <div className="space-y-3 bg-muted/30 p-3 rounded-lg border border-border">
                            {/* Monitoring Node Config */}
                            {selectedNode.type === 'monitoring' && (
                                <>
                                    <div>
                                        <label className="text-xs text-muted-foreground">Métrica</label>
                                        <select
                                            className="w-full mt-1 bg-background/80 border border-border rounded px-2 py-1 text-sm"
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
                                            className="w-full mt-1 bg-background/80 border border-border rounded px-2 py-1 text-sm"
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
                                            className="w-full mt-1 bg-background/80 border border-border rounded px-2 py-1 text-sm"
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
                                            className="w-full mt-1 bg-background/80 border border-border rounded px-2 py-1 text-sm"
                                            value={selectedNode.data.agg || 'mean'}
                                            onChange={(e) => onUpdateNodeData(selectedNode.id, { agg: e.target.value })}
                                        >
                                            {AGG_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* Action Node Config */}
                            {selectedNode.type === 'action' && (
                                <>
                                    <div>
                                        <label className="text-xs text-muted-foreground">Métrica</label>
                                        <select
                                            className="w-full mt-1 bg-background/80 border border-border rounded px-2 py-1 text-sm"
                                            value={selectedNode.data.metric || 'cpu'}
                                            onChange={(e) => onUpdateNodeData(selectedNode.id, { metric: e.target.value })}
                                        >
                                            {METRIC_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="col-span-1">
                                            <label className="text-xs text-muted-foreground">Operador</label>
                                            <select
                                                className="w-full mt-1 bg-background/80 border border-border rounded px-2 py-1 text-sm"
                                                value={selectedNode.data.operator || '>='}
                                                onChange={(e) => onUpdateNodeData(selectedNode.id, { operator: e.target.value })}
                                            >
                                                <option value=">">{'>'}</option>
                                                <option value=">=">{'>='}</option>
                                                <option value="<">{'<'}</option>
                                                <option value="<=">{'<='}</option>
                                                <option value="==">{'='}</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-xs text-muted-foreground">Umbral</label>
                                            <input
                                                type="number"
                                                className="w-full mt-1 bg-background/80 border border-border rounded px-2 py-1 text-sm"
                                                value={selectedNode.data.threshold || 0}
                                                onChange={(e) => onUpdateNodeData(selectedNode.id, { threshold: Number(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Email Node Config */}
                            {selectedNode.type === 'email' && (
                                <>
                                    <div>
                                        <label className="text-xs text-muted-foreground">Destinatario (To)</label>
                                        <input
                                            type="email"
                                            placeholder="admin@example.com"
                                            className="w-full mt-1 bg-background/80 border border-border rounded px-2 py-1 text-sm"
                                            value={selectedNode.data.to || ''}
                                            onChange={(e) => onUpdateNodeData(selectedNode.id, { to: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground">Asunto</label>
                                        <input
                                            type="text"
                                            placeholder="Alerta CPU"
                                            className="w-full mt-1 bg-background/80 border border-border rounded px-2 py-1 text-sm"
                                            value={selectedNode.data.subject || ''}
                                            onChange={(e) => onUpdateNodeData(selectedNode.id, { subject: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground">Frecuencia (Cooldown)</label>
                                        <input
                                            type="text"
                                            placeholder="ej. 10m, 1h, 24h"
                                            className="w-full mt-1 bg-background/80 border border-border rounded px-2 py-1 text-sm"
                                            value={selectedNode.data.cooldown || '1h'}
                                            onChange={(e) => onUpdateNodeData(selectedNode.id, { cooldown: e.target.value })}
                                        />
                                        <p className="text-[10px] text-muted-foreground mt-1">Formatos: 30s, 5m, 1h</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground">Contenido</label>
                                        <textarea
                                            placeholder="El uso de CPU es alto..."
                                            className="w-full mt-1 bg-background/80 border border-border rounded px-2 py-1 text-sm min-h-[80px] resize-none"
                                            value={selectedNode.data.body || ''}
                                            onChange={(e) => onUpdateNodeData(selectedNode.id, { body: e.target.value })}
                                        />
                                    </div>
                                    <div className="pt-2">
                                        <button
                                            onClick={async () => {
                                                const email = selectedNode.data.to;
                                                if (!email) {
                                                    alert("Por favor ingresa un destinatario primero.");
                                                    return;
                                                }
                                                const jwt = localStorage.getItem("jwt");
                                                if (!jwt) return;

                                                try {
                                                    const { sendTestEmail } = await import("@/lib/api/api");
                                                    await sendTestEmail(jwt, email);
                                                    alert(`Correo de prueba enviado a ${email}`);
                                                } catch (err: any) {
                                                    alert(`Error enviando correo: ${err.message}`);
                                                }
                                            }}
                                            className="w-full px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded text-xs font-medium transition-colors flex items-center justify-center gap-2"
                                        >
                                            <EnvelopeIcon className="w-3 h-3" />
                                            Probar Envío
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* Connection Status for Monitoring and Action */}
                            {(selectedNode.type === 'monitoring' || selectedNode.type === 'action') && (
                                <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                                    {selectedNode.data.connectedDevice ? (
                                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                            <CheckCircleIcon className="w-4 h-4" />
                                            <span>Conectado a: {selectedNode.data.connectedDevice}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                                            <ExclamationTriangleIcon className="w-4 h-4" />
                                            <span>No conectado a ningún dispositivo</span>
                                        </div>
                                    )}
                                </div>
                            )}
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
                                    className="w-full text-left px-3 py-2 text-sm bg-background/50 hover:bg-accent rounded border border-border transition-colors"
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
                        className="w-full bg-background/80 border border-border rounded px-3 py-2 text-sm"
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
                        className="w-full px-4 py-2 bg-background/50 hover:bg-accent border border-border rounded text-sm font-medium transition-colors"
                    >
                        Nueva Topología
                    </button>

                    <button
                        onClick={handleSaveClick}
                        className="w-full px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-sm font-medium transition-colors"
                    >
                        Guardar
                    </button>

                    <button
                        onClick={onExport}
                        className="w-full px-4 py-2 bg-background/50 hover:bg-accent border border-border rounded text-sm font-medium transition-colors"
                    >
                        Exportar JSON
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
                                    if (e.key === "Enter") handleSaveConfirm();
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
                                    onClick={handleSaveConfirm}
                                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-sm"
                                >
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
