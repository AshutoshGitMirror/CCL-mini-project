export default function StatCard({ label, value, sub }) {
  return (
    <div className="ticket p-5">
      <p className="mono text-[11px] text-ink-soft">{label}</p>
      <p className="font-display mt-1 text-3xl font-extrabold tracking-tight text-ink">{value}</p>
      {sub && <p className="mt-1 text-xs text-ink-soft">{sub}</p>}
    </div>
  );
}
