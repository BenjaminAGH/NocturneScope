"use client";

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, DocumentArrowDownIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ReportDocument from './ReportDocument';
import { getDevices, getTimeseries, getLastStats } from '@/lib/api/api';
import { useLanguage } from '@/context/LanguageContext';
import { useGroup } from '@/context/GroupContext';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ReportModal({ isOpen, onClose }: ReportModalProps) {
    const { t } = useLanguage();
    const { selectedGroup } = useGroup();

    // State
    const [devices, setDevices] = useState<string[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<string>('');
    const [range, setRange] = useState('1h');
    const [thresholdCpu, setThresholdCpu] = useState(80);
    const [thresholdRam, setThresholdRam] = useState(80);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && selectedGroup) {
            const jwt = localStorage.getItem('jwt');
            if (jwt) {
                getDevices(jwt, selectedGroup.ID).then(setDevices).catch(console.error);
            }
        }
    }, [isOpen, selectedGroup]);

    interface CriticalEvent {
        time: string;
        metric: string;
        value: number;
        threshold: number;
    }

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

            // Define interval based on range to avoid too many points? 
            // '1m' is standard for granular, maybe '5m' for 7d if backend supports it.
            // Using '1m' for now.
            const interval = '1m';

            // Fetch Data
            // We need multiple metrics: cpu, ram, temp? Using getTimeseries for each is one way, or just fetch main ones.
            // Let's fetch CPU and RAM for now as primary criticals.
            const [cpuTs, ramTs, tempTs, lastStats] = await Promise.all([
                getTimeseries(jwt, { device: selectedDevice, field: 'cpu', range, agg: 'mean', interval }),
                getTimeseries(jwt, { device: selectedDevice, field: 'ram', range, agg: 'mean', interval }),
                getTimeseries(jwt, { device: selectedDevice, field: 'temp', range, agg: 'mean', interval }), // Assuming temp exists
                getLastStats(jwt, selectedDevice)
            ]);

            // Process Data
            const pointsCpu = cpuTs.points || [];
            const pointsRam = ramTs.points || [];
            const pointsTemp = tempTs.points || [];

            // Calculate Averages
            const avgCpu = pointsCpu.reduce((a: number, b: any) => a + b.v, 0) / (pointsCpu.length || 1);
            const avgRam = pointsRam.reduce((a: number, b: any) => a + b.v, 0) / (pointsRam.length || 1);
            const avgTemp = pointsTemp.reduce((a: number, b: any) => a + b.v, 0) / (pointsTemp.length || 1);

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

    return (
        <Transition show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-card border border-border p-6 text-left align-middle shadow-xl transition-all">
                                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-foreground flex justify-between items-center">
                                    <span>Necturne Reports</span>
                                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                                        <XMarkIcon className="w-5 h-5" />
                                    </button>
                                </Dialog.Title>

                                <div className="mt-4 space-y-4">
                                    {/* Device Selection */}
                                    <div>
                                        <label className="block text-sm font-medium text-muted-foreground mb-1">{t('device')}</label>
                                        <select
                                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                            value={selectedDevice}
                                            onChange={(e) => {
                                                setSelectedDevice(e.target.value);
                                                setReportData(null); // Reset report if device changes
                                            }}
                                        >
                                            <option value="">Select a device...</option>
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

                                    {/* Thresholds */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-muted-foreground mb-1">Critical CPU (%)</label>
                                            <input
                                                type="number"
                                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                value={thresholdCpu}
                                                onChange={(e) => setThresholdCpu(Number(e.target.value))}
                                                min="0" max="100"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-muted-foreground mb-1">Critical RAM (%)</label>
                                            <input
                                                type="number"
                                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                value={thresholdRam}
                                                onChange={(e) => setThresholdRam(Number(e.target.value))}
                                                min="0" max="100"
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="text-sm text-red-500 bg-red-500/10 p-2 rounded">
                                            {error}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="mt-6 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            className="inline-flex justify-center rounded-md border border-transparent bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 focus:outline-none"
                                            onClick={handleGenerate}
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                            ) : (
                                                "Generate Report"
                                            )}
                                        </button>

                                        {reportData && !loading && (
                                            <PDFDownloadLink
                                                document={<ReportDocument data={reportData} />}
                                                fileName={`necturne-report-${selectedDevice}-${new Date().toISOString().split('T')[0]}.pdf`}
                                                className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none gap-2 items-center"
                                            >
                                                {/* @ts-ignore */}
                                                {({ blob, url, loading: pdfLoading, error }) =>
                                                    pdfLoading ? 'Preparing PDF...' : (
                                                        <>
                                                            <DocumentArrowDownIcon className="w-5 h-5" />
                                                            Download PDF
                                                        </>
                                                    )
                                                }
                                            </PDFDownloadLink>
                                        )}
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
