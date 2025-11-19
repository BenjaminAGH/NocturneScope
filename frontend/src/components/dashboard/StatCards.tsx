"use client";

export default function StatCards({ stats }:{ stats: Record<string, number> }){
  const order = [
    ["cpu","CPU %"],["ram","RAM %"],["disk","DISK %"],
    ["net_rx","Net RX (B/s)"],["net_tx","Net TX (B/s)"],
    ["temp","Temp (°C)"],["uptime","Uptime (s)"],
  ] as const;
  return (
    <div className="grid gap-3 grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
      {order.map(([k,label])=>(
        <div key={k} className="rounded-lg bg-card text-card-foreground p-4 shadow">
          <div className="text-sm text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold">{stats?.[k] ?? "—"}</div>
        </div>
      ))}
    </div>
  );
}
