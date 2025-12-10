"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { ChartBarIcon, CheckCircleIcon, ExclamationTriangleIcon, BoltIcon, EnvelopeIcon, ChevronRightIcon, ChevronLeftIcon, BellIcon, PencilIcon, TrashIcon, ClockIcon, SpeakerWaveIcon, GlobeAltIcon, FunnelIcon, ChevronDownIcon, InformationCircleIcon, CalendarDaysIcon, HashtagIcon, ComputerDesktopIcon, PresentationChartLineIcon, ChartPieIcon } from "@heroicons/react/24/outline";
import { ChartBarIcon, CheckCircleIcon, ExclamationTriangleIcon, BoltIcon, EnvelopeIcon, ChevronRightIcon, ChevronLeftIcon, BellIcon, PencilIcon, TrashIcon, ClockIcon, SpeakerWaveIcon, GlobeAltIcon, FunnelIcon, ChevronDownIcon, InformationCircleIcon, CalendarDaysIcon, HashtagIcon, ComputerDesktopIcon, PresentationChartLineIcon, ChartPieIcon } from "@heroicons/react/24/outline";
import { useNotification } from "@/context/NotificationContext";
import { useLanguage } from "@/context/LanguageContext";
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
    onAddStatisticsNode: () => void;
    selectedNode: Node<any> | undefined;
    onUpdateNodeData: (id: string, data: any) => void;
    onDelete: (id: number) => void;
    onRename: (id: number, newName: string) => void;
}


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
    onAddStatisticsNode,
    selectedNode,
    onUpdateNodeData,
    onDelete,
    onRename,
    jwt,
}: TopologyControlsProps) {
    const { notify } = useNotification();
    const { t } = useLanguage();
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
        { id: 'all', label: t('catAll') },
        { id: 'monitoring', label: t('catMonitoring') },
        { id: 'triggers', label: t('catTriggers') },
        { id: 'logic', label: t('catLogic') },
        { id: 'actions', label: t('catActions') },
    ];

    const METRIC_OPTIONS = [
        { value: "cpu", label: t("cpu") },
        { value: "ram", label: t("ram") },
        { value: "disk", label: t("disk") },
        { value: "net_rx", label: t("net_rx") },
        { value: "net_tx", label: t("net_tx") },
        { value: "temp", label: t("temp") },
    ];

    const RANGE_OPTIONS = [
        { value: "30m", label: t("t_30m") },
        { value: "1h", label: t("t_1h") },
        { value: "6h", label: t("t_6h") },
        { value: "24h", label: t("t_24h") },
        { value: "7d", label: t("t_7d") },
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
                <h2 className="text-lg font-semibold">{t('topologyControls')}</h2>

                {/* Herramientas */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">{t('tools')}</label>

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
                        <div className="grid grid-cols-4 gap-2">
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
                                        title={t('metricChartDesc')}
                                    >
                                        <ChartBarIcon className="w-6 h-6" />
                                        <span className="text-xs">{t('metricChart')}</span>
                                    </button>
                                    <button
                                        onClick={onAddDetailsNode}
                                        draggable
                                        onDragStart={(event) => {
                                            event.dataTransfer.setData('application/reactflow', 'details');
                                            event.dataTransfer.effectAllowed = 'move';
                                        }}
                                        className="flex flex-col items-center justify-center p-3 bg-background/50 hover:bg-accent rounded border border-border transition-colors gap-2 cursor-grab active:cursor-grabbing"
                                        title={t('detailsNodeDesc')}
                                    >
                                        <InformationCircleIcon className="w-6 h-6" />
                                        <span className="text-xs">{t('detailsNode')}</span>
                                    </button>
                                    <button
                                        onClick={onAddTrafficNode}
                                        draggable
                                        onDragStart={(event) => {
                                            event.dataTransfer.setData('application/reactflow', 'traffic');
                                            event.dataTransfer.effectAllowed = 'move';
                                        }}
                                        className="flex flex-col items-center justify-center p-3 bg-background/50 hover:bg-accent rounded border border-border transition-colors gap-2 cursor-grab active:cursor-grabbing"
                                        title={t('trafficNodeDesc')}
                                    >
                                        <GlobeAltIcon className="w-6 h-6" />
                                        <span className="text-xs">{t('trafficNode')}</span>
                                    </button>
                                    <button
                                        onClick={onAddStatisticsNode}
                                        draggable
                                        onDragStart={(event) => {
                                            event.dataTransfer.setData('application/reactflow', 'statistics');
                                            event.dataTransfer.effectAllowed = 'move';
                                        }}
                                        className="flex flex-col items-center justify-center p-3 bg-background/50 hover:bg-accent rounded border border-border transition-colors gap-2 cursor-grab active:cursor-grabbing"
                                        title={t('statsNodeDesc')}
                                    >
                                        <ChartPieIcon className="w-6 h-6" />
                                        <span className="text-xs">{t('statsNode')}</span>
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
                                        title={t('actionNodeDesc')}
                                    >
                                        <BoltIcon className="w-6 h-6" />
                                        <span className="text-xs">{t('actionNode')}</span>
                                    </button>
                                    <button
                                        onClick={onAddTrafficTriggerNode}
                                        draggable
                                        onDragStart={(event) => {
                                            event.dataTransfer.setData('application/reactflow', 'traffic-trigger');
                                            event.dataTransfer.effectAllowed = 'move';
                                        }}
                                        className="flex flex-col items-center justify-center p-3 bg-background/50 hover:bg-accent rounded border border-border transition-colors gap-2 cursor-grab active:cursor-grabbing"
                                        title={t('trafficTriggerDesc')}
                                    >
                                        <FunnelIcon className="w-6 h-6" />
                                        <span className="text-xs">{t('trafficTrigger')}</span>
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
                                        title={t('delayNodeDesc')}
                                    >
                                        <ClockIcon className="w-6 h-6" />
                                        <span className="text-xs">{t('delayNode')}</span>
                                    </button>
                                    <button
                                        onClick={onAddTimeWindowNode}
                                        draggable
                                        onDragStart={(event) => {
                                            event.dataTransfer.setData('application/reactflow', 'time-window');
                                            event.dataTransfer.effectAllowed = 'move';
                                        }}
                                        className="flex flex-col items-center justify-center p-3 bg-background/50 hover:bg-accent rounded border border-border transition-colors gap-2 cursor-grab active:cursor-grabbing"
                                        title={t('windowNodeDesc')}
                                    >
                                        <CalendarDaysIcon className="w-6 h-6" />
                                        <span className="text-xs">{t('windowNode')}</span>
                                    </button>
                                    <button
                                        onClick={onAddThresholdNode}
                                        draggable
                                        onDragStart={(event) => {
                                            event.dataTransfer.setData('application/reactflow', 'threshold');
                                            event.dataTransfer.effectAllowed = 'move';
                                        }}
                                        className="flex flex-col items-center justify-center p-3 bg-background/50 hover:bg-accent rounded border border-border transition-colors gap-2 cursor-grab active:cursor-grabbing"
                                        title={t('thresholdNodeDesc')}
                                    >
                                        <HashtagIcon className="w-6 h-6" />
                                        <span className="text-xs">{t('thresholdNode')}</span>
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
                                        title={t('emailNodeDesc')}
                                    >
                                        <EnvelopeIcon className="w-6 h-6" />
                                        <span className="text-xs">{t('emailNode')}</span>
                                    </button>
                                    <button
                                        onClick={onAddNotificationNode}
                                        draggable
                                        onDragStart={(event) => {
                                            event.dataTransfer.setData('application/reactflow', 'notification');
                                            event.dataTransfer.effectAllowed = 'move';
                                        }}
                                        className="flex flex-col items-center justify-center p-3 bg-background/50 hover:bg-accent rounded border border-border transition-colors gap-2 cursor-grab active:cursor-grabbing"
                                        title={t('notificationNodeDesc')}
                                    >
                                        <BellIcon className="w-6 h-6" />
                                        <span className="text-xs">{t('notificationNode')}</span>
                                    </button>
                                    <button
                                        onClick={onAddSoundNode}
                                        draggable
                                        onDragStart={(event) => {
                                            event.dataTransfer.setData('application/reactflow', 'sound');
                                            event.dataTransfer.effectAllowed = 'move';
                                        }}
                                        className="flex flex-col items-center justify-center p-3 bg-background/50 hover:bg-accent rounded border border-border transition-colors gap-2 cursor-grab active:cursor-grabbing"
                                        title={t('soundNodeDesc')}
                                    >
                                        <SpeakerWaveIcon className="w-6 h-6" />
                                        <span className="text-xs">{t('soundNode')}</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Configuración específica para Traffic Trigger Node */}
                {selectedNode?.type === 'traffic-trigger' && (
                    <div className="space-y-4 bg-muted/30 p-3 rounded-lg border border-border animate-in fade-in slide-in-from-right-4">
                        <label className="text-sm font-medium text-primary">{t('configTitle')} Traffic Trigger</label>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">{t('ruleType')}</label>
                            <select
                                className="w-full mt-1 p-2 bg-background border border-border rounded text-sm"
                                value={(selectedNode.data as any).ruleType || 'threat_level'}
                                onChange={(e) => onUpdateNodeData(selectedNode.id, { ruleType: e.target.value, value: '' })}
                            >
                                <option value="threat_level">{t('threatLevel')}</option>
                                <option value="port">{t('port')}</option>
                                <option value="protocol">{t('protocol')}</option>
                                <option value="ip">{t('ipAddr')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-muted-foreground">{t('value')}</label>
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
                            {selectedNode.type === 'monitoring' && `${t('configTitle')} ${t('metricChart')}`}
                            {selectedNode.type === 'action' && `${t('configTitle')} ${t('actionNode')}`}
                            {selectedNode.type === 'email' && `${t('configTitle')} ${t('emailNode')}`}
                            {selectedNode.type === 'notification' && `${t('configTitle')} ${t('notificationNode')}`}
                            {selectedNode.type === 'delay' && `${t('configTitle')} ${t('delayNode')}`}
                            {selectedNode.type === 'sound' && `${t('configTitle')} ${t('soundNode')}`}
                            {selectedNode.type === 'traffic' && `${t('configTitle')} ${t('trafficNode')}`}
                            {selectedNode.type === 'traffic-trigger' && `${t('configTitle')} ${t('trafficTrigger')}`}
                            {selectedNode.type === 'time-window' && `${t('configTitle')} ${t('windowNode')}`}
                            {selectedNode.type === 'threshold' && `${t('configTitle')} ${t('thresholdNode')}`}
                            {selectedNode.type === 'device' && `${t('detailsNodeDesc')}`}
                        </label>

                        <div className="space-y-3 bg-muted/30 p-3 rounded-lg border border-border">
                            {/* Device Details */}
                            {selectedNode.type === 'device' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-muted-foreground">{t('changeDevice')}</label>
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
                                        <label className="text-xs text-muted-foreground">{t('nodeColor')}</label>
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

                            {/* Statistics Node Configuration */}
                            {selectedNode.type === 'statistics' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-muted-foreground">{t('monitoredDevice')}</label>
                                        <select
                                            className="w-full mt-1 bg-background/80 border border-border rounded px-2 py-1 text-sm"
                                            value={(selectedNode.data as any).deviceId || ""}
                                            onChange={(e) => onUpdateNodeData(selectedNode.id, { deviceId: e.target.value })}
                                        >
                                            <option value="">{t('selectDevice')}</option>
                                            {devices.map(dev => (
                                                <option key={dev} value={dev}>{dev}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground">{t('metricType')}</label>
                                        <select
                                            className="w-full mt-1 bg-background/80 border border-border rounded px-2 py-1 text-sm"
                                            value={(selectedNode.data as any).metricType || ""}
                                            onChange={(e) => onUpdateNodeData(selectedNode.id, { metricType: e.target.value })}
                                        >
                                            <option value="">{t('selectMetric')}</option>
                                            <option value="cpu">CPU</option>
                                            <option value="ram">RAM</option>
                                            <option value="disk">Disco</option>
                                            <option value="network">Red</option>
                                            <option value="temp">Temperatura</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Monitoring Node Config */}
                            {selectedNode.type === 'monitoring' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-muted-foreground">{t('metric')}</label>
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
                                        <label className="text-xs text-muted-foreground">{t('timeRange')}</label>
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

                                </div>
                            )}

                            {/* Action Node Config */}
                            {selectedNode.type === 'action' && (
                                <>
                                    <div>
                                        <label className="text-xs text-muted-foreground">{t('metric')}</label>
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
                                            <label className="text-xs text-muted-foreground">{t('operator')}</label>
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
                                        <label className="text-xs text-muted-foreground">{t('recipient')}</label>
                                        <input
                                            type="email"
                                            placeholder="admin@example.com"
                                            className="w-full mt-1 bg-background/80 border border-border rounded px-2 py-1 text-sm"
                                            value={(selectedNode.data.to as string) || ''}
                                            onChange={(e) => onUpdateNodeData(selectedNode.id, { to: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground">{t('subject')}</label>
                                        <input
                                            type="text"
                                            placeholder="Alerta CPU"
                                            className="w-full mt-1 bg-background/80 border border-border rounded px-2 py-1 text-sm"
                                            value={selectedNode.data.subject || ''}
                                            onChange={(e) => onUpdateNodeData(selectedNode.id, { subject: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="text-xs text-muted-foreground">{t('content')}</label>
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
                                                    notify(t('enterRecipient'), "error");
                                                    return;
                                                }
                                                const jwt = localStorage.getItem("jwt");
                                                if (!jwt) return;

                                                try {
                                                    const { sendTestEmail } = await import("@/lib/api/api");
                                                    await sendTestEmail(jwt, email);
                                                    notify(`${t('testSendSuccess')} ${email}`, "success");
                                                } catch (err: any) {
                                                    notify(`${t('testSendError')}: ${err.message}`, "error");
                                                }
                                            }}
                                            className="w-full px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded text-xs font-medium transition-colors flex items-center justify-center gap-2"
                                        >
                                            <EnvelopeIcon className="w-3 h-3" />
                                            {t('testSend')}
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* Notification Node Config */}
                            {selectedNode.type === 'notification' && (
                                <div>
                                    <label className="text-xs text-muted-foreground">{t('message')}</label>
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
                                    <label className="text-xs text-muted-foreground">{t('delayMs')}</label>
                                    <input
                                        type="number"
                                        placeholder="10000"
                                        className="w-full mt-1 bg-background/80 border border-border rounded px-2 py-1 text-sm"
                                        value={(selectedNode.data as any).delay || 5}
                                        onChange={(e) => onUpdateNodeData(selectedNode.id, { delay: parseInt(e.target.value) })}
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-1">{t('delayHint')}</p>
                                </div>
                            )}

                            {/* Sound Node Config */}
                            {selectedNode.type === 'sound' && (
                                <div>
                                    <label className="text-xs text-muted-foreground">{t('soundType')}</label>
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
                                        <label className="text-xs text-muted-foreground">{t('startTime')}</label>
                                        <input
                                            type="time"
                                            className="w-full mt-1 bg-background/80 border border-border rounded px-2 py-1 text-sm"
                                            value={(selectedNode.data as any).startTime || '09:00'}
                                            onChange={(e) => onUpdateNodeData(selectedNode.id, { startTime: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground">{t('endTime')}</label>
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
                                        <label className="text-xs text-muted-foreground">{t('thresholdAttempt')}</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full mt-1 bg-background/80 border border-border rounded px-2 py-1 text-sm"
                                            value={(selectedNode.data as any).threshold || 3}
                                            onChange={(e) => onUpdateNodeData(selectedNode.id, { threshold: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground">{t('timeWindowSec')}</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full mt-1 bg-background/80 border border-border rounded px-2 py-1 text-sm"
                                            value={(selectedNode.data as any).timeWindow || 60}
                                            onChange={(e) => onUpdateNodeData(selectedNode.id, { timeWindow: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                                        {t('currentState')}: {selectedNode.data.currentCount || 0} / {selectedNode.data.threshold || 3}
                                    </div>
                                </>
                            )}

                            {/* Connection Status for Monitoring and Action */}
                            {(selectedNode.type === 'monitoring' || selectedNode.type === 'action') && (
                                <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
                                    {selectedNode.data.connectedDevice ? (
                                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                            <CheckCircleIcon className="w-4 h-4" />
                                            <span>{t('connectedTo')}: {selectedNode.data.connectedDevice}</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                                            <ExclamationTriangleIcon className="w-4 h-4" />
                                            <span>{t('notConnected')}</span>
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
                        <span className="bg-card px-2 text-muted-foreground">{t('devices')}</span>
                    </div>
                </div>

                {/* Dispositivos disponibles */}
                <div className="space-y-2 flex-1 min-h-0 flex flex-col">
                    <label className="text-sm font-medium">{t('availableDevices')}</label>
                    <div className="space-y-1 overflow-y-auto flex-1 pr-2">
                        {devices.length === 0 ? (
                            <p className="text-xs text-muted-foreground">{t('noAvailableDevices')}</p>
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
                                        <div className="text-[10px] text-muted-foreground mt-1">{t('dragToAdd')}</div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                    <label className="text-sm font-medium">{t('savedTopologies')}</label>
                    <div className="flex gap-2">
                        <select
                            className="flex-1 bg-background/80 border border-border rounded px-3 py-2 text-sm"
                            value={selectedTopology || ""}
                            onChange={(e) => {
                                const id = parseInt(e.target.value);
                                if (!isNaN(id)) onLoad(id);
                            }}
                        >
                            <option value="">{t('selectTopology')}</option>
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
                        onClick={onNew}
                        className="w-full px-4 py-2 bg-background/50 hover:bg-accent border border-border rounded text-sm font-medium transition-colors"
                    >
                        {t('newTopology')}
                    </button>

                    <button
                        onClick={handleSaveClick}
                        className="w-full px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-sm font-medium transition-colors"
                    >
                        {t('saveTopology')}
                    </button>
                </div>

                {/* Dialog para guardar */}
                {showSaveDialog && typeof document !== 'undefined' && createPortal(
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
                        <div className="bg-card border border-border rounded-lg p-6 w-96 space-y-4 shadow-xl">
                            <h3 className="text-lg font-semibold">{t('saveTopologyTitle')}</h3>
                            <input
                                type="text"
                                placeholder={t('topologyNamePlaceholder')}
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
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={handleSaveConfirm}
                                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-sm"
                                >
                                    {t('saveTopology')}
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
                            <h3 className="text-lg font-semibold">{t('renameTopologyTitle')}</h3>
                            <input
                                type="text"
                                placeholder={t('topologyNamePlaceholder')}
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
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={handleRenameConfirm}
                                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded text-sm"
                                >
                                    {t('rename')}
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
                            <h3 className="text-lg font-semibold text-destructive">{t('deleteTopologyTitle')}</h3>
                            <p className="text-sm text-muted-foreground">
                                {t('deleteConfirmMsg')}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowDeleteDialog(false)}
                                    className="flex-1 px-4 py-2 bg-background hover:bg-accent border border-border rounded text-sm"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded text-sm"
                                >
                                    {t('delete')}
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
