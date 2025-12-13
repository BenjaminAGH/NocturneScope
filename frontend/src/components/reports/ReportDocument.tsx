
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#333',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingBottom: 10,
    },
    headerLogo: {
        width: 40,
        height: 40,
    },
    headerTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#000',
    },
    section: {
        margin: 10,
        padding: 10,
        flexGrow: 1,
    },
    title: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 10,
        fontWeight: 'bold',
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 10,
        marginTop: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 2,
        fontWeight: 'bold',
    },
    text: {
        margin: 12,
        fontSize: 10,
        textAlign: 'justify',
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingVertical: 5,
    },
    col: {
        flex: 1,
    },
    colHeader: {
        flex: 1,
        fontWeight: 'bold',
        backgroundColor: '#f5f5f5',
        padding: 2,
    },
    table: {
        width: '100%',
        marginBottom: 10,
    },
    critical: {
        color: 'red',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        textAlign: 'center',
        color: 'grey',
        fontSize: 8,
    }
});

interface ReportData {
    scope?: 'device' | 'group'; // Defaults to 'device' for backward compatibility
    device: string; // Used as Group Name if scope is 'group'
    range: string;
    generatedAt: string;
    summary: {
        uptime: string; // For group: Avg Uptime or "N/A"
        avgCpu: number;
        avgRam: number;
        avgTemp: number;
        totalDevices?: number; // Only for group
        offlineDevices?: number; // Only for group
    };
    criticalEvents: Array<{
        time: string;
        metric: string;
        value: number;
        threshold: number;
        deviceName?: string; // Only for group
    }>;
    stats: Array<{
        name: string;
        min: number;
        max: number;
        avg: number;
    }>;
    topOffenders?: Array<{ // Only for group
        device: string;
        cpu: number;
        ram: number;
        alerts: number;
    }>;
}

interface ReportDocumentProps {
    data: ReportData;
}

const ReportDocument: React.FC<ReportDocumentProps> = ({ data }) => {
    const isGroup = data.scope === 'group';

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* Header */}
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Image src="/img/scope_icon.svg" style={styles.headerLogo} />
                    </View>
                    <View style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                        <Image src="/nocturneDark.svg" style={{ width: 100, height: 20 }} />
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.title}>{isGroup ? 'Group Health Report' : 'System Performance Report'}</Text>

                <View style={styles.row}>
                    <View style={styles.col}><Text>{isGroup ? 'Group' : 'Device'}: {data.device}</Text></View>
                    <View style={styles.col}><Text>Range: {data.range}</Text></View>
                    <View style={styles.col}><Text>Date: {data.generatedAt}</Text></View>
                </View>

                {/* Executive Summary */}
                <Text style={styles.subtitle}>Executive Summary</Text>
                <View style={styles.row}>
                    {isGroup && (
                        <View style={styles.col}>
                            <Text>Devices: {data.summary.totalDevices}</Text>
                        </View>
                    )}
                    <View style={styles.col}>
                        <Text>Avg CPU: {data.summary.avgCpu.toFixed(1)}%</Text>
                    </View>
                    <View style={styles.col}>
                        <Text>Avg RAM: {data.summary.avgRam.toFixed(1)}%</Text>
                    </View>
                    {!isGroup && (
                        <View style={styles.col}>
                            <Text>Avg Temp: {data.summary.avgTemp.toFixed(1)}°C</Text>
                        </View>
                    )}
                </View>

                {/* Group Specific: Top Offenders */}
                {isGroup && data.topOffenders && (
                    <>
                        <Text style={styles.subtitle}>Top Offenders (High Consumption)</Text>
                        <View style={styles.table}>
                            <View style={styles.row}>
                                <Text style={styles.colHeader}>Device</Text>
                                <Text style={styles.colHeader}>Avg CPU</Text>
                                <Text style={styles.colHeader}>Avg RAM</Text>
                                <Text style={styles.colHeader}>Alerts</Text>
                            </View>
                            {data.topOffenders.map((dev, i) => (
                                <View key={i} style={styles.row}>
                                    <Text style={styles.col}>{dev.device}</Text>
                                    <Text style={styles.col}>{dev.cpu.toFixed(1)}%</Text>
                                    <Text style={styles.col}>{dev.ram.toFixed(1)}%</Text>
                                    <Text style={[styles.col, dev.alerts > 0 ? { color: 'red' } : {}]}>{dev.alerts}</Text>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {/* Critical Events */}
                <Text style={styles.subtitle}>Critical Events Analysis</Text>
                <Text style={{ fontSize: 8, color: '#666', marginBottom: 5 }}>Events where usage exceeded defined thresholds (Critical Variables).</Text>

                <View style={styles.table}>
                    <View style={styles.row}>
                        {isGroup && <Text style={styles.colHeader}>Device</Text>}
                        <Text style={styles.colHeader}>Time</Text>
                        <Text style={styles.colHeader}>Metric</Text>
                        <Text style={styles.colHeader}>Value</Text>
                        <Text style={styles.colHeader}>Threshold</Text>
                    </View>
                    {data.criticalEvents.length === 0 ? (
                        <Text style={{ margin: 10, fontStyle: 'italic' }}>No critical events detected in this range.</Text>
                    ) : (
                        data.criticalEvents.slice(0, 50).map((event, i) => ( // Limit to 50 events in specific view to avoid overflow
                            <View key={i} style={styles.row}>
                                {isGroup && <Text style={styles.col}>{event.deviceName}</Text>}
                                <Text style={styles.col}>{event.time}</Text>
                                <Text style={styles.col}>{event.metric}</Text>
                                <Text style={[styles.col, { color: 'red' }]}>{event.value.toFixed(1)}</Text>
                                <Text style={styles.col}>{event.threshold}</Text>
                            </View>
                        ))
                    )}
                    {data.criticalEvents.length > 50 && (
                        <Text style={{ margin: 5, fontSize: 8, fontStyle: 'italic', textAlign: 'center' }}>
                            ... {data.criticalEvents.length - 50} more events omitted ...
                        </Text>
                    )}
                </View>

                {/* Detailed Statics (Only for Single Device or Global Group Average) */}
                <Text style={styles.subtitle}>{isGroup ? 'Group Averages' : 'Detailed Statistics'}</Text>
                <View style={styles.table}>
                    <View style={styles.row}>
                        <Text style={styles.colHeader}>Metric</Text>
                        <Text style={styles.colHeader}>Min</Text>
                        <Text style={styles.colHeader}>Max</Text>
                        <Text style={styles.colHeader}>Average</Text>
                    </View>
                    {data.stats.map((stat, i) => (
                        <View key={i} style={styles.row}>
                            <Text style={styles.col}>{stat.name}</Text>
                            <Text style={styles.col}>{stat.min.toFixed(1)}</Text>
                            <Text style={styles.col}>{stat.max.toFixed(1)}</Text>
                            <Text style={styles.col}>{stat.avg.toFixed(1)}</Text>
                        </View>
                    ))}
                </View>

                {/* Footer */}
                <Text style={styles.footer}>
                    Generated by NocturneScope | Necturne Security | {data.generatedAt}
                </Text>
            </Page>
        </Document>
    );
};

export default ReportDocument;
