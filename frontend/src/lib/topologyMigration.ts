import { Node, Edge } from "@xyflow/react";

export function migrateTopology(nodes: Node[], edges: Edge[]): { nodes: Node[], edges: Edge[] } {
    const migratedNodes = nodes.map(node => {
        const data = node.data || {};
        let newData = { ...data };

        switch (node.type) {
            case 'traffic-trigger':
                newData = {
                    ruleType: 'threat_level',
                    operator: 'is',
                    value: 'HIGH',
                    isActive: false,
                    ...data
                };
                break;
            case 'action':
                newData = {
                    metric: 'cpu',
                    operator: '>=',
                    threshold: 0,
                    isActive: false,
                    ...data
                };
                break;
            case 'monitoring':
                newData = {
                    metric: 'cpu',
                    range: '1h',
                    interval: '1m',
                    agg: 'mean',
                    ...data
                };
                break;
            case 'email':
                newData = {
                    to: '',
                    subject: '',
                    body: '',
                    isActive: false,
                    ...data
                };
                break;
            case 'notification':
                newData = {
                    message: 'Alerta detectada',
                    isActive: false,
                    ...data
                };
                break;
            case 'delay':
                newData = {
                    delay: 5000,
                    isActive: false,
                    isWaiting: false,
                    ...data
                };
                break;
            case 'sound':
                newData = {
                    sound: 'beep',
                    isActive: false,
                    ...data
                };
                break;
            case 'time-window':
                newData = {
                    startTime: '09:00',
                    endTime: '17:00',
                    isActive: false,
                    ...data
                };
                break;
            case 'threshold':
                newData = {
                    threshold: 3,
                    timeWindow: 60,
                    currentCount: 0,
                    isActive: false,
                    ...data
                };
                break;
            case 'traffic':
                newData = {
                    label: 'Traffic Log',
                    ...data
                };
                break;
            case 'device':
                // Ensure status is at least unknown if missing
                if (!newData.status) {
                    newData.status = 'unknown';
                }
                break;
        }

        return {
            ...node,
            data: newData
        };
    });

    return { nodes: migratedNodes, edges };
}
