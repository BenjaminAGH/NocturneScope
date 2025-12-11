
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
    device: string;
    range: string;
    generatedAt: string;
    summary: {
        uptime: string;
        avgCpu: number;
        avgRam: number;
        avgTemp: number;
    };
    criticalEvents: Array<{
        time: string;
        metric: string;
        value: number;
        threshold: number;
    }>;
    stats: Array<{
        name: string;
        min: number;
        max: number;
        avg: number;
    }>;
}

interface ReportDocumentProps {
    data: ReportData;
}

const ReportDocument: React.FC<ReportDocumentProps> = ({ data }) => (
    <Document>
        <Page size="A4" style={styles.page}>

            {/* Header */}
            <View style={styles.header}>
                {/* Logo Left - Scope Icon (Grayscale equivalent via style logic not available directly on Image, assuming filtered source or accept as is) */}
                {/* Since user asked for Black and White, we use the standard icon. PDF renderer processes images essentially as is. */}
                {/* We can use standard Image component. */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    {/* Using absolute path or public URL. In React PDF, fetching from public can be tricky in dev. */}
                    {/* We will assume it can load from the same host or base64. pass base64 if needed later. */}
                    <Text style={{ fontWeight: 'bold', fontSize: 16 }}>SCOPE</Text>
                </View>

                <View style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                    <Text style={styles.headerTitle}>NECTURNE SECURITY</Text>
                    <Text style={{ fontSize: 8, color: '#666' }}>Automated Report</Text>
                </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>System Performance Report</Text>

            <View style={styles.row}>
                <View style={styles.col}><Text>Device: {data.device}</Text></View>
                <View style={styles.col}><Text>Range: {data.range}</Text></View>
                <View style={styles.col}><Text>Date: {data.generatedAt}</Text></View>
            </View>

            {/* Executive Summary */}
            <Text style={styles.subtitle}>Executive Summary</Text>
            <View style={styles.row}>
                <View style={styles.col}>
                    <Text>Uptime: {data.summary.uptime}</Text>
                </View>
                <View style={styles.col}>
                    <Text>Avg CPU: {data.summary.avgCpu.toFixed(1)}%</Text>
                </View>
                <View style={styles.col}>
                    <Text>Avg RAM: {data.summary.avgRam.toFixed(1)}%</Text>
                </View>
                <View style={styles.col}>
                    <Text>Avg Temp: {data.summary.avgTemp.toFixed(1)}°C</Text>
                </View>
            </View>

            {/* Critical Events */}
            <Text style={styles.subtitle}>Critical Events Analysis</Text>
            <Text style={{ fontSize: 8, color: '#666', marginBottom: 5 }}>Events where usage exceeded defined thresholds (Critical Variables).</Text>

            <View style={styles.table}>
                <View style={styles.row}>
                    <Text style={styles.colHeader}>Time</Text>
                    <Text style={styles.colHeader}>Metric</Text>
                    <Text style={styles.colHeader}>Value</Text>
                    <Text style={styles.colHeader}>Threshold</Text>
                </View>
                {data.criticalEvents.length === 0 ? (
                    <Text style={{ margin: 10, fontStyle: 'italic' }}>No critical events detected in this range.</Text>
                ) : (
                    data.criticalEvents.map((event, i) => (
                        <View key={i} style={styles.row}>
                            <Text style={styles.col}>{event.time}</Text>
                            <Text style={styles.col}>{event.metric}</Text>
                            <Text style={[styles.col, { color: 'red' }]}>{event.value.toFixed(1)}</Text>
                            <Text style={styles.col}>{event.threshold}</Text>
                        </View>
                    ))
                )}
            </View>

            {/* Detailed Statics */}
            <Text style={styles.subtitle}>Detailed Statistics</Text>
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

export default ReportDocument;
