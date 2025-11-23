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
import NotificationNode, { NotificationNodeData } from "@/components/topology/NotificationNode";
import { useNotification } from "@/context/NotificationContext";

const nodeTypes = {
    device: DeviceNode,
    router: RouterNode,
    monitoring: MonitoringNode,
    action: ActionNode,
    email: EmailNode,
    notification: NotificationNode,
};

function TopologyEditor() {
    const router = useRouter();
    const { fitView, screenToFlowPosition } = useReactFlow();
    const { notify } = useNotification();

    const [jwt, setJwt] = useState<string | null>(null);
    const [devices, setDevices] = useState<string[]>([]);
    const [topologies, setTopologies] = useState<Topology[]>([]);
    const [selectedTopology, setSelectedTopology] = useState<number | null>(null);
    const [currentTopologyName, setCurrentTopologyName] = useState("");

    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const edgesRef = useRef<Edge[]>([]);

    // Mantener edgesRef sincronizado
    useEffect(() => {
        edgesRef.current = edges;
    }, [edges]);

    // Persist draft to localStorage
    useEffect(() => {
        if (nodes.length > 0 || edges.length > 0) {
            const draft = {
                nodes,
                edges,
                selectedTopology,
                currentTopologyName,
                timestamp: Date.now()
            };
            localStorage.setItem("topology_draft", JSON.stringify(draft));
        }
    }, [nodes, edges, selectedTopology, currentTopologyName]);

    const [autoDetectGateways, setAutoDetectGateways] = useState(true);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const nodeIdCounter = useRef(0);

    useEffect(() => {
        const token = localStorage.getItem("jwt");
        if (!token) {
            router.push("/auth/login");
            return;
        }
        setJwt(token);

        getDevices(token).then(setDevices).catch(console.error);
        getTopologies(token).then(setTopologies).catch(console.error);
    }, [router]);

    // Polling de estados de dispositivos y detección de gateways
    useEffect(() => {
        if (!jwt) return;

        const updateDeviceStatus = async () => {
            try {
                const deviceList = await getDevices(jwt);
                const statsPromises = deviceList.map(async (device) => {
                    try {
                        const data = await getLastStats(jwt, device);
                        return { device, data };
                    } catch (e) {
                        console.error(`Error fetching stats for ${device}:`, e);
                        return null;
                    }
                });

                const results = await Promise.all(statsPromises);
                const stats: Record<string, any> = {};
                results.forEach(r => {
                    if (r && r.data) {
                        stats[r.device] = r.data;
                    }
                });

                const deviceUpdates = new Map<string, { status: "online" | "offline" | "unknown"; ip?: string; gateway?: string }>();

                // Mapear estados
                Object.entries(stats).forEach(([device, data]: [string, any]) => {
                    const now = Date.now() / 1000;
                    const lastSeen = data.timestamp ? new Date(data.timestamp).getTime() / 1000 : 0;
                    // El timestamp viene como string ISO8601 desde Go/JSON
                    // Ojo: si data.timestamp ya es un objeto Date o número, ajustar.
                    // Asumimos string ISO por defecto en JSON.

                    // Mejor validación del timestamp
                    let timeDiff = 999999;
                    if (data.timestamp) {
                        const ts = new Date(data.timestamp).getTime() / 1000;
                        timeDiff = now - ts;
                    }

                    const isActive = timeDiff < 300; // 5 minutos
                    deviceUpdates.set(device, {
                        status: isActive ? "online" : "offline",
                        ip: data.ip,
                        gateway: data.gateway
                    });
                });


                // Actualizar nodos
                setNodes(currentNodes => {
                    const nextNodes = [...currentNodes];
                    const gatewaysFound = new Map<string, { ip: string; devices: string[] }>();
                    let nodesChanged = false;
                    const currentNodesSnapshot = [...currentNodes]; // Para uso en edges

                    // A. Actualizar Dispositivos y Recolectar Gateways
                    nextNodes.forEach((node, index) => {
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
                                nextNodes[index] = {
                                    ...node,
                                    data: {
                                        ...currentData,
                                        status: update.status,
                                        ip: update.ip || currentData.ip,
                                    }
                                };
                                nodesChanged = true;
                            }
                        }
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

                    return nodesChanged ? nextNodes : currentNodes;
                });

                // 3. Actualizar Edges para Gateways
                if (autoDetectGateways) {
                    setEdges(currentEdges => {
                        const nextEdges = [...currentEdges];
                        let edgesChanged = false;
                        const existingEdgeIds = new Set(currentEdges.map(e => e.id));

                        deviceUpdates.forEach((update, deviceId) => {
                            if (update.gateway) {
                                const routerId = `router-${update.gateway.replace(/\./g, '-')}`;
                                const edgeId = `edge-${deviceId}-${routerId}`;

                                if (!existingEdgeIds.has(edgeId)) {
                                    nextEdges.push({
                                        id: edgeId,
                                        source: routerId,
                                        target: deviceId,
                                        type: 'default',
                                        animated: true,
                                    });
                                    edgesChanged = true;
                                }
                            }
                        });

                        return edgesChanged ? nextEdges : currentEdges;
                    });
                }

                // 4. Evaluar Reglas (Client-Side)
                setNodes(currentNodes => {
                    const nextNodes = [...currentNodes];
                    let nodesChanged = false;
                    const activeActionIds = new Set<string>();

                    // A. Evaluar Action Nodes
                    nextNodes.forEach((node, index) => {
                        if (node.type === 'action') {
                            const data = node.data as any;
                            const device = data.connectedDevice;
                            if (device && stats[device]) {
                                const metricValue = stats[device][data.metric];
                                const threshold = data.threshold;
                                const operator = data.operator;

                                let isActive = false;
                                if (metricValue !== undefined) {
                                    switch (operator) {
                                        case '>': isActive = metricValue > threshold; break;
                                        case '>=': isActive = metricValue >= threshold; break;
                                        case '<': isActive = metricValue < threshold; break;
                                        case '<=': isActive = metricValue <= threshold; break;
                                        case '==': isActive = metricValue == threshold; break;
                                    }
                                }

                                if (isActive) activeActionIds.add(node.id);

                                if (data.isActive !== isActive) {
                                    nextNodes[index] = { ...node, data: { ...data, isActive } };
                                    nodesChanged = true;
                                }
                            }
                        }
                    });

                    // B. Propagar a Email/Notification Nodes
                    nextNodes.forEach((node, index) => {
                        if (node.type === 'email' || node.type === 'notification') {
                            const isConnectedToActiveAction = edgesRef.current.some(e =>
                                e.target === node.id && activeActionIds.has(e.source)
                            );

                            const data = node.data as any;
                            const wasActive = data.isActive;

                            if (data.isActive !== isConnectedToActiveAction) {
                                nextNodes[index] = { ...node, data: { ...data, isActive: isConnectedToActiveAction } };
                                nodesChanged = true;

                                // Trigger email sending if becoming active
                                if (isConnectedToActiveAction && !wasActive && node.type === 'email') {
                                    const emailData = data as EmailNodeData;
                                    if (emailData.to && jwt) {
                                        // Send email asynchronously
                                        (async () => {
                                            try {
                                                const { sendCustomEmail } = await import("@/lib/api/api");
                                                await sendCustomEmail(
                                                    jwt,
                                                    emailData.to!,
                                                    emailData.subject || "Alert from NocturneScope",
                                                    emailData.body || "An alert has been triggered."
                                                );
                                                console.log(`Email sent to ${emailData.to}`);
                                            } catch (error) {
                                                console.error("Error sending email:", error);
                                            }
                                        })();
                                    }
                                }

                                // Trigger notification logic if becoming active
                                if (isConnectedToActiveAction && !wasActive && node.type === 'notification') {
                                    const message = (data as NotificationNodeData).message || "Alerta detectada";
                                    notify(message, "warning");
                                }
                            }
                        }
                    });

                    return nodesChanged ? nextNodes : currentNodes;
                });

            } catch (error) {
                console.error("Error updating device status:", error);
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
                            const isConnectedToActiveAction = edgesRef.current.some(e =>
                                e.target === n.id && recentAlerts.includes(e.source)
                            );

                            if (isConnectedToActiveAction) {
                                return { ...n, data: { ...n.data, isActive: true } };
                            } else {
                                return { ...n, data: { ...n.data, isActive: false } };
                            }
                        }

                        // Notification Node Logic
                        if (n.type === 'notification') {
                            const isConnectedToActiveAction = edgesRef.current.some(e =>
                                e.target === n.id && recentAlerts.includes(e.source)
                            );

                            if (isConnectedToActiveAction) {
                                // Trigger notification if not already active (simple debounce via state)
                                if (!n.data.isActive) {
                                    const message = (n.data as NotificationNodeData).message || "Alerta detectada";
                                    notify(message, "warning");
                                }
                                return { ...n, data: { ...n.data, isActive: true } };
                            } else {
                                return { ...n, data: { ...n.data, isActive: false } };
                            }
                        }

                        return n;
                    }));
                } else {
                    // Reset active state if no alerts
                    setNodes((nds) => nds.map((n) => {
                        if ((n.type === 'action' || n.type === 'email' || n.type === 'notification') && n.data.isActive) {
                            return { ...n, data: { ...n.data, isActive: false } };
                        }
                        return n;
                    }));
                }
            } catch (e) {
                console.error("Error checking alerts:", e);
            }
        };

        const interval = setInterval(checkAlerts, 3000);
        return () => clearInterval(interval);
    }, [jwt, setNodes, notify]);



    const onEdgesDelete = useCallback(
        (deleted: Edge[]) => {
            setEdges((eds) => eds.filter((e) => !deleted.some((d) => d.id === e.id)));
        },
        [setEdges]
    );

    const handleAddDevice = useCallback((deviceName: string) => {
        const id = deviceName;
        // Verificar si ya existe
        setNodes((nds) => {
            if (nds.find(n => n.id === id)) return nds;
            const newNode: Node<DeviceNodeData> = {
                id,
                type: "device",
                position: { x: Math.random() * 400, y: Math.random() * 400 },
                data: {
                    deviceName,
                    label: deviceName,
                    status: "unknown",
                },
            };
            return [...nds, newNode];
        });
    }, [setNodes]);

    const onConnect = useCallback(
        (params: Connection) => {
            setEdges((eds) => addEdge(params, eds));

            // Lógica para conectar nodos de monitoreo a dispositivos
            const { source, target } = params;
            if (!source || !target) return;

            setNodes((nds) => nds.map((node) => {
                // Caso 1: Target es Monitoring o Action
                if (node.id === target && (node.type === 'monitoring' || node.type === 'action')) {
                    const sourceNode = nds.find(n => n.id === source);
                    if (sourceNode && sourceNode.type === 'device') {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                connectedDevice: sourceNode.data.deviceName,
                                jwt: jwt
                            }
                        };
                    }
                }
                // Caso 2: Source es Monitoring o Action (conexión inversa)
                if (node.id === source && (node.type === 'monitoring' || node.type === 'action')) {
                    const targetNode = nds.find(n => n.id === target);
                    if (targetNode && targetNode.type === 'device') {
                        return {
                            ...node,
                            data: {
                                ...node.data,
                                connectedDevice: targetNode.data.deviceName,
                                jwt: jwt
                            }
                        };
                    }
                }
                return node;
            }));
        },
        [setEdges, setNodes, jwt],
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
    }, [jwt, setNodes]);

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

    const handleAddNotificationNode = useCallback(() => {
        const id = `notif-${++nodeIdCounter.current}`;
        const newNode: Node<NotificationNodeData> = {
            id,
            type: "notification",
            position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
            data: {
                message: '',
            },
        };
        setNodes((nds) => [...nds, newNode]);
    }, [setNodes]);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');

            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            if (type === 'monitoring') {
                const id = `mon-${++nodeIdCounter.current}`;
                const newNode: Node<MonitoringNodeData> = {
                    id,
                    type: "monitoring",
                    position,
                    data: {
                        jwt: jwt || undefined,
                        metric: 'cpu',
                        label: 'Monitoring',
                    },
                };
                setNodes((nds) => [...nds, newNode]);
            } else if (type === 'action') {
                const id = `act-${++nodeIdCounter.current}`;
                const newNode: Node<ActionNodeData> = {
                    id,
                    type: "action",
                    position,
                    data: {
                        metric: 'cpu',
                        operator: '>=',
                        threshold: 70,
                    },
                };
                setNodes((nds) => [...nds, newNode]);
            } else if (type === 'email') {
                const id = `email-${++nodeIdCounter.current}`;
                const newNode: Node<EmailNodeData> = {
                    id,
                    type: "email",
                    position,
                    data: {
                        subject: '',
                        body: '',
                    },
                };
                setNodes((nds) => [...nds, newNode]);
            } else if (type === 'notification') {
                const id = `notif-${++nodeIdCounter.current}`;
                const newNode: Node<NotificationNodeData> = {
                    id,
                    type: "notification",
                    position,
                    data: {
                        message: '',
                    },
                };
                setNodes((nds) => [...nds, newNode]);
            } else if (type === 'device') {
                const deviceName = event.dataTransfer.getData('device/name');
                if (deviceName) {
                    // Usar el nombre del dispositivo como ID para que coincida con deviceUpdates
                    const id = deviceName;
                    const newNode: Node<DeviceNodeData> = {
                        id,
                        type: "device",
                        position,
                        data: {
                            deviceName,
                            label: deviceName,
                            status: "unknown",
                        },
                    };
                    setNodes((nds) => [...nds, newNode]);
                }
            }
        },
        [screenToFlowPosition, setNodes, jwt],
    );

    const handleUpdateNodeData = useCallback((id: string, data: any) => {
        setNodes(nds => nds.map(n => {
            if (n.id === id) {
                return { ...n, data: { ...n.data, ...data } };
            }
            return n;
        }));
    }, [setNodes]);



    const loadTopology = async (id: number) => {
        const jwt = localStorage.getItem("jwt");
        if (!jwt) return;

        try {
            const { getTopology, updateLastTopology } = await import("@/lib/api/api");
            const topo = await getTopology(jwt, id);

            // Parsear data
            let parsedData = topo.Data;
            if (typeof parsedData === 'string') {
                try {
                    parsedData = JSON.parse(parsedData);
                } catch (e) {
                    console.error("Error parsing topology data JSON:", e);
                }
            }

            // Restaurar nodos y edges
            if (parsedData && parsedData.nodes && parsedData.edges) {
                setNodes(parsedData.nodes);
                setEdges(parsedData.edges);
                setSelectedTopology(id);
                setCurrentTopologyName(topo.Name);
                notify(`Topología "${topo.Name}" cargada`, "success");

                // Actualizar preferencia de última topología
                updateLastTopology(jwt, id).catch(console.error);
            }
        } catch (error) {
            console.error("Error loading topology:", error);
            notify("Error al cargar la topología", "error");
        }
    };

    // Cargar topologías y última activa al inicio
    useEffect(() => {
        const jwt = localStorage.getItem("jwt");
        if (!jwt) {
            router.push("/auth/login");
            return;
        }

        const init = async () => {
            try {
                // 1. Cargar lista de topologías
                const { getTopologies } = await import("@/lib/api/api");
                const topos = await getTopologies(jwt);
                setTopologies(topos);

                // 2. Check for local draft first
                const draftJson = localStorage.getItem("topology_draft");
                if (draftJson) {
                    try {
                        const draft = JSON.parse(draftJson);
                        // Optional: Check if draft is too old? For now, just load it.
                        if (draft.nodes && draft.edges) {
                            setNodes(draft.nodes);
                            setEdges(draft.edges);
                            setSelectedTopology(draft.selectedTopology);
                            setCurrentTopologyName(draft.currentTopologyName || "");
                            notify("Borrador local restaurado", "info");
                            return; // Skip loading from backend if draft exists
                        }
                    } catch (e) {
                        console.error("Error parsing local draft:", e);
                    }
                }

                // 3. Obtener usuario para ver última topología activa (fallback)
                const { getUser } = await import("@/lib/api/api");
                const user = await getUser(jwt);

                if (user.LastTopologyID) {
                    // Verificar que la topología aún exista
                    const exists = topos.find((t: any) => t.ID === user.LastTopologyID);
                    if (exists) {
                        loadTopology(user.LastTopologyID);
                    }
                }
            } catch (error) {
                console.error("Error initializing topology:", error);
            }
        };

        init();
    }, [router, loadTopology, setTopologies, notify]);

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
                        message: (n.data as any).message, // Save notification message
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
                const { createTopology, updateTopology, getTopologies } = await import("@/lib/api/api");
                if (selectedTopology) {
                    // Actualizar existente
                    await updateTopology(jwt, selectedTopology, name, data);
                    if (!silent) notify("Topología actualizada", "success");
                } else {
                    // Crear nueva
                    const newTopo = await createTopology(jwt, name, data);
                    setSelectedTopology(newTopo.ID);
                    if (!silent) notify("Topología guardada", "success");
                }
                setCurrentTopologyName(name);
                // Recargar lista de topologías
                const topos = await getTopologies(jwt);
                setTopologies(topos);

                if (!silent) {
                    // This notification is now handled inside the if/else block
                    // notify("Topología guardada correctamente", "success");
                } else {
                    console.log("Auto-saved topology");
                }
            } catch (e: any) {
                console.error("Error guardando topología:", e);
                if (!silent) notify("Error guardando topología: " + e.message, "error");
            }
        },
        [jwt, nodes, edges, selectedTopology, notify]
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

                // Update draft with loaded topology
                const draft = {
                    nodes: nodesWithData,
                    edges: data.edges,
                    selectedTopology: id,
                    currentTopologyName: topo.Name,
                    timestamp: Date.now()
                };
                localStorage.setItem("topology_draft", JSON.stringify(draft));

                // Ajustar vista después de cargar
                setTimeout(() => fitView(), 100);
            } catch (e: any) {
                console.error("Error cargando topología:", e);
                notify("Error cargando topología: " + e.message, "error");
            }
        },
        [jwt, setNodes, setEdges, fitView, notify]
    );

    // Auto-save effect
    useEffect(() => {
        if (!selectedTopology || !currentTopologyName) return;

        const timer = setTimeout(() => {
            handleSave(currentTopologyName, true);
        }, 2000);

        return () => clearTimeout(timer);
    }, [nodes, edges, selectedTopology, currentTopologyName, handleSave]);

    const handleRenameTopology = async (id: number, newName: string) => {
        const jwt = localStorage.getItem("jwt");
        if (!jwt) return;

        try {
            const { updateTopology, getTopologies } = await import("@/lib/api/api");

            const topologyData = {
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

            await updateTopology(jwt, id, newName, topologyData);
            notify("Topología renombrada", "success");

            const topos = await getTopologies(jwt);
            setTopologies(topos);
            if (selectedTopology === id) {
                setCurrentTopologyName(newName);
            }
        } catch (error) {
            console.error("Error renaming topology:", error);
            notify("Error al renombrar", "error");
        }
    };

    const handleDeleteTopology = async (id: number) => {
        const jwt = localStorage.getItem("jwt");
        if (!jwt) return;

        try {
            const { deleteTopology, getTopologies } = await import("@/lib/api/api");
            await deleteTopology(jwt, id);
            notify("Topología eliminada", "success");

            if (selectedTopology === id) {
                setSelectedTopology(null);
                setCurrentTopologyName("");
                setNodes([]);
                setEdges([]);
                localStorage.removeItem("topology_draft");
            }

            const topos = await getTopologies(jwt);
            setTopologies(topos);
        } catch (error) {
            console.error("Error deleting topology:", error);
            notify("Error al eliminar", "error");
        }
    };

    const handleNew = useCallback(() => {
        setNodes([]);
        setEdges([]);
        setSelectedTopology(null);
        setCurrentTopologyName("");
        localStorage.removeItem("topology_draft");
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
                    onDragOver={onDragOver}
                    onDrop={onDrop}
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
                    onAddNotificationNode={handleAddNotificationNode}
                    selectedNode={selectedNode}
                    onUpdateNodeData={handleUpdateNodeData}
                    onDelete={handleDeleteTopology}
                    onRename={handleRenameTopology}
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
