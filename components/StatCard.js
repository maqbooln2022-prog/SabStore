export default function StatCard({ icon, tintBg, tintFg, bar, label, value, sub, onClick }) {
  return (
    <button
      onClick={onClick}
      className="ks-card ks-tile text-left p-4 hover:-translate-y-0.5 active:scale-[.98] transition-transform"
      style={{ cursor: onClick ? "pointer" : "default", "--bar": bar, "--tint-bg": tintBg, "--tint-fg": tintFg }}
    >
      <div className="ks-tint-icon mb-3">{icon}</div>
      <div className="text-[11px] uppercase tracking-wide font-semibold" style={{ color: "var(--text-secondary)" }}>{label}</div>
      <div className="ks-display text-2xl font-bold mt-0.5">{value}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{sub}</div>}
    </button>
  );
}
