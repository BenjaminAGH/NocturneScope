"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    ReactFlow,
    Node,
    Edge,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    ReactFlowProvider,
    useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import DeviceNode, { DeviceNodeData } from "@/components/topology/DeviceNode";
import RouterNode, { RouterNodeData } from "@/components/topology/RouterNode";
import TopologyControls from "@/components/topology/TopologyControls";
import { getDevices, getLastStats, getRecentAlerts } from "@/lib/api/api";
import {
    saveTopology,
    getTopologies,
    getTopology,
    updateTopology,
    type Topology,
    type TopologyData,
} from "@/lib/api/topology";
import MonitoringNode, { MonitoringNodeData } from "@/components/topology/MonitoringNode";
import ActionNode, { ActionNodeData } from "@/components/topology/ActionNode";
import EmailNode, { EmailNodeData } from "@/components/topology/EmailNode";

const nodeTypes = {
    device: DeviceNode,
    router: RouterNode,
    monitoring: MonitoringNode,
    action: ActionNode,
    email: EmailNode,
};

function TopologyEditor() {
    const router = useRouter();
    const { fitView } = useReactFlow();

    const [jwt, setJwt] = useState<string | null>(null);
    const [devices, setDevices] = useState<string[]>([]);
    const [topologies, setTopologies] = useState<Topology[]>([]);
    const [selectedTopology, setSelectedTopology] = useState<number | null>(null);
    const [currentTopologyName, setCurrentTopologyName] = useState<string>("");
    const [autoDetectGateways, setAutoDetectGateways] = useState<boolean>(true);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const [nodes, setNodes, onNodesChange] = useNodesState<Node<DeviceNodeData | RouterNodeData | MonitoringNodeData | ActionNodeData | EmailNodeData>>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

    const nodeIdCounter = useRef(0);


    // Autenticación
    useEffect(() => {
        const t = localStorage.getItem("jwt");
        if (!t) {
            router.replace("/auth/login");
            return;
        }
        setJwt(t);
    }, [router]);

    // Cargar dispositivos y topologías
    useEffect(() => {
        if (!jwt) return;

        const loadData = async () => {
            try {
                const [devs, topos] = await Promise.all([
                    getDevices(jwt),
                    getTopologies(jwt),
                ]);
                setDevices(devs);
                setTopologies(topos);
            } catch (e: any) {
                console.error("Error cargando datos:", e);
            }
        };

        loadData();
    }, [jwt]);

    const nodesRef = useRef(nodes);
    const edgesRef = useRef(edges);

    // Mantener las referencias actualizadas
    useEffect(() => {
        nodesRef.current = nodes;
    }, [nodes]);

    useEffect(() => {
        edgesRef.current = edges;
    }, [edges]);

    // Actualizar estado de dispositivos en tiempo real y detectar gateways
    useEffect(() => {
        if (!jwt) return;

        const updateDeviceStatus = async () => {
            // Usamos nodesRef para saber QUÉ dispositivos consultar
            const currentNodesSnapshot = nodesRef.current;
            if (currentNodesSnapshot.length === 0) return;

            // 1. Fase de Recolección de Datos (Async)
            const deviceUpdates = new Map<string, { status: 'online' | 'offline', ip?: string, gateway?: string }>();

            await Promise.all(
                currentNodesSnapshot.map(async (node) => {
                    if (node.type !== "device") return;
                    const deviceData = node.data as DeviceNodeData;
                    try {
                        const stats = await getLastStats(jwt, deviceData.deviceName);
                        deviceUpdates.set(node.id, {
                            status: "online",
                            ip: stats.ip ? String(stats.ip) : undefined,
                            gateway: (stats.gateway && typeof stats.gateway === 'string') ? stats.gateway : undefined
                        });
                    } catch {
                        deviceUpdates.set(node.id, { status: "offline" });
                    }
                })
            );

            // 2. Fase de Actualización (Síncrona y Atómica)
            setNodes((prevNodes) => {
                const gatewaysFound = new Map<string, { ip: string; devices: string[] }>();
                let nodesChanged = false;

                // A. Actualizar nodos existentes
                const nextNodes = prevNodes.map(node => {
                    // Actualizar JWT en monitoreo
                    if (node.type === "monitoring") {
                        if ((node.data as MonitoringNodeData).jwt !== jwt) {
                            return { ...node, data: { ...node.data, jwt } };
                        }
                        return node;
                    }

                    // Actualizar Dispositivos
                    if (node.type === "device" && deviceUpdates.has(node.id)) {
                        const update = deviceUpdates.get(node.id)!;
                        const currentData = node.data as DeviceNodeData;

                        // Recolectar info de gateway
                        if (update.gateway) {
                            if (!gatewaysFound.has(update.gateway)) {
                                gatewaysFound.set(update.gateway, { ip: update.gateway, devices: [] });
                            }
                            gatewaysFound.get(update.gateway)?.devices.push(node.id);
                        }

                        // Verificar cambios
                        if (currentData.status !== update.status || (update.ip && currentData.ip !== update.ip)) {
                            return {
                                ...node,
                                data: {
                                    ...currentData,
                                    status: update.status,
                                    ip: update.ip || currentData.ip,
                                }
                            };
                        }
                    }
                    return node;
                });

                // B. Lógica de Gateways (Router Nodes)
                if (autoDetectGateways && gatewaysFound.size > 0) {
                    const finalNodes = [...nextNodes];

                    gatewaysFound.forEach((gwInfo, gwIP) => {
                        let routerNodeId = finalNodes.find(
                            n => n.type === 'router' && (n.data as RouterNodeData).gatewayIP === gwIP
                        )?.id;

                        if (!routerNodeId) {
                            routerNodeId = `router-${gwIP.replace(/\./g, '-')}`;
                            const firstDevice = finalNodes.find(n => n.id === gwInfo.devices[0]);
                            const position = firstDevice ? { x: firstDevice.position.x, y: firstDevice.position.y - 150 } : { x: Math.random() * 400, y: Math.random() * 400 };

                            finalNodes.push({
                                id: routerNodeId,
                                type: 'router',
                                position,
                                data: {
                                    gatewayIP: gwIP,
                                    label: `Router ${gwIP}`,
                                    deviceCount: gwInfo.devices.length
                                } as RouterNodeData
                            });
                            nodesChanged = true;
                        } else {
                            const idx = finalNodes.findIndex(n => n.id === routerNodeId);
                            if (idx !== -1) {
                                const rNode = finalNodes[idx];
                                const rData = rNode.data as RouterNodeData;
                                if (rData.deviceCount !== gwInfo.devices.length) {
                                    finalNodes[idx] = {
                                        ...rNode,
                                        data: { ...rData, deviceCount: gwInfo.devices.length }
                                    };
                                    nodesChanged = true;
                                }
                            }
                        }
                    });

                    if (nodesChanged) return finalNodes;
                }

                return nextNodes;
            });

            // 3. Actualizar Edges para Gateways
            if (autoDetectGateways) {
                const gatewaysFound = new Map<string, { ip: string; devices: string[] }>();
                currentNodesSnapshot.forEach(node => {
                    if (node.type === 'device' && deviceUpdates.has(node.id)) {
                        const update = deviceUpdates.get(node.id)!;
                        if (update.gateway) {
                            if (!gatewaysFound.has(update.gateway)) {
                                gatewaysFound.set(update.gateway, { ip: update.gateway, devices: [] });
                            }
                            gatewaysFound.get(update.gateway)?.devices.push(node.id);
                        }
                    }
                });

                if (gatewaysFound.size > 0) {
                    setEdges(prevEdges => {
                        const newEdges = [...prevEdges];
                        let edgesChanged = false;

                        gatewaysFound.forEach((gwInfo, gwIP) => {
                            const routerNodeId = `router-${gwIP.replace(/\./g, '-')}`;
                            gwInfo.devices.forEach(deviceId => {
                                const edgeId = `edge-${routerNodeId}-${deviceId}`;
                                if (!newEdges.find(e => e.id === edgeId)) {
                                    newEdges.push({
                                        id: edgeId,
                                        source: routerNodeId,
                                        target: deviceId,
                                        type: 'default',
                                        animated: true,
                                    });
                                    edgesChanged = true;
                                }
                            });
                        });

                        return edgesChanged ? newEdges : prevEdges;
                    });
                }
            }
        };

        updateDeviceStatus();
        const interval = setInterval(updateDeviceStatus, 5000);
        return () => clearInterval(interval);
    }, [jwt, setNodes, setEdges, autoDetectGateways]);

    // Polling de alertas recientes para confirmación visual
    useEffect(() => {
        if (!jwt) return;

        const checkAlerts = async () => {
            try {
                const recentAlerts = await getRecentAlerts(jwt);

                if (recentAlerts.length > 0) {
                    setNodes((nds) => nds.map((n) => {
                        // Si es un nodo de acción y está en la lista de alertas recientes
                        if (n.type === 'action' && recentAlerts.includes(n.id)) {
                            return { ...n, data: { ...n.data, isActive: true } };
                        }

                        // Si es un nodo de email conectado a una acción activa
                        if (n.type === 'email') {
                            // Buscar si hay un edge que conecte una acción activa a este email
                            const isConnectedToActiveAction = edgesRef.current.some(e =>
                                e.target === n.id && recentAlerts.includes(e.source)
                            );
                            if (isConnectedToActiveAction) {
                                return { ...n, data: { ...n.data, isActive: true } };
                            }
                        }

                        // Resetear estado si no está activo (opcional, o dejar que expire)
                        // Por ahora reseteamos si no está en la lista, asumiendo que la lista
                        // trae todo lo "reciente" (últimos 10s).
                        if (n.type === 'action' || n.type === 'email') {
                            // Para email es más complejo resetear sin saber si la acción sigue activa,
                            // pero si la acción ya no está en recentAlerts, el email tampoco debería.
                            if (n.type === 'action' && !recentAlerts.includes(n.id)) {
                                return { ...n, data: { ...n.data, isActive: false } };
                            }
                            if (n.type === 'email') {
                                const isConnectedToActiveAction = edgesRef.current.some(e =>
                                    e.target === n.id && recentAlerts.includes(e.source)
                                );
                                if (!isConnectedToActiveAction) {
                                    return { ...n, data: { ...n.data, isActive: false } };
                                }
                            }
                        }

                        return n;
                    }));
                } else {
                    // Si no hay alertas recientes, desactivar todo
                    setNodes((nds) => nds.map((n) => {
                        if ((n.type === 'action' || n.type === 'email') && n.data.isActive) {
                            return { ...n, data: { ...n.data, isActive: false } };
                        }
                        return n;
                    }));
                }
            } catch (e) {
                console.error("Error checking alerts:", e);
            }
        };

        const interval = setInterval(checkAlerts, 3000); // Poll cada 3 segundos
        return () => clearInterval(interval);
    }, [jwt, setNodes]);

    const onConnect = useCallback(
        (params: Connection) => {
            setEdges((eds) => addEdge(params, eds));

            // Verificar si conectamos un dispositivo a un nodo de monitoreo o accion
            const sourceNode = nodesRef.current.find(n => n.id === params.source);
            const targetNode = nodesRef.current.find(n => n.id === params.target);

            if (sourceNode && targetNode) {
                // Monitoring Node Logic
                let monitoringNodeId: string | null = null;
                let deviceName: string | null = null;

                if (sourceNode.type === 'device' && targetNode.type === 'monitoring') {
                    monitoringNodeId = targetNode.id;
                    deviceName = (sourceNode.data as DeviceNodeData).deviceName;
                } else if (sourceNode.type === 'monitoring' && targetNode.type === 'device') {
                    monitoringNodeId = sourceNode.id;
                    deviceName = (targetNode.data as DeviceNodeData).deviceName;
                }

                if (monitoringNodeId && deviceName) {
                    setNodes(nds => nds.map(n => {
                        if (n.id === monitoringNodeId) {
                            return {
                                ...n,
                                data: { ...n.data, connectedDevice: deviceName }
                            };
                        }
                        return n;
                    }));
                }

                // Action Node Logic
                let actionNodeId: string | null = null;
                let deviceNameForAction: string | null = null;

                if (sourceNode.type === 'device' && targetNode.type === 'action') {
                    actionNodeId = targetNode.id;
                    deviceNameForAction = (sourceNode.data as DeviceNodeData).deviceName;
                }

                if (actionNodeId && deviceNameForAction) {
                    setNodes(nds => nds.map(n => {
                        if (n.id === actionNodeId) {
                            return {
                                ...n,
                                data: { ...n.data, connectedDevice: deviceNameForAction }
                            };
                        }
                        return n;
                    }));
                }

                // Email Node Logic (Action -> Email)
                if (sourceNode.type === 'action' && targetNode.type === 'email') {
                    // Find device connected to action
                    // Note: edgesRef might not have the new edge yet, but we need the edge CONNECTED TO the action (sourceNode)
                    const deviceEdge = edgesRef.current.find(e => e.target === sourceNode.id);
                    if (deviceEdge) {
                        const deviceNode = nodesRef.current.find(n => n.id === deviceEdge.source);
                        if (deviceNode && deviceNode.type === 'device') {
                            const deviceName = (deviceNode.data as DeviceNodeData).deviceName;
                            setNodes(nds => nds.map(n => {
                                if (n.id === targetNode.id) {
                                    return {
                                        ...n,
                                        data: { ...n.data, connectedDevice: deviceName }
                                    };
                                }
                                return n;
                            }));
                        }
                    }
                }
            }
        },
        [setEdges, setNodes]
    );

    // Manejar desconexión (borrado de edges)
    const onEdgesDelete = useCallback((deletedEdges: Edge[]) => {
        deletedEdges.forEach(edge => {
            const sourceNode = nodesRef.current.find(n => n.id === edge.source);
            const targetNode = nodesRef.current.find(n => n.id === edge.target);

            if (sourceNode && targetNode) {
                if (sourceNode.type === 'monitoring' || targetNode.type === 'monitoring') {
                    const monNodeId = sourceNode.type === 'monitoring' ? sourceNode.id : targetNode.id;
                    setNodes(nds => nds.map(n => {
                        if (n.id === monNodeId) {
                            return {
                                ...n,
                                data: { ...n.data, connectedDevice: undefined }
                            };
                        }
                        return n;
                    }));
                }

                if (targetNode.type === 'action') {
                    setNodes(nds => nds.map(n => {
                        if (n.id === targetNode.id) {
                            return {
                                ...n,
                                data: { ...n.data, connectedDevice: undefined }
                            };
                        }
                        return n;
                    }));
                }
            }
        });
    }, [setNodes]);

    const handleAddDevice = useCallback(
        (deviceName: string) => {
            const id = `node-${++nodeIdCounter.current}`;
            const newNode: Node<DeviceNodeData> = {
                id,
                type: "device",
                position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
                data: {
                    deviceName,
                    label: deviceName,
                    status: "unknown",
                },
            };
            setNodes((nds) => [...nds, newNode]);
        },
        [setNodes]
    );

    const handleAddMonitoringNode = useCallback(() => {
        const id = `mon-${++nodeIdCounter.current}`;
        const newNode: Node<MonitoringNodeData> = {
            id,
            type: "monitoring",
            position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
            data: {
                jwt: jwt || undefined,
                metric: 'cpu',
                label: 'Monitoring',
            },
        };
        setNodes((nds) => [...nds, newNode]);
    }, [setNodes, jwt]);

    const handleAddActionNode = useCallback(() => {
        const id = `act-${++nodeIdCounter.current}`;
        const newNode: Node<ActionNodeData> = {
            id,
            type: "action",
            position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
            data: {
                metric: 'cpu',
                operator: '>=',
                threshold: 70,
            },
        };
        setNodes((nds) => [...nds, newNode]);
    }, [setNodes]);

    const handleAddEmailNode = useCallback(() => {
        const id = `email-${++nodeIdCounter.current}`;
        const newNode: Node<EmailNodeData> = {
            id,
            type: "email",
            position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
            data: {
                subject: '',
                body: '',
            },
        };
        setNodes((nds) => [...nds, newNode]);
    }, [setNodes]);

    const handleUpdateNodeData = useCallback((id: string, data: any) => {
        setNodes(nds => nds.map(n => {
            if (n.id === id) {
                return { ...n, data: { ...n.data, ...data } };
            }
            return n;
        }));
    }, [setNodes]);

    const handleSave = useCallback(
        async (name: string, silent: boolean = false) => {
            if (!jwt) return;

            const data: TopologyData = {
                nodes: nodes.map((n) => ({
                    id: n.id,
                    type: n.type,
                    position: n.position,
                    data: {
                        ...n.data,
                        // Explicitly ensure these are saved if present
                        deviceName: (n.data as any).deviceName,
                        label: (n.data as any).label,
                        metric: (n.data as any).metric,
                        operator: (n.data as any).operator,
                        threshold: (n.data as any).threshold,
                        to: (n.data as any).to,
                        subject: (n.data as any).subject,
                        body: (n.data as any).body,
                        cooldown: (n.data as any).cooldown,
                    },
                })),
                edges: edges.map((e) => ({
                    id: e.id,
                    source: e.source,
                    target: e.target,
                    type: e.type,
                })),
            };

            try {
                if (selectedTopology) {
                    // Actualizar existente
                    await updateTopology(jwt, selectedTopology, name, data);
                } else {
                    // Crear nueva
                    const saved = await saveTopology(jwt, name, data);
                    setSelectedTopology(saved.ID);
                }

                setCurrentTopologyName(name);
                // Recargar lista de topologías
                const topos = await getTopologies(jwt);
                setTopologies(topos);

                if (!silent) {
                    alert("Topología guardada correctamente");
                } else {
                    console.log("Auto-saved topology");
                }
            } catch (e: any) {
                console.error("Error guardando topología:", e);
                if (!silent) alert("Error guardando topología: " + e.message);
            }
        },
        [jwt, nodes, edges, selectedTopology]
    );

    const handleLoad = useCallback(
        async (id: number) => {
            if (!jwt) return;

            try {
                const topo = await getTopology(jwt, id);
                const data: TopologyData = JSON.parse(topo.Data);

                // Reconstruir connectedDevice basado en edges
                const edges = data.edges;
                const nodesWithData = data.nodes.map((n) => {
                    let extraData = {};
                    if (n.type === 'monitoring') {
                        // Buscar edge conectado
                        const edge = edges.find(e => e.source === n.id || e.target === n.id);
                        if (edge) {
                            const otherId = edge.source === n.id ? edge.target : edge.source;
                            const otherNode = data.nodes.find(on => on.id === otherId);
                            if (otherNode && otherNode.type === 'device') {
                                extraData = { connectedDevice: (otherNode.data as any).deviceName };
                            }
                        }
                        extraData = { ...extraData, jwt }; // Inyectar JWT
                    }

                    return {
                        ...n,
                        data: {
                            ...n.data,
                            ...extraData,
                            status: "unknown" as const,
                        },
                    };
                });

                setNodes(nodesWithData);
                setEdges(data.edges);
                setSelectedTopology(id);
                setCurrentTopologyName(topo.Name);

                // Ajustar vista después de cargar
                setTimeout(() => fitView(), 100);
            } catch (e: any) {
                console.error("Error cargando topología:", e);
                alert("Error cargando topología: " + e.message);
            }
        },
        [jwt, setNodes, setEdges, fitView]
    );

    // Auto-save effect
    useEffect(() => {
        if (!selectedTopology || !currentTopologyName) return;

        const timer = setTimeout(() => {
            handleSave(currentTopologyName, true);
        }, 2000);

        return () => clearTimeout(timer);
    }, [nodes, edges, selectedTopology, currentTopologyName, handleSave]);

    const handleNew = useCallback(() => {
        setNodes([]);
        setEdges([]);
        setSelectedTopology(null);
        setCurrentTopologyName("");
    }, [setNodes, setEdges]);

    const handleExport = useCallback(() => {
        const data: TopologyData = {
            nodes: nodes.map((n) => ({
                id: n.id,
                type: n.type,
                position: n.position,
                data: n.data,
            })),
            edges: edges.map((e) => ({
                id: e.id,
                source: e.source,
                target: e.target,
                type: e.type,
            })),
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `topology-${currentTopologyName || "export"}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }, [nodes, edges, currentTopologyName]);

    const selectedNode = nodes.find(n => n.id === selectedNodeId);

    if (!jwt) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p>Cargando...</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-0 flex flex-col bg-background" style={{ paddingTop: 'var(--navbar-height)' }}>
            <div className="flex-1 relative w-full h-full">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onEdgesDelete={onEdgesDelete}
                    onNodeClick={(_, node) => setSelectedNodeId(node.id)}
                    onPaneClick={() => setSelectedNodeId(null)}
                    nodeTypes={nodeTypes}
                    fitView
                    className="bg-background"
                >
                    <Controls />
                    <Background />
                </ReactFlow>

                {/* Header */}
                <div className="absolute top-4 left-4 bg-card border border-border rounded-lg px-4 py-2 shadow-lg z-10">
                    <h1 className="text-xl font-semibold">Topología de Red</h1>
                    {currentTopologyName && (
                        <p className="text-sm text-muted-foreground">{currentTopologyName}</p>
                    )}
                </div>

                <TopologyControls
                    devices={devices}
                    topologies={topologies.map((t) => ({ ID: t.ID, Name: t.Name }))}
                    selectedTopology={selectedTopology}
                    onAddDevice={handleAddDevice}
                    onSave={handleSave}
                    onLoad={handleLoad}
                    onNew={handleNew}
                    onExport={handleExport}
                    onAddMonitoringNode={handleAddMonitoringNode}
                    onAddActionNode={handleAddActionNode}
                    onAddEmailNode={handleAddEmailNode}
                    selectedNode={selectedNode}
                    onUpdateNodeData={handleUpdateNodeData}
                />
            </div>
        </div>
    );
}

export default function TopologyPage() {
    return (
        <ReactFlowProvider>
            <TopologyEditor />
        </ReactFlowProvider>
    );
}
