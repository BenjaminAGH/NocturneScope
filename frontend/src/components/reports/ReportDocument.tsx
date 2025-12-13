import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font, Svg, Polyline, Line, Path } from '@react-pdf/renderer';

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
    labels?: {
        groupHealthReport: string;
        systemPerformanceReport: string;
        executiveSummary: string;
        topOffenders: string;
        topOffendersDesc: string;
        criticalEventsAnalysis: string;
        criticalEventsDesc: string;
        detailedStatistics: string;
        groupAverages: string;
        average: string;
        alerts: string;
        noCriticalEvents: string;
        moreEventsOmitted: string;
        devices: string;
        metric: string;
        min: string;
        max: string;
        time: string;
        value: string;
        threshold: string;
        scope: string;
        group: string;
        device: string;
        range: string;
        date: string;
        generatedBy: string;

        metricChartDesc?: string;
        dataTables?: string;
        dataTablesSection?: string;
        cpuUsage?: string;
        ramUsage?: string;
        netRx?: string;
        netTx?: string;
        groupTrends?: string;
        deviceHealthDist?: string;
        axisTime?: string;
        axisValue?: string;
    };
    origin?: string;
    history?: {
        cpu: { t: string; v: number }[];
        ram: { t: string; v: number }[];
        temp: { t: string; v: number }[];
        net_rx: { t: string; v: number }[];
        net_tx: { t: string; v: number }[];
    };
    groupHistory?: {
        cpu: { t: string; v: number }[];
        ram: { t: string; v: number }[];
        temp: { t: string; v: number }[];
    };
    pieStats?: {
        healthy: number;
        critical: number;
    };
}

// Chart Component using SVG
const ChartComponent = ({ data, color, title, unit = "%", xLabel = "Time", yLabel = "Value" }: { data: { t: string; v: number }[], color: string, title: string, unit?: string, xLabel?: string, yLabel?: string }) => {
    if (!data || data.length < 2) return null;

    // Downsample if too many points to avoid PDF bloat/crash
    const downsampledData = data.length > 200 ? data.filter((_, i) => i % Math.ceil(data.length / 200) === 0) : data;

    const width = 500;
    const height = 180; // Increased for X axis label
    const padding = 40; // Increased for Y axis label
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const maxVal = Math.max(...downsampledData.map(p => p.v), 10); // Ensure at least 0-10 scale
    const minVal = 0; // Always start at 0 for percentages usually, or Math.min(...data.map(p => p.v));

    const normalizeX = (index: number) => padding + (index / (downsampledData.length - 1)) * chartWidth;
    const normalizeY = (value: number) => height - padding - ((value - minVal) / (maxVal - minVal)) * chartHeight;

    const points = downsampledData.map((p, i) => `${normalizeX(i)},${normalizeY(p.v)}`).join(' ');

    return (
        <View style={{ marginBottom: 20 }} wrap={false}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5, marginLeft: padding }}>{title}</Text>
            <Svg width={width} height={height}>
                {/* Axes */}
                <Line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="black" strokeWidth={1} />
                <Line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="black" strokeWidth={1} />

                {/* Y Axis Label (Rotated) - React PDF doesn't support text rotation easily in all versions, using simple text or skipping rotation if problematic.
                   Actually transform is supported. */}
                <Text
                    x={10}
                    y={height / 2}
                    style={{
                        fontSize: 8,
                        transform: 'rotate(-90deg)',
                        transformOrigin: '0 0' // Pivot might be tricky, keeping it simple or omitting rotation if it breaks layout
                    }}
                >
                    {/* Simplified: Just put it at the top or side without rotation for safety if unsure about specific version support, but rotation is standard.
                       Let's try standard horizontal label at top of Y axis for reliability. */}
                </Text>

                {/* Alternative Y Axis Label at Top */}
                <Text x={padding - 10} y={padding - 10} style={{ fontSize: 8 }}>{yLabel}</Text>

                {/* X Axis Label */}
                <Text x={width / 2} y={height - 5} style={{ fontSize: 8, textAlign: 'center' }}>{xLabel}</Text>

                {/* Horizontal Grid Lines */}

                {/* Grid Lines (Horizontal) - 4 lines */}
                {[0.25, 0.5, 0.75, 1].map((ratio) => {
                    const y = height - padding - ratio * chartHeight;
                    return (
                        <Line key={ratio} x1={padding} y1={y} x2={width - padding} y2={y} stroke="#eee" strokeWidth={1} />
                    );
                })}

                {/* Y Axis Labels */}
                <Text x={5} y={height - padding} style={{ fontSize: 8 }}>{minVal}</Text>
                <Text x={5} y={padding + 5} style={{ fontSize: 8 }}>{maxVal.toFixed(1)}{unit}</Text>

                {/* Data Line */}
                <Polyline points={points} stroke={color} strokeWidth={2} fill="none" />
            </Svg>
        </View>
    );
};

