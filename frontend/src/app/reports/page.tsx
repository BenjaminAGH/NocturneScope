"use client";

import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { ArrowPathIcon, DocumentArrowDownIcon, ExclamationTriangleIcon, DocumentTextIcon, EyeIcon } from '@heroicons/react/24/outline';
import ReportDocument from '@/components/reports/ReportDocument';
import { getDevices, getTimeseries, getLastStats } from '@/lib/api/api';
import { useLanguage } from '@/context/LanguageContext';
import { useGroup } from '@/context/GroupContext';

// Dynamic import for PDFViewer to avoid SSR issues
const PDFViewer = dynamic(
    () => import("@react-pdf/renderer").then((mod) => mod.PDFViewer),
    {
        ssr: false,
        loading: () => <div className="h-[500px] w-full flex items-center justify-center bg-muted/20 rounded-lg animate-pulse">Loading Preview...</div>,
    }
);

interface CriticalEvent {
    time: string;
    metric: string;
    value: number;
    threshold: number;
}

export default function ReportsPage() {
    const { t } = useLanguage();
    const { selectedGroup, initialized } = useGroup();
    const router = useRouter();

    // State
    const [devices, setDevices] = useState<string[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<string>('');
    const [scope, setScope] = useState<'device' | 'group'>('device');
    const [range, setRange] = useState('1h');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['cpu', 'ram', 'temp', 'net_rx', 'net_tx']);
    const [thresholdCpu, setThresholdCpu] = useState(80);
    const [thresholdRam, setThresholdRam] = useState(80);
    const [thresholdTemp, setThresholdTemp] = useState(75);
    const [loading, setLoading] = useState(false);
    const [deviceLoading, setDeviceLoading] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [error, setError] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    const availableMetrics = [
        { id: 'cpu', label: 'CPU' },
        { id: 'ram', label: 'RAM' },
        { id: 'temp', label: 'Temp' },
        { id: 'net_rx', label: 'Net RX' },
        { id: 'net_tx', label: 'Net TX' },
    ];

    const toggleMetric = (id: string) => {
        setReportData(null);
        setSelectedMetrics(prev =>
            prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
        );
    };

    // Authentication & Group Check
    useEffect(() => {
        const token = localStorage.getItem("jwt");
        if (!token) {
            router.push("/auth/login");
        }
    }, [router]);

    useEffect(() => {
        if (initialized && !selectedGroup) {
            router.push("/groups");
        }
    }, [initialized, selectedGroup, router]);

    // Fetch Devices
    useEffect(() => {
        if (selectedGroup) {
            const jwt = localStorage.getItem('jwt');
            if (jwt) {
                setDeviceLoading(true);
                getDevices(jwt, selectedGroup.ID)
                    .then(setDevices)
                    .catch(e => {
                        console.error("Failed to fetch devices", e);
                        setError(t('errorLoadingDevices') || "Error loading devices");
                    })
                    .finally(() => setDeviceLoading(false));
            }
        }
    }, [selectedGroup, t]);

    const handleGenerate = async () => {
        if (scope === 'device' && !selectedDevice) {
            setError(t('selectDevice') || "Select a device");
            return;
        }
        if (scope === 'group' && devices.length === 0) {
            setError("No devices available in this group.");
            return;
        }

        setLoading(true);
        setError('');

        try {
            const jwt = localStorage.getItem('jwt');
            if (!jwt) throw new Error("No JWT");

            const interval = '1m';
            const devicesToProcess = scope === 'group' ? devices : [selectedDevice];

            // Resolve time range
            let rangeParam = range;
            let startParam: string | undefined = undefined;
            let stopParam: string | undefined = undefined;

            if (range === 'custom') {
                if (!customStart) {
                    setError("Select start date for custom range");
                    setLoading(false);
                    return;
                }
                rangeParam = ''; // Unset range to force start/stop usage
                startParam = new Date(customStart).toISOString();
                if (customEnd) {
                    stopParam = new Date(customEnd).toISOString();
                }
            }

            // Helper to process a single device
            const processDevice = async (deviceName: string) => {
                // Dynamic Fetch
                const promises: Promise<any>[] = [];
                const metricMap: Record<string, any> = {};

                const fetchMetric = (field: string) =>
                    getTimeseries(jwt, { device: deviceName, field, range: rangeParam, start: startParam, stop: stopParam, agg: 'mean', interval })
                        .then(res => { metricMap[field] = res; })
                        .catch(err => { console.warn(`Failed to fetch ${field}`, err); metricMap[field] = { points: [] }; });

                if (selectedMetrics.includes('cpu')) promises.push(fetchMetric('cpu'));
                if (selectedMetrics.includes('ram')) promises.push(fetchMetric('ram'));
                if (selectedMetrics.includes('temp')) promises.push(fetchMetric('temp'));
                if (selectedMetrics.includes('net_rx')) promises.push(fetchMetric('net_rx'));
                if (selectedMetrics.includes('net_tx')) promises.push(fetchMetric('net_tx'));

                await Promise.all(promises);
                const lastStats = await getLastStats(jwt, deviceName);

                const pointsCpu = metricMap.cpu?.points || [];
                const pointsRam = metricMap.ram?.points || [];
                const pointsTemp = metricMap.temp?.points || [];
                const pointsNetRx = metricMap.net_rx?.points || [];
                const pointsNetTx = metricMap.net_tx?.points || [];

                const avg = (pts: any[]) => pts && pts.length ? pts.reduce((a, b) => a + b.v, 0) / pts.length : 0;
                const min = (pts: any[]) => pts && pts.length ? Math.min(...pts.map((p: any) => p.v)) : 0;
                const max = (pts: any[]) => pts && pts.length ? Math.max(...pts.map((p: any) => p.v)) : 0;

                const avgCpu = avg(pointsCpu);
                const avgRam = avg(pointsRam);
                const avgTemp = avg(pointsTemp);
                const avgNetRx = avg(pointsNetRx);
                const avgNetTx = avg(pointsNetTx);

                const deviceCriticalEvents: CriticalEvent[] = [];
                // Check CPU
                if (selectedMetrics.includes('cpu')) {
                    pointsCpu.forEach((p: any) => {
                        if (p.v > thresholdCpu) {
                            deviceCriticalEvents.push({
                                time: new Date(p.t).toLocaleTimeString(),
                                metric: 'CPU',
                                value: p.v,
                                threshold: thresholdCpu
                            });
                        }
                    });
                }
                // Check RAM
                if (selectedMetrics.includes('ram')) {
                    pointsRam.forEach((p: any) => {
                        if (p.v > thresholdRam) {
                            deviceCriticalEvents.push({
                                time: new Date(p.t).toLocaleTimeString(),
                                metric: 'RAM',
                                value: p.v,
                                threshold: thresholdRam
                            });
                        }
                    });
                }
                // Check Temp
                if (selectedMetrics.includes('temp')) {
                    pointsTemp.forEach((p: any) => {
                        if (p.v > thresholdTemp) {
                            deviceCriticalEvents.push({
                                time: new Date(p.t).toLocaleTimeString(),
                                metric: 'Temp',
                                value: p.v,
                                threshold: thresholdTemp
                            });
                        }
                    });
                }

                const stats = [];
                if (selectedMetrics.includes('cpu')) stats.push({ name: 'CPU (%)', min: min(pointsCpu), max: max(pointsCpu), avg: avgCpu });
                if (selectedMetrics.includes('ram')) stats.push({ name: 'RAM (%)', min: min(pointsRam), max: max(pointsRam), avg: avgRam });
                if (selectedMetrics.includes('temp')) stats.push({ name: 'Temp (°C)', min: min(pointsTemp), max: max(pointsTemp), avg: avgTemp });
                if (selectedMetrics.includes('net_rx')) stats.push({ name: 'Net RX (B/s)', min: min(pointsNetRx), max: max(pointsNetRx), avg: avgNetRx });
                if (selectedMetrics.includes('net_tx')) stats.push({ name: 'Net TX (B/s)', min: min(pointsNetTx), max: max(pointsNetTx), avg: avgNetTx });

                return {
                    device: deviceName,
                    stats,
                    criticalEvents: deviceCriticalEvents,
                    summary: { uptime: lastStats?.uptime ? `${(lastStats.uptime / 3600).toFixed(1)}h` : 'Unknown', avgCpu, avgRam, avgTemp },
                    history: {
                        cpu: pointsCpu,
                        ram: pointsRam,
                        temp: pointsTemp,
                        net_rx: pointsNetRx,
                        net_tx: pointsNetTx
                    }
                };
            };

            // Run requests (could throttle if list is huge, but simplistic for now)
            const results = await Promise.all(devicesToProcess.map(d => processDevice(d)));

            // Aggregate Data
            let aggregatedEvents: any[] = [];
            let totalCpu = 0;
            let totalRam = 0;
            let totalTemp = 0;
            let topOffenders: any[] = [];

            results.forEach(res => {
                // Add Device Name to events if group scope
                const events = res.criticalEvents.map(e => ({ ...e, deviceName: res.device }));
                aggregatedEvents = [...aggregatedEvents, ...events];

                totalCpu += res.summary.avgCpu;
                totalRam += res.summary.avgRam;
                totalTemp += res.summary.avgTemp;

                topOffenders.push({
                    device: res.device,
                    cpu: res.summary.avgCpu,
                    ram: res.summary.avgRam,
                    alerts: res.criticalEvents.length
                });
            });

            // Calculate Group Averages
            const count = results.length || 1;
            const groupAvgCpu = totalCpu / count;
            const groupAvgRam = totalRam / count;
            const groupAvgTemp = totalTemp / count;

            // Sort Events
            aggregatedEvents.sort((a, b) => a.time.localeCompare(b.time));

            // Sort Top Offenders
            // Sort by Alerts first, then CPU
            topOffenders.sort((a, b) => {
                if (b.alerts !== a.alerts) return b.alerts - a.alerts;
                return b.cpu - a.cpu;
            });
            topOffenders = topOffenders.slice(0, 5); // Take top 5

            const finalData = {
                scope,
                device: scope === 'group' ? selectedGroup?.Name || 'Group' : selectedDevice,
                range: range === 'custom' ? `${customStart} - ${customEnd || 'Now'}` : range,
                generatedAt: new Date().toLocaleString(),
                summary: {
                    uptime: scope === 'group' ? 'N/A' : results[0].summary.uptime,
                    avgCpu: groupAvgCpu,
                    avgRam: groupAvgRam,
                    avgTemp: groupAvgTemp,
                    totalDevices: scope === 'group' ? count : undefined
                },
                history: scope === 'group' ? undefined : {
                    cpu: results[0].history?.cpu || [],
                    ram: results[0].history?.ram || [],
                    temp: results[0].history?.temp || [],
                    net_rx: results[0].history?.net_rx || [],
                    net_tx: results[0].history?.net_tx || []
                },
                criticalEvents: aggregatedEvents,
                stats: scope === 'group'
                    ? [
                        // Only add group averages if metric was selected
                        ...(selectedMetrics.includes('cpu') ? [{ name: 'Avg CPU (%)', min: 0, max: 0, avg: groupAvgCpu }] : []),
                        ...(selectedMetrics.includes('ram') ? [{ name: 'Avg RAM (%)', min: 0, max: 0, avg: groupAvgRam }] : []),
                        ...(selectedMetrics.includes('temp') ? [{ name: 'Avg Temp (°C)', min: 0, max: 0, avg: groupAvgTemp }] : []),
                    ]
                    : results[0].stats,
                topOffenders: scope === 'group' ? topOffenders : undefined
            };

            setReportData({
                ...finalData,
                labels: {
                    groupHealthReport: t('groupHealthReport'),
                    systemPerformanceReport: t('systemPerformanceReport'),
                    executiveSummary: t('executiveSummary'),
                    topOffenders: t('topOffenders'),
                    topOffendersDesc: t('topOffendersDesc'),
                    criticalEventsAnalysis: t('criticalEventsAnalysis'),
                    criticalEventsDesc: t('criticalEventsDesc'),
                    detailedStatistics: t('detailedStatistics'),
                    groupAverages: t('groupAverages'),
                    average: t('average'),
                    alerts: t('alerts'),
                    noCriticalEvents: t('noCriticalEvents'),
                    moreEventsOmitted: t('moreEventsOmitted'),
                    devices: t('devices'),
                    metric: t('metric'),
                    min: t('min') || "Min", // Fallback if key missing in dev
                    max: t('max') || "Max",
                    time: t('time'),
                    value: t('value'),
                    threshold: t('thresholdNode'), // Reusing Threshold node label or add specific
                    scope: t('reportScope'),
                    group: t('group'),
                    device: t('device'),
                    range: t('timeRange'),
                    date: "Date", // Or t('date') if added
                    generatedBy: "Generated by NocturneScope", // Or t('generatedBy')
                }
            });

        } catch (e: any) {
            console.error(e);
            setError(e.message || "Error generating report");
        } finally {
            setLoading(false);
        }
    };

    if (!selectedGroup) return <div className="p-8 text-center">{t('loading')}</div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <header className="mb-8 border-b border-border/50 pb-4">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('reportGeneration')}</h1>
                <p className="text-muted-foreground mt-2">
                    {t('reportGenerationDesc')}
                </p>
            </header>

            <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
                {/* Configuration Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">{t('topologyControls').replace("Topology Controls", "Configuration") /* Reuse or add 'configuration' key */}</h2>
                        <div className="space-y-4">

                            {/* Scope Selection */}
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-2">{t('reportScope')}</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => { setScope('device'); setReportData(null); }}
                                        className={`px-3 py-2 text-sm font-medium rounded-md border transition-all ${scope === 'device' ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-input text-muted-foreground hover:bg-accent'}`}
                                    >
                                        {t('singleDevice')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setScope('group'); setReportData(null); }}
                                        className={`px-3 py-2 text-sm font-medium rounded-md border transition-all ${scope === 'group' ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-input text-muted-foreground hover:bg-accent'}`}
                                    >
                                        {t('groupSummary')}
                                    </button>
                                </div>
                            </div>

                            {/* Device Selection (Only if Single Device) */}
                            {scope === 'device' && (
                                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                    <label className="block text-sm font-medium text-muted-foreground mb-1">{t('device')}</label>
                                    <select
                                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
                                        value={selectedDevice}
                                        onChange={(e) => {
                                            setSelectedDevice(e.target.value);
                                            setReportData(null);
                                        }}
                                        disabled={deviceLoading}
                                    >
                                        <option value="">{deviceLoading ? t('loading') : t('selectDeviceFromTopology')}</option>
                                        {devices.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            )}

                            {/* Group Info (Only if Group) */}
                            {scope === 'group' && (
                                <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md animate-in fade-in slide-in-from-top-1 duration-200">
                                    {t('generatingFor')} <strong>{devices.length}</strong> {t('devicesInGroup')} <strong>{selectedGroup.Name}</strong>.
                                </div>
                            )}

                            {/* Range Selection */}
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">{t('timeRange')}</label>
                                <select
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={range}
                                    onChange={(e) => { setRange(e.target.value); setReportData(null); }}
                                >
                                    <option value="1h">{t('t_1h')}</option>
                                    <option value="6h">{t('t_6h')}</option>
                                    <option value="24h">{t('t_24h')}</option>
                                    <option value="7d">{t('t_7d')}</option>
                                    <option value="720h">{t('t_30d')}</option>
                                    <option value="3600h">{t('t_5m')}</option>
                                    <option value="8760h">{t('t_1y')}</option>
                                    <option value="custom">Custom Range</option>
                                </select>
                            </div>

                            {/* Custom Range Inputs */}
                            {range === 'custom' && (
                                <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1">
                                    <div>
                                        <label className="text-xs text-muted-foreground">Start</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                                            value={customStart}
                                            onChange={(e) => setCustomStart(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-muted-foreground">End</label>
                                        <input
                                            type="datetime-local"
                                            className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                                            value={customEnd}
                                            onChange={(e) => setCustomEnd(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Metrics Selection */}
                            <div className="pt-2">
                                <label className="block text-sm font-medium text-muted-foreground mb-2">{t('selectMetrics')}</label>
                                <div className="grid grid-cols-2 gap-2 bg-muted/20 p-2 rounded-md">
                                    {availableMetrics.map(m => (
                                        <label key={m.id} className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                                                checked={selectedMetrics.includes(m.id)}
                                                onChange={() => toggleMetric(m.id)}
                                            />
                                            <span>
                                                {/* Use translation if available, else label */}
                                                {m.id === 'cpu' ? t('cpu')?.replace(' (%)', '') :
                                                    m.id === 'ram' ? t('ram')?.replace(' (%)', '') :
                                                        m.id === 'temp' ? t('temp')?.replace(' (°C)', '') :
                                                            m.id === 'net_rx' ? 'Net RX' :
                                                                m.id === 'net_tx' ? 'Net TX' : m.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <hr className="border-border/50" />

                            {/* Thresholds */}
                            <div>
                                <h3 className="text-sm font-semibold mb-3">{t('criticalThresholds')}</h3>
                                <div className="space-y-3">
                                    {selectedMetrics.includes('cpu') && (
                                        <div className="animate-in fade-in slide-in-from-left-1">
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">{t('criticalCpu')}</label>
                                            <input
                                                type="number"
                                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                value={thresholdCpu}
                                                onChange={(e) => setThresholdCpu(Number(e.target.value))}
                                                min="0" max="100"
                                            />
                                        </div>
                                    )}
                                    {selectedMetrics.includes('ram') && (
                                        <div className="animate-in fade-in slide-in-from-left-1">
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">{t('criticalRam')}</label>
                                            <input
                                                type="number"
                                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                value={thresholdRam}
                                                onChange={(e) => setThresholdRam(Number(e.target.value))}
                                                min="0" max="100"
                                            />
                                        </div>
                                    )}
                                    {selectedMetrics.includes('temp') && (
                                        <div className="animate-in fade-in slide-in-from-left-1">
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">{t('criticalTemp')}</label>
                                            <input
                                                type="number"
                                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                value={thresholdTemp}
                                                onChange={(e) => setThresholdTemp(Number(e.target.value))}
                                                min="0" max="120"
                                            />
                                        </div>
                                    )}
                                    {!selectedMetrics.includes('cpu') && !selectedMetrics.includes('ram') && !selectedMetrics.includes('temp') && (
                                        <p className="text-xs text-muted-foreground italic">Enable CPU, RAM, or Temp metrics to configure thresholds.</p>
                                    )}
                                </div>
                            </div>

                            {/* Generate Button */}
                            <div className="pt-2">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all"
                                    onClick={handleGenerate}
                                    disabled={loading || (scope === 'device' && !selectedDevice)}
                                >
                                    {loading ? (
                                        <>
                                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                            {t('generating')}
                                        </>
                                    ) : (
                                        t('generateReport')
                                    )}
                                </button>
                            </div>

                            {error && (
                                <div className="text-xs text-red-500 bg-red-500/10 p-3 rounded-md flex items-start gap-2">
                                    <ExclamationTriangleIcon className="w-4 h-4 shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Preview / Results Panel */}
                <div className="lg:col-span-2">
                    <div className="bg-card rounded-xl border border-border/50 p-8 shadow-sm h-full flex flex-col items-center justify-center min-h-[400px] text-center">
                        {loading ? (
                            <div className="space-y-4 animate-pulse">
                                <div className="w-16 h-16 bg-muted rounded-full mx-auto"></div>
                                <div className="space-y-2">
                                    <div className="h-4 w-48 bg-muted rounded mx-auto"></div>
                                    <div className="h-3 w-32 bg-muted rounded mx-auto"></div>
                                </div>
                                {scope === 'group' && <p className="text-xs text-muted-foreground">Aggregating data from all devices...</p>}
                            </div>
                        ) : reportData ? (
                            <div className="space-y-6 w-full h-full flex flex-col">
                                <div className="flex items-center justify-between w-full mb-4">
                                    <div className="text-left">
                                        <h2 className="text-2xl font-bold text-foreground">{t('reportReady')}</h2>
                                        <p className="text-muted-foreground text-sm">
                                            {t('generatedFor')} <span className="font-medium text-foreground">{reportData.device}</span> ({reportData.scope === 'group' ? t('groupSummary') : t('singleDevice')})
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowPreview(!showPreview)}
                                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                                        >
                                            <EyeIcon className="w-4 h-4" />
                                            {showPreview ? t('hidePreview') : t('showPreview')}
                                        </button>
                                        <PDFDownloadLink
                                            document={<ReportDocument data={reportData} />}
                                            fileName={`necturne-report-${scope === 'group' ? 'GROUP' : selectedDevice}-${new Date().toISOString().split('T')[0]}.pdf`}
                                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                        >
                                            {/* @ts-ignore */}
                                            {({ loading: pdfLoading }) =>
                                                pdfLoading ? (
                                                    <>
                                                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                                        {t('processing')}
                                                    </>
                                                ) : (
                                                    <>
                                                        <DocumentArrowDownIcon className="w-4 h-4" />
                                                        {t('download')}
                                                    </>
                                                )
                                            }
                                        </PDFDownloadLink>
                                    </div>
                                </div>

                                {showPreview ? (
                                    <div className="flex-1 w-full min-h-[500px] border border-border/50 rounded-lg overflow-hidden shadow-inner bg-gray-100 dark:bg-gray-800">
                                        <PDFViewer width="100%" height="100%" className="w-full h-full" showToolbar={true}>
                                            <ReportDocument data={reportData} />
                                        </PDFViewer>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
                                        <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center">
                                            <DocumentArrowDownIcon className="w-10 h-10" />
                                        </div>
                                        <div className="bg-muted/30 rounded-lg p-6 text-left text-sm space-y-3 border border-border/50 w-full max-w-sm mx-auto">
                                            <div className="flex justify-between border-b border-border/10 pb-2">
                                                <span className="text-muted-foreground">{t('generatedAt')}:</span>
                                                <span className="font-mono">{reportData.generatedAt}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-border/10 pb-2">
                                                <span className="text-muted-foreground">{t('timeRange')}:</span>
                                                <span className="font-medium bg-background px-2 py-0.5 rounded text-xs border border-border">{reportData.range}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">{t('criticalThresholds')}:</span>
                                                <span className={`font-bold px-2 py-0.5 rounded text-xs ${reportData.criticalEvents.length > 0 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                                    {reportData.criticalEvents.length}
                                                </span>
                                            </div>
                                            {reportData.scope === 'group' && (
                                                <div className="flex justify-between pt-2 border-t border-border/10">
                                                    <span className="text-muted-foreground">{t('totalDevices')}:</span>
                                                    <span className="font-bold">{reportData.summary.totalDevices}</span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-muted-foreground text-sm max-w-xs">
                                            {t('clickPreview')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4 text-muted-foreground opacity-60">
                                <DocumentTextIcon className="w-24 h-24 mx-auto stroke-1" />
                                <div>
                                    <h3 className="text-lg font-medium">{t('noReport')}</h3>
                                    <p className="text-sm">{t('configureReport')}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
