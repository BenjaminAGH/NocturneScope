"use client";

export default function StatCards({ stats }: { stats: Record<string, any> }) {
  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const ramTotal = stats?.ram_total || 0;
  const ramUsed = stats?.ram_used || 0;
  const ramStr = ramTotal > 0
    ? `${stats?.ram?.toFixed(1)}% (${formatBytes(ramUsed)} / ${formatBytes(ramTotal)})`
    : `${stats?.ram?.toFixed(1)}%`;

  const order = [
    ["cpu", "CPU %", `${stats?.cpu?.toFixed(1)}%`],
    ["ram", "RAM", ramStr],
    ["disk", "DISK %", `${stats?.disk?.toFixed(1)}%`],
    ["net_rx", "Net RX", `${formatBytes(stats?.net_rx || 0)}/s`],
    ["net_tx", "Net TX", `${formatBytes(stats?.net_tx || 0)}/s`],
    ["temp", "Temp", `${stats?.temp?.toFixed(1)}°C`],
    ["uptime", "Uptime", `${(stats?.uptime / 3600).toFixed(1)} h`],
  ] as const;

  return (
    <div className="grid gap-3 grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
      {order.map(([k, label, val]) => (
        <div key={k} className="rounded-lg bg-card text-card-foreground p-4 shadow">
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold">{val ?? "—"}</div>
        </div>
      ))}
    </div>
  );
}
