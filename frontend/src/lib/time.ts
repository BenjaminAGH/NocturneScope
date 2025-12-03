export const fmtCL = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  dateStyle: "short",
  timeStyle: "medium",
  hour12: false,
});

export function formatCL(iso: string | number | Date) {
  return fmtCL.format(new Date(iso));
}

export function formatTickCL(iso: string | number | Date) {
  const d = new Date(iso);

  return new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    hour12: false,
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return "0s";

  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (parts.length === 0) return "< 1m";

  return parts.join(" ");
}
