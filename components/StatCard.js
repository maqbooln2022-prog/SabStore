export default function StatCard({ icon, iconBg, label, value, sub, onClick }) {
  return (
    <button
      onClick={onClick}
      className="ks-card text-left p-4 hover:-translate-y-0.5 active:scale-[.98] transition-transform"
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 text-white" style={{ background: iconBg }}>
        {icon}
      </div>
      <div className="text-[11px] uppercase tracking-wide text-[#6B7280] font-semibold">{label}</div>
      <div className="ks-display text-2xl font-bold mt-0.5">{value}</div>
      {sub && <div className="text-xs text-[#6B7280] mt-0.5">{sub}</div>}
    </button>
  );
}
