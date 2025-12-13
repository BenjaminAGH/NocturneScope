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
    const [range, setRange] = useState('1h');
    const [thresholdCpu, setThresholdCpu] = useState(80);
    const [thresholdRam, setThresholdRam] = useState(80);
    const [loading, setLoading] = useState(false);
    const [deviceLoading, setDeviceLoading] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [error, setError] = useState('');
    const [showPreview, setShowPreview] = useState(false);

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
        if (!selectedDevice) {
            setError(t('selectDevice') || "Select a device");
            return;
        }
        setLoading(true);
        setError('');

        try {
            const jwt = localStorage.getItem('jwt');
            if (!jwt) throw new Error("No JWT");

            // Define interval
            const interval = '1m';

            // Fetch Data
            const [cpuTs, ramTs, tempTs, netRxTs, netTxTs, lastStats] = await Promise.all([
                getTimeseries(jwt, { device: selectedDevice, field: 'cpu', range, agg: 'mean', interval }),
                getTimeseries(jwt, { device: selectedDevice, field: 'ram', range, agg: 'mean', interval }),
                getTimeseries(jwt, { device: selectedDevice, field: 'temp', range, agg: 'mean', interval }),
                getTimeseries(jwt, { device: selectedDevice, field: 'net_rx', range, agg: 'mean', interval }),
                getTimeseries(jwt, { device: selectedDevice, field: 'net_tx', range, agg: 'mean', interval }),
                getLastStats(jwt, selectedDevice)
            ]);

            // Process Data
            const pointsCpu = cpuTs.points || [];
            const pointsRam = ramTs.points || [];
            const pointsTemp = tempTs.points || [];
            const pointsNetRx = netRxTs.points || [];
            const pointsNetTx = netTxTs.points || [];

            // Calculate Averages
            const avgCpu = pointsCpu.reduce((a: number, b: any) => a + b.v, 0) / (pointsCpu.length || 1);
            const avgRam = pointsRam.reduce((a: number, b: any) => a + b.v, 0) / (pointsRam.length || 1);
            const avgTemp = pointsTemp.reduce((a: number, b: any) => a + b.v, 0) / (pointsTemp.length || 1);
            const avgNetRx = pointsNetRx.reduce((a: number, b: any) => a + b.v, 0) / (pointsNetRx.length || 1);
            const avgNetTx = pointsNetTx.reduce((a: number, b: any) => a + b.v, 0) / (pointsNetTx.length || 1);

            // Find Critical Events
            const criticalEvents: CriticalEvent[] = [];

            // Check CPU
            pointsCpu.forEach((p: any) => {
                if (p.v > thresholdCpu) {
                    criticalEvents.push({
                        time: new Date(p.t).toLocaleTimeString(),
                        metric: 'CPU',
                        value: p.v,
                        threshold: thresholdCpu
                    });
                }
            });

            // Check RAM
            pointsRam.forEach((p: any) => {
                if (p.v > thresholdRam) {
                    criticalEvents.push({
                        time: new Date(p.t).toLocaleTimeString(),
                        metric: 'RAM',
                        value: p.v,
                        threshold: thresholdRam
                    });
                }
            });

            // Sort events by time
            criticalEvents.sort((a, b) => a.time.localeCompare(b.time));

            // Stats Array
            const stats = [
                {
                    name: 'CPU (%)',
                    min: Math.min(...pointsCpu.map((p: any) => p.v), 0),
                    max: Math.max(...pointsCpu.map((p: any) => p.v), 0),
                    avg: avgCpu
                },
                {
                    name: 'RAM (%)',
                    min: Math.min(...pointsRam.map((p: any) => p.v), 0),
                    max: Math.max(...pointsRam.map((p: any) => p.v), 0),
                    avg: avgRam
                },
                {
                    name: 'Temp (°C)',
                    min: Math.min(...pointsTemp.map((p: any) => p.v), 0),
                    max: Math.max(...pointsTemp.map((p: any) => p.v), 0),
                    avg: avgTemp
                },
                {
                    name: 'Net RX (B/s)',
                    min: Math.min(...pointsNetRx.map((p: any) => p.v), 0),
                    max: Math.max(...pointsNetRx.map((p: any) => p.v), 0),
                    avg: avgNetRx
                },
                {
                    name: 'Net TX (B/s)',
                    min: Math.min(...pointsNetTx.map((p: any) => p.v), 0),
                    max: Math.max(...pointsNetTx.map((p: any) => p.v), 0),
                    avg: avgNetTx
                }
            ];

            const data = {
                device: selectedDevice,
                range,
                generatedAt: new Date().toLocaleString(),
                summary: {
                    uptime: lastStats?.uptime ? `${(lastStats.uptime / 3600).toFixed(1)}h` : 'Unknown',
                    avgCpu,
                    avgRam,
                    avgTemp
                },
                criticalEvents,
                stats
            };

            setReportData(data);

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
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Report Generation</h1>
                <p className="text-muted-foreground mt-2">
                    Create and export detailed performance reports for your devices.
                </p>
            </header>

            <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
                {/* Configuration Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4">Configuration</h2>
                        <div className="space-y-4">
                            {/* Device Selection */}
                            <div>
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
                                    <option value="">{deviceLoading ? "Loading..." : "Select a device..."}</option>
                                    {devices.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>

                            {/* Range Selection */}
                            <div>
                                <label className="block text-sm font-medium text-muted-foreground mb-1">{t('timeRange')}</label>
                                <select
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={range}
                                    onChange={(e) => setRange(e.target.value)}
                                >
                                    <option value="1h">Last 1 Hour</option>
                                    <option value="6h">Last 6 Hours</option>
                                    <option value="24h">Last 24 Hours</option>
                                    <option value="7d">Last 7 Days</option>
                                </select>
                            </div>

                            <hr className="border-border/50" />

                            {/* Thresholds */}
                            <div>
                                <h3 className="text-sm font-semibold mb-3">Critical Thresholds</h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">Critical CPU (%)</label>
                                        <input
                                            type="number"
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={thresholdCpu}
                                            onChange={(e) => setThresholdCpu(Number(e.target.value))}
                                            min="0" max="100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">Critical RAM (%)</label>
                                        <input
                                            type="number"
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={thresholdRam}
                                            onChange={(e) => setThresholdRam(Number(e.target.value))}
                                            min="0" max="100"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Generate Button */}
                            <div className="pt-2">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all"
                                    onClick={handleGenerate}
                                    disabled={loading || !selectedDevice}
                                >
                                    {loading ? (
                                        <>
                                            <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        "Generate Report"
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
                            </div>
                        ) : reportData ? (
                            <div className="space-y-6 w-full h-full flex flex-col">
                                <div className="flex items-center justify-between w-full mb-4">
                                    <div className="text-left">
                                        <h2 className="text-2xl font-bold text-foreground">Report Ready</h2>
                                        <p className="text-muted-foreground text-sm">
                                            Generated for <span className="font-medium text-foreground">{reportData.device}</span>
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowPreview(!showPreview)}
                                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
                                        >
                                            <EyeIcon className="w-4 h-4" />
                                            {showPreview ? "Hide Preview" : "Show Preview"}
                                        </button>
                                        <PDFDownloadLink
                                            document={<ReportDocument data={reportData} />}
                                            fileName={`necturne-report-${selectedDevice}-${new Date().toISOString().split('T')[0]}.pdf`}
                                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                                        >
                                            {/* @ts-ignore */}
                                            {({ loading: pdfLoading }) =>
                                                pdfLoading ? (
                                                    <>
                                                        <ArrowPathIcon className="w-4 h-4 animate-spin" />
                                                        Processing...
                                                    </>
                                                ) : (
                                                    <>
                                                        <DocumentArrowDownIcon className="w-4 h-4" />
                                                        Download
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
                                                <span className="text-muted-foreground">Generated At:</span>
                                                <span className="font-mono">{reportData.generatedAt}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-border/10 pb-2">
                                                <span className="text-muted-foreground">Range:</span>
                                                <span className="font-medium bg-background px-2 py-0.5 rounded text-xs border border-border">{reportData.range}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Critical Events:</span>
                                                <span className={`font-bold px-2 py-0.5 rounded text-xs ${reportData.criticalEvents.length > 0 ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                                                    {reportData.criticalEvents.length}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-muted-foreground text-sm max-w-xs">
                                            Click "Show Preview" to view the PDF directly here, or "Download" to save it to your device.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4 text-muted-foreground opacity-60">
                                <DocumentTextIcon className="w-24 h-24 mx-auto stroke-1" />
                                <div>
                                    <h3 className="text-lg font-medium">No Report Generated</h3>
                                    <p className="text-sm">Configure report settings and click "Generate Report" to see results here.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
