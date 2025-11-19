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
