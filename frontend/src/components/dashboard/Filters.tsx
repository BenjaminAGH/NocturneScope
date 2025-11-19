"use client";

type Props = {
  devices: string[];
  device: string; setDevice: (v: string)=>void;
  field: string; setField: (v: string)=>void;
  range: string; setRange: (v: string)=>void;
  interval: string; setInterval: (v: string)=>void;
  agg: string; setAgg: (v: string)=>void;
};
const FIELDS = [
  { v:"cpu",    l:"CPU %" },
  { v:"ram",    l:"RAM %" },
  { v:"disk",   l:"DISK %" },
  { v:"net_rx", l:"Net RX (B/s)" },
  { v:"net_tx", l:"Net TX (B/s)" },
  { v:"temp",   l:"Temp (°C)" },
  { v:"uptime", l:"Uptime (s)" },
];
export default function Filters(p: Props){
  return (
    <div className="grid gap-3 grid-cols-1 md:grid-cols-5">
      <select className="bg-card border rounded px-3 py-2" value={p.device} onChange={e=>p.setDevice(e.target.value)}>
        <option value="">{p.devices.length? "Selecciona dispositivo": "Sin dispositivos"}</option>
        {p.devices.map(d=> <option key={d} value={d}>{d}</option>)}
      </select>
      <select className="bg-card border rounded px-3 py-2" value={p.field} onChange={e=>p.setField(e.target.value)}>
        {FIELDS.map(f=> <option key={f.v} value={f.v}>{f.l}</option>)}
      </select>
      <select className="bg-card border rounded px-3 py-2" value={p.range} onChange={e=>p.setRange(e.target.value)}>
        {["30m","1h","6h","24h","7d"].map(r=> <option key={r} value={r}>{r}</option>)}
      </select>
      <select className="bg-card border rounded px-3 py-2" value={p.interval} onChange={e=>p.setInterval(e.target.value)}>
        {["1m","5m","15m","1h"].map(i=> <option key={i} value={i}>{i}</option>)}
      </select>
      <select className="bg-card border rounded px-3 py-2" value={p.agg} onChange={e=>p.setAgg(e.target.value)}>
        {["mean","min","max","last"].map(a=> <option key={a} value={a}>{a.toUpperCase()}</option>)}
      </select>
    </div>
  );
}

