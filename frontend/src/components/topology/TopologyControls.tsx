"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { ChartBarIcon, CheckCircleIcon, ExclamationTriangleIcon, BoltIcon, EnvelopeIcon, ChevronRightIcon, ChevronLeftIcon, BellIcon, PencilIcon, TrashIcon, ClockIcon, SpeakerWaveIcon, GlobeAltIcon, FunnelIcon, ChevronDownIcon, InformationCircleIcon, CalendarDaysIcon, HashtagIcon, ComputerDesktopIcon, PresentationChartLineIcon } from "@heroicons/react/24/outline";
import { useNotification } from "@/context/NotificationContext";
import { SOUND_OPTIONS } from "@/lib/soundPlayer";
import DeviceDetails from "./DeviceDetails";
import { Node } from "@xyflow/react";

interface TopologyControlsProps {
    jwt: string | null;
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
    onAddNotificationNode: () => void;
    onAddDelayNode: () => void;
    onAddSoundNode: () => void;
    onAddTrafficNode: () => void;
    onAddTrafficTriggerNode: () => void;
    onAddTimeWindowNode: () => void;
    onAddThresholdNode: () => void;
    onAddDetailsNode: () => void;
    onAddMetricNode: () => void;
    selectedNode: Node<any> | undefined;
    onUpdateNodeData: (id: string, data: any) => void;
    onDelete: (id: number) => void;
    onRename: (id: number, newName: string) => void;
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
    onAddNotificationNode,
    onAddDelayNode,
    onAddSoundNode,
    onAddTrafficNode,
    onAddTrafficTriggerNode,
    onAddTimeWindowNode,
    onAddThresholdNode,
    onAddDetailsNode,
    onAddMetricNode,
    selectedNode,
    onUpdateNodeData,
    onDelete,
    onRename,
    jwt,
}: TopologyControlsProps) {
    const { notify } = useNotification();
    const [isOpen, setIsOpen] = useState(true);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showRenameDialog, setShowRenameDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
        setTopologyName("");
        setShowSaveDialog(true);
    };

    const handleSaveConfirm = () => {
        if (topologyName.trim()) {
            onSave(topologyName.trim());
            setShowSaveDialog(false);
            setTopologyName("");
        }
    };

    const handleRenameConfirm = () => {
        if (selectedTopology && topologyName.trim()) {
            onRename(selectedTopology, topologyName.trim());
            setShowRenameDialog(false);
            setTopologyName("");
        }
    };

    const handleDeleteConfirm = () => {
        if (selectedTopology) {
            onDelete(selectedTopology);
            setShowDeleteDialog(false);
        }
    };

    const [activeCategory, setActiveCategory] = useState<'all' | 'monitoring' | 'triggers' | 'logic' | 'actions'>('all');

    const categories = [
        { id: 'all', label: 'Todos' },
        { id: 'monitoring', label: 'Monitoreo' },
        { id: 'triggers', label: 'Disparadores' },
        { id: 'logic', label: 'Lógica' },
        { id: 'actions', label: 'Acciones' },
    ];

    const [isFilterOpen, setIsFilterOpen] = useState(false);

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
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Herramientas</label>

                        {/* Category Filter Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className="flex items-center gap-2 px-2 py-1 bg-background/50 border border-border rounded text-xs hover:bg-accent transition-colors min-w-[100px] justify-between"
                            >
                                <span>{categories.find(c => c.id === activeCategory)?.label}</span>
                                <ChevronDownIcon className={`w-3 h-3 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isFilterOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setIsFilterOpen(false)}
                                    />
                                    <div className="absolute top-full right-0 mt-1 w-32 bg-popover border border-border rounded-md shadow-md overflow-hidden animate-in fade-in zoom-in-95 duration-100 z-20 flex flex-col">
                                        {categories.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => {
                                                    setActiveCategory(cat.id as any);
                                                    setIsFilterOpen(false);
                                                }}
                                                className={`text-left px-3 py-2 text-xs hover:bg-accent transition-colors ${activeCategory === cat.id ? "bg-accent/50 font-medium text-primary" : "text-muted-foreground"
                                                    }`}
                                            >
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="max-h-[180px] overflow-y-auto pr-1">
                        <div className="grid grid-cols-3 gap-2">
                            {/* Monitoring Tools */}
                            {(activeCategory === 'all' || activeCategory === 'monitoring') && (
                                <>
                                    <button
                                        onClick={onAddMonitoringNode}
                                        draggable
                                        onDragStart={(event) => {
                                            event.dataTransfer.setData('application/reactflow', 'monitoring');
                                            event.dataTransfer.effectAllowed = 'move';
                                        }}
                                        className="flex flex-col items-center justify-center p-3 bg-background/50 hover:bg-accent rounded border border-border transition-colors gap-2 cursor-grab active:cursor-grabbing"
                                        title="Visualiza métricas en tiempo real (CPU, RAM, etc.) de un dispositivo conectado."
                                    >
                                        <ChartBarIcon className="w-6 h-6" />
                                        <span className="text-xs">Gráfico</span>
                                    </button>
                                    <button
                                        onClick={onAddDetailsNode}
                                        draggable
                                        onDragStart={(event) => {
                                            event.dataTransfer.setData('application/reactflow', 'details');
                                            event.dataTransfer.effectAllowed = 'move';
                                        }}
                                        className="flex flex-col items-center justify-center p-3 bg-background/50 hover:bg-accent rounded border border-border transition-colors gap-2 cursor-grab active:cursor-grabbing"
                                        title="Muestra información detallada (OS, IP, Estado) del dispositivo conectado en el canvas."
                                    >
                                        <InformationCircleIcon className="w-6 h-6" />
                                        <span className="text-xs">Detalles</span>
                                    </button>
                                    <button
                                        onClick={onAddTrafficNode}
                                        draggable
                                        onDragStart={(event) => {
                                            event.dataTransfer.setData('application/reactflow', 'traffic');
                                            event.dataTransfer.effectAllowed = 'move';
                                        }}
                                        className="flex flex-col items-center justify-center p-3 bg-background/50 hover:bg-accent rounded border border-border transition-colors gap-2 cursor-grab active:cursor-grabbing"
                                        title="Monitorea el tráfico de red entrante y saliente del dispositivo."
                                    >
                                        <GlobeAltIcon className="w-6 h-6" />
                                        <span className="text-xs">Tráfico</span>
                                    </button>
                                </>
                            )}

                            {/* Trigger Tools */}
                            {(activeCategory === 'all' || activeCategory === 'triggers') && (
                                <>
                                    <button
                                        onClick={onAddActionNode}
                                        draggable
                                        onDragStart={(event) => {
                                            event.dataTransfer.setData('application/reactflow', 'action');
                                            event.dataTransfer.effectAllowed = 'move';
                                        }}
                                        className="flex flex-col items-center justify-center p-3 bg-background/50 hover:bg-accent rounded border border-border transition-colors gap-2 cursor-grab active:cursor-grabbing"
                                        title="Evalúa una condición sobre una métrica (ej: CPU > 80%) para disparar alertas."
                                    >
                                        <BoltIcon className="w-6 h-6" />
                                        <span className="text-xs">Acción</span>
                                    </button>
                                    <button
                                        onClick={onAddTrafficTriggerNode}
                                        draggable
                                        onDragStart={(event) => {
                                            event.dataTransfer.setData('application/reactflow', 'traffic-trigger');
                                            event.dataTransfer.effectAllowed = 'move';
                                        }}
                                        className="flex flex-col items-center justify-center p-3 bg-background/50 hover:bg-accent rounded border border-border transition-colors gap-2 cursor-grab active:cursor-grabbing"
                                        title="Dispara alertas basadas en patrones de tráfico específicos (ej: puerto, protocolo)."
                                    >
                                        <FunnelIcon className="w-6 h-6" />
                                        <span className="text-xs">Trigger</span>
                                    </button>
                                </>
                            )}

                            {/* Logic Tools */}
                            {(activeCategory === 'all' || activeCategory === 'logic') && (
                                <>
                                    <button
                                        onClick={onAddDelayNode}
                                        draggable
                                        onDragStart={(event) => {
                                            event.dataTransfer.setData('application/reactflow', 'delay');
                                            event.dataTransfer.effectAllowed = 'move';
                                        }}
                                        className="flex flex-col items-center justify-center p-3 bg-background/50 hover:bg-accent rounded border border-border transition-colors gap-2 cursor-grab active:cursor-grabbing"
                                        title="Introduce una pausa configurable antes de pasar la señal al siguiente nodo."
                                    >
                                        <ClockIcon className="w-6 h-6" />
                                        <span className="text-xs">Delay</span>
                                    </button>
                                    <button
                                        onClick={onAddTimeWindowNode}
                                        draggable
                                        onDragStart={(event) => {
                                            event.dataTransfer.setData('application/reactflow', 'time-window');
                                            event.dataTransfer.effectAllowed = 'move';
                                        }}
                                        className="flex flex-col items-center justify-center p-3 bg-background/50 hover:bg-accent rounded border border-border transition-colors gap-2 cursor-grab active:cursor-grabbing"
                                        title="Permite el paso de señales solo dentro de un horario específico configurado."
                                    >
                                        <CalendarDaysIcon className="w-6 h-6" />
                                        <span className="text-xs">Ventana</span>
                                    </button>
                                    <button
                                        onClick={onAddThresholdNode}
                                        draggable
                                        onDragStart={(event) => {
                                            event.dataTransfer.setData('application/reactflow', 'threshold');
                                            event.dataTransfer.effectAllowed = 'move';
                                        }}
                                        className="flex flex-col items-center justify-center p-3 bg-background/50 hover:bg-accent rounded border border-border transition-colors gap-2 cursor-grab active:cursor-grabbing"
                                        title="Requiere que una señal se repita X veces en un tiempo dado antes de activarse."
                                    >
                                        <HashtagIcon className="w-6 h-6" />
                                        <span className="text-xs">Umbral</span>
                                    </button>
                                </>
                            )}

                            {/* Action Tools */}
                            {(activeCategory === 'all' || activeCategory === 'actions') && (
                                <>
                                    <button
                                        onClick={onAddEmailNode}
                                        draggable
                                        onDragStart={(event) => {
                                            event.dataTransfer.setData('application/reactflow', 'email');
                                            event.dataTransfer.effectAllowed = 'move';
                                        }}
                                        className="flex flex-col items-center justify-center p-3 bg-background/50 hover:bg-accent rounded border border-border transition-colors gap-2 cursor-grab active:cursor-grabbing"
                                        title="Envía un correo electrónico de alerta cuando recibe una señal de activación."
                                    >
                                        <EnvelopeIcon className="w-6 h-6" />
                                        <span className="text-xs">Email</span>
                                    </button>
                                    <button
                                        onClick={onAddNotificationNode}
                                        draggable
                                        onDragStart={(event) => {
                                            event.dataTransfer.setData('application/reactflow', 'notification');
                                            event.dataTransfer.effectAllowed = 'move';
                                        }}
                                        className="flex flex-col items-center justify-center p-3 bg-background/50 hover:bg-accent rounded border border-border transition-colors gap-2 cursor-grab active:cursor-grabbing"
                                        title="Muestra una notificación emergente (toast) en la pantalla del usuario."
                                    >
                                        <BellIcon className="w-6 h-6" />
                                        <span className="text-xs">Notificación</span>
                                    </button>
                                    <button
                                        onClick={onAddSoundNode}
                                        draggable
                                        onDragStart={(event) => {
                                            event.dataTransfer.setData('application/reactflow', 'sound');
                                            event.dataTransfer.effectAllowed = 'move';
                                        }}
                                        className="flex flex-col items-center justify-center p-3 bg-background/50 hover:bg-accent rounded border border-border transition-colors gap-2 cursor-grab active:cursor-grabbing"
                                        title="Reproduce un sonido de alarma cuando se activa."
                                    >
                                        <SpeakerWaveIcon className="w-6 h-6" />
                                        <span className="text-xs">Sonido</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Configuración específica para Traffic Trigger Node */}
                {selectedNode?.type === 'traffic-trigger' && (
                    <div className="space-y-4 bg-muted/30 p-3 rounded-lg border border-border animate-in fade-in slide-in-from-right-4">
                        <label className="text-sm font-medium text-primary">Configuración de Traffic Trigger</label>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Tipo de Regla</label>
                            <select
                                className="w-full mt-1 p-2 bg-background border border-border rounded text-sm"
                                value={(selectedNode.data as any).ruleType || 'threat_level'}
                                onChange={(e) => onUpdateNodeData(selectedNode.id, { ruleType: e.target.value, value: '' })}
                            >
                                <option value="threat_level">Nivel de Amenaza</option>
                                <option value="port">Puerto</option>
                                <option value="protocol">Protocolo</option>
                                <option value="ip">Dirección IP</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">Valor</label>
                            {selectedNode.data.ruleType === 'threat_level' ? (
                                <select
                                    className="w-full mt-1 p-2 bg-background border border-border rounded text-sm"
                                    value={(selectedNode.data as any).value || 'HIGH'}
                                    onChange={(e) => onUpdateNodeData(selectedNode.id, { value: e.target.value })}
                                >
                                    <option value="LOW">LOW</option>
                                    <option value="MEDIUM">MEDIUM</option>
                                    <option value="HIGH">HIGH</option>
                                    <option value="CRITICAL">CRITICAL</option>
                                </select>
                            ) : selectedNode.data.ruleType === 'protocol' ? (
                                <select
                                    className="w-full mt-1 p-2 bg-background border border-border rounded text-sm"
                                    value={(selectedNode.data as any).value || 'TCP'}
                                    onChange={(e) => onUpdateNodeData(selectedNode.id, { value: e.target.value })}
                                >
                                    <option value="TCP">TCP</option>
                                    <option value="UDP">UDP</option>
                                    <option value="HTTP">HTTP</option>
                                    <option value="HTTPS">HTTPS</option>
                                    <option value="SSH">SSH</option>
                                    <option value="DNS">DNS</option>
                                    <option value="ICMP">ICMP</option>
                                </select>
                            ) : selectedNode.data.ruleType === 'port' ? (
                                <input
                                    type="number"
                                    className="w-full mt-1 p-2 bg-background border border-border rounded text-sm"
                                    value={(selectedNode.data as any).value || ''}
                                    onChange={(e) => onUpdateNodeData(selectedNode.id, { value: e.target.value })}
                                    placeholder="Ej: 80"
                                />
                            ) : (
                                <input
                                    type="text"
                                    className="w-full mt-1 p-2 bg-background border border-border rounded text-sm"
                                    value={(selectedNode.data as any).value || ''}
                                    onChange={(e) => onUpdateNodeData(selectedNode.id, { value: e.target.value })}
                                    placeholder="Ej: 192.168.1.10"
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Configuración de Nodo Seleccionado */}
                {selectedNode && (
                    <div className="space-y-2 border-t border-border pt-4 animate-in fade-in slide-in-from-right-4">
                        <label className="text-sm font-medium text-primary">
                            {selectedNode.type === 'monitoring' && "Configuración de Gráfico"}
                            {selectedNode.type === 'action' && "Regla de Disparo"}
                            {selectedNode.type === 'email' && "Configuración de Email"}
                            {selectedNode.type === 'notification' && "Configuración de Notificación"}
                            {selectedNode.type === 'delay' && "Configuración de Delay"}
                            {selectedNode.type === 'sound' && "Configuración de Sonido"}
                            {selectedNode.type === 'traffic' && "Configuración de Tráfico"}
                            {selectedNode.type === 'traffic-trigger' && "Configuración de Traffic Trigger"}
                            {selectedNode.type === 'time-window' && "Configuración de Ventana de Tiempo"}
                            {selectedNode.type === 'threshold' && "Configuración de Umbral"}
                            {selectedNode.type === 'device' && "Detalles del Dispositivo"}
                        </label>

                        <div className="space-y-3 bg-muted/30 p-3 rounded-lg border border-border">
                            {/* Device Details */}
                            {selectedNode.type === 'device' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-muted-foreground">Cambiar Dispositivo</label>
                                        <select
                                            className="w-full mt-1 bg-background/80 border border-border rounded px-2 py-1 text-sm"
                                            value={(selectedNode.data as any).deviceName || selectedNode.id}
                                            onChange={(e) => onUpdateNodeData(selectedNode.id, { deviceName: e.target.value, label: e.target.value })}
                                        >
                                            {devices.map(dev => (
                                                <option key={dev} value={dev}>{dev}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground">Color del Nodo</label>
                                        <div className="flex flex-wrap gap-1 mt-1 mb-2">
                                            {[
                                                '#eb6f92', // Love
                                                '#f6c177', // Gold
                                                '#ebbcba', // Rose
                                                '#31748f', // Pine
                                                '#9ccfd8', // Foam
                                                '#c4a7e7', // Iris
                                                '#908caa', // Subtle
                                                '#1f1d2e', // Surface
                                            ].map((color) => (
                                                <button
                                                    key={color}
                                                    className={`w-5 h-5 rounded-full border border-border transition-transform hover:scale-110 ${((selectedNode.data as any).color || '#c4a7e7') === color ? 'ring-2 ring-primary ring-offset-1 ring-offset-card' : ''
                                                        }`}
                                                    style={{ backgroundColor: color }}
                                                    onClick={() => onUpdateNodeData(selectedNode.id, { color })}
                                                    title={color}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                className="h-8 w-12 bg-transparent border border-border rounded cursor-pointer"
                                                value={(selectedNode.data as any).color || '#c4a7e7'}
                                                onChange={(e) => onUpdateNodeData(selectedNode.id, { color: e.target.value })}
                                            />
                                            <span className="text-xs font-mono text-muted-foreground">
                                                {(selectedNode.data as any).color || '#c4a7e7'}
                                            </span>
                                        </div>
                                    </div>
                                    {jwt && (
                                        <DeviceDetails deviceId={(selectedNode.data as any).deviceName || selectedNode.id} jwt={jwt} />
                                    )}
                                </div>
                            )}

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
                                            value={(selectedNode.data as any).range || '1h'}
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
                                            value={(selectedNode.data as any).interval || '1m'}
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
                                            value={(selectedNode.data as any).agg || 'mean'}
                                            onChange={(e) => onUpdateNodeData(selectedNode.id, { agg: e.target.value })}
                                        >
                                            {AGG_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* Metric Node Configuration */}
                            {selectedNode.type === 'metric' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-muted-foreground">Métrica</label>
                                        <select
                                            className="w-full mt-1 bg-background/80 border border-border rounded px-2 py-1 text-sm"
                                            value={(selectedNode.data as any).metric || 'cpu'}
                                            onChange={(e) => onUpdateNodeData(selectedNode.id, { metric: e.target.value })}
                                        >
                                            <option value="cpu">CPU Usage</option>
                                            <option value="ram">RAM Usage</option>
                                            <option value="disk">Disk Usage</option>
                                            <option value="net_rx">Network RX</option>
                                            <option value="net_tx">Network TX</option>
                                            <option value="temp">Temperature</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Detail Node Configuration */}
                            {selectedNode.type === 'detail' && (
                                <div className="space-y-3">
                                    <label className="text-xs text-muted-foreground">Métricas Visibles</label>
                                    <div className="space-y-1">
                                        {[
                                            { id: 'cpu', label: 'CPU Usage' },
                                            { id: 'ram', label: 'RAM Usage' },
                                            { id: 'disk', label: 'Disk Usage' },
                                            { id: 'net_rx', label: 'Network RX' },
                                            { id: 'net_tx', label: 'Network TX' },
                                            { id: 'temp', label: 'Temperature' },
                                        ].map((metric) => {
                                            const selectedMetrics = (selectedNode.data as any).selectedMetrics || ['cpu', 'ram', 'disk'];
                                            const isSelected = selectedMetrics.includes(metric.id);
                                            return (
                                                <label key={metric.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={(e) => {
                                                            const newMetrics = e.target.checked
                                                                ? [...selectedMetrics, metric.id]
                                                                : selectedMetrics.filter((m: string) => m !== metric.id);
                                                            onUpdateNodeData(selectedNode.id, { selectedMetrics: newMetrics });
                                                        }}
                                                        className="rounded border-border bg-background"
                                                    />
                                                    <span>{metric.label}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
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
                                            value={(selectedNode.data.to as string) || ''}
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
                                                    notify("Por favor ingresa un destinatario primero.", "error");
                                                    return;
                                                }
                                                const jwt = localStorage.getItem("jwt");
                                                if (!jwt) return;

                                                try {
                                                    const { sendTestEmail } = await import("@/lib/api/api");
                                                    await sendTestEmail(jwt, email);
                                                    notify(`Correo de prueba enviado a ${email}`, "success");
                                                } catch (err: any) {
                                                    notify(`Error enviando correo: ${err.message}`, "error");
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

                            {/* Notification Node Config */}
                            {selectedNode.type === 'notification' && (
                                <div>
                                    <label className="text-xs text-muted-foreground">Mensaje</label>
                                    <input
                                        type="text"
                                        placeholder="Mensaje de alerta..."
                                        className="w-full mt-1 bg-background/80 border border-border rounded px-2 py-1 text-sm"
                                        value={(selectedNode.data as any).message || ''}
                                        onChange={(e) => onUpdateNodeData(selectedNode.id, { message: e.target.value })}
                                    />
                                </div>
                            )}

                            {/* Delay Node Config */}
                            {selectedNode.type === 'delay' && (
                                <div>
                                    <label className="text-xs text-muted-foreground">Retraso (ms)</label>
                                    <input
                                        type="number"
                                        placeholder="10000"
                                        className="w-full mt-1 bg-background/80 border border-border rounded px-2 py-1 text-sm"
                                        value={(selectedNode.data as any).delay || 5}
                                        onChange={(e) => onUpdateNodeData(selectedNode.id, { delay: parseInt(e.target.value) })}
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-1">1000ms = 1 segundo</p>
                                </div>
                            )}

                            {/* Sound Node Config */}
                            {selectedNode.type === 'sound' && (
                                <div>
                                    <label className="text-xs text-muted-foreground">Tipo de Sonido</label>
                                    <select
                                        className="w-full mt-1 bg-background/80 border border-border rounded px-2 py-1 text-sm"
                                        value={(selectedNode.data as any).sound || 'alarm'}
                                        onChange={(e) => onUpdateNodeData(selectedNode.id, { sound: e.target.value })}
                                    >
                                        {SOUND_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Time Window Node Config */}
                            {selectedNode.type === 'time-window' && (
                                <>
                                    <div>
                                        <label className="text-xs text-muted-foreground">Hora Inicio (HH:mm)</label>
                                        <input
                                            type="time"
                                            className="w-full mt-1 bg-background/80 border border-border rounded px-2 py-1 text-sm"
                                            value={(selectedNode.data as any).startTime || '09:00'}
                                            onChange={(e) => onUpdateNodeData(selectedNode.id, { startTime: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground">Hora Fin (HH:mm)</label>
                                        <input
                                            type="time"
                                            className="w-full mt-1 bg-background/80 border border-border rounded px-2 py-1 text-sm"
                                            value={(selectedNode.data as any).endTime || "17:00"}
                                            onChange={(e) => onUpdateNodeData(selectedNode.id, { endTime: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}

                            {/* Threshold Node Config */}
                            {selectedNode.type === 'threshold' && (
                                <>
                                    <div>
                                        <label className="text-xs text-muted-foreground">Umbral (Intentos)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full mt-1 bg-background/80 border border-border rounded px-2 py-1 text-sm"
                                            value={(selectedNode.data as any).threshold || 3}
                                            onChange={(e) => onUpdateNodeData(selectedNode.id, { threshold: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground">Ventana de Tiempo (segundos)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full mt-1 bg-background/80 border border-border rounded px-2 py-1 text-sm"
                                            value={(selectedNode.data as any).timeWindow || 60}
                                            onChange={(e) => onUpdateNodeData(selectedNode.id, { timeWindow: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                                        Estado actual: {selectedNode.data.currentCount || 0} / {selectedNode.data.threshold || 3}
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

                {/* Separator */}
                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Dispositivos</span>
                    </div>
                </div>

                {/* Dispositivos disponibles */}
                <div className="space-y-2 flex-1 min-h-0 flex flex-col">
                    <label className="text-sm font-medium">Disponibles</label>
                    <div className="space-y-1 overflow-y-auto flex-1 pr-2">
                        {devices.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No hay dispositivos</p>
                        ) : (
                            devices.map((device) => (
                                <button
                                    key={device}
                                    onClick={() => onAddDevice(device)}
                                    draggable
                                    onDragStart={(event) => {
                                        event.dataTransfer.setData('application/reactflow', 'device');
                                        event.dataTransfer.setData('device/name', device);
                                        event.dataTransfer.effectAllowed = 'move';
                                    }}
                                    className="w-full group flex items-center gap-3 p-2.5 bg-card/50 hover:bg-accent border border-border rounded-lg transition-all shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing"
                                >
                                    <div className="p-2 bg-primary/10 rounded-md group-hover:bg-primary/20 transition-colors">
                                        <ComputerDesktopIcon className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="text-sm font-medium leading-none truncate">{device}</div>
                                        <div className="text-[10px] text-muted-foreground mt-1">Arrastra para agregar</div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                    <label className="text-sm font-medium">Topologías Guardadas</label>
                    <div className="flex gap-2">
                        <select
                            className="flex-1 bg-background/80 border border-border rounded px-3 py-2 text-sm"
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
                        <button
                            onClick={() => {
                                if (selectedTopology) {
                                    const topo = topologies.find(t => t.ID === selectedTopology);
                                    if (topo) {
                                        setTopologyName(topo.Name);
                                        setShowRenameDialog(true);
                                    }
                                }
                            }}
                            disabled={!selectedTopology}
                            className="p-2 bg-background/50 hover:bg-accent border border-border rounded disabled:opacity-50"
                            title="Renombrar"
                        >
                            <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => {
                                if (selectedTopology) setShowDeleteDialog(true);
                            }}
                            disabled={!selectedTopology}
                            className="p-2 bg-background/50 hover:bg-destructive/20 border border-border rounded text-destructive disabled:opacity-50"
                            title="Eliminar"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Acciones */}
                <div className="border-t border-border pt-4 space-y-2">
                    <button
                        onClick={onAddMonitoringNode}
                        className="flex flex-col items-center justify-center p-2 rounded-lg border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors"
                        title="Añadir Gráfico"
                    >
                        <PresentationChartLineIcon className="w-6 h-6 mb-1" />
                        <span className="text-[10px]">Gráfico</span>
                    </button>
                    <button
                        onClick={onAddMetricNode}
                        className="flex flex-col items-center justify-center p-2 rounded-lg border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors"
                        title="Añadir Métrica"
                    >
                        <div className="w-6 h-6 mb-1 flex items-center justify-center border-2 border-current rounded text-[10px] font-bold">12</div>
                        <span className="text-[10px]">Métrica</span>
                    </button>
                    <button
                        onClick={onAddDetailsNode}
                        className="flex flex-col items-center justify-center p-2 rounded-lg border border-border bg-card hover:bg-accent hover:text-accent-foreground transition-colors"
                        title="Añadir Detalles"
                    >
                        <div className="w-6 h-6 mb-1 flex flex-col gap-0.5 justify-center px-1">
                            <div className="h-0.5 w-full bg-current rounded-full"></div>
                            <div className="h-0.5 w-full bg-current rounded-full"></div>
                            <div className="h-0.5 w-full bg-current rounded-full"></div>
                        </div>
                        <span className="text-[10px]">Detalles</span>
                    </button>
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
                </div>

                {/* Dialog para guardar */}
                {showSaveDialog && typeof document !== 'undefined' && createPortal(
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
                        <div className="bg-card border border-border rounded-lg p-6 w-96 space-y-4 shadow-xl">
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
                    </div>,
                    document.body
                )}

                {/* Dialog para renombrar */}
                {showRenameDialog && typeof document !== 'undefined' && createPortal(
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
                        <div className="bg-card border border-border rounded-lg p-6 w-96 space-y-4 shadow-xl">
                            <h3 className="text-lg font-semibold">Renombrar Topología</h3>
                            <input
                                type="text"
                                placeholder="Nuevo nombre"
                                value={topologyName}
                                onChange={(e) => setTopologyName(e.target.value)}
                                className="w-full px-3 py-2 bg-background border border-border rounded text-sm"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") handleRenameConfirm();
                                    if (e.key === "Escape") setShowRenameDialog(false);
                                }}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowRenameDialog(false)}
                                    className="flex-1 px-4 py-2 bg-background hover:bg-accent border border-border rounded text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleRenameConfirm}
                                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-sm"
                                >
                                    Renombrar
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

                {/* Dialog para eliminar */}
                {showDeleteDialog && typeof document !== 'undefined' && createPortal(
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
                        <div className="bg-card border border-border rounded-lg p-6 w-96 space-y-4 shadow-xl">
                            <h3 className="text-lg font-semibold text-destructive">Eliminar Topología</h3>
                            <p className="text-sm text-muted-foreground">
                                ¿Estás seguro de que deseas eliminar esta topología? Esta acción no se puede deshacer.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowDeleteDialog(false)}
                                    className="flex-1 px-4 py-2 bg-background hover:bg-accent border border-border rounded text-sm"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded text-sm"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}
            </div>
        </div >
    );
}
