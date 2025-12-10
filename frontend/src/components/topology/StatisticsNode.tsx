"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import {
    CpuChipIcon,
    ServerIcon,
    CircleStackIcon,
    SignalIcon,
    FireIcon,
    ArrowDownIcon,
    ArrowUpIcon
} from "@heroicons/react/24/outline";
import { useLanguage } from "@/context/LanguageContext";

export interface StatisticsNodeData extends Record<string, unknown> {
    deviceId?: string;
    metricType?: "cpu" | "ram" | "disk" | "network" | "temp";
    stats?: any;
}

const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

function StatisticsNode({ data }: NodeProps) {
    const { t } = useLanguage();
    const typedData = data as StatisticsNodeData;
    const { deviceId, metricType, stats } = typedData;

    const renderContent = () => {
        if (!deviceId) {
            return (
                <div className="text-center py-2">
                    <div className="text-sm text-muted-foreground">{t('selectDeviceShort')}</div>
                </div>
            );
        }

        if (!metricType) {
            return (
                <div className="text-center py-2">
                    <div className="text-sm text-muted-foreground">{t('selectMetricShort')}</div>
                </div>
            );
        }

        switch (metricType) {
            case "cpu":
                return (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CpuChipIcon className="w-5 h-5 text-purple-500" />
                                <span className="text-sm font-medium text-muted-foreground">{t('cpuSimple')}</span>
                            </div>
                            <span className="text-xl font-bold">{stats?.cpu?.toFixed(1) || "0"}%</span>
                        </div>
                        <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-purple-500 h-full transition-all duration-500"
                                style={{ width: `${Math.min(stats?.cpu || 0, 100)}%` }}
                            />
                        </div>
                        <div className="text-xs text-muted-foreground flex justify-between">
                            <span>{t('currentUsage')}</span>
                            <span>{stats?.cpu_count || 1} {t('cores')}</span>
                        </div>
                    </div>
                );

            case "ram":
                return (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ServerIcon className="w-5 h-5 text-orange-500" />
                                <span className="text-sm font-medium text-muted-foreground">{t('ramSimple')}</span>
                            </div>
                            <span className="text-xl font-bold">{stats?.ram?.toFixed(1) || "0"}%</span>
                        </div>
                        <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-orange-500 h-full transition-all duration-500"
                                style={{ width: `${Math.min(stats?.ram || 0, 100)}%` }}
                            />
                        </div>
                        <div className="text-xs text-muted-foreground flex justify-between">
                            <span>{t('used')}: {stats?.ram_used ? formatBytes(stats.ram_used) : "0 B"}</span>
                            <span>{t('total')}: {stats?.ram_total ? formatBytes(stats.ram_total) : "0 B"}</span>
                        </div>
                    </div>
                );

            case "disk":
                const partitions = stats ? Object.keys(stats)
                    .filter(k => k.startsWith('disk_usage_'))
                    .map(k => ({
                        total: stats[k.replace('usage', 'total')],
                        used: stats[k.replace('usage', 'used')]
                    })) : [];
                const totalDisk = partitions.reduce((acc: number, p: any) => acc + (p.total || 0), 0);
                const usedDisk = partitions.reduce((acc: number, p: any) => acc + (p.used || 0), 0);
                const percent = totalDisk > 0 ? (usedDisk / totalDisk) * 100 : 0;

                return (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CircleStackIcon className="w-5 h-5 text-emerald-500" />
                                <span className="text-sm font-medium text-muted-foreground">{t('storage')}</span>
                            </div>
                            <span className="text-xl font-bold">{percent.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-emerald-500 h-full transition-all duration-500"
                                style={{ width: `${Math.min(percent, 100)}%` }}
                            />
                        </div>
                        <div className="text-xs text-muted-foreground flex justify-between">
                            <span>{t('used')}: {formatBytes(usedDisk)}</span>
                            <span>{t('total')}: {formatBytes(totalDisk)}</span>
                        </div>
                    </div>
                );

            case "temp":
                return (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <FireIcon className="w-5 h-5 text-red-500" />
                            <span className="text-sm font-medium text-muted-foreground">{t('temperature')}</span>
                        </div>
                        <div className="flex items-end justify-between">
                            <div>
                                <div className="text-3xl font-bold">{stats?.temp?.toFixed(1) || "—"}°C</div>
                                <div className="text-xs text-muted-foreground mt-1">{t('coreTemp')}</div>
                            </div>
                        </div>
                    </div>
                );

            case "network":
                return (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <SignalIcon className="w-5 h-5 text-indigo-500" />
                            <span className="text-sm font-medium text-muted-foreground">{t('network')}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="relative overflow-hidden rounded border border-blue-500/20 bg-blue-500/10 p-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <ArrowDownIcon className="w-3 h-3 text-blue-500" />
                                    <span className="text-[10px] font-medium text-blue-500">RX</span>
                                </div>
                                <div className="text-xs font-bold font-mono">
                                    {stats?.net_rx ? formatBytes(stats.net_rx) : "0 B"}/s
                                </div>
                            </div>
                            <div className="relative overflow-hidden rounded border border-indigo-500/20 bg-indigo-500/10 p-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <ArrowUpIcon className="w-3 h-3 text-indigo-500" />
                                    <span className="text-[10px] font-medium text-indigo-500">TX</span>
                                </div>
                                <div className="text-xs font-bold font-mono">
                                    {stats?.net_tx ? formatBytes(stats.net_tx) : "0 B"}/s
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return <div>{t('unknownMetric')}</div>;
        }
    };

    return (
        <div className="min-w-[220px] rounded-xl bg-card border-2 border-border shadow-sm relative overflow-hidden">
            {/* Single Input and Output handles */}
            <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-background !border-2 !border-primary" />
            <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-background !border-2 !border-primary" />

            <div className="p-4">
                {deviceId && (
                    <div className="text-xs text-muted-foreground mb-2 truncate" title={deviceId}>
                        {deviceId}
                    </div>
                )}
                {renderContent()}
            </div>
        </div>
    );
}

export default memo(StatisticsNode);