// Pie Chart Component
const PieChartComponent = ({ data, title }: { data: { label: string, value: number, color: string }[], title: string }) => {
    const total = data.reduce((acc, curr) => acc + curr.value, 0);
    if (total === 0) return null;

    let startAngle = 0;
    const radius = 50;
    const cx = 100;
    const cy = 75;

    const paths = data.map((slice) => {
        if (slice.value === 0) return null;
        const angle = (slice.value / total) * 360;
        const endAngle = startAngle + angle;

        // Convert polar to cartesian
        const x1 = cx + radius * Math.cos(Math.PI * startAngle / 180);
        const y1 = cy + radius * Math.sin(Math.PI * startAngle / 180);
        const x2 = cx + radius * Math.cos(Math.PI * endAngle / 180);
        const y2 = cy + radius * Math.sin(Math.PI * endAngle / 180);

        // SVG Path command
        const d = [
            `M ${cx} ${cy}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${angle > 180 ? 1 : 0} 1 ${x2} ${y2}`,
            'Z'
        ].join(' ');

        // Legend position (simple calculation, improved later if needed)
        // const midAngle = startAngle + angle / 2;
        // const lx = cx + (radius + 20) * Math.cos(Math.PI * midAngle / 180);
        // const ly = cy + (radius + 20) * Math.sin(Math.PI * midAngle / 180);

        const currentStart = startAngle;
        startAngle = endAngle;

        return (
            <React.Fragment key={slice.label}>
                <Path d={d} fill={slice.color} />
            </React.Fragment>
        );
    });

    return (
        <View style={{ marginBottom: 20, alignItems: 'center' }} wrap={false}>
            <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 10 }}>{title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Svg width={200} height={150}>
                    {paths}
                </Svg>
                <View style={{ marginLeft: 20 }}>
                    {data.map((slice, i) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                            <View style={{ width: 10, height: 10, backgroundColor: slice.color, marginRight: 5 }} />
                            <Text style={{ fontSize: 9 }}>{slice.label}: {slice.value} ({((slice.value / total) * 100).toFixed(0)}%)</Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
};
interface ReportDocumentProps {
    data: ReportData;
}

const ReportDocument: React.FC<ReportDocumentProps> = ({ data }) => {
    const isGroup = data.scope === 'group';
    const labels = data.labels || {
        groupHealthReport: 'Group Health Report',
        systemPerformanceReport: 'System Performance Report',
        executiveSummary: 'Executive Summary',
        topOffenders: 'Top Offenders (High Consumption)',
        topOffendersDesc: 'High consumption devices or alerts.',
        criticalEventsAnalysis: 'Critical Events Analysis',
        criticalEventsDesc: 'Events where usage exceeded defined thresholds (Critical Variables).',
        detailedStatistics: 'Detailed Statistics',
        groupAverages: 'Group Averages',
        average: 'Average',
        alerts: 'Alerts',
        noCriticalEvents: 'No critical events detected in this range.',
        moreEventsOmitted: 'more events omitted',
        devices: 'Devices',
        metric: 'Metric',
        min: 'Min',
        max: 'Max',
        time: 'Time',
        value: 'Value',
        threshold: 'Threshold',
        scope: 'Scope',
        group: 'Group',
        device: 'Device',
        range: 'Range',
        date: 'Date',
        generatedBy: 'Generated by NocturneScope',
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* Header */}
                {/* Header */}
                <View style={styles.header}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        {data.origin && (
                            <Image
                                src={`${data.origin}/nocturneDark.png`}
                                style={{ width: 100, height: 20 }}
                            />
                        )}
                        {/* Fallback Text if image fails to load/render (React-PDF doesn't fallback easily, but this text is always here if we remove the image or if layout allows) */}
                        {/* For now, relying on PNG. If user hasn't converted yet, it will be blank. */}
                    </View>
                    <View style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                        {/* Scope Icon - assuming PNG available or removed if causing issues */}
                        {/* <Image src={`${data.origin}/img/scope_icon.png`} style={styles.headerLogo} /> */}
                        {/* Replacing with text indicator for robustness */}
                        <Text style={{ fontSize: 10, color: '#666' }}>{isGroup ? "GROUP REPORT" : "DEVICE REPORT"}</Text>
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.title}>{isGroup ? labels.groupHealthReport : labels.systemPerformanceReport}</Text>

                <View style={styles.row}>
                    <View style={styles.col}><Text>{isGroup ? labels.group : labels.device}: {data.device}</Text></View>
                    <View style={styles.col}><Text>{labels.range}: {data.range}</Text></View>
                    <View style={styles.col}><Text>{labels.date || 'Date'}: {data.generatedAt}</Text></View>
                </View>

                {/* Executive Summary */}
                <Text style={styles.subtitle}>{labels.executiveSummary}</Text>
                <View style={styles.row}>
                    {isGroup && (
                        <View style={styles.col}>
                            <Text>{labels.devices}: {data.summary.totalDevices}</Text>
                        </View>
                    )}
                    {data.stats.some(s => s.name.includes('CPU')) && (
                        <View style={styles.col}>
                            <Text>Avg CPU: {data.summary.avgCpu.toFixed(1)}%</Text>
                        </View>
                    )}
                    {data.stats.some(s => s.name.includes('RAM')) && (
                        <View style={styles.col}>
                            <Text>Avg RAM: {data.summary.avgRam.toFixed(1)}%</Text>
                        </View>
                    )}
                    {!isGroup && data.stats.some(s => s.name.includes('Temp')) && (
                        <View style={styles.col}>
                            <Text>Avg Temp: {data.summary.avgTemp.toFixed(1)}°C</Text>
                        </View>
                    )}
                    {/* Add Net summary if desired, or skip */}
                </View>



                {/* SECTION: DATA TABLES */}
                <View style={{ marginTop: 20 }}>
                    <Text style={styles.title}>{labels.dataTablesSection || "Data Tables"}</Text>

                    {/* Table 1: Top Offenders (Group Only) */}
                    {isGroup && data.topOffenders && (
                        <>
                            <Text style={styles.subtitle}>{labels.topOffenders}</Text>
                            <View style={styles.table}>
                                <View style={styles.row}>
                                    <Text style={styles.colHeader}>{labels.device}</Text>
                                    {data.stats.some(s => s.name.includes('CPU')) && <Text style={styles.colHeader}>{labels.cpuUsage || 'Avg CPU (%)'}</Text>}
                                    {data.stats.some(s => s.name.includes('RAM')) && <Text style={styles.colHeader}>{labels.ramUsage || 'Avg RAM (%)'}</Text>}
                                    <Text style={styles.colHeader}>{labels.alerts}</Text>
                                </View>
                                {data.topOffenders.map((dev, i) => (
                                    <View key={i} style={styles.row}>
                                        <Text style={styles.col}>{dev.device}</Text>
                                        {data.stats.some(s => s.name.includes('CPU')) && <Text style={styles.col}>{dev.cpu.toFixed(1)}%</Text>}
                                        {data.stats.some(s => s.name.includes('RAM')) && <Text style={styles.col}>{dev.ram.toFixed(1)}%</Text>}
                                        <Text style={[styles.col, dev.alerts > 0 ? { color: 'red' } : {}]}>{dev.alerts}</Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}

                    {/* Table 2: Critical Events */}
                    <Text style={styles.subtitle}>{labels.criticalEventsAnalysis}</Text>
                    <Text style={{ fontSize: 8, color: '#666', marginBottom: 5 }}>{labels.criticalEventsDesc}</Text>

                    <View style={styles.table}>
                        <View style={styles.row}>
                            <Text style={styles.colHeader}>{isGroup ? labels.device : labels.time}</Text>
                            {isGroup && <Text style={styles.colHeader}>{labels.time}</Text>}
                            <Text style={styles.colHeader}>{labels.metric}</Text>
                            <Text style={styles.colHeader}>{labels.value}</Text>
                            <Text style={styles.colHeader}>{labels.threshold}</Text>
                        </View>
                        {data.criticalEvents.length === 0 ? (
                            <Text style={{ margin: 10, fontStyle: 'italic' }}>{labels.noCriticalEvents}</Text>
                        ) : (
                            data.criticalEvents.slice(0, 50).map((event, i) => (
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
                                ... {data.criticalEvents.length - 50} {labels.moreEventsOmitted} ...
                            </Text>
                        )}
                    </View>

                    {/* Table 3: Detailed Statistics */}
                    <Text style={styles.subtitle}>{isGroup ? labels.groupAverages : labels.detailedStatistics}</Text>
                    <View style={styles.table}>
                        <View style={styles.row}>
                            <Text style={styles.colHeader}>{labels.metric} (Name)</Text>
                            <Text style={styles.colHeader}>{labels.min} (Value)</Text>
                            <Text style={styles.colHeader}>{labels.max} (Value)</Text>
                            <Text style={styles.colHeader}>{labels.average} (Mean)</Text>
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
                </View>

                {/* SECTION: VISUALIZATIONS */}
                <View break>
                    <Text style={styles.title}>{labels.metricChartDesc || "Visualizations"}</Text>

                    {/* Single Device Charts */}
                    {!isGroup && data.history && (
                        <>
                            {data.stats.some(s => s.name.includes('CPU')) && (
                                <ChartComponent
                                    data={data.history.cpu}
                                    color="#8884d8"
                                    title={labels.cpuUsage || `CPU Usage (%)`}
                                    xLabel={labels.axisTime}
                                    yLabel="%"
                                />
                            )}
                            {data.stats.some(s => s.name.includes('RAM')) && (
                                <ChartComponent
                                    data={data.history.ram}
                                    color="#82ca9d"
                                    title={labels.ramUsage || `RAM Usage (%)`}
                                    xLabel={labels.axisTime}
                                    yLabel="%"
                                />
                            )}
                            {data.stats.some(s => s.name.includes('Temp')) && (
                                <ChartComponent
                                    data={data.history.temp}
                                    color="#ff7300"
                                    title={labels.metric?.includes('Temp') ? labels.metric : `Temperature (°C)`} // Fallback to generic if key missing
                                    unit="°C"
                                    xLabel={labels.axisTime}
                                    yLabel="°C"
                                />
                            )}
                            {data.stats.some(s => s.name.includes('Net RX')) && (
                                <ChartComponent
                                    data={data.history.net_rx}
                                    color="#0088FE"
                                    title={labels.netRx || `Network RX (B/s)`}
                                    unit=" B/s"
                                    xLabel={labels.axisTime}
                                    yLabel="B/s"
                                />
                            )}
                            {data.stats.some(s => s.name.includes('Net TX')) && (
                                <ChartComponent
                                    data={data.history.net_tx}
                                    color="#00C49F"
                                    title={labels.netTx || `Network TX (B/s)`}
                                    unit=" B/s"
                                    xLabel={labels.axisTime}
                                    yLabel="B/s"
                                />
                            )}
                        </>
                    )}

                    {/* Group Charts */}
                    {isGroup && data.groupHistory && data.pieStats && (
                        <>
                            {/* Pie Chart: Device Status (Healthy vs Critical) */}
                            <PieChartComponent
                                data={[
                                    { label: 'Healthy', value: data.pieStats.healthy, color: '#82ca9d' }, // Green
                                    { label: 'Critical/Warnings', value: data.pieStats.critical, color: '#ff7300' } // Orange/Red
                                ]}
                                title={labels.deviceHealthDist || "Device Health Distribution"}
                            />

                            <Text style={{ fontSize: 10, fontWeight: 'bold', marginTop: 15, marginBottom: 5 }}>{labels.groupTrends || "Group Average Trends"}</Text>

                            {/* Line Charts for Group Averages */}
                            {data.stats.some(s => s.name.includes('CPU')) && (
                                <ChartComponent
                                    data={data.groupHistory.cpu}
                                    color="#8884d8"
                                    title={labels.cpuUsage || `Avg Group CPU (%)`}
                                    xLabel={labels.axisTime}
                                    yLabel="%"
                                />
                            )}
                            {data.stats.some(s => s.name.includes('RAM')) && (
                                <ChartComponent
                                    data={data.groupHistory.ram}
                                    color="#82ca9d"
                                    title={labels.ramUsage || `Avg Group RAM (%)`}
                                    xLabel={labels.axisTime}
                                    yLabel="%"
                                />
                            )}
                            {data.stats.some(s => s.name.includes('Temp')) && (
                                <ChartComponent
                                    data={data.groupHistory.temp}
                                    color="#ff7300"
                                    title={labels.metric?.includes('Temp') ? labels.metric : `Avg Group Temp (°C)`}
                                    unit="°C"
                                    xLabel={labels.axisTime}
                                    yLabel="°C"
                                />
                            )}
                        </>
                    )}
                </View>

                {/* Footer */}
                <Text style={styles.footer} fixed>
                    {labels.generatedBy || 'Generated by NocturneScope'} | Necturne Security | {data.generatedAt} | Page <Text render={({ pageNumber, totalPages }) => (`${pageNumber} of ${totalPages}`)} />
                </Text>
            </Page>
        </Document >
    );
};

export default ReportDocument;
